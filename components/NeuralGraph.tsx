'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { VaultNode } from '@/types/vault';
import { useGraphData } from '@/hooks/graph/useGraphData';
import { useForceSimulation } from '@/hooks/graph/useForceSimulation';
import { useGraphInteraction } from '@/hooks/graph/useGraphInteraction';
import {
  GraphCanvas,
  GraphControls,
  GraphSearch,
  GraphContextMenu,
} from '@/components/graph';

interface NeuralGraphProps {
  data: VaultNode[];
  onClose?: () => void;
  initialSearchTerm?: string;
}

const NeuralGraph: React.FC<NeuralGraphProps> = ({ data, onClose, initialSearchTerm = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Local UI State
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [activeFilters, setActiveFilters] = useState<string[]>([
    'project',
    'research',
    'blog',
    'keyword',
  ]);
  const [activeSpectrums, setActiveSpectrums] = useState<string[]>(['offense', 'defense', 'misc']);
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // 2. Data Hook
  const {
    nodes,
    links,
    searchMatches,
    pathSourceId,
    setPathSourceId,
    pathResult,
    findPaths,
    clearPath,
  } = useGraphData({
    data,
    searchTerm,
    activeFilters,
    activeSpectrums,
    hiddenNodes,
  });

  // 3. Simulation Hook
  const { draggedNodeRef, wakeSimulation, updatePhysics } = useForceSimulation({
    nodes,
    width: dimensions.width,
    height: dimensions.height,
  });

  // 4. Interaction Hook
  const {
    zoom,
    setZoom,
    contextMenu,
    setContextMenu,
    hoveredNodeRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleWheel,
    handleContextMenu,
  } = useGraphInteraction({
    nodes,
    canvasRef,
    draggedNodeRef,
    wakeSimulation,
  });

  // Handle Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
        wakeSimulation();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [wakeSimulation]);

  // Keyboard Shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
        } else if (searchTerm) {
          setSearchTerm('');
        } else if (pathResult || pathSourceId) {
          clearPath();
        } else if (onClose) {
          onClose();
        }
      } else if (e.key === 'Backspace') {
        setSearchTerm((prev) => prev.slice(0, -1));
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setSearchTerm((prev) => prev + e.key);
      }
    },
    [contextMenu, onClose, searchTerm, pathResult, pathSourceId, clearPath, setContextMenu],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full relative bg-[#0a0f14] overflow-hidden" ref={containerRef}>
      <GraphCanvas
        ref={canvasRef}
        nodes={nodes}
        links={links}
        zoom={zoom}
        searchTerm={searchTerm}
        searchMatches={searchMatches}
        pathSourceId={pathSourceId}
        pathResult={pathResult}
        hoveredNodeRef={hoveredNodeRef}
        updatePhysics={updatePhysics}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />

      <GraphControls
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2.0))}
        onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        activeSpectrums={activeSpectrums}
        setActiveSpectrums={setActiveSpectrums}
      />

      <GraphSearch searchTerm={searchTerm} />

      {contextMenu && (
        <GraphContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          pathSourceId={pathSourceId}
          pathResult={pathResult}
          onClose={() => setContextMenu(null)}
          onPathSelect={setPathSourceId}
          onPathFind={(id) => findPaths(pathSourceId!, id)}
          onPathClear={clearPath}
          onHideNode={(id) => {
            setHiddenNodes((prev) => new Set(prev).add(id));
            setContextMenu(null);
          }}
        />
      )}

      {/* Hidden Nodes Reset */}
      {hiddenNodes.size > 0 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-in slide-in-from-bottom-4 fade-in">
          <button
            onClick={() => setHiddenNodes(new Set())}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900/90 border border-gray-700 rounded-full text-xs font-mono text-white hover:bg-gray-800 transition-colors shadow-lg backdrop-blur"
          >
            <RefreshCw size={12} />
            RESET {hiddenNodes.size} HIDDEN NODES
          </button>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute bottom-6 right-6 z-20 p-3 bg-[#0a0f14] border border-gray-800 hover:border-gray-600 rounded-full text-gray-400 hover:text-white transition-colors shadow-xl group"
        >
          <X size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default NeuralGraph;
