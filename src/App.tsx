import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './components/chat/ChatMessage';
import { ChatInput } from './components/chat/ChatInput';
import { ShiftMode } from './components/chat/ShiftMode';
import { BrandLogo } from './components/brand/BrandLogo';
import { LoadingContainer } from './components/loading/LoadingContainer';
import { MusicPlayer } from './components/music/MusicPlayer';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChat } from './hooks/useChat';
import { AboutUsToast } from './components/about/AboutUsToast';

export default function App() {
  const { 
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
  } = useChat();
  
  const [isCenterStage, setIsCenterStage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);

  const scrollToMessage = () => {
    const container = document.querySelector('.message-container');
    if (container) {
      const lastMessage = messages[messages.length - 1];
      const isShortMessage = lastMessage.content.length < 350 && !lastMessage.content.includes('\n');
      
      if (!lastMessage.isAI || isShortMessage) {
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
        if (isAtBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isAI) {
        lastUserMessageRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (!streamingMessageId) {
        scrollToMessage();
      }
    }
  }, [messages, streamingMessageId]);

  useEffect(() => {
    const updateVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVH();
    window.addEventListener('resize', updateVH);
    return () => window.removeEventListener('resize', updateVH);
  }, []);

  const personaGlowColors = {
    default: 'rgba(168,85,247,0.3)',
    girlie: 'rgba(255,0,128,0.5)',
    x: 'rgba(34,211,238,0.3)'
  };

  const personaBorderColors = {
    default: 'from-purple-600/20 to-blue-600/20',
    girlie: 'from-pink-500 to-rose-400',
    x: 'from-cyan-600/20 to-blue-600/20'
  };

  return (
    <div 
      className="min-h-screen bg-black text-white relative overflow-hidden"
      style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <main className="relative h-screen flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-black/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <BrandLogo 
              currentPersona={currentPersona}
              onPersonaChange={handlePersonaChange}
            />
            <div className="flex items-center gap-2">
              {(currentPersona === 'default' || currentPersona === 'girlie') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCenterStage(!isCenterStage)}
                  className={`px-4 py-2 rounded-full
                    bg-gradient-to-r ${personaBorderColors[currentPersona]}
                    backdrop-blur-xl text-white
                    border ${isCenterStage ? `border-${currentPersona === 'girlie' ? 'pink' : 'purple'}-500` : 'border-white/10'}
                    transition-all duration-300
                    flex items-center gap-2
                    ${isCenterStage 
                      ? `shadow-[0_0_20px_${currentPersona === 'girlie' ? 'rgba(255,0,128,0.5)' : 'rgba(168,85,247,0.5)'}] 
                         ${currentPersona === 'girlie' ? 'bg-pink-500/20' : 'bg-purple-500/20'}`
                      : `shadow-[0_0_15px_${personaGlowColors[currentPersona]}]`}`}
                >
                  <Star className={`w-4 h-4 ${isCenterStage 
                    ? currentPersona === 'girlie' ? 'text-pink-400' : 'text-purple-400'
                    : 'text-white'}`} 
                  />
                  <span className={`text-sm ${isCenterStage 
                    ? currentPersona === 'girlie' ? 'text-pink-400' : 'text-purple-400'
                    : 'text-white'}`}
                  >
                    Center Stage
                  </span>
                </motion.button>
              )}
              <ShiftMode 
                isChatMode={isChatMode} 
                onToggle={() => setChatMode(!isChatMode)} 
                currentPersona={currentPersona}
              />
            </div>
          </div>
        </header>

        <LoadingContainer isVisible={isLoading} />
        
        <MusicPlayer 
          currentPersona={currentPersona}
          currentEmotion={currentEmotion}
          isCenterStage={isCenterStage}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar message-container">
          <div className={`min-h-full ${isChatMode ? 'pt-20' : 'pt-16'} pb-48`}>
            {isChatMode ? (
              <div className="w-full max-w-4xl mx-auto px-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-red-400">
                    {error}
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    ref={index === messages.length - 1 && !message.isAI ? lastUserMessageRef : null}
                    className={index === 0 ? 'h-[calc(100vh-16rem)] flex items-center justify-center' : ''}
                  >
                    <ChatMessage 
                      {...message}
                      isChatMode={isChatMode}
                      onAnimationComplete={markMessageAsAnimated}
                      currentPersona={currentPersona}
                      isStreaming={message.id === streamingMessageId}
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-20" />
              </div>
            ) : (
              <div className="w-full px-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-red-400">
                    {error}
                  </div>
                )}
                {messages.length > 0 && (
                  <ChatMessage 
                    {...messages[messages.length - 1]}
                    isChatMode={isChatMode}
                    onAnimationComplete={markMessageAsAnimated}
                    currentPersona={currentPersona}
                    isStreaming={messages[messages.length - 1].id === streamingMessageId}
                  />
                )}
                <div ref={messagesEndRef} className="h-20" />
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
          <div className="max-w-4xl mx-auto">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading}
              currentPersona={currentPersona}
            />
          </div>
        </div>

        <AboutUsToast
          isVisible={showAboutUs}
          onClose={dismissAboutUs}
          onClick={() => {
            // TODO: Add your article content and display logic here
            console.log('Show article');
          }}
          currentPersona={currentPersona}
        />
      </main>
    </div>
  );
}