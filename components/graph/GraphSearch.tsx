import React from 'react';
import { Search } from 'lucide-react';

interface GraphSearchProps {
  searchTerm: string;
}

export const GraphSearch: React.FC<GraphSearchProps> = ({ searchTerm }) => {
  if (!searchTerm) return null;

  return (
    <div className="absolute bottom-6 left-6 z-30 pointer-events-none animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="flex items-center gap-2 text-gray-200 font-mono text-sm bg-[#0a0f14] backdrop-blur px-3 py-2 rounded-lg border border-gray-800 shadow-2xl">
        <Search size={14} className="text-gray-500" />
        <span className="tracking-wider">{searchTerm}</span>
      </div>
    </div>
  );
};
