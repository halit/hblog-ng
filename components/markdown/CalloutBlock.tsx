import React from 'react';
import { AlertTriangle, Shield, Info, AlertOctagon } from 'lucide-react';

interface CalloutBlockProps {
  type: string;
  title: string;
  children: React.ReactNode;
}

export const CalloutBlock: React.FC<CalloutBlockProps> = ({ type, title, children }) => {
  let Icon = Shield;
  let bgColor = 'bg-[#0a0f14]';
  let borderColor = 'border-gray-800';
  let textColor = 'text-gray-300';

  switch (type.toUpperCase()) {
    case 'WARNING':
    case 'CAUTION':
    case 'TODO':
      Icon = AlertTriangle;
      bgColor = 'bg-yellow-500/10';
      borderColor = 'border-yellow-500/50';
      textColor = 'text-yellow-500';
      break;
    case 'INFO':
    case 'NOTE':
    case 'ABSTRACT':
    case 'SUMMARY':
    case 'TLDR':
      Icon = Info;
      bgColor = 'bg-defense/10';
      borderColor = 'border-defense/50';
      textColor = 'text-defense';
      break;
    case 'DANGER':
    case 'ERROR':
    case 'BUG':
    case 'FAILURE':
    case 'FAIL':
    case 'MISSING':
      Icon = AlertOctagon;
      bgColor = 'bg-offense/10';
      borderColor = 'border-offense/50';
      textColor = 'text-offense';
      break;
    case 'SUCCESS':
    case 'CHECK':
    case 'DONE':
      Icon = Shield; // Could use Check but original used Shield for some
      bgColor = 'bg-green-500/10';
      borderColor = 'border-green-500/50';
      textColor = 'text-green-500';
      break;
  }

  return (
    <div
      className={`${bgColor} ${borderColor} border-l-4 p-4 my-6 flex gap-3 items-center rounded-r shadow-lg print:shadow-none animate-in fade-in slide-in-from-left-2`}
    >
      <Icon className={`${textColor} flex-shrink-0`} size={20} />
      <div className="flex-1">
        {title && (
          <div className={`${textColor} font-bold text-sm mb-1 uppercase tracking-wider`}>
            {title}
          </div>
        )}
        <div className="text-gray-300 text-sm leading-relaxed prose-sm prose-invert max-w-none [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
};
