import { useState, useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  initialCount?: number;
  increment?: number;
  totalItems: number;
}

export function useInfiniteScroll({
  initialCount = 12,
  increment = 12,
  totalItems,
}: UseInfiniteScrollOptions) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < totalItems) {
          setDisplayCount((prev) => Math.min(prev + increment, totalItems));
        }
      },
      { threshold: 0.1, rootMargin: '100px' },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [displayCount, totalItems, increment]);

  return { displayCount, observerTarget, setDisplayCount };
}
