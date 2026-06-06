import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Route, Ban, Copy, EyeOff } from 'lucide-react';
import { GraphNode } from '@/types/graph';

interface GraphContextMenuProps {
  x: number;
  y: number;
  node: GraphNode;
  pathSourceId: string | null;
  pathResult: { nodes: Set<string>; links: Set<string> } | null;
  onClose: () => void;
  onPathSelect: (id: string) => void;
  onPathFind: (id: string) => void;
  onPathClear: () => void;
  onHideNode: (id: string) => void;
}

export const GraphContextMenu: React.FC<GraphContextMenuProps> = ({
  x,
  y,
  node,
  pathSourceId,
  pathResult,
  onClose,
  onPathSelect,
  onPathFind,
  onPathClear,
  onHideNode,
}) => {
  const router = useRouter();
  const [copyFeedback, setCopyFeedback] = useState(false);

  const getPagePath = () => {
    const cleanId = node.id.replace(/^keyword-/, '').split(':').pop() || node.id;
    switch (node.group) {
      case 'blog':
        return `/posts/${cleanId}`;
      case 'project':
        return `/projects/${cleanId}`;
      case 'research':
        return `/research/${cleanId}`;
      case 'keyword':
        return `/keywords/${cleanId}`;
      default:
        return `/posts/${cleanId}`;
    }
  };

  const handleGoToPage = () => {
    router.push(getPagePath());
    onClose();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${getPagePath()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  return (
    <div
      className="absolute z-50 bg-[#0a0f14] border border-gray-700 rounded-lg shadow-2xl py-1 w-48 animate-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
      onMouseLeave={onClose}
    >
      <div className="px-3 py-2 border-b border-gray-800 mb-1">
        <div className="text-[10px] font-mono text-gray-500 uppercase truncate max-w-full">
          {node.title}
        </div>
      </div>

      <button
        onClick={handleGoToPage}
        className="w-full text-left px-3 py-2 text-xs font-mono text-gray-300 hover:bg-gray-800 flex items-center gap-2"
      >
        <ExternalLink size={12} />
        GO TO PAGE
      </button>

      {!pathSourceId && (
        <button
          onClick={() => onPathSelect(node.id)}
          className="w-full text-left px-3 py-2 text-xs font-mono text-gray-300 hover:bg-gray-800 flex items-center gap-2"
        >
          <Route size={12} />
          SELECT FOR PATH
        </button>
      )}

      {pathSourceId && pathSourceId !== node.id && (
        <button
          onClick={() => onPathFind(node.id)}
          className="w-full text-left px-3 py-2 text-xs font-mono text-gray-300 hover:bg-gray-800 flex items-center gap-2"
        >
          <Route size={12} />
          FIND PATH HERE
        </button>
      )}

      {(pathSourceId || pathResult) && (
        <button
          onClick={onPathClear}
          className="w-full text-left px-3 py-2 text-xs font-mono text-gray-300 hover:bg-gray-800 flex items-center gap-2 text-red-400 hover:text-red-300"
        >
          <Ban size={12} />
          CLEAR PATH
        </button>
      )}

      <div className="my-1 border-t border-gray-800"></div>

      <button
        onClick={handleCopyLink}
        className="w-full text-left px-3 py-2 text-xs font-mono text-gray-300 hover:bg-gray-800 flex items-center gap-2"
      >
        <Copy size={12} />
        {copyFeedback ? 'COPIED!' : 'COPY LINK'}
      </button>

      <div className="my-1 border-t border-gray-800"></div>

      <button
        onClick={() => onHideNode(node.id)}
        className="w-full text-left px-3 py-2 text-xs font-mono text-gray-300 hover:bg-gray-800 flex items-center gap-2"
      >
        <EyeOff size={12} />
        HIDE NODE
      </button>
    </div>
  );
};
