const { TextEncoder, TextDecoder } = require('util');

const jestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup-tests.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/test-contracts/', '/tests/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^wagmi$': '<rootDir>/src/test-utils/mocks/wagmi.ts',
    '^@wagmi/core$': '<rootDir>/src/test-utils/mocks/wagmi.ts',
    '^viem$': '<rootDir>/src/test-utils/mocks/viem.ts',
    '^viem/chains$': '<rootDir>/src/test-utils/mocks/viem-chains.ts',
    '^@coinbase/onchainkit$': '<rootDir>/src/test-utils/mocks/onchainkit.ts',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!wagmi|@wagmi|viem|@coinbase|@farcaster)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      plugins: [['@babel/plugin-transform-modules-commonjs', { loose: true }]]
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test-utils/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  globals: {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
    Request: class {},
    Response: class {},
    fetch: global.fetch,
  },
};

module.exports = jestConfig;