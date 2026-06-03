// Test data for blockchain mocks
export const TEST_ADDRESSES = {
  zero: '0x0000000000000000000000000000000000000000',
  one: '0x0000000000000000000000000000000000000001',
  two: '0x0000000000000000000000000000000000000002',
  contract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
} as const;

export const TEST_PRIVATE_KEYS = {
  one: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  two: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
} as const;

export const TEST_BLOCKS = {
  genesis: 0,
  first: 1,
  current: 1000000,
} as const;

export const TEST_BALANCES = {
  zero: 0n,
  small: 1000000000000000000n, // 1 ETH
  large: 1000000000000000000000n, // 1000 ETH
} as const;
