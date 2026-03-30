import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const isTurbopack = process.env.TURBOPACK === '1';

const baseConfig: NextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com', 'randomuser.me'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

const nextConfig: NextConfig = !isTurbopack
  ? withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(baseConfig)
  : baseConfig;

export default nextConfig;
