import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '../../types/chat';
import { AI_CONFIG, GEMINI_API_KEY } from '../../config/constants';

// Initialize Gemini AI
let genAI: GoogleGenerativeAI;
let model: any;

try {
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });
  }
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error);
}

// Format messages for the chat
function formatMessages(messages: Message[]): string {
  return messages
    .map(msg => `${msg.isAI ? 'Assistant' : 'User'}: ${msg.content}`)
    .join('\n');
}

export async function generateAIResponse(messages: Message[]): Promise<string> {
  try {
    // Check if API key is set
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      return "Please set your Gemini API key in config/constants.ts to enable AI responses. Replace 'YOUR_API_KEY_HERE' with your actual API key.";
    }

    if (!model) {
      return "The AI model failed to initialize. Please check your API key and try refreshing the page.";
    }

    // Start chat and send system prompt
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: AI_CONFIG.TEMPERATURE,
        maxOutputTokens: AI_CONFIG.MAX_TOKENS,
      },
    });

    // Format conversation history
    const prompt = `${AI_CONFIG.SYSTEM_PROMPT}\n\nConversation history:\n${formatMessages(messages)}`;

    // Generate response
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      return "Invalid API key. Please check your Gemini API key in config/constants.ts";
    }
    return "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
  }
}
