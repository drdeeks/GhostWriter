/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  allowedDevOrigins: ['192.168.0.168'],

  webpack: (config, { isServer }) => {
    // Handle optional dependencies that are not needed in web environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    // Explicitly mirror the @ alias from tsconfig.json for Webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },

  // Add Turbopack-specific alias configuration
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
        '@/*': './src/*',
      },
    },
  },
};

module.exports = nextConfig;
