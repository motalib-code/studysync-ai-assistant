import type React from 'react';

export enum Feature {
  Summarize = 'Summarize',
  Translate = 'Translate',
  Questions = 'Questions',
  Rewrite = 'Rewrite',
  StudyGuide = 'Study Guide',
  Proofread = 'Proofread',
  Multimodal = 'Multimodal',
  Writer = 'Writer',
  CustomPrompt = 'Custom Prompt',
  ComplexReasoning = 'Complex Reasoning',
  GenerateImage = 'Generate Image',
  Transcribe = 'Transcribe',
  LiveConversation = 'Live Conversation',
  ChatBot = 'Chat Bot',
}

export interface FeatureDefinition {
  id: Feature;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  needsImage?: boolean;
  supportsImage?: boolean;
  placeholder: string;
}

export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Mandarin Chinese' | 'Japanese';