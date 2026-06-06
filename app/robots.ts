import { MetadataRoute } from 'next';
import { config } from '@/config/env';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = config.siteUrl.replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/out/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
