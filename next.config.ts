import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["ffmpeg-static"],
  experimental: {
    // Default proxy body buffer is 10MB; hero compress posts up to ~250MB.
    proxyClientMaxBodySize: "250mb",
    serverActions: {
      bodySizeLimit: "250mb",
    },
  },
  images: {
    // ProductImage uses quality={70}; Next defaults to [75] only.
    qualities: [70, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/product-images/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/landing-media/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/chat-media/**",
      },
    ],
  },
};

export default nextConfig;
