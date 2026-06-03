import { JsonRpcProvider } from 'ethers';
import { MockJsonRpcProvider, MockEthersConfig } from './types';

// Provider mock factory
export const createMockProvider = (config?: MockEthersConfig): MockJsonRpcProvider => {
  const state = {
    blockNumber: 1,
    balances: new Map<string, bigint>(),
    codes: new Map<string, string>(),
    storage: new Map<string, Map<string, string>>(),
    logs: [] as any[],
  };

  return {
    // Provider methods
    getBlockNumber: async () => state.blockNumber,
    getBalance: async (address) => state.balances.get(address) || 0n,
    getCode: async (address) => state.codes.get(address) || '0x',
    getStorage: async (address, slot) => state.storage.get(address)?.get(slot) || '0x00',
    call: async () => '0x',
    estimateGas: async () => 21000n,
    getGasPrice: async () => 1n,
    getTransactionCount: async () => 0,
    getBlock: async () => ({
      number: state.blockNumber,
      timestamp: Math.floor(Date.now() / 1000),
      transactions: [],
    }),
    getTransaction: async () => null,
    getTransactionReceipt: async () => null,
    getLogs: async (filter) => state.logs.filter(log =>
      (!filter.address || log.address === filter.address) &&
      (!filter.topics || log.topics?.some((t: string, i: number) => !filter.topics?.[i] || t === filter.topics[i]))
    ),
    send: async () => '0x',
    waitForTransaction: async () => null,

    // Mock control methods
    setBlockNumber: (blockNumber) => { state.blockNumber = blockNumber; },
    setBalance: (address, balance) => { state.balances.set(address, balance); },
    setCode: (address, code) => { state.codes.set(address, code); },
    setStorageAt: (address, slot, value) => {
      if (!state.storage.has(address)) state.storage.set(address, new Map());
      state.storage.get(address)!.set(slot, value);
    },
    reset: () => {
      state.blockNumber = 1;
      state.balances.clear();
      state.codes.clear();
      state.storage.clear();
      state.logs = [];
    },

    // Connection
    _network: { chainId: config?.chainId || 31337 },
    _pollingInterval: config?.pollingInterval || 4000,
    _isProvider: true,
  };
};
