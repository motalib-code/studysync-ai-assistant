
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import InputArea from './components/InputArea';
import OutputArea from './components/OutputArea';
import ChatBotUI from './components/ChatBotUI';
import { processContent, transcribeAudio, generateImage, generateSpeech, decode, decodeAudioData, createBlobForLiveAPI, encode } from './services/geminiService';
import type { Feature, Language } from './types';
import { Feature as FeatureEnum } from './types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';


const Header: React.FC = () => (
  <header className="bg-white shadow-sm p-4 sticky top-0 z-10 md:hidden">
    <div className="flex items-center space-x-3">
      <span className="text-2xl">📚</span>
      <h1 className="text-xl font-bold text-slate-800">StudySync AI</h1>
    </div>
  </header>
);

const DesktopHeader: React.FC = () => (
  <div className="hidden md:flex items-center space-x-4 mb-6">
    <span className="text-4xl">📚</span>
    <div>
      <h1 className="text-3xl font-bold text-slate-800">StudySync AI</h1>
      <p className="text-slate-500">Your AI-Powered Academic Assistant</p>
    </div>
  </div>
);

const LiveConversationUI: React.FC = () => {
    const [status, setStatus] = useState('idle'); // idle, connecting, connected, error
    const [transcript, setTranscript] = useState<{ speaker: 'user' | 'model', text: string }[]>([]);
    const [liveUserTranscript, setLiveUserTranscript] = useState('');
    const [liveModelTranscript, setLiveModelTranscript] = useState('');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        setStatus('idle');
        setLiveUserTranscript('');
        setLiveModelTranscript('');
    }, []);
    
    const startConversation = useCallback(async () => {
        setStatus('connecting');
        setTranscript([]);
        setLiveUserTranscript('');
        setLiveModelTranscript('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

            let nextStartTime = 0;
            const sources = new Set<AudioBufferSourceNode>();
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setStatus('connected');
                        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlobForLiveAPI(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                            setLiveUserTranscript(currentInputTranscription);
                        }
                        if (message.serverContent?.outputTranscription) {
                            if (currentInputTranscription.trim()) {
                                setTranscript(prev => [...prev, { speaker: 'user', text: currentInputTranscription.trim() }]);
                                currentInputTranscription = '';
                                setLiveUserTranscript('');
                            }
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                            setLiveModelTranscript(currentOutputTranscription);
                        }
                        if (message.serverContent?.turnComplete) {
                            if (currentInputTranscription.trim()) {
                                setTranscript(prev => [...prev, { speaker: 'user', text: currentInputTranscription.trim() }]);
                            }
                            if (currentOutputTranscription.trim()) {
                                setTranscript(prev => [...prev, { speaker: 'model', text: currentOutputTranscription.trim() }]);
                            }
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                            setLiveUserTranscript('');
                            setLiveModelTranscript('');
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => sources.delete(source));
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        setStatus('error');
                        stopConversation();
                    },
                    onclose: () => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });
        } catch (err) {
            console.error("Failed to start conversation:", err);
            setStatus('error');
        }
    }, [stopConversation]);

    useEffect(() => {
        return () => stopConversation();
    }, [stopConversation]);

    const transcriptRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript, liveUserTranscript, liveModelTranscript]);

    const BlinkingCursor = () => <span className="inline-block w-2 h-4 bg-slate-600 ml-1 animate-pulse" />;

    return (
        <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8">
            <DesktopHeader />
            <div className="bg-white p-6 rounded-xl shadow-xl border border-t-slate-100 border-l-slate-100 border-b-slate-300 border-r-slate-300 flex flex-col h-[60vh] min-h-[500px]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Live Conversation</h2>
                    <button
                        onClick={status === 'connected' ? stopConversation : startConversation}
                        disabled={status === 'connecting'}
                        className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors ${status === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-slate-400`}
                    >
                        {status === 'connected' ? 'End Conversation' : status === 'connecting' ? 'Connecting...' : 'Start Conversation'}
                    </button>
                </div>
                <div ref={transcriptRef} className="flex-grow bg-slate-50 p-4 rounded-lg overflow-y-auto space-y-4">
                    {transcript.map((entry, index) => (
                        <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                             {entry.speaker === 'model' && <span className="flex-shrink-0 text-xl">🤖</span>}
                            <div className={`max-w-xl p-3 rounded-xl ${entry.speaker === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-800'}`}>
                                <p className="text-sm">{entry.text}</p>
                            </div>
                            {entry.speaker === 'user' && <span className="flex-shrink-0 text-xl">👤</span>}
                        </div>
                    ))}
                    {liveUserTranscript && (
                        <div className="flex items-start gap-3 justify-end">
                            <div className="max-w-xl p-3 rounded-xl bg-blue-100 text-blue-900 opacity-80">
                                <p className="text-sm flex items-center">{liveUserTranscript}<BlinkingCursor /></p>
                            </div>
                            <span className="flex-shrink-0 text-xl">👤</span>
                        </div>
                    )}
                    {liveModelTranscript && (
                        <div className="flex items-start gap-3">
                             <span className="flex-shrink-0 text-xl">🤖</span>
                            <div className="max-w-xl p-3 rounded-xl bg-slate-200 text-slate-800 opacity-80">
                                <p className="text-sm flex items-center">{liveModelTranscript}<BlinkingCursor /></p>
                            </div>
                        </div>
                    )}
                     {status === 'idle' && transcript.length === 0 && !liveUserTranscript && !liveModelTranscript && <div className="text-center text-slate-500 pt-10">Click "Start Conversation" to begin.</div>}
                     {status === 'error' && <div className="text-center text-red-500 pt-10">Connection failed. Please try again.</div>}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<Feature>(FeatureEnum.Summarize);
  const [inputText, setInputText] = useState<string>('');
  const [outputContent, setOutputContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<Language>('English');
  const [outputType, setOutputType] = useState<'text' | 'image'>('text');
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleProcessContent = useCallback(async (data?: File) => {
    setIsLoading(true);
    setError(null);
    setOutputContent('');

    const currentFeature = selectedFeature;
    setOutputType(currentFeature === FeatureEnum.GenerateImage ? 'image' : 'text');

    try {
        let result: string;
        switch (currentFeature) {
            case FeatureEnum.GenerateImage:
                result = await generateImage(inputText);
                break;
            case FeatureEnum.Transcribe:
                if (!data) throw new Error("No audio data provided for transcription.");
                result = await transcribeAudio(data);
                break;
            default:
                result = await processContent(currentFeature, inputText, data, targetLanguage);
        }
        
        if (result.startsWith('An error occurred:')) {
            setError(result);
        } else {
            setOutputContent(result);
        }
    } catch (e: any) {
        setError(`An unexpected error occurred: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  }, [selectedFeature, inputText, targetLanguage]);
  
  const handlePlayTTS = useCallback(async (text: string) => {
    try {
        const audioData = await generateSpeech(text);
        if (audioData.startsWith('An error occurred:')) {
          setError(audioData);
          return;
        }
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioBuffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
    } catch (e: any) {
        setError(`Failed to play audio: ${e.message}`);
    }
  }, []);

  let mainContent;
    if (selectedFeature === FeatureEnum.LiveConversation) {
        mainContent = <LiveConversationUI />;
    } else if (selectedFeature === FeatureEnum.ChatBot) {
        mainContent = (
            <div className="lg:col-span-2 flex flex-col h-full">
                <ChatBotUI />
            </div>
        );
    } else {
        mainContent = (
            <>
                <div className="lg:col-span-2">
                    <DesktopHeader />
                </div>
                <div className="min-h-[400px] lg:min-h-0">
                    <InputArea
                        inputText={inputText}
                        setInputText={setInputText}
                        selectedFeature={selectedFeature}
                        targetLanguage={targetLanguage}
                        setTargetLanguage={setTargetLanguage}
                        onProcess={handleProcessContent}
                        isLoading={isLoading}
                    />
                </div>
                <div className="min-h-[400px] lg:min-h-0">
                    <OutputArea
                        outputContent={outputContent}
                        isLoading={isLoading}
                        error={error}
                        outputType={outputType}
                        onPlayTTS={handlePlayTTS}
                    />
                </div>
            </>
        );
    }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Header />
      <Sidebar selectedFeature={selectedFeature} setSelectedFeature={setSelectedFeature} />
      <main className="flex-grow p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {mainContent}
      </main>
    </div>
  );
};

export default App;
