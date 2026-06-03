export const createPublicClient = jest.fn();
export const createWalletClient = jest.fn();
export const http = jest.fn();
export const fallback = jest.fn();
export const webSocket = jest.fn();
export const custom = jest.fn();
export const createTestClient = jest.fn();
export const publicActions = jest.fn();
export const walletActions = jest.fn();
export const testActions = jest.fn();
export const encodeFunctionData = jest.fn().mockImplementation(({ abi, functionName, args }) => {
  return `mock-encoded-data-for-${functionName}-${args?.join('-') || ''}`;
});
export const formatEther = jest.fn().mockImplementation((value) => {
  return typeof value === 'bigint' ? (Number(value) / 1e18).toString() : '0';
});
export const parseEther = jest.fn().mockImplementation((value) => {
  return BigInt(Number(value) * 1e18);
});
export const getContract = jest.fn();