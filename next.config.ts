import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: "export" to support dynamic routes
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
