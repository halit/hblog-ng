'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional mono header label; when set, a standard header row with a close button is rendered. */
  label?: string;
  /** Width/size classes for the inner container (e.g. `w-full max-w-lg`). */
  className?: string;
  children: React.ReactNode;
}

/**
 * Shared modal shell: full-screen backdrop, click-outside-to-close, a centered
 * container that stops propagation, and an optional standard header. Replaces the
 * backdrop/container/header boilerplate that was duplicated across every modal.
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, label, className, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl overflow-hidden ${className ?? ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {label && (
          <div className="p-4 border-b border-gray-800 flex justify-between items-center gap-4">
            <span className="font-mono text-xs text-gray-400">{label}</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
