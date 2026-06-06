'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useVaultData } from '../hooks/useVaultData';
import { createSearchRegex } from '../lib/search-client';
import { formatBibtexEntry } from '../lib/bibtex-client';
import referencesData from '@/data/references.json';
import { Marked } from 'marked';
import { obsidianExtensions } from '../lib/markdown/extensions';
import { MarkdownContent } from './markdown/MarkdownContent';
import { BibtexEntry } from '../lib/bibtex-client';

// Lazy singleton — avoids stacking extensions on the global marked instance
// on every module load (observable in Next.js hot-reload).
let _markedInstance: Marked | null = null;
function getMarked(): Marked {
  if (!_markedInstance) {
    _markedInstance = new Marked({ gfm: true, breaks: true });
    _markedInstance.use({ extensions: obsidianExtensions });
  }
  return _markedInstance;
}

interface MarkdownRendererProps {
  content: string;
  postType?: 'blog' | 'research' | 'project' | 'profile' | 'system' | 'intel';
}

interface Reference {
  id: string;
  url?: string;
  label?: string;
  number: number;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const vaultData = useVaultData();
  const pathname = usePathname();
  const [highlightedRef, setHighlightedRef] = React.useState<number | null>(null);

  // Initialize bibtexEntries synchronously
  const bibtexEntries = React.useMemo(
    () => new Map<string, BibtexEntry>(Object.entries(referencesData) as [string, BibtexEntry][]),
    [],
  );

