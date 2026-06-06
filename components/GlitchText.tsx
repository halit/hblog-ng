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
  'Incident Response',
];

const GlitchText: React.FC<GlitchTextProps> = ({ text, mode }) => {
  // A single monotonic counter is the source of truth; mode and item index are
  // derived from it. Keeping the updater pure avoids StrictMode's double-invoke
  // advancing the index twice (which previously pinned offense to even indices).
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (mode) return; // if mode forced, don't toggle
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [mode]);

  // Even ticks = offense, odd ticks = defense. Each full offense→defense pair
  // advances the cycle index by one, so every item is eventually shown.
  const localMode: 'offense' | 'defense' = tick % 2 === 0 ? 'offense' : 'defense';
  const cycleIndex = Math.floor(tick / 2);

  const currentMode = mode || localMode;
  const items = currentMode === 'offense' ? redItems : blueItems;
  const content = text || items[cycleIndex % items.length];

  return (
    <span className="relative inline-block align-bottom">
      <span
        className={`glitch-text glitch-text-dynamic font-bold whitespace-nowrap ${currentMode === 'offense' ? 'text-offense' : 'text-defense'}`}
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
