'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyVaultData } from '@/hooks/useLazyVaultData';
import { Terminal } from 'lucide-react';
import { NavLink } from '@/components/ui/NavLink';
import KeywordTags from '@/components/ui/KeywordTags';
import SpectrumMeter from '@/components/ui/SpectrumMeter';
import { calculateSpectrum, getNodeSortDate } from '@/utils';
import { getIconComponent } from '@/utils/icons';
import { getNodeKeywords } from '@/utils/keywords';
import BlockHeader from '@/components/ui/BlockHeader';

interface QueryRendererProps {
  query: string;
}

interface QueryParams {
  types?: string[];
  status?: string[];
  keywords?: string[];
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const parseQuery = (queryString: string): QueryParams => {
  const params: QueryParams = {
    sortOrder: 'desc',
  };

  const lines = queryString.split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (!key || valueParts.length === 0) continue;

    const trimmedKey = key.trim().toLowerCase();
    const value = valueParts.join(':').trim();

    if (!value) continue;

    switch (trimmedKey) {
      case 'type':
      case 'types':
        params.types = value.split(',').map((s) => s.trim().toLowerCase());
        break;
      case 'status':
        params.status = value.split(',').map((s) => s.trim().toLowerCase());
        break;
      case 'keyword':
      case 'keywords':
      case 'tag':
      case 'tags':
        params.keywords = value.split(',').map((s) => s.trim().toLowerCase());
        break;
      case 'limit':
        const limit = parseInt(value);
        if (!isNaN(limit)) params.limit = limit;
        break;
      case 'sort':
        const [field, order] = value.split(' ');
        params.sortBy = field.trim();
        if (order && (order.toLowerCase() === 'asc' || order.toLowerCase() === 'desc')) {
          params.sortOrder = order.toLowerCase() as 'asc' | 'desc';
        }
        break;
    }
  }

  return params;
};

const QueryRenderer: React.FC<QueryRendererProps> = ({ query }) => {
  const router = useRouter();
  const [vaultData, isLoading, loadVaultData, isLoaded] = useLazyVaultData();

  // Trigger load on mount
  React.useEffect(() => {
    if (vaultData.length === 0 && !isLoading) {
      loadVaultData();
    }
  }, [vaultData.length, isLoading, loadVaultData]);

  const results = useMemo(() => {
    if (vaultData.length === 0) return [];

    const params = parseQuery(query);
    let filtered = [...vaultData];

    // Filter by type
    if (params.types && params.types.length > 0) {
      filtered = filtered.filter((node) => params.types!.includes(node.type.toLowerCase()));
    }

    // Filter by status (only for projects usually, but check generically)
    if (params.status && params.status.length > 0) {
      filtered = filtered.filter(
        (node) => node.status && params.status!.includes(node.status.toLowerCase()),
      );
    }

    // Filter by keywords
    if (params.keywords && params.keywords.length > 0) {
      filtered = filtered.filter((node) => {
        const nodeKeywords = getNodeKeywords(node);
        if (nodeKeywords.length === 0) return false;
        return params.keywords!.some((k) => nodeKeywords.includes(k));
      });
    }

    // Sort
    if (params.sortBy) {
      filtered.sort((a, b) => {
        const nodeA = a as unknown as Record<string, string | number | undefined>;
        const nodeB = b as unknown as Record<string, string | number | undefined>;
        const fieldA = nodeA[params.sortBy!];
        const fieldB = nodeB[params.sortBy!];

        if (fieldA === fieldB) return 0;
        if (fieldA === undefined) return 1;
        if (fieldB === undefined) return -1;

        if (fieldA < fieldB) return params.sortOrder === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by robust date (created > year > updated)
      filtered.sort((a, b) => {
        return getNodeSortDate(b) - getNodeSortDate(a);
      });
    }

    // Limit
    if (params.limit) {
      filtered = filtered.slice(0, params.limit);
    }

    return filtered;
  }, [vaultData, query]);

  if (!isLoaded && vaultData.length === 0) {
    return (
      <div className="my-8 flex flex-col items-center justify-center p-8 border border-gray-800 rounded-lg bg-[#0a0f14] space-y-3 animate-pulse">
        <div className="w-8 h-8 border-2 border-defense border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          Executing Vault Query...
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="my-6 p-4 border border-gray-800 rounded bg-[#0a0f14] text-gray-500 italic text-sm">
        No results found for query.
      </div>
    );
  }

  return (
    <div className="relative group my-8">
      <div className="bg-[#0a0f14] border border-gray-800 rounded-lg overflow-hidden shadow-xl">
        <BlockHeader
          title="QUERY RESULTS"
          icon={Terminal}
          rightElement={
            <div className="text-xs font-mono text-defense">{results.length} ITEMS</div>
          }
        />
        <div className="grid md:grid-cols-2 gap-4 bg-[#0a0f14] p-4">
          {results.map((p) => {
            const Icon = getIconComponent(p.icon || (p.type === 'project' ? 'wifi' : 'file-text'));
            const year = p.year || new Date(p.updated || p.created || Date.now()).getFullYear();
            const spectrum = calculateSpectrum(p.content, p);

            return (
              <NavLink
                key={p.id}
                id={p.id}
                node={p}
                className="group cursor-pointer block h-full no-underline"
              >
                <div className="relative bg-[#0a0f14] border border-gray-800 hover:border-offense/50 transition-all duration-300 flex flex-col h-full p-5 group-hover:shadow-[0_0_20px_-5px_rgba(255,0,85,0.15)] rounded">
                  {/* Top Row: Icon, Type, Year */}
                  <div className="flex items-center justify-between mb-3 text-xs font-mono text-gray-500">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={14}
                        className="text-gray-400 group-hover:text-white transition-colors"
                      />
                      <span className="uppercase tracking-wider">{p.type}</span>
                    </div>
                    <span>{year}</span>
                  </div>

                  {/* Title */}
                  <div className="text-white font-display font-bold text-base mb-1 line-clamp-2 group-hover:text-offense transition-colors">
                    {p.title}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-1">
                    {p.description}
                  </p>

                  {/* Bottom: Keywords (Left) + Spectrum (Right) */}
                  <div className="mt-auto pt-3 border-t border-gray-800/50 flex justify-between items-center gap-4">
                    {/* Keywords */}
                    <div className="flex-1 min-w-0 relative">
                      {getNodeKeywords(p).length > 0 && (
                        <KeywordTags
                          keywords={getNodeKeywords(p)}
                          onKeywordClick={(keyword) =>
                            router.push(`/keywords/${encodeURIComponent(keyword.toLowerCase())}`)
                          }
                          className="flex items-center gap-1"
                          gap={4}
                          useButton={true}
                        />
                      )}
                    </div>

                    {/* Spectrum */}
                    <SpectrumMeter distribution={spectrum} className="w-[60px] flex-shrink-0" />
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QueryRenderer;
