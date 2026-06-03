import { Contract, ContractInterface, Interface, EventEmitter, ContractTransactionResponse } from 'ethers';
import { MockContract } from './types';

// Contract mock factory
export const createMockContract = (address: string, abi: ContractInterface, provider?: any): MockContract => {
  const emitter = new EventEmitter();
  const state = {
    events: new Map<string, any[]>(),
    callbacks: new Map<string, ((...args: any[]) => void)[]>(),
  };

  // Generate mock methods for all ABI functions
  const functions: Record<string, (...args: any[]) => Promise<any>> = {};
  const populateFunctions = (abi: any[]) => {
    abi.forEach(item => {
      if (item.type === 'function') {
        const functionName = item.name;
        const defaultReturn = getDefaultReturnValue(item.outputs?.[0]?.type);

        functions[functionName] = async (...args: any[]) => {
          return typeof defaultReturn === 'function' ? defaultReturn() : defaultReturn;
        };
      }
    });
  };

  if (Array.isArray(abi)) {
    populateFunctions(abi);
  } else if (abi instanceof Interface) {
    populateFunctions(abi.fragments);
  }

  // Event emitter methods
  const eventEmitterMethods = {
    on: ((event: any, listener: any) => {
      const eventName = typeof event === 'string' ? event : event.fragment.name;
      emitter.on(eventName, listener);
      return contract;
    }) as any,
    
    once: ((event: any, listener: any) => {
      const eventName = typeof event === 'string' ? event : event.fragment.name;
      emitter.once(eventName, listener);
      return contract;
    }) as any,
    
    off: ((event: any, listener: any) => {
      const eventName = typeof event === 'string' ? event : event.fragment.name;
      emitter.off(eventName, listener);
      return contract;
    }) as any,
    
    removeListener: ((event: any, listener: any) => {
      const eventName = typeof event === 'string' ? event : event.fragment.name;
      emitter.removeListener(eventName, listener);
      return contract;
    }) as any,
    
    queryFilter: async (event: any, fromBlock?: number | string, toBlock?: number | string) => {
      const eventName = typeof event === 'string' ? event : event.fragment.name;
      return state.events.get(eventName) || [];
    },
  };
  
  // Mock control methods
  const mockMethods = {
    emit: (eventName: string, ...args: any[]) => {
      if (!state.events.has(eventName)) {
        state.events.set(eventName, []);
      }
      state.events.get(eventName)!.push(args);
      emitter.emit(eventName, ...args);
    },
    
    getEvents: (eventName: string) => {
      return state.events.get(eventName) || [];
    },
    
    reset: () => {
      state.events.clear();
      state.callbacks.clear();
      emitter.removeAllListeners();
    },
  };
  
  // Contract properties
  const contractProperties = {
    address,
    provider,
    interface: abi instanceof Interface ? abi : new Interface(abi),
    _isContract: true as const,
  };
  
  const contract = {
    ...functions,
    ...eventEmitterMethods,
    ...mockMethods,
    ...contractProperties,
  };
  
  return contract as unknown as MockContract;
};

// Helper function to generate default return values
const getDefaultReturnValue = (type?: string): any => {
  if (!type) return null;
  
  if (type.startsWith('uint') || type.startsWith('int')) return 0n;
  if (type === 'bool') return false;
  if (type === 'string') return '';
  if (type === 'address') return '0x0000000000000000000000000000000000000000';
  if (type === 'bytes') return '0x';
  if (type.endsWith('[]')) return [];
  
  return null;
};

// Ethers Interface (simplified for mocking)
class Interface {
  fragments: any[];
  
  constructor(abi: any[]) {
    this.fragments = abi;
  }
}
