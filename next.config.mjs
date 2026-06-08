import bundleAnalyzer from '@next/bundle-analyzer';

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
};

export default withBundleAnalyzer(nextConfig);
