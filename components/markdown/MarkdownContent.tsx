import React, { Suspense, lazy, ElementType } from 'react';
import Link from 'next/link';
import { Token, Tokens } from 'marked';
import { Hash, CheckCircle, Copy } from 'lucide-react';
import { CalloutBlock } from './CalloutBlock';
import { getIconComponent } from '@/utils/icons';
import BlockHeader from '../BlockHeader';
import FileAttachment from '../FileAttachment';
import VideoPlayer from '../VideoPlayer';
import ImageWithZoom from '../ImageWithZoom';
import LinkPreview from '../LinkPreview';
import TerminalBlock from '../TerminalBlock';
import { smoothScrollToId, generateHeadingId } from '@/utils';
import { getPathFromId } from '@/lib/routing';
import { VaultNode } from '@/types/vault';
import { convertTextEmojis } from '@/utils/emoji';

// Lazy Components
const MermaidRenderer = lazy(() => import('../MermaidRenderer'));
const LatexRenderer = lazy(() => import('../LatexRenderer'));
const LatexInline = lazy(() => import('../LatexInline'));
const QueryRenderer = lazy(() => import('../QueryRenderer'));
const ChartRenderer = lazy(() => import('../ChartRenderer'));
const ImageGallery = lazy(() => import('../ImageGallery'));
const HighlightedCode = lazy(() => import('react-syntax-highlighter').then(m => ({ default: m.PrismAsyncLight })));

// Syntax highlighting theme
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Create a custom theme that removes the default background to prevent color clashing
const customOneDark = {
  ...oneDark,
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    backgroundColor: 'transparent',
  },
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    backgroundColor: 'transparent',
  },
};

interface MarkdownContentProps {
  tokens: Token[];
  vaultData: VaultNode[];
  referenceMap: Map<string, { number: number; label?: string; id: string }>;
  onReferenceClick: (num: number) => void;
  compact?: boolean;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ 
  tokens, 
  vaultData, 
  referenceMap,
  onReferenceClick,
  compact = false
}) => {
  return (
    <>
      {tokens.map((token, index) => (
        <TokenRenderer 
          key={index} 
          token={token} 
          vaultData={vaultData} 
          referenceMap={referenceMap}
          onReferenceClick={onReferenceClick}
          compact={compact}
        />
      ))}
    </>
  );
};

