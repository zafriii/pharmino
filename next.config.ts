import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    optimizePackageImports: ['react-icons'],
  },
  env: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimize images and static assets
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Bundle analyzer for debugging (optional)
  webpack: (config, { dev, isServer }) => {
    // Optimize react-icons imports
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-icons/ci': 'react-icons/ci/index.esm.js',
        'react-icons/bs': 'react-icons/bs/index.esm.js',
        'react-icons/lu': 'react-icons/lu/index.esm.js',
        'react-icons/ri': 'react-icons/ri/index.esm.js',
        'react-icons/gi': 'react-icons/gi/index.esm.js',
        'react-icons/md': 'react-icons/md/index.esm.js',
        'react-icons/fi': 'react-icons/fi/index.esm.js',
        'react-icons/hi': 'react-icons/hi/index.esm.js',
        'react-icons/go': 'react-icons/go/index.esm.js',
        'react-icons/tb': 'react-icons/tb/index.esm.js',
      };
    }
    return config;
  },
};

export default nextConfig;







