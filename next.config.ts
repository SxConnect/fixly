import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.neon.tech' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.' },
    ],
  },
  // Vercel optimizations
  poweredByHeader: false,
  compress: true,
  // Prisma
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

export default nextConfig
