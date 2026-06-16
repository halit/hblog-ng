'use client';

import React from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Modal } from './Modal';
import { loadBibtexReferences, generateBibtexString } from '@/lib/bibtex-client';

interface BibtexModalProps {
  isOpen: boolean;
  onClose: () => void;
  bibtex: string | null;
}

export const BibtexModal: React.FC<BibtexModalProps> = ({ isOpen, onClose, bibtex }) => {
  const [formattedBibtex, setFormattedBibtex] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const { copied, copy, reset } = useCopyToClipboard();

  const copyToClipboard = () => copy(formattedBibtex);

  React.useEffect(() => {
    if (!isOpen || !bibtex) {
      setFormattedBibtex('');
      setLoading(false);
      reset();
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
  }, [isOpen, bibtex, reset]);

  return (
    <Modal
      isOpen={isOpen && !!bibtex}
      onClose={onClose}
      label="BIBTEX CITATION"
      className="w-full max-w-2xl"
    >
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
    </Modal>
  );
};
