import { loadVaultData } from '@/lib/vault';
import { getPathFromId } from '@/lib/routing';
import { markdownToRssHtml } from '@/lib/rss-markdown';
import { byNewest, stripMarkdownToText } from '@/utils';
import { config } from '@/config/env';
import { NextResponse } from 'next/server';
import { formatAtomFeed, formatRssFeed, formatJsonFeed } from './feed-utils';

export interface FeedItem {
  id: string;
  url: string;
  title: string;
  content_html: string;
  content_text: string;
  summary: string;
  date_published: string; // ISO string
  date_modified: string; // ISO string
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  tags: string[];
  image?: string;
}

export interface FeedData {
  items: FeedItem[];
  lastUpdated: string; // ISO string
  siteUrl: string;
  siteTitle: string;
  siteDescription: string;
  authorName: string;
  authorEmail: string;
}

export async function getFeedData(): Promise<FeedData> {
  const vaultData = loadVaultData();

  // Clean site URL (remove trailing slash)
  const siteUrl = config.siteUrl.replace(/\/$/, '');

  const blogPosts = vaultData
    .filter(
      (node) =>
        ['blog', 'research', 'project'].includes(node.type) &&
        node.id !== 'root' &&
        node.id !== 'home',
    )
    .sort(byNewest)
    .slice(0, 50);

  const items = await Promise.all(
    blogPosts.map(async (node) => {
      const path = getPathFromId(node.id, node);
      const url = `${siteUrl}${path}`;
      const updated = new Date(node.updated).toISOString();
      const published = new Date(
        node.created || (node.year ? `${node.year}-01-01` : node.updated),
      ).toISOString();

      // Clean content for summary
      const summary = stripMarkdownToText(node.content, 500);

      // Prepare full content for feeds
      const fullContent = await markdownToRssHtml(node.content);

      // Handle image URL
      let imageUrl: string | undefined;
      if (node.cover_image) {
        if (node.cover_image.startsWith('http')) {
          imageUrl = node.cover_image;
        } else {
          const imagePath = node.cover_image.startsWith('/')
            ? node.cover_image
            : `/images/${node.cover_image}`;
          imageUrl = `${siteUrl}${imagePath}`;
        }
      }

      return {
        id: url,
        url,
        title: node.title,
        content_html: fullContent,
        content_text: node.content,
        summary: node.description || summary,
        date_published: published,
        date_modified: updated,
        author: {
          name: config.authorName,
          email: config.authorEmail,
        },
        tags: node.keywords || node.stack || [],
        image: imageUrl,
      };
    }),
  );

  const lastUpdated = items.length > 0 ? items[0].date_modified : new Date().toISOString();

  return {
    items,
    lastUpdated,
    siteUrl,
    siteTitle: config.siteTitle,
    siteDescription: config.siteDescription,
    authorName: config.authorName,
    authorEmail: config.authorEmail,
  };
}

export type FeedType = 'atom' | 'rss' | 'json';

const FEED_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function getFeedResponse(type: FeedType): Promise<NextResponse> {
  try {
    const data = await getFeedData();

    switch (type) {
      case 'atom':
        return new NextResponse(formatAtomFeed(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/atom+xml; charset=utf-8',
            'Cache-Control': FEED_CACHE_CONTROL,
          },
        });
      case 'rss':
        return new NextResponse(formatRssFeed(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': FEED_CACHE_CONTROL,
          },
        });
      case 'json':
        return NextResponse.json(formatJsonFeed(data), {
          headers: {
            'Cache-Control': FEED_CACHE_CONTROL,
          },
        });
      default:
        return new NextResponse('Invalid feed type', { status: 400 });
    }
  } catch (error) {
    console.error(`Error generating ${type} feed:`, error);
    return new NextResponse(`Error generating ${type} feed`, { status: 500 });
  }
}
