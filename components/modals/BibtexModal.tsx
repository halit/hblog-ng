'use client';

import React from 'react';
import { X, Copy, CheckCircle } from 'lucide-react';
import { loadBibtexReferences, generateBibtexString } from '@/lib/bibtex-client';

interface BibtexModalProps {
  isOpen: boolean;
  onClose: () => void;
  bibtex: string | null;
}

export const BibtexModal: React.FC<BibtexModalProps> = ({ isOpen, onClose, bibtex }) => {
  const [formattedBibtex, setFormattedBibtex] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedBibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    if (!isOpen || !bibtex) {
      setFormattedBibtex('');
      setLoading(false);
      setCopied(false);
      return;
    }

    // A reference ID has no newlines, no `@`, and is short
    const isReferenceId = !bibtex.includes('\n') && !bibtex.includes('@') && bibtex.length < 100;

    if (isReferenceId) {
      setLoading(true);
      loadBibtexReferences().then((entries) => {
        const entry = entries.get(bibtex);
        setFormattedBibtex(
          entry ? generateBibtexString(entry) : `Reference "${bibtex}" not found in references.bib`,
        );
        setLoading(false);
      });
    } else {
      setFormattedBibtex(bibtex);
      setLoading(false);
    }
  }, [isOpen, bibtex]);

  if (!isOpen || !bibtex) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <span className="font-mono text-xs text-gray-400">BIBTEX CITATION</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="bg-gray-900 p-4 text-xs font-mono text-gray-300 border border-gray-800 rounded text-center">
              Loading citation...
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg"
                >
                  {copied ? <CheckCircle size={12} className="text-defense" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="bg-gray-900 p-4 text-xs font-mono text-gray-300 border border-gray-800 rounded overflow-auto max-h-[60vh] whitespace-pre-wrap">
                {formattedBibtex}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
