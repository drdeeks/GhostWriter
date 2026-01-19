import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    rules: {
      // This rule is too aggressive for common UI patterns (e.g. loading spinners)
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: [
      '.vercel/**',
      'artifacts/**',
      'cache/**',
      'coverage/**',
      'typechain-types/**',
      'gas-report.txt',
      'deployment.json',
    ],
  },
];

export default config;
