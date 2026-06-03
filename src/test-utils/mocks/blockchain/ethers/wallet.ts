import { Wallet } from 'ethers';
import { MockWallet } from './types';

// Wallet mock factory
export const createMockWallet = (privateKey?: string, provider?: any): MockWallet => {
  const state = {
    signedMessages: new Map<string, string>(),
    signedTransactions: new Map<string, string>(),
    sentTransactions: new Map<string, any>(),
  };

  return {
    // Wallet methods
    signMessage: async (message) => {
      const messageKey = typeof message === 'string' ? message : Buffer.from(message).toString();
      const signature = `0xmock-signature-for-${messageKey}`;
      state.signedMessages.set(messageKey, signature);
      return signature;
    },
    signTransaction: async (transaction) => {
      const txKey = JSON.stringify(transaction);
      const signature = `0xmock-tx-signature-for-${txKey}`;
      state.signedTransactions.set(txKey, signature);
      return signature;
    },
    sendTransaction: async (transaction) => {
      const txKey = JSON.stringify(transaction);
      const txHash = `0xmock-tx-hash-${Math.random().toString(36).substring(2)}`;
      state.sentTransactions.set(txHash, transaction);
      return { hash: txHash, wait: async () => ({}) };
    },

    // Mock control methods
    reset: () => {
      state.signedMessages.clear();
      state.signedTransactions.clear();
      state.sentTransactions.clear();
    },

    // Wallet properties
    address: '0x0000000000000000000000000000000000000001',
    provider,
    _isSigner: true,
  };
};
