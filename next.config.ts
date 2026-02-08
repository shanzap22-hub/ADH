import type { NextConfig } from "next";

// 2026 Performance: Bundle Analyzer for optimization
// Usage: ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'idlvnncaqmiixwnyleci.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'adh-connect.b-cdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.bunnycdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['pdf-parse'],
  typescript: {
    // TODO: Fix params Promise migration in 68 API routes (Next.js 15+)
    // Requires: { params }: { params: Promise<{ id: string }> }
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase from default 1mb to support larger images
    },
  },

  // 2026 Performance Optimization: Aggressive Caching Strategy
  async headers() {
    return [
      // Static Assets - Cache for 1 year (immutable)
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|ico|woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API Routes - Cache with Stale-While-Revalidate
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      // Pages - Cache for 1 hour, serve stale for 24 hours
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
