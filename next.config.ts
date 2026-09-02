import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    // Windows dev builds intermittently fail to rename the webpack pack
    // cache file (ENOENT), corrupting the cache and dropping routes (404s)
    // until a full restart. Disabling the filesystem cache in dev avoids it.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
