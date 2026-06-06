'use client';

import { useRouter } from 'next/navigation';
import { Share2, Lock, Network, Github, ExternalLink, Quote } from 'lucide-react';
import KeywordTags from './KeywordTags';
import { VaultNode } from '@/types/vault';
import { getPathFromId } from '@/lib/routing';

interface UnifiedDetailHeaderProps {
  node: VaultNode;
  setSignatureOpen?: (sig: string) => void;
  setBibtexOpen?: (bibtex: string) => void;
  setShareOpen: (url: string, title: string, description?: string) => void;
}

export default function UnifiedDetailHeader({
  node,
  setSignatureOpen,
  setBibtexOpen,
  setShareOpen,
}: UnifiedDetailHeaderProps) {
  const router = useRouter();

  const handleKeywordClick = (keyword: string) => {
    router.push(`/keywords/${encodeURIComponent(keyword.toLowerCase())}`);
  };

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const itemUrl = `${siteUrl}${getPathFromId(node.id, node)}`;

  // Research specific logic
  const paperUrl =
    node.type === 'research' &&
    node.publication &&
    (node.publication.startsWith('http://') || node.publication.startsWith('https://'))
      ? node.publication
      : undefined;
  const paperLink = node.type === 'research' ? node.url || node.link : undefined;

  return (
    <div className="relative group mb-8">
      <div className="relative bg-[#0a0f14] print:bg-transparent border border-gray-800 print:border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          {node.type === 'research' && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 font-mono uppercase">PUBLISHED:</span>
              <span className="text-gray-400 font-mono uppercase text-xs">
                {paperUrl
                  ? 'Research Paper'
                  : node.published_in || node.publication || 'Research Paper'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-mono uppercase flex-shrink-0">
              KEYWORDS:
            </span>
            {(node.keywords || node.stack) && (node.keywords || node.stack)!.length > 0 && (
              <KeywordTags
                keywords={(node.keywords || node.stack)!}
                onKeywordClick={handleKeywordClick}
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap print:hidden">
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('openNeuralGraph', { detail: { searchTerm: node.title } }),
              )
            }
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1.5 text-xs font-bold border border-gray-800 transition-colors"
          >
            <Network size={12} /> GRAPH
          </button>

          <button
            onClick={() => setShareOpen(itemUrl, node.title, node.description)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1.5 text-xs font-bold border border-gray-800 transition-colors"
          >
            <Share2 size={12} /> SHARE
          </button>

          {/* Blog Specific */}
          {node.type === 'blog' && node.signature && setSignatureOpen && (
            <button
              onClick={() => setSignatureOpen(node.signature!)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1.5 text-xs font-bold border border-gray-800 transition-colors"
            >
              <Lock size={12} /> SIGNATURE
            </button>
          )}

          {/* Project Specific */}
          {node.type === 'project' && node.github && (
            <a
              href={`https://${node.github}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1.5 text-xs font-bold border border-gray-800 transition-colors"
            >
              <Github size={12} /> SOURCE
            </a>
          )}

          {/* Research Specific */}
          {node.type === 'research' && paperLink && (
            <a
              href={paperLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1.5 text-xs font-bold border border-gray-800 transition-colors"
            >
              <ExternalLink size={12} /> READ PAPER
            </a>
          )}
          {node.type === 'research' && paperUrl && (
            <a
              href={paperUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1.5 text-xs font-bold border border-gray-800 transition-colors"
            >
              <ExternalLink size={12} /> PAPER URL
            </a>
          )}
          {node.type === 'research' &&
            setBibtexOpen &&
            ((node.references && node.references.length > 0) ||
              (node.bibtex && node.bibtex !== '|')) && (
              <button
                onClick={() => {
                  if (node.references && node.references.length > 0) {
                    setBibtexOpen(node.references[0]);
                  } else if (node.bibtex && node.bibtex !== '|') {
                    setBibtexOpen(node.bibtex);
                  }
                }}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1.5 text-xs font-bold border border-gray-800 transition-colors"
              >
                <Quote size={12} /> CITATION
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
