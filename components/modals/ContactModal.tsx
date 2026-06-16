'use client';

import React from 'react';
import { Twitter, Linkedin, Github, Copy, CheckCircle } from 'lucide-react';
import { config } from '@/config/env';
import { usePublicKey } from '@/hooks/usePublicKey';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Modal } from './Modal';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const pgpKey = usePublicKey() ?? 'Loading public key…';
  const email = useCopyToClipboard();
  const key = useCopyToClipboard();

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="SECURE CONTACT" className="w-fit max-w-[95vw]">
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
                onClick={() => email.copy(config.authorEmail)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg"
              >
                {email.copied ? (
                  <CheckCircle size={12} className="text-defense" />
                ) : (
                  <Copy size={12} />
                )}
                {email.copied ? 'Copied' : 'Copy'}
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
                onClick={() => key.copy(pgpKey)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg"
              >
                {key.copied ? (
                  <CheckCircle size={12} className="text-defense" />
                ) : (
                  <Copy size={12} />
                )}
                {key.copied ? 'Copied' : 'Copy'}
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
    </Modal>
  );
};
