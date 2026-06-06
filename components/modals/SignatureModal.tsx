'use client';

import React from 'react';
import { Copy } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  signature: string | null;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, signature }) => {
  if (!isOpen || !signature) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-400 leading-relaxed">
            <p className="mb-2">
              This post has been cryptographically signed to ensure its authenticity and integrity.
            </p>
            <p className="mb-2">
              The signature below is generated from the content of this post using a cryptographic
              hash function (SHA-256). This allows you to verify that the content has not been
              tampered with or modified since it was published.
            </p>
            <p className="text-xs text-gray-500">
              The signature is based solely on the post content, not on metadata such as title,
              date, or other frontmatter fields.
            </p>
          </div>
          <div className="relative group">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => navigator.clipboard.writeText(signature)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <pre className="bg-gray-900 p-4 text-xs font-mono text-gray-300 border border-gray-800 rounded overflow-auto max-h-[50vh] whitespace-pre-wrap">
              {signature}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
