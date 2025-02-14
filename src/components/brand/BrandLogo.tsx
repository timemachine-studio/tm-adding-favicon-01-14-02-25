import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AI_PERSONAS } from '../../config/constants';

interface BrandLogoProps {
  onPersonaChange: (persona: keyof typeof AI_PERSONAS) => void;
  currentPersona: keyof typeof AI_PERSONAS;
}

const personaColors = {
  default: 'text-purple-400',
  girlie: 'text-pink-400',
  x: 'text-cyan-400'
} as const;

const personaDescriptions = {
  default: 'The basic TimeMachine AI for general use cases',
  girlie: 'TimeMachine Girlie is the girl of girls',
  x: 'For the AGI-like experience'
} as const;

const personaGlowColors = {
  default: 'rgba(168,85,247,0.5)',
  girlie: 'rgba(255,20,147,0.7)',
  x: 'rgba(34,211,238,0.5)'
} as const;

export function BrandLogo({ onPersonaChange, currentPersona }: BrandLogoProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handlePersonaSelect = (persona: keyof typeof AI_PERSONAS) => {
    onPersonaChange(persona);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 flex items-center gap-2 cursor-pointer group"
        onClick={toggleDropdown}
      >
        <h1 
          className={`text-xl sm:text-2xl font-bold ${personaColors[currentPersona]} transition-colors duration-300`}
          style={{
            fontFamily: 'Montserrat, sans-serif',
            textShadow: `
              0 0 20px ${personaGlowColors[currentPersona]},
              0 0 40px ${personaGlowColors[currentPersona].replace(/[\d.]+\)$/, '0.3)')}
            `
          }}
        >
          {AI_PERSONAS[currentPersona].name}
        </h1>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={personaColors[currentPersona]}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-72 bg-black/90 backdrop-blur-xl rounded-lg border border-purple-500/20 shadow-xl z-50"
          >
            {Object.entries(AI_PERSONAS).map(([key, persona]) => (
              <motion.button
                key={key}
                whileHover={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
                onClick={() => handlePersonaSelect(key as keyof typeof AI_PERSONAS)}
                className={`w-full px-4 py-3 text-left transition-colors
                  ${currentPersona === key ? personaColors[key as keyof typeof personaColors] : 'text-white/60'}
                  ${currentPersona === key ? 'bg-purple-500/10' : ''}
                  first:rounded-t-lg last:rounded-b-lg`}
              >
                <div className="font-bold">{persona.name}</div>
                <div className="text-sm mt-1 opacity-60">
                  {personaDescriptions[key as keyof typeof personaDescriptions]}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}