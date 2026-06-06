'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVaultData } from '../hooks/useVaultData';
import { performSearch, EnhancedSearchResult } from '../lib/search-client';
import { Search } from 'lucide-react';
import { calculateSpectrum } from '../utils';
import SpectrumMeter from './SpectrumMeter';
import { getIconComponent } from '../utils/icons';
import KeywordTags from '@/components/KeywordTags';
import BlockHeader from '@/components/BlockHeader';
import { getPathFromId } from '@/lib/routing';

interface SmartSuggestionsProps {
  className?: string;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ className }) => {
  const pathname = usePathname();
  const vaultData = useVaultData();
  const [suggestions, setSuggestions] = useState<EnhancedSearchResult[]>([]);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (pathname && vaultData.length > 0) {
        // Extract potential keywords from the path
        const rawQuery =
          pathname
            .replace(/^\/+|\/+$/g, '')
            .replace(/[-_]/g, ' ')
            .split('/')
            .pop() || '';

        setQuery(rawQuery);

        if (rawQuery.length > 2) {
          // performSearch now uses MiniSearch which is robust enough.
          // We don't explicitly pass 'title-only' anymore as the client handles boost/fields.
          try {
            const results = await performSearch(rawQuery, vaultData);
            setSuggestions(results.slice(0, 3)); // Only top 3 results
          } catch (e) {
            console.error('Error fetching suggestions:', e);
          }
        }
      }
    };
    fetchSuggestions();
  }, [pathname, vaultData]);

  // Reusable link styles matching PostDetail connected nodes exactly
  const linkClasses =
    'relative bg-[#0a0f14] border border-gray-800 hover:border-offense/50 transition-all duration-300 flex flex-col h-full p-5 group-hover:shadow-[0_0_20px_-5px_rgba(255,0,85,0.15)] text-left';

  // If no matches or query is too short, return null (hide component completely)
  if (!query || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`max-w-5xl mx-auto w-full ${className}`}>
      <div className="border border-gray-800 rounded-lg overflow-hidden bg-[#0a0f14]">
        <BlockHeader title="Did you mean?" icon={Search} />

        <div className="p-6 grid md:grid-cols-3 gap-4 text-left">
          {suggestions.map((result, idx) => {
            if (!result.node) return null;

            const Icon = getIconComponent(result.node.icon || 'file-text');
            // Spectrum calc might be less accurate without full content if vaultData is lite
            // But we pass what we have. If content is missing, calculateSpectrum handles empty string.
            const spectrum = calculateSpectrum(result.node.content || '', result.node);
            const year =
              result.node.year ||
              new Date(result.node.created || result.node.updated || Date.now()).getFullYear();

            // Determine correct link path using the routing helper
            // If node has an explicit link (e.g. external), use it. Otherwise compute internal path.
            const href = result.node.link || getPathFromId(result.node.id, result.node);

            return (
              <Link
                key={`${result.node.id}-${idx}`}
                href={href}
                className="group block h-full text-left"
              >
                <div className={linkClasses}>
                  {/* Top Row: Icon, Type, Year */}
                  <div className="flex items-center justify-between mb-3 text-xs font-mono text-gray-500">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={14}
                        className="text-gray-400 group-hover:text-white transition-colors"
                      />
                      <span className="uppercase tracking-wider">{result.node.type}</span>
                    </div>
                    <span>{year}</span>
                  </div>

                  {/* Title */}
                  <div className="text-white font-mono font-bold text-sm mb-1 line-clamp-2 group-hover:text-offense transition-colors uppercase tracking-tight">
                    {result.node.title}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-1">
                    {result.node.description}
                  </p>

                  {/* Bottom: Keywords (Left) + Spectrum (Right) */}
                  <div className="mt-auto pt-3 border-t border-gray-800/50 flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0 relative">
                      {(result.node.keywords || result.node.stack) &&
                        (result.node.keywords || result.node.stack)!.length > 0 && (
                          <KeywordTags
                            keywords={result.node.keywords || result.node.stack || []}
                            className="flex items-center gap-1"
                            gap={4}
                          />
                        )}
                    </div>

                    <SpectrumMeter distribution={spectrum} className="w-[60px] flex-shrink-0" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SmartSuggestions;
