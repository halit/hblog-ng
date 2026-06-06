import React, { useState } from 'react';
import {
  Filter,
  X,
  Minus,
  Plus,
  Cpu,
  FlaskConical,
  FileText,
  Hash,
  Zap,
  Shield,
  Box,
} from 'lucide-react';

interface GraphControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  activeSpectrums: string[];
  setActiveSpectrums: React.Dispatch<React.SetStateAction<string[]>>;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  activeFilters,
  setActiveFilters,
  activeSpectrums,
  setActiveSpectrums,
}) => {
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleSpectrum = (spec: string) => {
    setActiveSpectrums((prev) =>
      prev.includes(spec) ? prev.filter((t) => t !== spec) : [...prev, spec],
    );
  };

  return (
    <>
      {/* Zoom Controls */}
      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button
          onClick={onZoomOut}
          className="p-2 bg-[#0a0f14] border border-gray-800 hover:border-gray-600 rounded text-gray-400 hover:text-white transition-colors shadow-xl"
        >
          <Minus size={16} />
        </button>
        <div className="px-2 py-2 bg-[#0a0f14] border border-gray-800 rounded text-xs font-mono text-gray-500 min-w-[3rem] text-center flex items-center justify-center">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={onZoomIn}
          className="p-2 bg-[#0a0f14] border border-gray-800 hover:border-gray-600 rounded text-gray-400 hover:text-white transition-colors shadow-xl"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Filter Toolbox */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
        {!isToolboxOpen ? (
          <button
            onClick={() => setIsToolboxOpen(true)}
            className="p-3 bg-[#0a0f14] border border-gray-800 hover:border-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors shadow-xl"
            title="Open Filters"
          >
            <Filter size={18} />
          </button>
        ) : (
          <div className="bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl w-64 overflow-hidden animate-in slide-in-from-left-2 fade-in duration-200">
            <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/50">
              <span className="text-xs font-mono font-bold text-gray-400">FILTERS</span>
              <button
                onClick={() => setIsToolboxOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3 flex flex-col gap-2">
              <div className="mb-1">
                <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-wider">
                  Types
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'project', icon: Cpu, label: 'PROJECTS' },
                    { id: 'research', icon: FlaskConical, label: 'RESEARCH' },
                    { id: 'blog', icon: FileText, label: 'POSTS' },
                    { id: 'keyword', icon: Hash, label: 'KEYWORDS' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => toggleFilter(id)}
                      className={`flex items-center justify-between px-3 py-2 rounded text-xs font-mono border transition-all ${
                        activeFilters.includes(id)
                          ? 'bg-[#1a1f24] border-gray-600 text-white'
                          : 'bg-[#0a0f14] border-gray-800 text-gray-500 hover:border-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2 uppercase">
                        <Icon size={14} />
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 border-t border-gray-800 pt-3">
                <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-wider">
                  Spectrum
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'offense', icon: Zap, color: 'text-offense' },
                    { id: 'defense', icon: Shield, color: 'text-defense' },
                    { id: 'misc', icon: Box, color: 'text-gray-400' },
                  ].map(({ id, icon: Icon, color }) => (
                    <button
                      key={id}
                      onClick={() => toggleSpectrum(id)}
                      className={`flex items-center justify-between px-3 py-2 rounded text-xs font-mono border transition-all ${
                        activeSpectrums.includes(id)
                          ? 'bg-[#1a1f24] border-gray-600 text-white'
                          : 'bg-[#0a0f14] border-gray-800 text-gray-500 hover:border-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2 uppercase">
                        <Icon size={14} className={color} />
                        {id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
