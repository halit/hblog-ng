'use client';

import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  isLoading: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLoading) {
      setIsVisible(true);
      setProgress(0);

      // Start progress simulation
      interval = setInterval(() => {
        setProgress((prev) => {
          // Fast initially, then slows down
          // Asymptotic approach to 90%
          const remaining = 90 - prev;
          if (remaining < 0.1) return prev;

          // Randomize the increment slightly for more natural feel
          const increment = Math.max(remaining * 0.1, 1) * (0.5 + Math.random());
          return Math.min(prev + increment, 90);
        });
      }, 200);
    } else {
      // Complete the bar
      if (isVisible) {
        setProgress(100);
        // Hide after completion animation
        const timeout = setTimeout(() => {
          setIsVisible(false);
          setProgress(0);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }

    return () => clearInterval(interval);
  }, [isLoading, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 left-0 right-0 h-[2px] z-[9999] pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#ff0055] via-[#00e5ff] to-[#ff0055] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px #ff0055, 0 0 5px #00e5ff',
        }}
      />
    </div>
  );
};
