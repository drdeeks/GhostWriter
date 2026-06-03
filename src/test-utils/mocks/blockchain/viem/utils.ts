import { Address, Hex, PublicClient, WalletClient, TestClient } from 'viem';
import { MockPublicClient, MockWalletClient, MockTestClient } from './types';

// Utility functions for viem mocks
export const createMockPublicClient = (): MockPublicClient => {
  const state = {
    blockNumber: 1n,
    balances: new Map<Address, bigint>(),
    codes: new Map<Address, Hex>(),
    storage: new Map<Address, Map<Hex, Hex>>(),
    logs: [] as any[],
  };

  return {
    // Chain methods
    getChainId: async () => 31337,
    getBlockNumber: async () => state.blockNumber,
    getBalance: async ({ address }) => state.balances.get(address) || 0n,
    getCode: async ({ address }) => state.codes.get(address) || '0x',
    getStorageAt: async ({ address, slot }) => state.storage.get(address)?.get(slot) || '0x00',
    call: async () => ({ data: '0x' }),
    estimateGas: async () => 21000n,
    getGasPrice: async () => 1n,
    getTransactionCount: async () => 0,
    getBlock: async () => ({
      number: state.blockNumber,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      transactions: [],
    }),
    getTransaction: async () => ({}),
    getTransactionReceipt: async () => ({ status: 'success' }),
    getLogs: async (filter) => state.logs.filter(log =>
      (!filter.address || log.address === filter.address) &&
      (!filter.event || log.eventName === filter.event.name)
    ),

    // Mock control methods
    setBlockNumber: (blockNumber) => { state.blockNumber = blockNumber; },
    setBalance: (address, balance) => { state.balances.set(address, balance); },
    setCode: (address, code) => { state.codes.set(address, code); },
    setStorageAt: (address, slot, value) => {
      if (!state.storage.has(address)) state.storage.set(address, new Map());
      state.storage.get(address)!.set(slot, value);
    },
    reset: () => {
      state.blockNumber = 1n;
      state.balances.clear();
      state.codes.clear();
      state.storage.clear();
      state.logs = [];
    },

    // Transport
    transport: { name: 'mock', request: async () => null },
    uid: 'mock-public-client',
    account: undefined,
    chain: undefined,
    pollingInterval: 4000,
  };
};

export const createMockWalletClient = (): MockWalletClient => {
  const state = {
    signedMessages: new Map<string, Hex>(),
    signedTypedData: new Map<string, Hex>(),
    transactions: new Map<Hex, any>(),
  };

  return {
    // Wallet methods
    signMessage: async ({ message }) => {
      const signature = `0xmock-signature-for-${message}` as Hex;
      state.signedMessages.set(message, signature);
      return signature;
    },
    signTypedData: async (args) => {
      const signature = `0xmock-typed-data-signature-for-${JSON.stringify(args)}` as Hex;
      state.signedTypedData.set(JSON.stringify(args), signature);
      return signature;
    },
    sendTransaction: async (args) => {
      const hash = `0xmock-tx-hash-${Math.random().toString(36).substring(2)}` as Hex;
      state.transactions.set(hash, args);
      return hash;
    },
    writeContract: async () => `0xmock-tx-hash-${Math.random().toString(36).substring(2)}` as Hex,
    deployContract: async () => `0xmock-contract-address-${Math.random().toString(36).substring(2)}` as Address,

    // Mock control methods
    reset: () => {
      state.signedMessages.clear();
      state.signedTypedData.clear();
      state.transactions.clear();
    },

    // Transport
    transport: {
      name: 'mock',
      config: { url: 'http://localhost:8545' },
      request: (async <TRpcSchema extends RpcSchema = PublicRpcSchema>(
        request: RpcRequest<TRpcSchema>
      ): Promise<RpcResponse<TRpcSchema>> => {
        return { id: 1, jsonrpc: '2.0', result: null } as RpcResponse<TRpcSchema>;
      }) as RpcRequestHandler,
      value: {} as HttpTransport
    },
    uid: 'mock-wallet-client',
    account: undefined,
    chain: undefined,
    pollingInterval: 4000,
  };
};

export const createMockTestClient = (): MockTestClient => {
  const state = {
    blockTimestamp: BigInt(Math.floor(Date.now() / 1000)),
    nextBlockBaseFee: 1n,
  };

  return {
    // Test methods
    setBlockTimestamp: (timestamp) => { state.blockTimestamp = timestamp; },
    setNextBlockBaseFee: (baseFee) => { state.nextBlockBaseFee = baseFee; },
    mine: async ({ blocks }) => {},
    snapshot: async () => '0x1',
    revert: async () => true,
    setAutomine: async () => {},
    getAutomine: async () => false,
    setIntervalMining: async () => {},
    getTxpoolContent: async () => ({}),
    dropTransaction: async () => {},
    reset: async () => {},
    setBalance: async () => {},
    setCode: async () => {},
    setNonce: async () => {},
    setStorageAt: async () => {},
    setCoinbase: async () => {},
    impersonateAccount: async () => {},
    stopImpersonatingAccount: async () => {},
    setMinGasPrice: async () => {},
    setNextBlockTimestamp: async () => {},
    getTxpoolStatus: async () => ({}),

    // Mock control methods
    setBlockTimestamp: (timestamp) => { state.blockTimestamp = timestamp; },
    setNextBlockBaseFee: (baseFee) => { state.nextBlockBaseFee = baseFee; },
    reset: () => {
      state.blockTimestamp = BigInt(Math.floor(Date.now() / 1000));
      state.nextBlockBaseFee = 1n;
    },

    // Transport
    transport: {
      name: 'mock',
      config: { url: 'http://localhost:8545' },
      request: (async <TRpcSchema extends RpcSchema = PublicRpcSchema>(
        request: RpcRequest<TRpcSchema>
      ): Promise<RpcResponse<TRpcSchema>> => {
        return { id: 1, jsonrpc: '2.0', result: null } as RpcResponse<TRpcSchema>;
      }) as RpcRequestHandler,
      value: {} as HttpTransport
    },
    uid: 'mock-test-client',
    mode: 'anvil',
    chain: undefined,
    pollingInterval: 4000,
  };
};
