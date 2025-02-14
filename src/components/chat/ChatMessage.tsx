import React from 'react';
import { AIMessage } from './AIMessage';
import { UserMessage } from './UserMessage';
import { Message } from '../../types/chat';
import { AI_PERSONAS } from '../../config/constants';

interface ChatMessageProps extends Message {
  isChatMode: boolean;
  onAnimationComplete: (messageId: number) => void;
  currentPersona: keyof typeof AI_PERSONAS;
}

export function ChatMessage({ content, thinking, isAI, isChatMode, id, hasAnimated, onAnimationComplete, currentPersona }: ChatMessageProps) {
  const isShortMessage = content.length < 350 && !content.includes('\n');

  if (isAI) {
    return (
      <div className={`w-full ${isShortMessage ? 'h-[calc(100vh-12rem)] flex items-center justify-center' : ''}`}>
        <AIMessage 
          content={content} 
          thinking={thinking}
          isChatMode={isChatMode} 
          messageId={id}
          hasAnimated={hasAnimated}
          onAnimationComplete={onAnimationComplete}
          currentPersona={currentPersona}
        />
      </div>
    );
  }
  return <UserMessage content={content} />;
}