const TokenRenderer: React.FC<{
  token: Token;
  vaultData: VaultNode[];
  referenceMap: Map<string, { number: number; label?: string; id: string }>;
  onReferenceClick: (num: number) => void;
  compact?: boolean;
}> = ({ token, vaultData, referenceMap, onReferenceClick, compact }) => {
  switch (token.type) {
    case 'heading': {
      const heading = token as Tokens.Heading;
      const id = generateHeadingId(heading.text, 0);
      const Tag = `h${heading.depth}` as ElementType;
      const classNames = {
        1: 'text-3xl font-bold text-white mt-12 mb-8 font-display group relative scroll-mt-20',
        2: 'text-2xl font-bold text-white mt-10 mb-6 font-display relative pl-4 group scroll-mt-20',
        3: 'text-xl font-bold text-white mt-8 mb-4 font-display relative pl-4 group scroll-mt-20',
        4: 'text-lg font-bold text-white mt-6 mb-4 font-display relative pl-4 group scroll-mt-20',
        5: 'text-base font-bold text-white mt-4 mb-2 font-display relative pl-4 group scroll-mt-20',
        6: 'text-sm font-bold text-white mt-4 mb-2 font-display relative pl-4 group scroll-mt-20',
      }[token.depth as 1 | 2 | 3 | 4 | 5 | 6];

      return (
        <Tag id={id} className={classNames}>
          {token.depth > 1 && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-offense opacity-50"></div>
          )}
          <a
            href={`#${id}`}
            className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-offense transition-opacity no-underline"
            onClick={(e) => {
              e.preventDefault();
              history.pushState(null, '', `#${id}`);
              smoothScrollToId(id);
            }}
          >
            <Hash size={20} />
          </a>
          <InlineRenderer
            tokens={heading.tokens}
            vaultData={vaultData}
            referenceMap={referenceMap}
            onReferenceClick={onReferenceClick}
          />
        </Tag>
      );
    }

    case 'paragraph': {
      const paragraph = token as Tokens.Paragraph;
      // Check if this paragraph is ONLY images (gallery) - allow whitespace and line breaks
      const isGallery =
        paragraph.tokens &&
        paragraph.tokens
          .filter((t) => {
            if (t.type === 'text' && (t as Tokens.Text).text.trim() === '') return false; // Ignore whitespace
            if (t.type === 'br') return false; // Ignore line breaks
            return true;
          })
          .every((t) => t.type === 'image');

      const images = paragraph.tokens
        ? (paragraph.tokens.filter((t) => t.type === 'image') as Tokens.Image[])
        : [];

      if (isGallery && images.length > 1) {
        const galleryImages = images.map((img) => {
          let src = img.href;
          let fallbackSrc: string | undefined;
          let altText = img.text || '';
          let scale: number | undefined;

          if (altText.includes('|')) {
            const parts = altText.split('|');
            const possibleScale = parseFloat(parts[parts.length - 1]);
            if (!isNaN(possibleScale) && possibleScale > 0 && possibleScale <= 1) {
              scale = possibleScale;
              altText = parts.slice(0, -1).join('|').trim();
            }
          }

          if (!src.startsWith('http') && !src.startsWith('/')) {
            const baseName = src.replace(/\.[^/.]+$/, '');
            fallbackSrc = `/images/${src}`;
            src = `/images/${baseName}.webp`;
          }

          return { src, alt: altText, fallbackSrc, scale };
        });

        return (
          <Suspense
            key={paragraph.raw}
            fallback={<div className="h-64 animate-pulse bg-gray-900 rounded"></div>}
          >
            <ImageGallery images={galleryImages} />
          </Suspense>
        );
      }

      return (
        <div className={`text-gray-300 leading-7 ${compact ? '' : 'mb-4'}`}>
          <InlineRenderer
            tokens={paragraph.tokens}
            vaultData={vaultData}
            referenceMap={referenceMap}
            onReferenceClick={onReferenceClick}
          />
        </div>
      );
    }

    case 'list': {
      const list = token as Tokens.List;
      return (
        <ul className={`list-none my-4 space-y-2 ${list.ordered ? 'list-decimal ml-6' : ''}`}>
          {list.items.map((item, i) => (
            <li key={i} className="flex items-baseline gap-2">
              {!list.ordered && <span className="text-offense flex-shrink-0">•</span>}
              <div className="text-gray-300 flex-1">
                <MarkdownContent
                  tokens={item.tokens}
                  vaultData={vaultData}
                  referenceMap={referenceMap}
                  onReferenceClick={onReferenceClick}
                  compact={true}
                />
              </div>
            </li>
          ))}
        </ul>
      );
    }

    case 'blockquote': {
      const blockquote = token as Tokens.Blockquote;
      return (
        <blockquote className="border-l-4 border-gray-700 pl-4 my-6 italic text-gray-400">
          <MarkdownContent
            tokens={blockquote.tokens}
            vaultData={vaultData}
            referenceMap={referenceMap}
            onReferenceClick={onReferenceClick}
          />
        </blockquote>
      );
    }

    case 'code': {
      const code = token as Tokens.Code;
      const fullLang = code.lang || 'text';
      const [lang, ...metaParts] = fullLang.split(/\s+/);
      const metadata = metaParts.join(' ');

      const parseMetadata = (str: string) => {
        const props: Record<string, string> = {};
        // Match key="value", key='value', or key=value (no spaces)
        const regex = /(\w+)=(?:"([^"]*)"|'([^']*)'|([^"'\s]+))/g;
        let m;
        while ((m = regex.exec(str)) !== null) {
          const key = m[1];
          const value = m[2] || m[3] || m[4];
          props[key] = value;
        }
        return props;
      };

      if (lang === 'mermaid') {
        const props = parseMetadata(metadata);
        return (
          <Suspense
            fallback={
              <div className="my-8 bg-[#0a0f14] border border-gray-800 p-6 rounded">
                Loading diagram...
              </div>
            }
          >
            <MermaidRenderer code={code.text.trim()} title={props.title || props.caption} />
          </Suspense>
        );
      }
      if (lang === 'chart') {
        const props = parseMetadata(metadata);
        return (
          <Suspense
            fallback={
              <div className="my-8 bg-[#0a0f14] border border-gray-800 p-6 rounded">
                Loading chart...
              </div>
            }
          >
            <ChartRenderer data={code.text.trim()} {...props} />
          </Suspense>
        );
      }
      if (lang === 'terminal' || lang === 'console') {
        return <TerminalBlock content={code.text.trim()} />;
      }
      if (lang === 'query') {
        return (
          <Suspense fallback={<div className="my-8 animate-pulse">Loading query...</div>}>
            <QueryRenderer query={code.text.trim()} />
          </Suspense>
        );
      }
      return <CodeBlock code={code.text} language={lang} />;
    }

    case 'table': {
      const table = token as Tokens.Table;
      return (
        <div className="overflow-x-auto my-6 w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900/30 border-y border-gray-800">
                {table.header.map((cell, i) => (
                  <th
                    key={i}
                    className="!px-4 !py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[120px]"
                  >
                    <InlineRenderer
                      tokens={cell.tokens}
                      vaultData={vaultData}
                      referenceMap={referenceMap}
                      onReferenceClick={onReferenceClick}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-900/20">
                  {row.map((cell, j) => (
                    <td key={j} className="!px-4 !py-3 text-sm text-gray-300">
                      <InlineRenderer
                        tokens={cell.tokens}
                        vaultData={vaultData}
                        referenceMap={referenceMap}
                        onReferenceClick={onReferenceClick}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'callout': {
      const callout = token as Token & { calloutType: string; title: string; tokens: Token[] };
      return (
        <CalloutBlock type={callout.calloutType} title={callout.title}>
          <MarkdownContent
            tokens={callout.tokens}
            vaultData={vaultData}
            referenceMap={referenceMap}
            onReferenceClick={onReferenceClick}
            compact={true}
          />
        </CalloutBlock>
      );
    }

    case 'mathBlock': {
      const mathBlock = token as Token & { text: string };
      return (
        <Suspense
          fallback={
            <div className="my-6 p-6 text-center text-gray-500 font-mono">Loading math...</div>
          }
        >
          <LatexRenderer math={mathBlock.text} />
        </Suspense>
      );
    }

    case 'space':
      return null;

    case 'hr':
      return <hr className="my-8 border-gray-800" />;

    case 'text': {
      const text = token as Tokens.Text;
      return (
        <div className={compact ? '' : 'mb-4'}>
          <InlineRenderer
            tokens={text.tokens || [{ type: 'text', text: text.text } as Token]}
            vaultData={vaultData}
            referenceMap={referenceMap}
            onReferenceClick={onReferenceClick}
          />
        </div>
      );
    }

    case 'html': {
      const html = token as Tokens.HTML;
      return <div dangerouslySetInnerHTML={{ __html: html.text }} />;
    }

    default:
      console.warn('Unhandled block token:', token.type);
      return (
        <div className="text-red-500 bg-red-900/10 p-2 rounded mb-4">
          Unsupported block: {token.type}
        </div>
      );
  }
};

const InlineRenderer: React.FC<{
  tokens: Token[];
  vaultData: VaultNode[];
  referenceMap: Map<string, { number: number; label?: string; id: string }>;
  onReferenceClick: (num: number) => void;
}> = ({ tokens, vaultData, referenceMap, onReferenceClick }) => {
  if (!tokens) return null;
  return (
    <>
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'text': {
            const text = token as Tokens.Text;
            const nextToken = tokens[i + 1];
            const raw = nextToken?.type === 'codespan'
              ? text.text.replace(/ $/, '\u00A0')
              : text.text;
            return <span key={i}>{convertTextEmojis(raw)}</span>;
          }
          case 'strong': {
            const strong = token as Tokens.Strong;
            return (
              <strong key={i} className="font-bold text-white">
                {strong.tokens ? (
                  <InlineRenderer
                    tokens={strong.tokens}
                    vaultData={vaultData}
                    referenceMap={referenceMap}
                    onReferenceClick={onReferenceClick}
                  />
                ) : (
                  strong.text
                )}
              </strong>
            );
          }
          case 'em': {
            const em = token as Tokens.Em;
            return (
              <em key={i} className="italic text-gray-200">
                {em.tokens ? (
                  <InlineRenderer
                    tokens={em.tokens}
                    vaultData={vaultData}
                    referenceMap={referenceMap}
                    onReferenceClick={onReferenceClick}
                  />
                ) : (
                  em.text
                )}
              </em>
            );
          }
          case 'codespan': {
            const codespan = token as Tokens.Codespan;
            return (
              <code
                key={i}
                className="inline whitespace-nowrap bg-gray-800 text-offense px-1 rounded text-xs font-mono border border-gray-700"
              >
                {codespan.text}
              </code>
            );
          }
          case 'link': {
            const link = token as Tokens.Link;
            return (
              <a
                key={i}
                href={link.href}
                title={link.title ?? undefined}
                className="text-defense hover:underline"
              >
                {link.text}
              </a>
            );
          }
          case 'br':
            return <br key={i} />;
          case 'del': {
            const del = token as Tokens.Del;
            return (
              <del key={i}>
                <InlineRenderer
                  tokens={del.tokens}
                  vaultData={vaultData}
                  referenceMap={referenceMap}
                  onReferenceClick={onReferenceClick}
                />
              </del>
            );
          }
          case 'image': {
            const image = token as Tokens.Image;
            let src = image.href;
            let fallbackSrc: string | undefined;
            if (!src.startsWith('http') && !src.startsWith('/')) {
              const baseName = src.replace(/\.[^/.]+$/, '');
              const ext = src.match(/\.[^/.]+$/)?.[0] || '';
              if (ext !== '.webp') {
                fallbackSrc = `/images/${src}`;
                src = `/images/${baseName}.webp`;
              } else {
                src = `/images/${src}`;
              }
            }
            return (
              <ImageWithZoom
                key={i}
                src={src}
                alt={image.text}
                fallbackSrc={fallbackSrc}
                index={i}
              />
            );
          }

          case 'embed': {
            const embed = token as Token & { link: string; caption?: string };
            const isImage = /\.(png|jpe?g|gif|svg|webp)$/i.test(embed.link);
            if (isImage) {
              const src = embed.link.startsWith('/') ? embed.link : `/images/${embed.link}`;
              return <ImageWithZoom key={i} src={src} alt={embed.caption || ''} />;
            }
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-defense border-b border-dotted border-defense/50 hover:border-defense"
              >
                ![[{embed.link}]]
              </span>
            );
          }

          case 'fileAttachment': {
            const fileAttachment = token as Token & { name: string; path: string };
            const fileName = fileAttachment.name;
            const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
            
            // If the path is already resolved (starts with /files/ or /images/), use it directly
            // Otherwise, construct the default path
            let fileUrl = fileAttachment.path;
            if (!fileUrl.startsWith('/') && !fileUrl.startsWith('http')) {
              const actualFileName = fileAttachment.path.split('/').pop() || fileAttachment.path;
              fileUrl = `/files/${encodeURIComponent(actualFileName)}`;
            }
            
            return (
              <div key={i} className="my-4">
                <FileAttachment fileName={fileName} fileUrl={fileUrl} fileExt={fileExt} />
              </div>
            );
          }

          case 'videoPlayer': {
            const videoPlayer = token as Token & { url: string; caption?: string };
            return (
              <div key={i} className="my-8">
                <Suspense
                  fallback={
                    <div className="bg-[#0a0f14] border border-gray-800 h-64 rounded animate-pulse"></div>
                  }
                >
                  <VideoPlayer src={videoPlayer.url} caption={videoPlayer.caption} />
                </Suspense>
              </div>
            );
          }

          case 'asciinema': {
            const asciinema = token as Token & { id: string; caption?: string };
            const src = asciinema.id.startsWith('http')
              ? asciinema.id
              : `https://asciinema.org/a/${asciinema.id}`;
            return (
              <div key={i} className="my-8">
                <Suspense
                  fallback={
                    <div className="bg-[#0a0f14] border border-gray-800 h-64 rounded animate-pulse"></div>
                  }
                >
                  <VideoPlayer src={src} caption={asciinema.caption} />
                </Suspense>
              </div>
            );
          }

          // Customs
          case 'referenceLink': {
            const referenceLink = token as Token & { refId: string };
            const ref = referenceMap.get(referenceLink.refId);
            if (ref) {
              return (
                <a
                  key={i}
                  href={`#ref-${ref.number}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onReferenceClick(ref.number);
                  }}
                  className="text-offense hover:text-offense/80 font-mono text-xs no-underline border-b border-dotted border-offense/50 hover:border-offense cursor-pointer"
                  title={ref.label || ref.id}
                >
                  [{ref.number}]
                </a>
              );
            }
            return <span key={i} className="text-gray-500">[{referenceLink.refId}]</span>;
          }

          case 'wikilink': {
            const wikilink = token as Token & { page: string; label: string };
            const normalized = wikilink.page.toLowerCase().replace(/\s+/g, '-');
            const target = vaultData.find(
              (n) =>
                n.title.toLowerCase() === wikilink.page.toLowerCase() ||
                n.id === normalized ||
                (n.aliases && n.aliases.some((a) => a.toLowerCase() === wikilink.page.toLowerCase())),
            );
            if (target) {
              return (
                <LinkPreview key={i} id={target.id}>
                  <Link
                    href={getPathFromId(target.id, target)}
                    prefetch={false}
                    className="text-defense hover:text-defense/80 border-b border-dotted border-defense/50 hover:border-defense no-underline"
                  >
                    {wikilink.label}
                  </Link>
                </LinkPreview>
              );
            }
            return (
              <span key={i} className="text-gray-500 border-b border-dotted border-gray-700 cursor-not-allowed">
                {wikilink.label}
              </span>
            );
          }

          case 'mathInline': {
            const mathInline = token as Token & { text: string };
            return (
              <Suspense key={i} fallback={<code>${mathInline.text}$</code>}>
                <LatexInline math={mathInline.text} />
              </Suspense>
            );
          }

          case 'hashtag': {
            const hashtag = token as Token & { text: string };
            const keyword = hashtag.text;
            const filterPath = `/keywords/${encodeURIComponent(keyword.toLowerCase())}`;
            return (
              <Link
                key={i}
                href={filterPath}
                className="inline text-defense hover:text-defense/80 border-b border-dotted border-defense/50 hover:border-defense no-underline font-mono text-sm"
              >
                #{keyword}
              </Link>
            );
          }

          default:
            return <span key={i} className="text-red-400">[{token.type}]</span>;
        }
      })}
    </>
  );
};

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-8">
      <div className="bg-[#0a0f14] border border-gray-800 rounded-lg overflow-hidden shadow-xl">
        <BlockHeader
          title={language || 'text'}
          icon={getIconComponent(language, 'FileCode')}
          rightElement={
            <button
              onClick={copyToClipboard}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? <CheckCircle size={12} className="text-defense" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          }
        />
        <div className="overflow-x-auto">
          <Suspense fallback={<pre className="p-4 text-gray-400 font-mono text-sm">{code}</pre>}>
            <HighlightedCode
              language={language || 'text'}
              style={customOneDark}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: '#0a0f14',
                border: 0,
                fontSize: '0.875rem',
                fontFamily: '"JetBrains Mono", monospace',
              }}
              showLineNumbers={false}
            >
              {code}
            </HighlightedCode>
          </Suspense>
        </div>
      </div>
    </div>
  );
};
