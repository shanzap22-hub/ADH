import type { NextConfig } from "next"; // Restart trigger
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// 2026 Performance: Bundle Analyzer for optimization
// Usage: ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  turbopack: {},
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
      {
        protocol: 'https',
        hostname: 'media.adh.today',
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
      bodySizeLimit: '100mb', // Increase from default 10mb to support larger files like audio/video
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
      // Chat API Routes - Force No-Cache (MUST come before general API rule)
      {
        source: '/api/chat/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      // General API Routes - Cache with Stale-While-Revalidate
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

export default withBundleAnalyzer(withSerwist(nextConfig));
