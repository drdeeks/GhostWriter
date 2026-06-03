import { createPublicClient, createWalletClient, createTestClient, type HttpTransport, type WebSocketTransport, type RpcRequestHandler, type RpcSchema, type RpcRequest, type RpcResponse, type PublicRpcSchema } from 'viem';
import { MockPublicClient, MockWalletClient, MockTestClient, MockClientConfig } from './types';
import { createMockPublicClient, createMockWalletClient, createMockTestClient } from './utils';
import { http, webSocket } from './transports';

// Client factory functions
export const createMockPublicClient = (config?: MockClientConfig): MockPublicClient => {
  const mockClient = createMockPublicClient();
  return {
    ...mockClient,
    chain: config?.chain,
    transport: config?.transport || http(),
    pollingInterval: config?.pollingInterval || 4000,
  };
};

export const createMockWalletClient = (config?: MockClientConfig): MockWalletClient => {
  const mockClient = createMockWalletClient();
  return {
    ...mockClient,
    chain: config?.chain,
    transport: config?.transport || http(),
    account: config?.account,
    pollingInterval: config?.pollingInterval || 4000,
  };
};

export const createMockTestClient = (config?: MockClientConfig): MockTestClient => {
  const mockClient = createMockTestClient();
  return {
    ...mockClient,
    chain: config?.chain,
    transport: config?.transport || http(),
    pollingInterval: config?.pollingInterval || 4000,
  };
};
