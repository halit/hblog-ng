'use client';

import React, { useState, useEffect } from 'react';

interface GlitchTextProps {
  text?: string;
  mode?: 'offense' | 'defense';
}

const redItems = [
  'Offensive Operations',
  'Vulnerability Research',
  'Software Exploitation',
  'Malware Development',
];

const blueItems = [
  'Threat Intelligence', 
  'Malware Analysis', 
  'Computer Forensics', 
  'Cryptography', 
  'Incident Response'
];

const GlitchText: React.FC<GlitchTextProps> = ({ text, mode }) => {
  const [localMode, setLocalMode] = useState<'offense' | 'defense'>('offense');
  const [cycleIndex, setCycleIndex] = useState<number>(0);

  useEffect(() => {
    if (mode) return; // if mode forced, don't toggle
    const interval = setInterval(() => {
      setLocalMode((prev) => {
        const nextMode = prev === 'offense' ? 'defense' : 'offense';

        if (nextMode === 'offense') {
          // Moving to red: increment cycle index
          setCycleIndex((prevIndex) => prevIndex + 1);
        }
        // For blue, we use the current cycleIndex (no increment needed)

        return nextMode;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [mode]);

  // Calculate current text based on mode and cycle index
  const currentText =
    text ||
    (localMode === 'offense'
      ? redItems[cycleIndex % redItems.length]
      : blueItems[cycleIndex % blueItems.length]);

  const currentMode = mode || localMode;
  const content = text || currentText;

  return (
    <span className="relative inline-block align-bottom">
      <span
        className={`glitch-text glitch-text-dynamic font-bold ${currentMode === 'offense' ? 'text-offense' : 'text-defense'}`}
        data-text={content}
        style={
          {
            '--glitch-color-1': currentMode === 'offense' ? '#00e5ff' : '#ff0055',
            '--glitch-color-2': currentMode === 'offense' ? '#00e5ff' : '#ff0055',
          } as React.CSSProperties
        }
      >
        {content}
      </span>
    </span>
  );
};

export default GlitchText;
