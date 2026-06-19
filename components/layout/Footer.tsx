'use client';

import React from 'react';
import { formatBytes } from '@/utils';
import { config } from '@/config/env';
import { getVaultDataSync } from '@/lib/vault-cache';
import { VaultNode } from '@/types/vault';

interface FooterProps {
  rx: number;
  tx: number;
  rxActive: boolean;
  txActive: boolean;
}

const Footer: React.FC<FooterProps> = ({ rx, tx, rxActive, txActive }) => {
  const [blogProject, setBlogProject] = React.useState<VaultNode | undefined>(undefined);

  // Initialize blog project lookup on mount to prevent hydration mismatch
  React.useEffect(() => {
    // Use cached vault data synchronously if available
    const vaultData = getVaultDataSync() || [];

    // Priority 1: Exact ID/Title matches for hblog-ng
    const exactMatch = vaultData.find(
      (n) =>
        n.id === 'hblog-ng' || n.id === 'project:hblog-ng' || n.title?.toLowerCase() === 'hblog-ng',
    );

    if (exactMatch) {
      setBlogProject(exactMatch);
      return;
    }

    // Priority 2: Fallback legacy IDs and broad search
    const fallbackMatch = vaultData.find(
      (n) =>
        n.id === 'blog-project' ||
        n.id === 'project:blog-project' ||
        n.id === 'project:this-blog-project' ||
        (n.type === 'project' &&
          (n.title?.toLowerCase().includes('blog') || n.title?.toLowerCase().includes('hblog'))),
    );

    if (fallbackMatch) {
      setBlogProject(fallbackMatch);
    }
  }, []);

  // Single source of truth: package.json version, imported in config/env.ts.
  const version = config.appVersion;
  const projectName = blogProject?.title || 'hblog-ng';

  // Repo link: handle from env (NEXT_PUBLIC_GITHUB_HANDLE), repo from the
  // project node's `github` field, normalized to an absolute URL. Falls back
  // to the handle + project name so the link is correct before the node loads.
  const githubUrl = (() => {
    const handle = config.githubHandle;
    const repo = blogProject?.github?.trim();
    if (!repo) return `https://github.com/${handle}/${projectName}`;
    if (repo.startsWith('http')) return repo;
    if (repo.startsWith('github.com/')) return `https://${repo}`;
    if (repo.includes('/')) return `https://github.com/${repo}`;
    return `https://github.com/${handle}/${repo}`;
  })();

  return (
    <footer className="fixed bottom-0 w-full bg-[#050505] border-t border-gray-800 py-1 px-4 text-[10px] font-mono text-gray-500 flex justify-between items-center z-50 h-8">
      <div className="flex items-center gap-4">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-defense transition-colors"
        >
          {projectName} v{version}
        </a>
      </div>
      <div className="flex-1"></div>
      <div className="flex gap-4 items-center min-w-[200px] justify-end">
        <div className="flex justify-between w-24">
          <span>RX:</span>
          <span className={rxActive ? 'text-defense' : 'text-gray-500'}>{formatBytes(rx)}/s</span>
        </div>
        <div className="flex justify-between w-24">
          <span>TX:</span>
          <span className={txActive ? 'text-offense' : 'text-gray-500'}>{formatBytes(tx)}/s</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
