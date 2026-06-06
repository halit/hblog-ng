import { MetadataRoute } from 'next';
import { loadVaultData } from '@/lib/vault';

export const dynamic = 'force-static';
import { getPathFromId } from '@/lib/routing';
import { config } from '@/config/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const vaultData = loadVaultData();
  const siteUrl = config.siteUrl.replace(/\/$/, '');

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/posts/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/projects/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/research/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Content Pages from Vault
  const publicPages = vaultData.filter(
    (node) =>
      node.type !== 'system' &&
      node.id !== 'root' &&
      node.id !== 'home' &&
      !node.exclude_from_graph,
  );

  const contentRoutes: MetadataRoute.Sitemap = publicPages.map((node) => {
    const path = getPathFromId(node.id, node);
    let priority = 0.5;
    let changeFrequency: 'monthly' | 'weekly' | 'daily' | 'always' | 'hourly' | 'yearly' | 'never' =
      'monthly';

    if (node.type === 'blog') {
      priority = 0.8;
      changeFrequency = 'monthly';
    } else if (node.type === 'project') {
      priority = 0.8;
      changeFrequency = 'weekly';
    } else if (node.type === 'research') {
      priority = 0.7;
      changeFrequency = 'monthly';
    } else if (node.type === 'profile' || node.id === 'about') {
      priority = 0.8;
      changeFrequency = 'monthly';
    }

    return {
      url: `${siteUrl}${path.endsWith('/') ? path : `${path}/`}`,
      lastModified: node.updated ? new Date(node.updated) : new Date(),
      changeFrequency,
      priority,
    };
  });

  // Keywords
  const allKeywords = new Set<string>();
  publicPages.forEach((node) => {
    const keywords = (node.keywords || node.stack || []) as string[];
    keywords.forEach((keyword) => {
      allKeywords.add(keyword.toLowerCase());
    });
  });

  const keywordRoutes: MetadataRoute.Sitemap = Array.from(allKeywords).map((keyword) => ({
    url: `${siteUrl}/keywords/${encodeURIComponent(keyword)}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...routes, ...contentRoutes, ...keywordRoutes];
}