  // Calculate references synchronously based on content
  const { references, referenceMap } = React.useMemo(() => {
    const refRegex = /\[ref:([^\]]+)\]/g;
    const seenRefs = new Set<string>();
    const refs: Reference[] = [];
    const refMap = new Map<string, Reference>();
    let counter = 1;
    let match;

    while ((match = refRegex.exec(content)) !== null) {
      const refKey = match[1].trim();
      // Look up in bibtex entries
      const bibtexEntry = bibtexEntries.get(refKey);

      if (bibtexEntry && !seenRefs.has(refKey)) {
        seenRefs.add(refKey);
        const formatted = formatBibtexEntry(bibtexEntry);
        const url = bibtexEntry.fields.url || '';

        const ref: Reference = {
          id: refKey,
          url: url,
          label: formatted,
          number: counter++,
        };
        refs.push(ref);
        refMap.set(refKey, ref);
      }
    }
    return { references: refs, referenceMap: refMap };
  }, [content, bibtexEntries]);

  // Handle search navigation - scroll to and highlight found text
  // Trigger on both content change and pathname change (for same-page navigation)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const processSearchHighlight = () => {
      const searchDataStr = sessionStorage.getItem('searchHighlight');
      if (searchDataStr) {
        try {
          const searchData = JSON.parse(searchDataStr);
          sessionStorage.removeItem('searchHighlight');

          // Wait for content to render
          setTimeout(() => {
            const searchTerm = searchData.query.toLowerCase();

            // Find first occurrence in visible text
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
              acceptNode: (node) => {
                // Skip script, style, and code blocks
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')
                  return NodeFilter.FILTER_REJECT;
                if (parent.closest('pre') || parent.closest('code'))
                  return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
              },
            });

            let textNode: Node | null;
            let foundElement: HTMLElement | null = null;

            // Create flexible regex for matching
            const regex = createSearchRegex(searchTerm);

            while ((textNode = walker.nextNode())) {
              const text = textNode.textContent || '';

              // Reset regex lastIndex
              regex.lastIndex = 0;
              const match = regex.exec(text);

              if (match) {
                const index = match.index;
                const matchLength = match[0].length;

                foundElement = textNode.parentElement;
                if (foundElement) {
                  // Scroll to center the element in viewport
                  const elementRect = foundElement.getBoundingClientRect();
                  const viewportHeight = window.innerHeight;
                  const elementHeight = elementRect.height;

                  // Calculate position to center element vertically
                  const scrollPosition =
                    elementRect.top + window.pageYOffset - viewportHeight / 2 + elementHeight / 2;

                  window.scrollTo({
                    top: Math.max(0, scrollPosition),
                    behavior: 'smooth',
                  });

                  // Highlight using mark element after scroll
                  // Capture textNode in closure
                  const targetNode = textNode as Text;
                  setTimeout(() => {
                    try {
                      // Manually split text node to insert mark element safely
                      const mark = document.createElement('mark');
                      mark.className = 'bg-offense/30 text-offense px-0.5 rounded font-bold';
                      mark.style.animation = 'pulse 2s ease-in-out';

                      const matchText = targetNode.data.substring(index, index + matchLength);
                      mark.textContent = matchText;

                      const afterText = targetNode.splitText(index);
                      afterText.data = afterText.data.substring(matchLength);
                      targetNode.parentNode?.insertBefore(mark, afterText);

                      // Remove highlight after 3 seconds
                      setTimeout(() => {
                        if (mark.parentNode) {
                          const parent = mark.parentNode;
                          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
                          parent.normalize();
                        }
                      }, 3000);
                    } catch (_e) {
                      console.warn('Could not highlight text:', _e);
                    }
                  }, 300);
                }
                break;
              }
            }
          }, 800);
        } catch (_e) {
          console.warn('Failed to process search highlight:', _e);
        }
      }
    };

    // Process immediately
    processSearchHighlight();

    // Also listen for custom event (for same-page navigation)
    const handleSearchTrigger = () => {
      processSearchHighlight();
    };
    window.addEventListener('searchHighlightTrigger', handleSearchTrigger);

    return () => {
      window.removeEventListener('searchHighlightTrigger', handleSearchTrigger);
    };
  }, [content, pathname]); // Also trigger on pathname change for same-page navigation

  const tokens = React.useMemo(() => {
    return getMarked().lexer(content);
  }, [content]);

  const onReferenceClick = React.useCallback((num: number) => {
    setHighlightedRef(num);
    const element = document.getElementById(`ref-${num}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setHighlightedRef(null), 2500);
  }, []);

  // Check if content already has a References section
  const hasReferencesSection = /^##+\s+References?/im.test(content);

  return (
    <>
      <div className="space-y-4">
        <MarkdownContent 
          tokens={tokens} 
          vaultData={vaultData} 
          referenceMap={referenceMap}
          onReferenceClick={onReferenceClick}
        />
      </div>
      {references.length > 0 && !hasReferencesSection && (
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h1 id="references" className="text-2xl font-bold text-white font-display mb-4">
            References
          </h1>
          <div className="space-y-2">
            {references.map((ref) => {
              // Clean up the label - remove any double periods
              let displayLabel = ref.label || '';
              if (displayLabel) {
                // Fix double periods
                displayLabel = displayLabel.replace(/\.{2,}/g, '.');
                // Ensure proper spacing
                displayLabel = displayLabel.replace(/\s+/g, ' ').trim();
              }

              return (
                <div
                  id={`ref-${ref.number}`}
                  key={ref.id}
                  className={`text-sm text-gray-300 font-mono mb-3 p-3 rounded border transition-all duration-500 flex gap-3 ${
                    highlightedRef === ref.number
                      ? 'border-offense bg-offense/5 shadow-[0_0_20px_rgba(255,0,85,0.2)]'
                      : 'border-gray-800/50 bg-[#0a0f14] hover:border-offense/50 hover:shadow-[0_0_20px_-5px_rgba(255,0,85,0.15)]'
                  }`}
                >
                  <span className="text-offense font-bold text-xs select-none flex-shrink-0 mt-0.5">
                    [{ref.number}]
                  </span>
                  <div className="flex-1 flex flex-col gap-1">
                    {displayLabel ? (
                      <>
                        <span className="text-gray-300 leading-relaxed">{displayLabel}</span>
                        {ref.url && (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-defense hover:text-defense/80 border-b border-dotted border-defense/50 hover:border-defense w-fit text-xs mt-1"
                          >
                            View Source ↗
                          </a>
                        )}
                      </>
                    ) : ref.url ? (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-defense hover:text-defense/80 border-b border-dotted border-defense/50 hover:border-defense"
                      >
                        {ref.url}
                      </a>
                    ) : (
                      <span className="text-gray-500">{ref.id}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default MarkdownRenderer;
