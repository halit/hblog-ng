import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Share_Tech_Mono } from 'next/font/google';
import './index.css';
import BugBountyNotice from '@/components/BugBountyNotice';
import AppLayout from '@/components/AppLayout';
import { config } from '@/config/env';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['100', '400', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-share-tech-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: `${config.siteTitle} | %s`,
    default: config.siteTitle,
  },
  description: config.siteDescription,
  applicationName: config.siteTitle,
  authors: [{ name: config.authorName }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#ff0055',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${jetbrainsMono.variable} ${shareTechMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Security Meta Tags that work in HTML */}
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        {/* CSP: frame-ancestors is removed here as it is ignored in meta tags */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://asciinema.org; style-src 'self' 'unsafe-inline' https://asciinema.org; font-src 'self' data:; img-src 'self' data: blob: https://asciinema.org; connect-src 'self' https://asciinema.org; frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com; child-src 'self' https://www.youtube.com https://player.vimeo.com; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
        />

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml" />
        <link rel="alternate" type="application/atom+xml" title="Atom Feed" href="/feed.atom" />
        <link rel="alternate" type="application/json" title="JSON Feed" href="/feed.json" />
      </head>
      <body className="bg-[#050505] text-[#e0e0e0] min-h-screen flex flex-col print:bg-white print:text-black">
        <div className="print:hidden">
          <BugBountyNotice />
        </div>
        <AppLayout>{children}</AppLayout>
        <div className="scanline print:hidden"></div>
      </body>
    </html>
  );
}
