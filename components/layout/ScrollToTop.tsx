'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopProps {
  threshold?: number; // Distance from bottom to show button
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ threshold = 300 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const shouldShow = scrollTop > threshold;

      if (shouldShow) {
        // Cancel any pending hide timer immediately
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setIsVisible(true);
        // Small delay to ensure DOM is ready for transition
        requestAnimationFrame(() => setOpacity(1));
      } else {
        setOpacity(0);
        // Only set hide timer if not already pending
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            timeoutRef.current = null;
          }, 500);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-16 right-6 z-50 bg-[#0a0f14] border border-gray-800 hover:border-offense text-gray-400 hover:text-offense p-3 rounded shadow-lg hover:shadow-offense/20 group transition-all duration-300"
      style={{ opacity }}
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} className="group-hover:translate-y-[-2px] transition-transform" />
    </button>
  );
};

export default ScrollToTop;
