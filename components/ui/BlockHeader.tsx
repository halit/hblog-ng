import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BlockHeaderProps {
  title: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
  className?: string;
}

export const BlockHeader: React.FC<BlockHeaderProps> = ({
  title,
  icon: Icon,
  rightElement,
  className = '',
}) => {
  return (
    <div
      className={`bg-gray-900 print:bg-transparent border-b border-gray-800 print:border-gray-200 px-4 flex items-center justify-between gap-2 h-8 select-none ${className}`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {Icon && <Icon size={16} className="text-gray-400 print:text-black flex-shrink-0" />}
        <span className="font-mono text-[10px] text-gray-400 print:text-black uppercase font-bold opacity-70 truncate">
          {title}
        </span>
      </div>
      {rightElement && <div className="flex-shrink-0 flex items-center">{rightElement}</div>}
    </div>
  );
};

export default BlockHeader;
