import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    // Windows dev builds intermittently fail to rename the webpack pack
    // cache file (ENOENT), corrupting the cache and dropping routes (404s)
    // until a full restart. In-memory caching in dev sidesteps that disk
    // write entirely (still faster than no cache at all).
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
