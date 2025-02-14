import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { MessageProps } from '../../types/chat';
import { AI_PERSONAS } from '../../config/constants';
import { Brain } from 'lucide-react';

interface AIMessageProps extends MessageProps {
  isChatMode: boolean;
  messageId: number;
  onAnimationComplete: (messageId: number) => void;
  currentPersona?: keyof typeof AI_PERSONAS;
  isStreaming?: boolean;
}

const getPersonaColor = (persona: keyof typeof AI_PERSONAS = 'default') => {
  switch (persona) {
    case 'girlie':
      return 'text-pink-400';
    case 'x':
      return 'text-cyan-400';
    default:
      return 'text-purple-400';
  }
};

export function AIMessage({ 
  content, 
  thinking,
  isChatMode, 
  messageId, 
  hasAnimated, 
  onAnimationComplete, 
  currentPersona = 'default',
  isStreaming = false
}: AIMessageProps) {
  const [showThinking, setShowThinking] = useState(false);
  const personaColor = getPersonaColor(currentPersona);
  const contentEndRef = useRef<HTMLDivElement>(null);

  // Auto-expand thinking process while streaming for TimeMachine X
  useEffect(() => {
    if (isStreaming && currentPersona === 'x' && thinking) {
      setShowThinking(true);
    }
  }, [isStreaming, currentPersona, thinking]);

  useEffect(() => {
    if (isStreaming && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content, thinking, isStreaming]);

  const MarkdownComponents = {
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-2xl font-bold mt-6 mb-4 text-white/90 text-center">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-xl font-bold mt-5 mb-3 text-white/90 text-center">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-lg font-bold mt-4 mb-2 text-white/90 text-center">{children}</h3>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="mb-4 leading-relaxed text-center">{children}</p>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className={`font-bold ${personaColor}`}>{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic text-white/80">{children}</em>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc inline-block text-left mb-4 space-y-2 ml-4">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal inline-block text-left mb-4 space-y-2 ml-4">{children}</ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="leading-relaxed">{children}</li>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-purple-500/50 pl-4 my-4 italic text-white/70 mx-auto max-w-2xl">
        {children}
      </blockquote>
    ),
    table: ({ children }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto mb-4 flex justify-center">
        <table className="divide-y divide-white/20">{children}</table>
      </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-white/5">{children}</thead>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="px-4 py-2 text-left text-white/90 font-semibold">{children}</th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="px-4 py-2 border-t border-white/10">{children}</td>
    ),
    hr: () => <hr className="my-6 border-white/20 max-w-2xl mx-auto" />,
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }: { children: React.ReactNode }) => (
      <pre className="bg-white/10 rounded-lg p-4 mb-4 overflow-x-auto font-mono text-sm mx-auto max-w-2xl text-left">
        {children}
      </pre>
    ),
  };

  const isShortMessage = content.length < 350 && !content.includes('\n');

  const MessageContent = () => (
    <>
      {thinking && currentPersona === 'x' && (
        <div className="w-full max-w-4xl mx-auto mb-6 mt-20">
          <motion.button
            onClick={() => !isStreaming && setShowThinking(!showThinking)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full
              bg-gradient-to-r from-cyan-600/20 to-blue-600/20
              backdrop-blur-xl border border-cyan-500/20
              shadow-[0_0_15px_rgba(34,211,238,0.3)]
              hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]
              transition-all duration-300
              mx-auto
              relative
              group
              animate-border-glow
              ${isStreaming ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="relative z-10 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="text-sm">Thinking Process</span>
            </div>
          </motion.button>

          <AnimatePresence>
            {showThinking && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-4
                  bg-gradient-to-r from-cyan-950/90 to-blue-950/90
                  backdrop-blur-xl rounded-lg border border-cyan-500/20
                  shadow-[0_0_30px_rgba(34,211,238,0.2)]"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={MarkdownComponents}
                  className="text-sm text-white/80"
                >
                  {thinking}
                </ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className={`text-white/60 ${
        isChatMode 
          ? 'text-base sm:text-lg' 
          : 'text-xl sm:text-2xl md:text-3xl'
      } w-full max-w-4xl mx-auto pt-4`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={MarkdownComponents}
          className="w-full prose prose-invert prose-purple max-w-none flex flex-col items-center"
        >
          {content}
        </ReactMarkdown>
        <div ref={contentEndRef} />
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onAnimationComplete={() => !hasAnimated && onAnimationComplete(messageId)}
      className={`w-full ${isShortMessage ? 'h-[calc(100vh-12rem)] flex items-center justify-center flex-col' : ''}`}
    >
      <MessageContent />
    </motion.div>
  );
}