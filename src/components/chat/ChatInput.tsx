import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { ChatInputProps } from '../../types/chat';
import { LoadingSpinner } from '../loading/LoadingSpinner';
import { ImagePreview } from './ImagePreview';
import { AI_PERSONAS } from '../../config/constants';

const personaGlowColors = {
  default: 'rgba(168,85,247,0.3)',
  girlie: 'rgba(255,0,128,0.3)', // Brighter, more saturated hot pink glow
  x: 'rgba(34,211,238,0.3)'
} as const;

const personaBorderColors = {
  default: 'from-purple-600/20 to-blue-600/20',
  girlie: 'from-pink-500 to-rose-400', // More opaque, vibrant gradient
  x: 'from-cyan-600/20 to-blue-600/20'
} as const;

const personaRingColors = {
  default: 'focus:ring-purple-500/50',
  girlie: 'focus:ring-pink-500', // Full opacity ring
  x: 'focus:ring-cyan-500/50'
} as const;

export function ChatInput({ onSendMessage, isLoading, currentPersona = 'default' }: ChatInputProps & { currentPersona?: keyof typeof AI_PERSONAS }) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedImage) && !isLoading && !isUploading) {
      if (selectedImage) {
        setIsUploading(true);
        try {
          const base64Image = await convertImageToBase64(selectedImage);
          await onSendMessage(message, base64Image);
          setSelectedImage(null);
          setImagePreviewUrl(null);
        } catch (error) {
          console.error('Error processing image:', error);
        } finally {
          setIsUploading(false);
        }
      } else {
        await onSendMessage(message);
      }
      setMessage('');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {imagePreviewUrl && (
        <ImagePreview
          url={imagePreviewUrl}
          onRemove={removeImage}
          isUploading={isUploading}
        />
      )}
      <div className="relative">
        {/* Premium glowing effect */}
        <div 
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: `radial-gradient(circle at center, ${personaGlowColors[currentPersona]}, transparent)` }}
        />
        
        <div className="relative flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            ref={fileInputRef}
          />
          
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className={`p-3 rounded-full
              bg-gradient-to-r ${personaBorderColors[currentPersona]}
              backdrop-blur-xl text-white
              disabled:opacity-50 relative group
              border border-white/10
              shadow-[0_0_15px_${personaGlowColors[currentPersona]}]
              transition-all duration-300
              ${currentPersona === 'girlie' ? 'hover:shadow-[0_0_25px_rgba(255,0,128,0.7)]' : ''}`}
          >
            <Plus className="w-5 h-5 relative z-10 drop-shadow-glow" />
          </motion.button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explore the future..."
            disabled={isLoading || isUploading}
            className={`w-full px-6 py-4 pr-24 rounded-full 
              bg-gray-900/50 backdrop-blur-xl
              text-white placeholder-gray-400
              border border-white/10
              focus:outline-none focus:ring-2 ${personaRingColors[currentPersona]}
              disabled:opacity-50
              shadow-[0_0_15px_${personaGlowColors[currentPersona]}]
              transition-all duration-300
              text-base sm:text-base
              ${currentPersona === 'girlie' ? 'focus:shadow-[0_0_25px_rgba(255,0,128,0.7)]' : ''}`}
            style={{
              textShadow: '0 0 10px rgba(255,255,255,0.1)',
              fontSize: '16px'
            }}
          />

          <div className="absolute right-2 flex items-center gap-2">
            <VoiceRecorder 
              onSendMessage={onSendMessage}
              disabled={isLoading || isUploading || message.trim().length > 0}
              currentPersona={currentPersona}
            />

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading || isUploading || (!message.trim() && !selectedImage)}
              className={`p-3 rounded-full
                bg-gradient-to-r ${personaBorderColors[currentPersona]}
                backdrop-blur-xl
                text-white
                disabled:opacity-50 relative group
                border border-white/10
                shadow-[0_0_15px_${personaGlowColors[currentPersona]}]
                transition-all duration-300
                ${currentPersona === 'girlie' ? 'hover:shadow-[0_0_25px_rgba(255,0,128,0.7)]' : ''}`}
            >
              {isLoading || isUploading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="w-5 h-5 relative z-10 drop-shadow-glow" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </form>
  );
}