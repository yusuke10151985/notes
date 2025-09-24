import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    serverActions: { allowedOrigins: ["*"] }
  },
  // For monorepo-unsafe root detection
  outputFileTracingRoot: process.cwd()
};

export default nextConfig;
