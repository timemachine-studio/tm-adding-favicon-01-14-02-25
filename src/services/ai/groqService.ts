import Groq from 'groq-sdk';
import { Message } from '../../types/chat';
import { AI_PERSONAS, GROQ_API_KEY } from '../../config/constants';

// Initialize Groq client with browser usage enabled
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

interface AIResponse {
  content: string;
  thinking?: string;
}

interface StreamingData {
  content: string;
  thinking?: string;
}

function extractThinkingAndContent(response: string): AIResponse {
  const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : undefined;
  const content = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  
  return { content, thinking };
}

export async function generateAIResponse(
  messages: Message[],
  imageData?: string,
  systemPrompt: string = AI_PERSONAS.default.systemPrompt,
  currentPersona: keyof typeof AI_PERSONAS = 'default',
  onStream?: (data: StreamingData) => void
): Promise<AIResponse> {
  try {
    if (!GROQ_API_KEY || GROQ_API_KEY === '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') {
      return { content: "Looks like we are missing something in the future. Please contact to TimeMachine Geniuses " };
    }

    const persona = AI_PERSONAS[currentPersona];
    const model = imageData ? 'llama-3.2-90b-vision-preview' : persona.model;
    
    // Enhance system prompt with formatting instructions
    const enhancedSystemPrompt = `${systemPrompt}

Remember to always talk to the user like a real human who genuenly cares.`;

    let groqMessages;
    
    if (imageData) {
      const lastMessage = messages[messages.length - 1];
      groqMessages = [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: `${enhancedSystemPrompt}\n\n${lastMessage.content || "What's in this image?"}`
            },
            { 
              type: 'image_url', 
              image_url: { url: imageData } 
            }
          ]
        }
      ];
    } else {
      groqMessages = [
        { role: 'system', content: enhancedSystemPrompt },
        ...messages.map(msg => ({
          role: msg.isAI ? 'assistant' : 'user' as const,
          content: msg.content
        }))
      ];
    }

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model,
      temperature: persona.temperature,
      max_tokens: persona.maxTokens,
      stream: true,
    });

    let fullResponse = '';
    let currentThinking = '';
    let isInThinkingBlock = false;

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      
      if (currentPersona === 'x' && onStream) {
        // Check for think tag opening
        if (content.includes('<think>')) {
          isInThinkingBlock = true;
          currentThinking = '';
          continue;
        }

        // Check for think tag closing
        if (content.includes('</think>')) {
          isInThinkingBlock = false;
          continue;
        }

        // Accumulate thinking content
        if (isInThinkingBlock) {
          currentThinking += content;
          onStream({ content: '', thinking: currentThinking.trim() });
        } else if (!isInThinkingBlock && content) {
          // Stream regular content
          onStream({ content, thinking: currentThinking.trim() });
        }
      } else if (onStream) {
        onStream({ content });
      }
    }

    if (!fullResponse) {
      throw new Error('No response received from the future');
    }

    return currentPersona === 'x' 
      ? extractThinkingAndContent(fullResponse)
      : { content: fullResponse };
  } catch (error) {
    console.error('Error generating AI response:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      return { content: "Looks like there's some error in the future matrix, please contact to TimeMachine Geniuses." };
    }
    return { content: "We are facing huge load on our servers and thus we've had to temporarily limit access to maintain system stability. Please be patient, this thing doesn't grow on trees." };
  }
}