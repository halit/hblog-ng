'use client';

import React, { useState, useEffect } from 'react';
import { Command } from '../hooks/useCommandHandler';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Don't focus on anything initially
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, commands.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === 'Enter' && selectedIndex >= 0 && commands[selectedIndex]) {
        e.preventDefault();
        commands[selectedIndex].handler();
        onClose();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, commands, selectedIndex, onClose]);

  if (!isOpen) return null;

  // Group commands by category
  const groupedCommands = commands.reduce(
    (acc, cmd) => {
      const category = cmd.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(cmd);
      return acc;
    },
    {} as Record<string, Command[]>,
  );

  // Flatten for index calculation
  const flatCommands = commands;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Commands List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="border-b border-gray-800 last:border-0">
              <div className="px-4 py-2 bg-gray-900/50 text-xs font-mono text-gray-500 uppercase">
                {category}
              </div>
              {cmds.map((cmd) => {
                const globalIdx = flatCommands.indexOf(cmd);
                const isSelected = globalIdx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.handler();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`w-full text-left p-4 hover:bg-gray-900/50 transition-colors flex items-center justify-between relative ${
                      isSelected && selectedIndex >= 0 ? 'bg-gray-900/50' : ''
                    }`}
                  >
                    {isSelected && selectedIndex >= 0 && (
                      <div className="absolute left-0 top-0 h-full w-[2px] bg-offense"></div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white font-display mb-1">
                        {cmd.name}
                      </div>
                      <div className="text-xs text-gray-400">{cmd.description}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-[10px] font-mono text-gray-400">
                        {cmd.shortcut}
                      </kbd>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between text-[10px] font-mono text-gray-600">
          <span>↑↓ Navigate • Enter Select • Esc Close</span>
          <span>
            {commands.length} command{commands.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
