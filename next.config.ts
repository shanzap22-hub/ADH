import type { NextConfig } from "next";

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
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase from default 1mb to support larger images
    },
  },
};

export default nextConfig;
