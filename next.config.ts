import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const isTurbopack = process.env.TURBOPACK === '1';

const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  outputFileTracingRoot: process.cwd(),
};



const nextConfig: NextConfig = !isTurbopack
  ? withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(baseConfig)
  : baseConfig;

export default nextConfig;

