const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore ESLint during builds (lint separately)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds (pre-existing issues)
    ignoreBuildErrors: true,
  },
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
