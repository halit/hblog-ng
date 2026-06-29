'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { LayoutGrid, List, Calendar } from 'lucide-react';
import { VaultNode } from '@/types/vault';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getNodeSortDate } from '@/utils';
import NodeCard from '@/components/NodeCard';

interface CollectionPageProps {
  title: string;
  description: string;
  items: VaultNode[];
  type: 'blog' | 'project' | 'research' | 'mixed';
  onBibtexClick?: (bibtex: string) => void;
  isKeywordPage?: boolean;
}

type ViewMode = 'grid' | 'list' | 'years';

const CollectionPage = ({
  title,
  description,
  items,
  type,
  isKeywordPage,
}: CollectionPageProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(type === 'project' ? 'grid' : 'list');

  // Sort items using robust sorting logic (created > year > updated)
  const sortedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return [...items].sort((a, b) => {
      return getNodeSortDate(b) - getNodeSortDate(a); // Newest first
    });
  }, [items]);

  // Infinite Scroll
  const { displayCount, observerTarget, setDisplayCount } = useInfiniteScroll({
    totalItems: sortedItems.length,
    initialCount: 12,
    increment: 12,
  });

  // Reset visible count when view mode changes
  useEffect(() => {
    setDisplayCount(12);
  }, [viewMode, setDisplayCount]);

  const visibleItems = useMemo(() => {
    return sortedItems.slice(0, displayCount);
  }, [sortedItems, displayCount]);

  const renderGrid = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleItems.map((item) => (
        <NodeCard key={item.id} node={item} viewMode="grid" showType={type === 'mixed'} />
      ))}
    </div>
  );

  const renderList = () => (
    <div className="flex flex-col gap-4">
      {visibleItems.map((item) => (
        <NodeCard key={item.id} node={item} viewMode="list" showType={type === 'mixed'} />
      ))}
    </div>
  );

  const renderYears = () => {
    const groupedByYear = visibleItems.reduce(
      (acc, item) => {
        const year =
          item.year || new Date(item.created || item.updated || Date.now()).getFullYear();
        const yearStr = String(year);
        if (!acc[yearStr]) acc[yearStr] = [];
        acc[yearStr].push(item);
        return acc;
      },
      {} as Record<string, VaultNode[]>,
    );

    const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

    return (
      <div className="space-y-16">
        {years.map((year) => (
          <div key={year} className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex flex-col">
                <h2 className="text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">
                  {year}
                </h2>
                <div className="h-1 w-24 bg-offense mt-2"></div>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-800 to-transparent mt-4"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedByYear[year]?.map((item) => (
                <NodeCard key={item.id} node={item} viewMode="grid" showType={type === 'mixed'} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-2 uppercase tracking-tight">
            {isKeywordPage && <span className="text-offense">#</span>} {title}
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl">{description}</p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1 bg-[#0a0f14] p-1 rounded-lg border border-gray-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-all duration-200 ${viewMode === 'grid' ? 'bg-gray-800 text-offense shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
            aria-label="Grid View"
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-all duration-200 ${viewMode === 'list' ? 'bg-gray-800 text-offense shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
            aria-label="List View"
            title="List View"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('years')}
            className={`p-2 rounded transition-all duration-200 ${viewMode === 'years' ? 'bg-gray-800 text-offense shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
            aria-label="Years View"
            title="Cluster by Year"
          >
            <Calendar size={16} />
          </button>
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No {type}s found.</div>
      ) : (
        <div className="mt-6">
          {viewMode === 'grid' && renderGrid()}
          {viewMode === 'list' && renderList()}
          {viewMode === 'years' && renderYears()}

          {/* Sentinel for Infinite Scroll */}
          {visibleItems.length < sortedItems.length && (
            <div
              ref={observerTarget}
              className="h-20 w-full flex items-center justify-center opacity-50"
            >
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionPage;
