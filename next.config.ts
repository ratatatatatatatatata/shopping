import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Admin/dynamic pages: never reuse client-side router cache
  experimental: {
    staleTimes: { dynamic: 0, static: 180 },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
