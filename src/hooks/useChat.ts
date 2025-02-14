import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types/chat';
import { generateAIResponse } from '../services/ai/groqService';
import { INITIAL_MESSAGE, AI_PERSONAS } from '../config/constants';
import { 
  checkUsageLimit, 
  incrementUsage, 
  getRemainingUsage,
  getTotalUsageCount,
  getDevControls
} from '../config/devControls';

// Get client IP (in a real environment, this would come from your server)
const getClientIdentifier = (): string => {
  // For demo purposes, we'll use a combination of user agent and screen resolution
  // In production, this should be replaced with proper IP tracking via server
  const identifier = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}`;
  return btoa(identifier); // Base64 encode the identifier
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([{ ...INITIAL_MESSAGE, hasAnimated: false }]);
  const [isChatMode, setChatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<keyof typeof AI_PERSONAS>('default');
  const [currentEmotion, setCurrentEmotion] = useState<string>('joy');
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAboutUs, setShowAboutUs] = useState(false);

  // Check if app is online
  const isAppOnline = getDevControls().isOnline;

  // Check total usage and show AboutUs toast after 3 messages
  useEffect(() => {
    const clientId = getClientIdentifier();
    const totalUsage = getTotalUsageCount(clientId, currentPersona);
    setShowAboutUs(totalUsage >= 3);
  }, [messages, currentPersona]);

  const extractEmotion = (content: string): string | null => {
    const match = content.match(/<emotion>([a-z]+)<\/emotion>/i);
    if (!match) return null;
    
    const emotion = match[1].toLowerCase();
    const validEmotions = ['sadness', 'joy', 'love', 'excitement', 'anger', 'motivation', 'jealousy', 'relaxation', 'hope', 'anxiety'];
    
    return validEmotions.includes(emotion) ? emotion : null;
  };

  const cleanContent = (content: string): string => {
    const emotion = extractEmotion(content);
    if (emotion) {
      return content.replace(/<emotion>[a-z]+<\/emotion>/i, '').trim();
    }
    return content;
  };

  const handleSendMessage = useCallback(async (content: string, imageData?: string) => {
    // Check if app is online
    if (!isAppOnline) {
      setError('TimeMachine is currently offline. Please try again later.');
      return;
    }

    const clientId = getClientIdentifier();
    
    // Check usage limits
    if (!checkUsageLimit(clientId, currentPersona)) {
      const remaining = getRemainingUsage(clientId, currentPersona);
      setError(`You've reached the daily limit for ${AI_PERSONAS[currentPersona].name}. Remaining messages: ${remaining}. Try again tomorrow or switch to a different persona.`);
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      content,
      isAI: false,
      hasAnimated: false
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const streamingId = Date.now() + 1;
      setStreamingMessageId(streamingId);
      setMessages(prev => [...prev, {
        id: streamingId,
        content: '',
        thinking: currentPersona === 'x' ? '' : undefined,
        isAI: true,
        hasAnimated: false
      }]);

      let accumulatedContent = '';

      const aiResponse = await generateAIResponse(
        [...messages, userMessage],
        imageData,
        AI_PERSONAS[currentPersona].systemPrompt,
        currentPersona,
        (data) => {
          if (data.content) {
            accumulatedContent += data.content;
            const cleanedContent = cleanContent(accumulatedContent);
            setMessages(prev => prev.map(msg => 
              msg.id === streamingId
                ? { 
                    ...msg, 
                    content: cleanedContent,
                    thinking: data.thinking !== undefined ? data.thinking : msg.thinking
                  }
                : msg
            ));
          }
        }
      );
      
      const emotion = extractEmotion(aiResponse.content);
      const cleanedContent = cleanContent(aiResponse.content);
      
      if (emotion) {
        setCurrentEmotion(emotion);
      }

      setMessages(prev => prev.map(msg =>
        msg.id === streamingId
          ? { ...msg, content: cleanedContent, thinking: aiResponse.thinking }
          : msg
      ));

      // Increment usage after successful response
      incrementUsage(clientId, currentPersona);
    } catch (error) {
      console.error('Failed to generate the response from future:', error);
      setError('Failed to generate response. Please try again.');
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, [messages, currentPersona, isAppOnline]);

  const handlePersonaChange = useCallback((persona: keyof typeof AI_PERSONAS) => {
    const clientId = getClientIdentifier();
    const remaining = getRemainingUsage(clientId, persona);
    
    if (remaining === 0) {
      setError(`You've reached the daily limit for ${AI_PERSONAS[persona].name}. Try again tomorrow or choose a different persona.`);
      return;
    }

    setCurrentPersona(persona);
    setError(null);
    const initialMessage = cleanContent(AI_PERSONAS[persona].initialMessage);
    setMessages([{
      id: Date.now(),
      content: initialMessage,
      isAI: true,
      hasAnimated: false
    }]);
  }, []);

  const markMessageAsAnimated = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, hasAnimated: true } : msg
    ));
  }, []);

  const dismissAboutUs = useCallback(() => {
    setShowAboutUs(false);
  }, []);

  return {
    messages,
    isChatMode,
    isLoading,
    currentPersona,
    currentEmotion,
    streamingMessageId,
    error,
    showAboutUs,
    setChatMode,
    handleSendMessage,
    handlePersonaChange,
    markMessageAsAnimated,
    dismissAboutUs
  };
}