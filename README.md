<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cUH14REhSqC6UJUeyzNBBoAx6hXMVaSi

# StudySync AI - JavaScript Implementation

This project provides a complete JavaScript implementation of the StudySync AI academic assistant, using Google's Gemini API. All the features available in the Python version have been ported to JavaScript for use in both Node.js environments and web browsers.

## Features

The JavaScript implementation includes all the core features of StudySync AI:

1. **Summarize**: Condense long articles into key points
2. **Translate**: Translate academic content instantly
3. **Questions**: Generate practice questions & MCQs
4. **Simplify**: Rewrite complex text simply
5. **Study Guide**: Create structured study materials
6. **Proofread**: Perfect your assignments & notes
7. **Multimodal**: Analyze text and suggest visual elements

## Files Overview

### Core Library
- [studysync-ai.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/studysync-ai.js) - Main StudySyncAI class with all core functionality

### Command-Line Interface
- [studysync-cli.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/studysync-cli.js) - Full CLI implementation with all features

### Utility Scripts
- [check-api-key.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/check-api-key.js) - Test API key validity
- [list-models.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/list-models.js) - List available models
- [demonstrate-features.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/demonstrate-features.js) - Demonstrate all features

### Examples
- [example-node.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/example-node.js) - Example usage in Node.js
- [test-node.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/test-node.js) - Simple test script

## Installation

Make sure you have Node.js installed, then install the required dependencies:

```bash
npm install
```

## Usage

### Command-Line Interface

The CLI provides access to all StudySync AI features:

```bash
# Get help
node studysync-cli.js --help

# Test API key
node studysync-cli.js test-key

# Summarize text
node studysync-cli.js summarize "Artificial intelligence is a wonderful field of study."

# Summarize with custom length
node studysync-cli.js summarize "Your long text here" --length long

# Translate text
node studysync-cli.js translate "Hello, how are you?" --target fr

# Generate questions
node studysync-cli.js questions "Your academic content here" --type mixed

# Simplify complex text
node studysync-cli.js simplify "Complex academic text here"

# Create study guide
node studysync-cli.js study-guide "Your content here"

# Proofread text
node studysync-cli.js proofread "Text with errors here"

# Multimodal analysis
node studysync-cli.js multimodal "Your content here"

# Process files
node studysync-cli.js summarize ./sample_text.txt --file --output summary.txt
```

### Using npm scripts

The package.json includes convenient scripts:

```bash
# Run feature demonstration
npm run demo

# Run CLI
npm run cli

# Check API key
npm run check-key

# List models
npm run list-models
```

### Programmatic Usage

You can also use the StudySyncAI class directly in your JavaScript code:

```javascript
const StudySyncAI = require('./studysync-ai.js');

// For Node.js, polyfill fetch if needed
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

// Initialize with your API key
const apiKey = 'YOUR_API_KEY_HERE';
const ai = new StudySyncAI(apiKey);

// Use any of the features
async function example() {
    const summary = await ai.summarize('Your text here', 'medium');
    console.log(summary);
    
    const translation = await ai.translate('Hello world', 'es');
    console.log(translation);
    
    // ... other features
}

example();
```

## Browser Usage

The [studysync-ai.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/studysync-ai.js) file is also compatible with browser environments. You can include it directly in your HTML:

```html
<script src="studysync-ai.js"></script>
<script>
    // The StudySyncAI class is now available globally
    const ai = new StudySyncAI('YOUR_API_KEY_HERE');
    
    // Use the features
    ai.summarize('Your text here', 'medium')
        .then(summary => console.log(summary));
</script>
```

## API Key

The project uses the Gemini API. Make sure to replace the API key in the JavaScript files with your own key:

```javascript
const apiKey = 'YOUR_GOOGLE_GEMINI_API_KEY';
```

You can get a free API key from the [Google AI Studio](https://aistudio.google.com/).

## Dependencies

- [node-fetch](https://www.npmjs.com/package/node-fetch) - For making HTTP requests in Node.js
- [commander](https://www.npmjs.com/package/commander) - For CLI argument parsing

## Testing

To test the implementation:

```bash
# Run the example
node example-node.js

# Run the test script
node test-node.js

# Run feature demonstration
node demonstrate-features.js

# Test API key
node check-api-key.js
```

## Available Models

The current implementation uses the `gemini-2.5-flash-preview-05-20` model, which provides a good balance of performance and capabilities. You can change the model in the [studysync-ai.js](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/studysync-ai.js) file:

```javascript
this.model = 'gemini-2.5-flash-preview-05-20'; // Change this to use a different model
```

Other available models include:
- gemini-pro
- gemini-1.5-pro
- gemini-1.5-flash
- gemini-2.5-pro-preview-03-25

## Error Handling

The JavaScript implementation includes comprehensive error handling for:
- Network issues
- API errors
- Invalid API keys
- File I/O errors
- Invalid parameters

All errors are returned as descriptive strings rather than throwing exceptions, making it easy to handle errors in your applications.

## Contributing

Feel free to contribute to this project by:
1. Reporting issues
2. Suggesting new features
3. Improving documentation
4. Adding new capabilities

## License

This project is licensed under the MIT License - see the [LICENSE](file:///c:/Users/91720/OneDrive/Desktop/studysync-ai-extension/LICENSE) file for details.
