'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText, FolderKanban, BookOpen, ArrowRight } from 'lucide-react';
import { useLazyVaultData } from '../hooks/useLazyVaultData';
import { useRouter } from 'next/navigation';
import { getPathFromId } from '../lib/routing';
import {
  performSearch,
  EnhancedSearchResult,
  loadSearchIndex,
  createSearchRegex,
} from '../lib/search-client';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [vaultData, isLoading, loadVaultData] = useLazyVaultData();
  const [results, setResults] = useState<EnhancedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Load vault data (lite) when modal opens
  useEffect(() => {
    if (isOpen && !isLoading && vaultData.length === 0) {
      loadVaultData();
    }
  }, [isOpen, isLoading, vaultData.length, loadVaultData]);

  // Preload search index when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSearchIndex();
    }
  }, [isOpen]);

  // Perform search when query changes
  useEffect(() => {
    const doSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      // We need vaultData for displaying results (titles, etc)
      if (vaultData.length === 0) return;

      setIsSearching(true);
      try {
        const searchResults = await performSearch(query, vaultData);
        setResults(searchResults);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(doSearch, 150); // Small debounce
    return () => clearTimeout(debounceTimer);
  }, [query, vaultData]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelectResult = useCallback(
    (result: EnhancedSearchResult) => {
      if (!result.node) return;

      const node = result.node;
      const path = getPathFromId(node.id, node);

      // Check if we're already on this page
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isSamePage = currentPath === path || currentPath === `${path}/`;

      // Store search query and match info for highlighting after navigation
      // MiniSearch returns matches differently, so we adapt or skip complex highlighting logic for now
      // MiniSearch match structure: { field: string, term: string, score: number }
      // For now we just pass the query for simple highlighting
      const searchData = {
        query: query.trim(),
        timestamp: Date.now(),
      };
      sessionStorage.setItem('searchHighlight', JSON.stringify(searchData));

      if (isSamePage) {
        // If same page, trigger a custom event to force highlight
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('searchHighlightTrigger'));
        }
        onClose();
        setQuery('');
      } else {
        router.push(path);
        onClose();
        setQuery('');
      }
    },
    [router, onClose, query],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (results.length === 0) return 0;
          return Math.min(prev + 1, results.length - 1);
        });
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === 'Enter' && results.length > 0 && results[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleSelectResult]);

  // Simple highlight helper using regex for display
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    const regex = createSearchRegex(searchTerm);
    const parts = text.split(regex);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <mark key={idx} className="bg-offense/30 text-offense px-0.5 rounded font-bold">
            {part}
          </mark>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return <FileText size={16} className="text-offense" />;
      case 'project':
        return <FolderKanban size={16} className="text-defense" />;
      case 'research':
        return <BookOpen size={16} className="text-gray-400" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800">
          <Search size={20} className="text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vault... (Ctrl+F)"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm font-mono"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Search size={32} className="mx-auto mb-4 opacity-50" />
              <p>Start typing to search through the vault</p>
              <p className="text-xs mt-2 text-gray-600">
                Search in titles, content, keywords, and descriptions
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {isSearching ? <p>Searching...</p> : <p>No results found for "{query}"</p>}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {results.map((result, idx) => {
                const node = result.node;
                // If node is missing (shouldn't happen if vaultData is consistent with index), skip
                if (!node) return null;

                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-4 hover:bg-gray-900/50 transition-colors relative ${
                      isSelected ? 'bg-gray-900/50' : ''
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 h-full w-[2px] bg-offense"></div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getTypeIcon(node.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white font-display">
                            {highlightMatch(node.title, query)}
                          </h3>
                          <span className="text-[10px] font-mono text-gray-600 uppercase">
                            {node.type}
                          </span>
                        </div>

                        {node.description && (
                          <p className="text-xs text-gray-400 mb-1">
                            {highlightMatch(node.description, query)}
                          </p>
                        )}

                        {/* MiniSearch doesn't easily return content snippets with highlighting, 
                            but we can try to match keywords if available in result matches */}

                        {(node.keywords || node.stack) && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {[...(node.keywords || node.stack || [])]
                              .slice(0, 5)
                              .map((keyword: string, kIdx: number) => (
                                <span
                                  key={kIdx}
                                  className="text-[10px] bg-gray-900 text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded"
                                >
                                  #{highlightMatch(keyword, query)}
                                </span>
                              ))}
                          </div>
                        )}

                        <div className="text-[10px] text-gray-600 font-mono mt-1">
                          Score: {Math.round(result.score || 0)}
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className={`flex-shrink-0 mt-0.5 ${isSelected ? 'text-offense' : 'text-gray-700'}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {query.trim() !== '' && results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between text-[10px] font-mono text-gray-600">
            <span>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
            <span>↑↓ Navigate • Enter Select • Esc Close</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
