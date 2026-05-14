require('@testing-library/jest-dom');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock viem/wagmi
jest.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123' }),
  useReadContract: () => ({ data: [], isLoading: false, error: null }),
  useWriteContract: () => ({ writeContract: jest.fn(), isLoading: false }),
  useWaitForTransactionReceipt: () => ({ isLoading: false }),
}));

// Mock window.ethereum
window.ethereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};