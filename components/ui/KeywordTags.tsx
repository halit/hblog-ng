'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';

interface KeywordTagsProps {
  keywords: string[];
  onKeywordClick?: (keyword: string) => void;
  maxWidth?: number;
  className?: string;
  sortByLength?: boolean;
  gap?: number;
  useButton?: boolean; // Use button instead of Link when inside clickable parent (like NavLink)
}

const KeywordTags: React.FC<KeywordTagsProps> = ({
  keywords,
  onKeywordClick,
  maxWidth,
  className = 'flex items-center gap-2',
  sortByLength = false,
  gap = 8,
  useButton = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);

  // Sort keywords alphabetically to ensure consistent display order
  const sortedKeywords = React.useMemo(() => {
    return [...keywords].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [keywords]);

  // Use useLayoutEffect to measure before paint to avoid flicker
  useLayoutEffect(() => {
    if (!containerRef.current || sortedKeywords.length === 0) {
      setVisibleIndices(sortedKeywords.map((_, i) => i));
      return;
    }

    const calculateVisible = () => {
      const container = containerRef.current;
      if (!container) return;

      // Get available width
      // If maxWidth provided, use it
      // Otherwise try to get parent width minus siblings, or container width
      let availableWidth = maxWidth;

      if (!availableWidth) {
        if (container.parentElement) {
          // Calculate available space in parent line
          // This is tricky if flexbox is complex, but generally:
          // Parent Width - Siblings Widths - Padding
          const parentStyle = window.getComputedStyle(container.parentElement);
          const parentWidth =
            container.parentElement.offsetWidth -
            parseFloat(parentStyle.paddingLeft) -
            parseFloat(parentStyle.paddingRight);

          // Sum of siblings width (excluding self)
          let siblingsWidth = 0;
          for (let i = 0; i < container.parentElement.children.length; i++) {
            const child = container.parentElement.children[i] as HTMLElement;
            if (child !== container && window.getComputedStyle(child).position !== 'absolute') {
              siblingsWidth +=
                child.offsetWidth +
                parseFloat(window.getComputedStyle(child).marginLeft) +
                parseFloat(window.getComputedStyle(child).marginRight);
            }
          }

          // Also account for gap in parent if flex/grid
          // This is an approximation
          availableWidth = Math.max(0, parentWidth - siblingsWidth - 20); // -20 buffer
        } else {
          availableWidth = container.offsetWidth;
        }
      }

      // If we still have 0 or very small width (e.g. hidden parent), fallback to showing nothing or everything?
      // Let's default to a reasonable min width if valid
      if (!availableWidth || availableWidth < 50) {
        // Try container offsetWidth again as fallback
        availableWidth = container.offsetWidth;
      }

      // Double check: if availableWidth is still small (e.g. 0), we might be in a hidden state or initial render
      if (availableWidth <= 0) {
        // Force full width to avoid "+N" bug on initial load
        setVisibleIndices(sortedKeywords.map((_, i) => i));
        return;
      }

      // Buffer for "+N" indicator (approx 48px to cover up to 3 digits safely)
      const plusIndicatorWidth = 48;

      // Measure tags
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.whiteSpace = 'nowrap';
      tempDiv.style.fontSize = '10px'; // Match the display font size
      tempDiv.style.fontFamily = 'JetBrains Mono, monospace'; // Match font
      tempDiv.style.padding = '2px 8px'; // Match padding
      tempDiv.style.border = '1px solid'; // Match border
      document.body.appendChild(tempDiv);

      const itemsToMeasure = sortedKeywords.map((tag, idx) => ({ tag, idx }));

      // Sort if requested
      if (sortByLength) {
        itemsToMeasure.sort((a, b) => a.tag.length - b.tag.length);
      }

      const measuredItems = itemsToMeasure.map((item) => {
        tempDiv.textContent = `# ${item.tag}`;
        return {
          ...item,
          width: tempDiv.offsetWidth,
        };
      });

      document.body.removeChild(tempDiv);

      // Reset and try again with clearer logic
      let usedWidth = 0;
      const finalVisible: number[] = [];
      let needsTruncation = false;

      for (let i = 0; i < measuredItems.length; i++) {
        const item = measuredItems[i];
        const itemGap = finalVisible.length > 0 ? gap : 0;

        // Check if adding this item fits
        if (usedWidth + itemGap + item.width <= availableWidth) {
          usedWidth += itemGap + item.width;
          finalVisible.push(item.idx);
        } else {
          needsTruncation = true;
          break;
        }
      }

      if (needsTruncation) {
        // We need to show +N.
        // Check if we have enough space for +N with the current finalVisible items
        // The current 'usedWidth' includes the items in finalVisible.
        // We need 'usedWidth + gap + plusIndicatorWidth <= availableWidth'

        while (finalVisible.length > 0 && usedWidth + gap + plusIndicatorWidth > availableWidth) {
          const lastIdx = finalVisible.pop()!;
          const lastItem = measuredItems.find((m) => m.idx === lastIdx)!;
          const lastGap = finalVisible.length > 0 ? gap : 0;
          usedWidth -= lastItem.width + lastGap;
        }
      }

      // Restore original order for display if we sorted
      if (sortByLength) {
        finalVisible.sort((a, b) => a - b);
      } else {
        finalVisible.sort((a, b) => a - b);
      }

      setVisibleIndices(finalVisible);
    };

    calculateVisible();

    const resizeObserver = new ResizeObserver(() => {
      // Request animation frame to throttle
      requestAnimationFrame(calculateVisible);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      if (containerRef.current.parentElement) {
        resizeObserver.observe(containerRef.current.parentElement);
      }
    }

    return () => resizeObserver.disconnect();
  }, [sortedKeywords, maxWidth, sortByLength, gap]);

  const visibleTags = visibleIndices.map((idx) => sortedKeywords[idx]);
  const hiddenIndices = sortedKeywords.map((_, i) => i).filter((i) => !visibleIndices.includes(i));
  const hiddenTags = hiddenIndices.map((i) => sortedKeywords[i]);
  const remainingCount = hiddenTags.length;

  return (
    <div ref={containerRef} className={className} style={{ minWidth: 0, maxWidth: '100%' }}>
      {visibleTags.map((keyword: string) => {
        const keywordUrl = `/keywords/${encodeURIComponent(keyword.toLowerCase())}`;

        if (onKeywordClick) {
          // Use button when inside clickable parent (like NavLink) to avoid nested <a> tags
          if (useButton) {
            return (
              <button
                key={keyword}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onKeywordClick(keyword);
                }}
                className="bg-gray-900/50 print:bg-transparent border border-gray-800 print:border-gray-200 text-gray-400 print:text-black font-mono text-[10px] px-2 py-1 rounded-sm hover:border-offense/50 hover:text-offense hover:bg-offense/5 transition-all duration-300 cursor-pointer whitespace-nowrap flex-shrink-0"
                aria-label={`View posts tagged with ${keyword}`}
              >
                #{keyword}
              </button>
            );
          }

          // Use Link when not inside clickable parent (for SEO)
          return (
            <Link
              key={keyword}
              href={keywordUrl}
              onClick={(e) => {
                e.stopPropagation();
                onKeywordClick(keyword);
              }}
              className="bg-gray-900/50 print:bg-transparent border border-gray-800 print:border-gray-200 text-gray-400 print:text-black font-mono text-[10px] px-2 py-1 rounded-sm hover:border-offense/50 hover:text-offense hover:bg-offense/5 transition-all duration-300 cursor-pointer whitespace-nowrap flex-shrink-0 no-underline"
            >
              #{keyword}
            </Link>
          );
        }

        return (
          <span
            key={keyword}
            className="bg-gray-900/50 print:bg-transparent border border-gray-800 print:border-gray-200 text-gray-400 print:text-black font-mono text-[10px] px-2 py-1 rounded-sm whitespace-nowrap flex-shrink-0"
          >
            #{keyword}
          </span>
        );
      })}

      {remainingCount > 0 && (
        <div className="relative group/more flex-shrink-0">
          <span className="text-[10px] font-mono text-gray-500 px-2 py-1 whitespace-nowrap flex-shrink-0 cursor-help border border-transparent hover:border-gray-800 rounded-sm transition-colors">
            +{remainingCount}
          </span>

          {/* Tooltip for hidden tags - Force top positioning */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover/more:block z-50 w-max max-w-[200px] origin-bottom-right">
            <div className="bg-[#0a0f14] border border-gray-800 p-2 rounded shadow-xl">
              <div className="flex flex-wrap gap-1">
                {hiddenTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-gray-400 font-mono bg-gray-900 px-1.5 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordTags;
