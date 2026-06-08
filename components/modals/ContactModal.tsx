'use client';

import React, { useState } from 'react';
import { X, Twitter, Linkedin, Github, Copy, CheckCircle } from 'lucide-react';
import { config } from '@/config/env';
import { usePublicKey } from '@/hooks/usePublicKey';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const pgpKey = usePublicKey() ?? 'Loading public key…';
  const [emailCopied, setEmailCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const copyText = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      console.error('Failed to copy:', _err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-fit max-w-[95vw] bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — unified with the other modals (mono label + close). */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center gap-4">
          <span className="font-mono text-xs text-gray-400">SECURE CONTACT</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* The PGP key block sets the width; other sections fill it via
            `w-0 min-w-full` without forcing the modal wider, so the key fits
            with no empty space on the right. */}
        <div className="p-5 space-y-4">
          {/* Email */}
          <div className="w-0 min-w-full">
            <label className="text-[10px] font-mono text-gray-500 uppercase block mb-2">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyText(config.authorEmail, setEmailCopied)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg"
                >
                  {emailCopied ? (
                    <CheckCircle size={12} className="text-defense" />
                  ) : (
                    <Copy size={12} />
                  )}
                  {emailCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <input
                readOnly
                value={config.authorEmail}
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-300 font-mono"
              />
            </div>
          </div>

          {/* PGP Key */}
          <div>
            <label className="text-[10px] font-mono text-gray-500 uppercase block mb-2">
              PGP Public Key
            </label>
            <div className="relative group w-fit max-w-full">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyText(pgpKey, setKeyCopied)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg"
                >
                  {keyCopied ? (
                    <CheckCircle size={12} className="text-defense" />
                  ) : (
                    <Copy size={12} />
                  )}
                  {keyCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="w-fit max-w-full bg-gray-900 border border-gray-800 p-4 rounded text-xs text-gray-300 font-mono max-h-[60vh] overflow-auto whitespace-pre">
                {pgpKey}
              </pre>
            </div>
          </div>

          {/* Social */}
          <div className="w-0 min-w-full">
            <label className="text-[10px] font-mono text-gray-500 uppercase block mb-2">
              Social Channels
            </label>
            <div className="grid grid-cols-3 gap-2">
              {config.twitterHandle && (
                <a
                  href={`https://twitter.com/${config.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 border border-gray-800 p-2 hover:bg-white/5 hover:border-white/20 transition-all text-xs text-gray-400 hover:text-white"
                >
                  <Twitter size={12} /> X
                </a>
              )}
              {config.linkedinHandle && (
                <a
                  href={`https://linkedin.com/in/${config.linkedinHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 border border-gray-800 p-2 hover:bg-white/5 hover:border-white/20 transition-all text-xs text-gray-400 hover:text-white"
                >
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
              {config.githubHandle && (
                <a
                  href={`https://github.com/${config.githubHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 border border-gray-800 p-2 hover:bg-white/5 hover:border-white/20 transition-all text-xs text-gray-400 hover:text-white"
                >
                  <Github size={12} /> Github
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
