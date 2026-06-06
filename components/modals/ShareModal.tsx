'use client';

import React, { useState } from 'react';
import { Twitter, Linkedin, Copy, CheckCircle, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url, description }) => {
  const [copied, setCopied] = useState(false);
  const [hasNativeShare] = useState(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
  );

  const encodedUrl = encodeURIComponent(url);

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'native') => {
    if (platform === 'native' && hasNativeShare) {
      try {
        await navigator.share({ text: description, url });
        onClose();
      } catch {
        // User cancelled or browser error — silently ignore
      }
      return;
    }

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}${description ? `&text=${encodeURIComponent(description)}` : ''}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    const shareUrl = shareUrls[platform];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      onClose();
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
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
        className="w-full max-w-lg bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div>
            <span className="text-xs text-gray-500 font-mono uppercase mb-3 block">
              SOCIAL MEDIA:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center justify-center gap-1 border border-gray-800 p-2 hover:bg-white/5 hover:border-white/20 transition-all text-xs text-gray-400 hover:text-white"
              >
                <Twitter size={12} /> X
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center justify-center gap-1 border border-gray-800 p-2 hover:bg-white/5 hover:border-white/20 transition-all text-xs text-gray-400 hover:text-white"
              >
                <Linkedin size={12} /> LinkedIn
              </button>
            </div>
          </div>

          {hasNativeShare && (
            <button
              onClick={() => handleShare('native')}
              className="w-full flex items-center justify-center gap-3 p-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded transition-colors group"
            >
              <Share2
                size={20}
                className="text-gray-400 group-hover:scale-110 transition-transform"
              />
              <span className="text-sm font-mono text-gray-300">Native Share</span>
            </button>
          )}

          <div className="pt-3 border-t border-gray-800">
            <div className="text-xs text-gray-500 font-mono mb-2">URL:</div>
            <div className="relative group">
              <div className="bg-gray-900 p-3 rounded border border-gray-800 w-full">
                <div className="text-xs font-mono text-gray-400 break-all pr-10">{url}</div>
              </div>
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopyUrl}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg"
                >
                  {copied ? <CheckCircle size={12} className="text-defense" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
