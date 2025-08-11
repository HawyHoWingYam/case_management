import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizeCss: false, // Disable CSS optimization that might conflict with fonts
  },
  // Enable standalone output for Docker
  output: 'standalone',
  webpack: (config, { dev, isServer }) => {
    // Fallback for font loading issues
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
