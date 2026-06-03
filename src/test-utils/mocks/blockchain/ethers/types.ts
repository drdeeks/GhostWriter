import { JsonRpcProvider, Wallet, Contract, ContractInterface, EventFilter, ContractTransaction, ContractTransactionResponse, ContractEventPayload, EventEmitterable, Listener } from 'ethers';

// Event types
export type Event = string | EventFilter | ContractEventPayload;

export interface TypedContractEvent<InputTuple extends any[], OutputTuple extends any[], OutputObject> {
  (...args: [...InputTuple, Listener<OutputTuple, OutputObject>]): void;
  name: string;
  fragment: any;
}

// Mock provider types
export type MockJsonRpcProvider = JsonRpcProvider & {
  setBlockNumber: (blockNumber: number) => void;
  setBalance: (address: string, balance: bigint) => void;
  setCode: (address: string, code: string) => void;
  setStorageAt: (address: string, slot: string, value: string) => void;
  getLogs: (filter: EventFilter) => Promise<any[]>;
  reset: () => void;
};

export type MockWallet = Wallet & {
  signMessage: (message: string | Uint8Array) => Promise<string>;
  signTransaction: (transaction: any) => Promise<string>;
  sendTransaction: (transaction: any) => Promise<any>;
  reset: () => void;
};

export type MockContract = Contract & EventEmitterable & {
  [method: string]: (...args: any[]) => Promise<any>;
  
  // Event emitter methods
  on: {
    (event: Event, listener: Listener): MockContract;
    (event: "error", listener: (error: Error) => void): MockContract;
    <InputTuple extends any[], OutputTuple extends any[], OutputObject>(
      event: TypedContractEvent<InputTuple, OutputTuple, OutputObject>,
      listener: Listener<OutputTuple, OutputObject>
    ): MockContract;
  };
  
  once: {
    (event: Event, listener: Listener): MockContract;
    (event: "error", listener: (error: Error) => void): MockContract;
    <InputTuple extends any[], OutputTuple extends any[], OutputObject>(
      event: TypedContractEvent<InputTuple, OutputTuple, OutputObject>,
      listener: Listener<OutputTuple, OutputObject>
    ): MockContract;
  };
  
  off: {
    (event: Event, listener: Listener): MockContract;
    (event: "error", listener: (error: Error) => void): MockContract;
    <InputTuple extends any[], OutputTuple extends any[], OutputObject>(
      event: TypedContractEvent<InputTuple, OutputTuple, OutputObject>,
      listener: Listener<OutputTuple, OutputObject>
    ): MockContract;
  };
  
  removeListener: {
    (event: Event, listener: Listener): MockContract;
    (event: "error", listener: (error: Error) => void): MockContract;
    <InputTuple extends any[], OutputTuple extends any[], OutputObject>(
      event: TypedContractEvent<InputTuple, OutputTuple, OutputObject>,
      listener: Listener<OutputTuple, OutputObject>
    ): MockContract;
  };
  
  // Event query methods
  queryFilter: <InputTuple extends any[], OutputTuple extends any[], OutputObject>(
    event: TypedContractEvent<InputTuple, OutputTuple, OutputObject>,
    fromBlock?: number | string,
    toBlock?: number | string
  ) => Promise<Array<ContractEventPayload>>;
  
  // Mock control methods
  emit: (eventName: string, ...args: any[]) => void;
  getEvents: (eventName: string) => any[];
  reset: () => void;
  
  // Contract properties
  address: string;
  provider: MockJsonRpcProvider;
  interface: ContractInterface;
  _isContract: true;
};

export type MockEthersConfig = {
  chainId?: number;
  pollingInterval?: number;
};
