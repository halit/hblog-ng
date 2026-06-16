'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLazyVaultData } from '../hooks/useLazyVaultData';
import { getIconComponent } from '../utils/icons';
import SpectrumMeter from './SpectrumMeter';
import { calculateSpectrum } from '../utils';

interface LinkPreviewProps {
  id: string; // The ID or title of the target node
  children: React.ReactNode;
  className?: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ id, children, className }) => {
  // Use lazy vault data to avoid loading on every page render if not needed.
  // The hook will only fetch if we call loadVaultData.
  // However, for LinkPreview to work on hover, we need data.
  // Strategy: Trigger load only on first hover of ANY link preview component?
  // Or better: if the page already has data (from context or prop), use it.
  // Since we don't have a global context provider yet, we rely on the cached promise.
  // If this is homepage (where we want to avoid load), link previews might trigger load.
  // Let's trigger load on hover.

  const [vaultData, isLoading, loadVaultData] = useLazyVaultData();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Find the target node
  const targetNode = React.useMemo(() => {
    if (!id || vaultData.length === 0) return null;
    const normalizedId = id.toLowerCase().replace(/\s+/g, '-');

    return vaultData.find(
      (n) =>
        n.id === normalizedId ||
        n.title.toLowerCase() === id.toLowerCase() ||
        n.title.toLowerCase().replace(/\s+/g, '-') === normalizedId,
    );
  }, [id, vaultData]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Trigger data load if not loaded
    if (vaultData.length === 0 && !isLoading) {
      loadVaultData();
    }

    if (!targetNode && vaultData.length > 0) return;

    // Clear any close timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Anchor to the mouse cursor rather than the element's bounding box.
    // A wikilink that wraps across two lines has a box spanning the full
    // content width, so its center lands mid-page — tracking the cursor
    // keeps the preview next to the pointer instead.
    updatePosition(e);

    setIsOpen(true);
  };

  const updatePosition = (e: React.MouseEvent) => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

    // Position just above the cursor.
    setPosition({
      top: e.clientY + scrollY - 12,
      left: e.clientX + scrollX,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isOpen) {
      updatePosition(e);
    }
  };

  const handleMouseLeave = () => {
    // Add delay to allow moving into the tooltip
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  // If no target node found (and data is loaded), just render children (or simple span)
  // If data is loading, we can show a loading state or just the children
  if (!targetNode && vaultData.length > 0) {
    return <span className={className}>{children}</span>;
  }

  const Icon = targetNode?.icon ? getIconComponent(targetNode.icon) : getIconComponent('FileText');
  const spectrum = targetNode
    ? calculateSpectrum(targetNode.content || '', targetNode)
    : { offensive: 0, defensive: 0, misc: 0 };

  return (
    <>
      <span
        ref={triggerRef}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {isOpen &&
        targetNode &&
        createPortal(
          <div
            ref={tooltipRef}
            className="absolute z-50 w-80 pointer-events-none" // pointer-events-none prevents getting stuck if user moves fast, but prevents interaction. For simple preview it's fine.
            style={{
              top: position.top,
              left: position.left,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="mb-2 bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header Image (if any) */}
              {targetNode.cover_image && (
                <div className="h-24 w-full relative overflow-hidden">
                  <img
                    src={
                      targetNode.cover_image.startsWith('http') ||
                      targetNode.cover_image.startsWith('/')
                        ? targetNode.cover_image
                        : `/images/${targetNode.cover_image}`
                    }
                    className="w-full h-full object-cover opacity-50"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f14] to-transparent"></div>
                </div>
              )}

              <div className="p-4 relative">
                {/* Type Badge */}
                <div className="absolute top-4 right-4 text-[10px] font-mono uppercase text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded bg-gray-900/50">
                  {targetNode.type}
                </div>

                {/* Title & Icon — pr-24 reserves room for the absolute type badge
                    above (e.g. "RESEARCH") so the truncated title can't run under it. */}
                <div className="flex items-center gap-2 mb-2 pr-24">
                  <div className="p-1.5 bg-gray-900 rounded text-gray-400 flex-shrink-0">
                    <Icon size={14} />
                  </div>
                  <h4 className="text-sm font-bold text-white font-display line-clamp-1 min-w-0">
                    {targetNode.title}
                  </h4>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 line-clamp-3 mb-3 leading-relaxed">
                  {targetNode.description || 'No description available.'}
                </p>

                {/* Footer: Stats/Spectrum */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                  <span className="text-[10px] text-gray-600 font-mono">
                    {targetNode.year ||
                      new Date(
                        targetNode.created || targetNode.updated || Date.now(),
                      ).getFullYear()}
                  </span>
                  <SpectrumMeter distribution={spectrum} className="w-24" />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default LinkPreview;
