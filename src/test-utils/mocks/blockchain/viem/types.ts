import { Chain, PublicClient, WalletClient, TestClient, Transport, Account, Address, Hex, HttpTransport, WebSocketTransport, HttpTransportConfig, WebSocketTransportConfig } from 'viem';
import { Abi, ExtractAbiFunctionNames } from 'abitype';

// Transport types
export type MockHttpTransport = HttpTransport & {
  config: HttpTransportConfig;
};

export type MockWebSocketTransport = WebSocketTransport & {
  config: WebSocketTransportConfig;
};

export type MockTransport = MockHttpTransport | MockWebSocketTransport;

// Mock client types
export type MockPublicClient = PublicClient & {
  setBlockNumber: (blockNumber: bigint) => void;
  setBalance: (address: Address, balance: bigint) => void;
  setCode: (address: Address, code: Hex) => void;
  setStorageAt: (address: Address, slot: Hex, value: Hex) => void;
  getLogs: (filter: { address?: Address; event: any; fromBlock?: bigint; toBlock?: bigint }) => any[];
  reset: () => void;
};

export type MockWalletClient = WalletClient & {
  signMessage: (args: { account: Account; message: string }) => Promise<Hex>;
  signTypedData: (args: any) => Promise<Hex>;
  sendTransaction: (args: any) => Promise<Hex>;
  reset: () => void;
};

export type MockTestClient = TestClient & {
  setBlockTimestamp: (timestamp: bigint) => void;
  setNextBlockBaseFee: (baseFee: bigint) => void;
  mine: (blocks: number) => void;
  reset: () => void;
};

export type MockContract<TAbi extends Abi = Abi> = {
  read: Record<ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>, (...args: any[]) => Promise<any>>;
  write: Record<ExtractAbiFunctionNames<TAbi, 'nonpayable' | 'payable'>, (...args: any[]) => Promise<Hex>>;
  simulate: Record<ExtractAbiFunctionNames<TAbi, 'nonpayable' | 'payable'>, (...args: any[]) => Promise<{ request: any }>>;
  on: <TEventName extends string>(eventName: TEventName, callback: (...args: any[]) => void) => void;
  off: <TEventName extends string>(eventName: TEventName, callback: (...args: any[]) => void) => void;
  getEvents: <TEventName extends string>(eventName: TEventName) => any[];
  reset: () => void;
};

export type MockClientConfig = {
  chain?: Chain;
  transport?: Transport;
  account?: Account;
  pollingInterval?: number;
};
