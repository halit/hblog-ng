import { readFileSync } from 'fs';
import bundleAnalyzer from '@next/bundle-analyzer';

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const version = packageJson.version || '0.0.0';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static site generation (no server runtime)
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || version,
  },
};

export default withBundleAnalyzer(nextConfig);
