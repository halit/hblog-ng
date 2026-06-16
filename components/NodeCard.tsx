'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Database } from 'lucide-react';
import SpectrumMeter from '@/components/ui/SpectrumMeter';
import { calculateSpectrum, calculateReadingTime, formatBytes } from '@/utils';
import { VaultNode } from '@/types/vault';
import { NavLink } from '@/components/ui/NavLink';
import KeywordTags from '@/components/ui/KeywordTags';
import { getIconComponent, getDefaultIconName } from '@/utils/icons';

interface NodeCardProps {
  node: VaultNode;
  viewMode?: 'grid' | 'list' | 'compact';
  showType?: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, viewMode = 'grid', showType = false }) => {
  const router = useRouter();
  const spectrum = calculateSpectrum(node.content, node);
  const Icon = getIconComponent(node.icon || getDefaultIconName(node.type));
  const readTime = calculateReadingTime(node.content);
  const size = formatBytes(node.content.length);

  const handleKeywordClick = (keyword: string) => {
    router.push(`/keywords/${encodeURIComponent(keyword.toLowerCase())}`);
  };

  if (viewMode === 'list') {
    const dateObj = new Date(node.created || node.updated || Date.now());
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const year = node.year || dateObj.getFullYear();

    return (
      <NavLink id={node.id} node={node} className="relative group cursor-pointer w-full">
        <div
          className="relative bg-[#0a0f14] border border-gray-800 p-6 flex flex-col md:flex-row gap-6 transition-all duration-300 group-hover:border-offense/50 group-hover:shadow-[0_0_20px_-5px_rgba(255,0,85,0.15)]"
          style={
            {
              viewTransitionName: `node-container-${node.id.replace(/[:/]/g, '-')}`,
            } as React.CSSProperties
          }
        >
          {/* Left Column: Date/Year */}
          <div className="md:w-32 flex flex-row items-center justify-between md:flex-col md:justify-start md:items-start border-b md:border-b-0 md:border-r border-gray-800 pb-4 md:pb-0 md:pr-6 mb-4 md:mb-0">
            <div className="flex flex-col items-start">
              <span className="text-3xl font-display font-bold text-gray-500 group-hover:text-white transition-colors">
                {node.type === 'blog' ? day : year}
              </span>
              <span className="text-xs font-mono text-gray-500 uppercase">
                {node.type === 'blog' ? `${month} ${year}` : ''}
              </span>
              {showType && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{node.type}</span>
                </div>
              )}
            </div>
            <div className="md:hidden">
              <SpectrumMeter distribution={spectrum} align="right" className="w-[100px]" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 pb-8 md:pb-0">
            <h2
              className="text-xl text-white font-display mb-2 transition-colors group-hover:text-offense"
              style={
                {
                  viewTransitionName: `node-title-${node.id.replace(/[:/]/g, '-')}`,
                } as React.CSSProperties
              }
            >
              {node.title}
            </h2>

            {node.type === 'blog' && (
              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {readTime}
                </span>
                <span className="flex items-center gap-1">
                  <Database size={10} /> {size}
                </span>
              </div>
            )}

            {node.type === 'research' && (
              <div className="text-xs font-mono text-gray-500 uppercase mb-3">
                {node.publication || node.published_in}
              </div>
            )}

            <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-2 pr-4 md:pr-32">
              {node.description}
            </p>

            {(node.keywords || node.stack) && (node.keywords || node.stack)!.length > 0 && (
              <div className="flex flex-wrap gap-2 pr-4 md:pr-40">
                <KeywordTags
                  keywords={(node.keywords || node.stack)!}
                  onKeywordClick={handleKeywordClick}
                  className="flex flex-wrap gap-2"
                  sortByLength={true}
                  useButton={true}
                />
              </div>
            )}
          </div>

          {/* Spectrum Meter - Bottom Right absolute */}
          <div className="hidden md:block absolute bottom-6 right-6">
            <SpectrumMeter distribution={spectrum} align="right" className="w-[140px]" />
          </div>
        </div>
      </NavLink>
    );
  }

  if (viewMode === 'compact') {
    return (
      <NavLink id={node.id} node={node} className="group cursor-pointer block h-full">
        <div
          className="relative bg-[#0a0f14] border border-gray-800 hover:border-offense/50 transition-all duration-300 flex flex-col h-full p-5 group-hover:shadow-[0_0_20px_-5px_rgba(255,0,85,0.15)]"
          style={
            {
              viewTransitionName: `node-container-${node.id.replace(/[:/]/g, '-')}`,
            } as React.CSSProperties
          }
        >
          {/* Top Row: Icon, Type, Year */}
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-gray-500">
            <div className="flex items-center gap-2">
              <Icon size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              <span className="uppercase tracking-wider">{node.type}</span>
            </div>
            <span>
              {node.year || new Date(node.created || node.updated || Date.now()).getFullYear()}
            </span>
          </div>

          {/* Title */}
          <div
            className="text-white font-display font-bold text-base mb-1 line-clamp-2 group-hover:text-offense transition-colors"
            style={
              {
                viewTransitionName: `node-title-${node.id.replace(/[:/]/g, '-')}`,
              } as React.CSSProperties
            }
          >
            {node.title}
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-1">
            {node.description}
          </p>

          {/* Bottom: Keywords (Left) + Spectrum (Right) */}
          <div className="mt-auto pt-3 border-t border-gray-800/50 flex justify-between items-center gap-4">
            {/* Keywords */}
            <div className="flex-1 min-w-0 relative">
              {(node.keywords || node.stack) && (node.keywords || node.stack)!.length > 0 && (
                <KeywordTags
                  keywords={node.keywords || node.stack || []}
                  onKeywordClick={handleKeywordClick}
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
  }

  // Default Grid View
  return (
    <NavLink id={node.id} node={node} className="relative group cursor-pointer h-full">
      <div
        className="relative bg-[#0a0f14] border border-gray-800 p-6 flex flex-col h-full transition-all duration-300 group-hover:border-offense/50 group-hover:shadow-[0_0_20px_-5px_rgba(255,0,85,0.15)]"
        style={
          {
            viewTransitionName: `node-container-${node.id.replace(/[:/]/g, '-')}`,
          } as React.CSSProperties
        }
      >
        <div className="flex justify-between items-center mb-6 h-[36px]">
          <div className="flex items-center gap-3 h-full">
            <div className="p-2 bg-gray-900 text-gray-300 rounded-sm">
              <Icon size={20} />
            </div>
            {showType && (
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                {node.type}
              </span>
            )}
          </div>
          <SpectrumMeter distribution={spectrum} className="w-[100px]" />
        </div>

        <h3
          className="text-lg text-white font-display mb-2 transition-colors group-hover:text-offense"
          style={
            {
              viewTransitionName: `node-title-${node.id.replace(/[:/]/g, '-')}`,
            } as React.CSSProperties
          }
        >
          {node.title}
        </h3>

        {node.type === 'blog' && (
          <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock size={10} /> {readTime}
            </span>
            <span className="flex items-center gap-1">
              <Database size={10} /> {size}
            </span>
          </div>
        )}

        {node.type === 'research' && (
          <p className="text-xs text-gray-500 font-mono mb-3 uppercase">
            {node.publication || node.published_in}
          </p>
        )}

        <p className="text-xs text-gray-400 mb-6 flex-1 leading-relaxed line-clamp-3">
          {node.description || node.content}
        </p>

        {(node.keywords || node.stack) && (node.keywords || node.stack)!.length > 0 && (
          <div className="pt-4 border-t border-gray-800 mt-auto">
            <KeywordTags
              keywords={(node.keywords || node.stack)!}
              onKeywordClick={handleKeywordClick}
              className="flex flex-wrap gap-2"
              sortByLength={true}
              useButton={true}
            />
          </div>
        )}
      </div>
    </NavLink>
  );
};

export default NodeCard;
