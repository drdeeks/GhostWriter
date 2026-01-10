/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your custom dev origins
  allowedDevOrigins: ['192.168.0.168'],

  // Production best practices
  poweredByHeader: false,
  reactStrictMode: true,

  // Modern image optimization (replaces deprecated domains)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'gateway.ipfs.io' },
      { protocol: 'https', hostname: 'nft.storage' },
      // Add any other hosts used for NFTs/metadata
    ],
  },

  // Transpile packages that sometimes need it
  transpilePackages: ['wagmi', 'viem'],

  // Webpack config (kept for alias & fallback support)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      'wagmi/experimental': require('path').resolve(__dirname, 'src/lib/wagmi-experimental-shim.ts'),
    };

    return config;
  },

  // Turbopack config – fixes extension resolution issues
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
};

module.exports = nextConfig;