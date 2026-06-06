import React from 'react';
import { Terminal, Copy, CheckCircle } from 'lucide-react';
import BlockHeader from './BlockHeader';

interface TerminalBlockProps {
  content: string;
  title?: string;
}

const TerminalBlock: React.FC<TerminalBlockProps> = ({ content, title = 'terminal' }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    // Extract only the commands (lines starting with $) to copy
    const commands = content
      .split('\n')
      .filter((line) => line.trim().startsWith('$'))
      .map((line) => line.trim().substring(1).trim())
      .join('\n');

    // If no commands found with $, just copy the whole content
    const textToCopy = commands || content;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split('\n');

  return (
    <div className="relative group my-8 rounded-lg overflow-hidden border border-gray-800 print:border-gray-200 bg-[#0a0f14] shadow-xl print:shadow-none font-mono text-sm">
      <BlockHeader
        title={title}
        icon={Terminal}
        rightElement={
          <button
            onClick={copyToClipboard}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        }
      />

      {/* Terminal Content */}
      <div className="p-4 overflow-x-auto">
        <div className="flex flex-col gap-0.5">
          {lines.map((line, i) => {
            const trimmed = line.trim();
            const isCommand = trimmed.startsWith('$');
            const isComment = trimmed.startsWith('#');

            return (
              <div key={i} className="whitespace-pre font-mono leading-relaxed">
                {isCommand ? (
                  <div className="flex">
                    <span className="text-offense mr-2 select-none">$</span>
                    <span className="text-gray-100 font-medium">
                      {line.substring(line.indexOf('$') + 1)}
                    </span>
                  </div>
                ) : isComment ? (
                  <span className="text-gray-500 italic">{line}</span>
                ) : (
                  <span className="text-gray-400">{line}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TerminalBlock;
