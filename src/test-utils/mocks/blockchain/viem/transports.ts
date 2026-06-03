import { type HttpTransport, type WebSocketTransport, type HttpTransportConfig, type WebSocketTransportConfig } from 'viem';

/**
 * Creates a mock HTTP transport for viem clients
 * @param url Optional RPC URL
 * @returns Configured HTTP transport
 */
export function http(url?: string): HttpTransport {
  const config: HttpTransportConfig = {};
  
  return {
    config,
    request: async () => null,
    value: {} as HttpTransport
  };
}

/**
 * Creates a mock WebSocket transport for viem clients
 * @param url Optional WebSocket URL
 * @returns Configured WebSocket transport
 */
export function webSocket(url?: string): WebSocketTransport {
  const config: WebSocketTransportConfig = {};
  
  return {
    config,
    request: async () => null,
    value: {} as WebSocketTransport
  };
}