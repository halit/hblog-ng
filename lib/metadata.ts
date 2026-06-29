import { Metadata } from 'next';
import { VaultNode } from '@/types/vault';
import { getPathFromId } from './routing';
import { config } from '@/config/env';
import { stripMarkdownToText } from '@/utils';
import { getPublication, getNodeKeywords } from '@/utils/keywords';

export interface PageMetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  type?: 'website' | 'article' | 'profile';
  image?: string;
  url?: string;
}

// Shared by both the site-level and per-node metadata objects below.
const ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
};

const AUTHORS: Metadata['authors'] = [
  { name: config.authorName, ...(config.authorEmail && { url: `mailto:${config.authorEmail}` }) },
];

export function generatePageMetadata(node?: VaultNode, options?: PageMetadataOptions): Metadata {
  const siteTitle = config.siteTitle;
  const siteDescription = config.siteDescription;
  const siteUrl = config.siteUrl;
  const metadataBase = new URL(siteUrl);

  if (!node) {
    const title = options?.title ? `${options.title} | ${siteTitle}` : siteTitle;
    const description = options?.description || siteDescription;
    const url = options?.url ? `${siteUrl}${options.url}` : siteUrl;
    const type = options?.type || 'website';
    const keywords = options?.keywords || [];
    // Pages without a node (homepage, collection listings, 404, etc.) fall back
    // to the site-level OG card so they still get a large social image.
    const image = options?.image || `${siteUrl}/images/og/default.png`;

    return {
      metadataBase,
      title: {
        absolute: title,
      },
      description: description,
      keywords: keywords.length > 0 ? keywords : undefined,
      authors: AUTHORS,
      creator: config.authorName,
      publisher: config.authorName,
      robots: ROBOTS,
      openGraph: {
        title,
        description,
        type,
        url,
        siteName: siteTitle,
        locale: 'en_US',
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
            type: 'image/png',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        creator: config.authorName,
        images: [image],
      },
      alternates: {
        canonical: url,
        types: {
          'application/rss+xml': `${siteUrl}/feed.xml`,
          'application/atom+xml': `${siteUrl}/feed.atom`,
          'application/json': `${siteUrl}/feed.json`,
        },
      },
      verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
        yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
        yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
      },
    };
  }

  const title = node.title;
  const description = node.description || stripMarkdownToText(node.content, 160) || siteDescription;

  // Determine image type based on URL extension
  const getImageType = (url: string): string => {
    if (url.endsWith('.png')) return 'image/png';
    if (url.endsWith('.svg')) return 'image/svg+xml';
    if (url.endsWith('.webp')) return 'image/webp';
    if (url.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
  };

  // Use generated OG image for each content
  const ogImageFilename = `${node.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.png`;
  const imageUrl = `${siteUrl}/images/og/${ogImageFilename}`;

  // Generate correct page URL based on node type
  const pageUrl = `${siteUrl}${getPathFromId(node.id, node)}`;

  const keywords = getNodeKeywords(node);
  const articleType =
    node.type === 'blog' ? 'article' : node.type === 'research' ? 'article' : 'website';
  const publishedTime =
    node.type === 'blog' || node.type === 'research' ? node.created || node.updated : undefined;

  return {
    metadataBase,
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: AUTHORS,
    creator: config.authorName,
    publisher: config.authorName,
    robots: ROBOTS,
    openGraph: {
      title,
      description,
      type: articleType,
      url: pageUrl,
      siteName: siteTitle,
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: node.title,
          type: getImageType(imageUrl),
        },
      ],
      publishedTime,
      modifiedTime: node.updated,
      authors: node.type === 'blog' || node.type === 'research' ? [config.authorName] : undefined,
      ...(node.type === 'blog' || node.type === 'research'
        ? {
            section: node.type === 'research' ? 'Research' : 'Blog',
            tags: keywords,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: config.authorName,
    },
    alternates: {
      canonical: pageUrl,
    },
    ...(publishedTime
      ? {
          other: {
            'article:published_time': publishedTime,
            'article:modified_time': node.updated,
            'article:author': config.authorName,
            ...(keywords.length > 0 ? { 'article:tag': keywords.join(', ') } : {}),
          },
        }
      : {}),
  };
}

export function generateSchemaMarkup(node?: VaultNode): string {
  const siteUrl = config.siteUrl;
  const authorEmail = config.authorEmail;

  const authorPerson = {
    '@type': 'Person',
    '@id': `${siteUrl}/#person`,
    name: config.authorName,
    ...(authorEmail ? { email: authorEmail } : {}),
    url: siteUrl,
    image: `${siteUrl}/favicon.svg`,
    sameAs: [
      // Add social links here if available in config
    ],
  };

  if (!node) {
    // Default Website Schema
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          url: siteUrl,
          name: config.siteTitle,
          description: config.siteDescription,
          publisher: { '@id': `${siteUrl}/#person` },
          inLanguage: 'en-US',
        },
        authorPerson,
      ],
    }).replace(/</g, '\\u003c');
  }

  // Generate correct page URL based on node type
  const pageUrl = `${siteUrl}${getPathFromId(node.id, node)}`;

  // Use generated OG image for each content
  const ogImageFilename = `${node.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.png`;
  const imageUrl = `${siteUrl}/images/og/${ogImageFilename}`;

  const schemaType =
    node.type === 'blog'
      ? 'TechArticle'
      : node.type === 'research'
        ? 'ScholarlyArticle'
        : node.type === 'project'
          ? 'SoftwareApplication'
          : 'Article';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: node.title,
    name: node.title,
    description: node.description || stripMarkdownToText(node.content, 200),
    author: authorPerson,
    datePublished: node.created || node.updated,
    dateModified: node.updated,
    url: pageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    publisher: authorPerson,
  };

  // Add image if available
  if (imageUrl) {
    schema.image = {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    };
  }

  // Add keywords/tags
  const keywords = getNodeKeywords(node);
  if (keywords.length > 0) {
    schema.keywords = keywords.join(', ');
  }

  // Specific fields for TechArticle
  if (node.type === 'blog') {
    schema.articleSection = 'Cybersecurity';
  }

  // Add specific fields for research papers
  if (node.type === 'research') {
    const publication = getPublication(node);
    if (publication) {
      schema.isPartOf = {
        '@type': 'Periodical',
        name: publication,
      };
    }
    if (node.year) {
      schema.datePublished = `${node.year}-01-01`;
    }
    if (node.url) {
      schema.sameAs = node.url;
    }
  }

  // Add specific fields for projects
  if (node.type === 'project') {
    if (node.github) {
      schema.codeRepository = node.github;
    }
    schema.applicationCategory = 'SecurityApplication';
    schema.operatingSystem = 'Any';
  }

  // Sanitize JSON to prevent script injection via </script> tags
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

export function generateCollectionSchema(
  title: string,
  description: string,
  url: string,
  items: VaultNode[],
): string {
  const siteUrl = config.siteUrl;
  const fullUrl = `${siteUrl}${url}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: fullUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((node, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}${getPathFromId(node.id, node)}`,
        name: node.title,
      })),
    },
  };

  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

export function generateBreadcrumbSchema(breadcrumbs: { name: string; item: string }[]): string {
  const siteUrl = config.siteUrl;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((bc, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: bc.name,
      item: bc.item.startsWith('http') ? bc.item : `${siteUrl}${bc.item}`,
    })),
  };

  return JSON.stringify(schema).replace(/</g, '\\u003c');
}
