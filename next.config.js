/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.0.168'],
  webpack: (config, { isServer }) => {
    // Handle optional dependencies that are not needed in web environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    return config;
  },
};

module.exports = nextConfig;
