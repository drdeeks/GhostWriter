jest.mock('@coinbase/onchainkit', () => ({
  setOnchainKitConfig: jest.fn(),
}));

jest.mock('@coinbase/onchainkit/api', () => ({
  buildMintTransaction: jest.fn(),
  buildPayTransaction: jest.fn(),
  buildSwapTransaction: jest.fn(),
  getMintDetails: jest.fn(),
  getPortfolios: jest.fn(),
  getPriceQuote: jest.fn(),
  getSwapQuote: jest.fn(),
  getTokenDetails: jest.fn(),
  getTokens: jest.fn(),
}));

jest.mock('@coinbase/onchainkit/swap', () => ({}));
jest.mock('@coinbase/onchainkit/token', () => ({}));

import {
  buildSendTransaction,
  isApiError,
  unwrapOnchainKitResponse,
  ONCHAINKIT_API_CONFIG,
  ONCHAINKIT_API_HEADERS,
} from './api';

describe('OnchainKit API types and utilities', () => {
  describe('ONCHAINKIT_API_CONFIG', () => {
    it('should have apiKey property', () => {
      expect(ONCHAINKIT_API_CONFIG).toHaveProperty('apiKey');
    });

    it('should have projectId property', () => {
      expect(ONCHAINKIT_API_CONFIG).toHaveProperty('projectId');
    });

    it('should be frozen', () => {
      expect(Object.isFrozen(ONCHAINKIT_API_CONFIG)).toBe(true);
    });
  });

  describe('ONCHAINKIT_API_HEADERS', () => {
    it('should have cb-api-key property', () => {
      expect(ONCHAINKIT_API_HEADERS).toHaveProperty('cb-api-key');
    });

    it('should have cb-project-id property', () => {
      expect(ONCHAINKIT_API_HEADERS).toHaveProperty('cb-project-id');
    });

    it('should be frozen', () => {
      expect(Object.isFrozen(ONCHAINKIT_API_HEADERS)).toBe(true);
    });
  });

  describe('buildSendTransaction', () => {
    it('should build native ETH transfer', () => {
      const result = buildSendTransaction({
        recipientAddress: '0x1234567890123456789012345678901234567890',
        tokenAddress: null,
        amount: BigInt('1000000000000000000'),
      });

      expect(result).toHaveProperty('to');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('value');
      expect((result as any).to).toBe('0x1234567890123456789012345678901234567890');
      expect((result as any).data).toBe('0x');
      expect((result as any).value).toBe(BigInt('1000000000000000000'));
    });

    it('should build ERC20 transfer with any token address string', () => {
      const result = buildSendTransaction({
        recipientAddress: '0x1234567890123456789012345678901234567890',
        tokenAddress: '0x0987654321098765432109876543210987654321',
        amount: BigInt('500000000000000000'),
      });

      expect(result).toHaveProperty('to');
      expect(result).toHaveProperty('data');
      expect((result as any).to).toBe('0x0987654321098765432109876543210987654321');
      expect((result as any).data).toMatch(/^0x/);
      expect((result as any).value).toBeUndefined();
    });

    it('should encode transfer data for any non-null token address', () => {
      const result = buildSendTransaction({
        recipientAddress: '0x1234567890123456789012345678901234567890',
        tokenAddress: '0x0987654321098765432109876543210987654321' as any,
        amount: BigInt('100'),
      });

      expect(result).toHaveProperty('to');
      expect(result).toHaveProperty('data');
      expect((result as any).data).toMatch(/^0x/);
    });
  });

  describe('isApiError', () => {
    it('should return true for API error objects', () => {
      expect(isApiError({ error: 'Something went wrong' })).toBe(true);
    });

    it('should return false for successful responses', () => {
      expect(isApiError({ data: 'success' })).toBe(false);
    });

    it('should return false for null', () => {
      expect(isApiError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isApiError('error')).toBe(false);
      expect(isApiError(123)).toBe(false);
    });
  });

  describe('unwrapOnchainKitResponse', () => {
    it('should return data for successful responses', () => {
      const data = { value: 42 };
      expect(unwrapOnchainKitResponse(data)).toBe(data);
    });

    it('should throw for API errors', () => {
      expect(() =>
        unwrapOnchainKitResponse({ error: 'Failed', message: 'Details' })
      ).toThrow('Failed');
    });

    it('should return response when only message is present (not an API error)', () => {
      const result = unwrapOnchainKitResponse({ message: 'Fallback message' });
      expect(result).toEqual({ message: 'Fallback message' });
    });

    it('should return response when only code is present (not an API error)', () => {
      const result = unwrapOnchainKitResponse({ code: '001' });
      expect(result).toEqual({ code: '001' });
    });
  });
});
