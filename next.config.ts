import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // No `remotePatterns`: media URLs are same-origin relative paths
    // (`/api/files/...`, proxied to PocketBase by middleware rule #2), so the
    // optimizer needs no allowlist. The previous entry was dead anyway — it
    // declared `port: ''` while PocketBase listens on 8090.
    formats: ['image/avif', 'image/webp'],
    // PocketBase file URLs embed the record id and filename, so a changed image
    // is a changed URL. Caching an optimised variant for a year is safe, and it
    // keeps `sharp` off the CPU on a VPS shared by many instances.
    minimumCacheTTL: 31536000,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

};

export default nextConfig;
