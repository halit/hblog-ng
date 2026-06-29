'use client';

import React, { useMemo } from 'react';
import NextImage from 'next/image';
import { Link as LinkIcon } from 'lucide-react';
import MarkdownRenderer from '@/components/content/MarkdownRenderer';
import PostTimeline from '@/components/PostTimeline';
import ScrollToTop from '@/components/layout/ScrollToTop';
import TableOfContents from '@/components/content/TableOfContents';
import { calculateSpectrum } from '@/utils';
import { VaultNode } from '@/types/vault';
import DetailHeader from '@/components/DetailHeader';
import { getIconComponent, getDefaultIconName } from '@/utils/icons';
import NodeCard from '@/components/NodeCard';
import SpectrumMeter from '@/components/ui/SpectrumMeter';

// Helper function to check if content has headings for TOC
const hasHeadings = (content: string): boolean => {
  const lines = content.split('\n');
  return lines.some((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('### ') ||
      trimmed.startsWith('## ') ||
      (trimmed.startsWith('# ') && !trimmed.startsWith('##'))
    );
  });
};

interface PostDetailProps {
  activeNode: VaultNode;
  connectedNodes: VaultNode[];
  setBibtexOpen: (bibtex: string) => void;
  setSignatureOpen: (signature: string) => void;
  setShareOpen: (url: string, title: string, description?: string) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({
  activeNode,
  connectedNodes,
  setBibtexOpen,
  setSignatureOpen,
  setShareOpen,
}) => {
  // Hooks must be called before early return
  // Calculate values safely handling potentially missing activeNode/content

  const spectrum = useMemo(() => {
    if (!activeNode?.content) return { offensive: 0, defensive: 0, misc: 0 };
    return calculateSpectrum(activeNode.content, activeNode);
  }, [activeNode]);

  // Check if content has headings for TOC and if TOC is not disabled
  const hasTOC = useMemo(() => {
    if (!activeNode?.content) return false;
    return activeNode.type === 'blog' && !activeNode.disable_toc && hasHeadings(activeNode.content);
  }, [activeNode]);

  const dateDisplay = useMemo(() => {
    if (!activeNode) return '';

    if (activeNode.type === 'research') {
      return (
        activeNode.year ||
        (activeNode.updated ? new Date(activeNode.updated).getFullYear().toString() : '')
      );
    }
    if (activeNode.type === 'project') {
      return (
        activeNode.year ||
        (activeNode.created
          ? new Date(activeNode.created).getFullYear().toString()
          : activeNode.updated
            ? new Date(activeNode.updated).getFullYear().toString()
            : '')
      );
    }
    return activeNode.updated
      ? new Date(activeNode.updated)
          .toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          .toUpperCase()
      : '';
  }, [activeNode]);

  const projectStatus = useMemo(() => {
    if (activeNode?.type === 'project') {
      return activeNode.status || 'PROJECT';
    }
    return null;
  }, [activeNode]);

  // Validation Check - Early Return
  if (!activeNode || !activeNode.content) {
    return (
      <article className="animate-in fade-in duration-700 pb-24 w-full">
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-gray-500">Content not available</p>
        </div>
      </article>
    );
  }

  // Helper logic (can be outside hooks or simple functions)
  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'blog':
        return 'BLOG';
      case 'research':
        return 'RESEARCH';
      case 'project':
        return 'PROJECT';
      case 'profile':
        return 'PROFILE';
      case 'system':
        return 'SYSTEM';
      default:
        return type.toUpperCase();
    }
  };

  const typeLabel = getTypeLabel(activeNode.type);

  const TypeIcon = getIconComponent(
    activeNode.icon || getDefaultIconName(activeNode.type),
    'FileText',
  );

  const showSidebar = hasTOC;

  return (
    <article className="animate-in fade-in duration-700 pb-24 w-full relative">
      {/* Hero Header Design */}
      <div
        className="relative min-h-[50vh] print:min-h-0 print:h-auto w-full flex flex-col justify-end print:justify-start overflow-hidden border-b border-gray-800/50 print:border-none"
        style={
          {
            viewTransitionName: `node-container-${activeNode.id.replace(/[:/]/g, '-')}`,
          } as React.CSSProperties
        }
      >
        {/* Background Image (Screen only) */}
        {activeNode.cover_image && (
          <div className="absolute inset-0 z-0 print:hidden">
            <NextImage
              src={
                activeNode.cover_image.startsWith('http://') ||
                activeNode.cover_image.startsWith('https://')
                  ? activeNode.cover_image
                  : activeNode.cover_image.startsWith('/')
                    ? activeNode.cover_image
                    : `/images/${activeNode.cover_image}`
              }
              fill
              className="object-cover opacity-40 mix-blend-luminosity transition-transform duration-[20s] scale-105 hover:scale-110"
              alt="Cover"
              unoptimized
              sizes="100vw"
              priority
            />
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/20 via-[#050505]/50 to-[#050505]/95 z-10 print:hidden"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 z-10 pointer-events-none print:hidden"></div>

        {/* Content Container */}
        <div className="relative z-20 w-full max-w-6xl mx-auto px-6 pb-8 pt-32 print:pt-0">
          {/* Meta Line: Type | Date | Spectrum */}
          <div className="flex flex-wrap items-center gap-y-3 gap-x-6 mb-6 font-mono text-xs tracking-wider uppercase text-gray-400 print:text-black border-b border-gray-800/50 pb-4 w-fit">
            {/* Type Label */}
            <div className="flex items-center gap-2 text-offense print:text-black">
              <TypeIcon size={14} />
              <span className="font-bold">{typeLabel}</span>
            </div>

            <span className="text-gray-700 print:text-gray-400">/</span>

            {/* Date if available */}
            {dateDisplay && (
              <span className="flex items-center gap-2">
                <span>{dateDisplay}</span>
              </span>
            )}

            {projectStatus && (
              <>
                <span className="text-gray-700 print:text-gray-400">/</span>
                <span className="flex items-center gap-2">
                  <span>{projectStatus.toUpperCase()}</span>
                </span>
              </>
            )}

            <span className="text-gray-700 print:text-gray-400">/</span>

            {/* Spectrum */}
            <div className="flex items-center gap-3">
              <SpectrumMeter distribution={spectrum} className="origin-left w-[200px]" />
            </div>
          </div>

          {/* Main Title */}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-display text-white print:text-black leading-[0.95] mb-8 max-w-5xl tracking-tight"
            style={
              {
                viewTransitionName: `node-title-${activeNode.id.replace(/[:/]/g, '-')}`,
              } as React.CSSProperties
            }
          >
            {activeNode.title}
          </h1>

          {/* Description with Side Line */}
          {activeNode.description && (
            <div className="flex flex-col md:flex-row gap-6 relative">
              {/* Decorative Vertical Line - Auto height based on parent */}
              <div className="hidden md:block w-1 bg-gradient-to-b from-offense to-transparent absolute left-0 top-0 bottom-0 h-auto print:hidden"></div>

              <div className="md:pl-6">
                <p className="text-lg md:text-xl text-gray-400 print:text-black max-w-3xl leading-relaxed font-light border-l-2 border-offense md:border-none pl-4 md:pl-0 print:border-none print:pl-0">
                  {activeNode.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 relative w-full min-h-[50vh]">
        {/* Detail Header */}
        <DetailHeader
          node={activeNode}
          setShareOpen={setShareOpen}
          setSignatureOpen={setSignatureOpen}
          setBibtexOpen={setBibtexOpen}
        />

        {/* Table of Contents - Mobile: at beginning */}
        {hasTOC && (
          <div className="lg:hidden mb-8">
            <TableOfContents content={activeNode.content} />
          </div>
        )}

        {/* Flex Layout for Desktop */}
        <div className="flex flex-col lg:flex-row items-start gap-8 w-full max-w-full">
          {/* Main content */}
          <div className="prose prose-invert prose-sm md:prose-base max-w-none flex-1 min-w-0 w-full break-words overflow-visible">
            <MarkdownRenderer content={activeNode.content} postType={activeNode.type} />
          </div>

          {/* Sidebar - Desktop */}
          {showSidebar && (
            <div className="hidden lg:flex w-72 flex-col gap-6 flex-shrink-0 sticky top-24 print:hidden">
              {hasTOC && <TableOfContents content={activeNode.content} />}
            </div>
          )}
        </div>

        {/* Timeline for responsible disclosure */}
        {activeNode.type === 'blog' && activeNode.timeline && activeNode.timeline.length > 0 && (
          <div className="mt-12">
            <div className="text-2xl font-bold text-white mt-10 mb-6 font-display">TIMELINE</div>
            <PostTimeline events={activeNode.timeline} />
          </div>
        )}
      </div>

      {/* Scroll to top button - only for blog posts */}
      {activeNode.type === 'blog' && (
        <div className="print:hidden">
          <ScrollToTop />
        </div>
      )}

      {/* Related Nodes */}
      {connectedNodes.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 mt-24 pt-8 border-t border-gray-800 print:hidden">
          <h4 className="text-xs font-bold text-gray-500 font-mono uppercase mb-6 flex items-center gap-2">
            <LinkIcon size={12} /> Related Nodes
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            {connectedNodes.map((p) => (
              <NodeCard key={p.id} node={p} viewMode="compact" />
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export default PostDetail;
