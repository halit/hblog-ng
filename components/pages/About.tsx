'use client';

import React from 'react';
import { VaultNode } from '@/types/vault';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface AboutProps {
  activeNode: VaultNode;
}

const About: React.FC<AboutProps> = ({ activeNode }) => {
  const rawContent = activeNode?.content || '';
  
  return (
    <div className="container mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      {/* Page Header - Matches Research/Project pages */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-2 uppercase tracking-tight">
            WHOAMI
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl">{activeNode?.description}</p>
        </div>
      </div>

      <main className="">
        {/* Clean Narrative Text */}
        <div className="prose prose-invert prose-sm md:prose-base max-w-none animate-in fade-in duration-1000">
          <div className="text-gray-300 font-sans leading-relaxed tracking-tight">
            <MarkdownRenderer content={rawContent} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
