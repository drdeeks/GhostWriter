const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false, // Disable to reduce memory usage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nftstorage.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Webpack (not Turbopack) is selected via the --webpack build/dev flag.
  // Sentry is configured via src/lib/sentry.ts
};

module.exports = nextConfig;
