import { MetadataRoute } from 'next';
import { config } from '@/config/env';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.siteTitle,
    short_name: config.siteTitle,
    description: config.siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#ff0055',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
