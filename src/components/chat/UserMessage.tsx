import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { MessageProps } from '../../types/chat';
import { slideInFromRight } from '../../utils/animations';

export function UserMessage({ content }: MessageProps) {
  return (
    <motion.div
      {...slideInFromRight}
      className="flex items-start gap-2 px-4 py-2 justify-end"
    >
      <p className="text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-2xl backdrop-blur-sm
        border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        {content}
      </p>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20
        border border-white/10 flex items-center justify-center backdrop-blur-sm">
        <User className="w-4 h-4 text-gray-300" />
      </div>
    </motion.div>
  );
}