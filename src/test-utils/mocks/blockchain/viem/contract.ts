import { Abi, Address, Hex } from 'viem';
import { MockContract } from './types';

// Contract mock factory
export const createMockContract = <TAbi extends Abi>(address: Address, abi: TAbi): MockContract<TAbi> => {
  const state = {
    events: new Map<string, any[]>(),
    callbacks: new Map<string, ((...args: any[]) => void)[]>(),
  };

  // Generate mock methods for all ABI functions
  const read: Record<string, (...args: any[]) => Promise<any>> = {};
  const write: Record<string, (...args: any[]) => Promise<Hex>> = {};
  const simulate: Record<string, (...args: any[]) => Promise<{ request: any }>> = {};

  abi.forEach(item => {
    if (item.type === 'function') {
      const functionName = item.name;
      const defaultReturn = getDefaultReturnValue(item.outputs?.[0]?.type);

      read[functionName] = async (...args: any[]) => {
        return typeof defaultReturn === 'function' ? defaultReturn() : defaultReturn;
      };

      write[functionName] = async (...args: any[]) => {
        return `0xmock-tx-hash-${Math.random().toString(36).substring(2)}` as Hex;
      };

      simulate[functionName] = async (...args: any[]) => ({
        request: { args, functionName, address },
      });
    }
  });

  return {
    read,
    write,
    simulate,
    on: (eventName, callback) => {
      if (!state.callbacks.has(eventName)) {
        state.callbacks.set(eventName, []);
      }
      state.callbacks.get(eventName)!.push(callback);
    },
    off: (eventName, callback) => {
      if (state.callbacks.has(eventName)) {
        const callbacks = state.callbacks.get(eventName)!;
        state.callbacks.set(eventName, callbacks.filter(cb => cb !== callback));
      }
    },
    getEvents: (eventName) => {
      return state.events.get(eventName) || [];
    },
    emit: (eventName: string, ...args: any[]) => {
      if (!state.events.has(eventName)) {
        state.events.set(eventName, []);
      }
      state.events.get(eventName)!.push(args);

      if (state.callbacks.has(eventName)) {
        state.callbacks.get(eventName)!.forEach(callback => callback(...args));
      }
    },
    reset: () => {
      state.events.clear();
      state.callbacks.clear();
    },
  };
};

// Helper function to generate default return values
export const getDefaultReturnValue = (type?: string): any => {
  if (!type) return null;
  
  if (type.startsWith('uint') || type.startsWith('int')) return 0n;
  if (type === 'bool') return false;
  if (type === 'string') return '';
  if (type === 'address') return '0x0000000000000000000000000000000000000000';
  if (type === 'bytes') return '0x';
  if (type.endsWith('[]')) return [];
  
  return null;
};
