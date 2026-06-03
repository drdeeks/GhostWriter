import { CONTRACTS, FEES } from './contracts';

describe('Contracts config', () => {
  describe('CONTRACTS', () => {
    it('should have all contract address fields', () => {
      expect(CONTRACTS).toHaveProperty('nft');
      expect(CONTRACTS).toHaveProperty('storyManager');
      expect(CONTRACTS).toHaveProperty('liquidityPool');
      expect(CONTRACTS).toHaveProperty('priceOracle');
      expect(CONTRACTS).toHaveProperty('token');
    });

    it('should default to zero address when env vars not set', () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      expect(CONTRACTS.nft).toBe(zeroAddress);
      expect(CONTRACTS.storyManager).toBe(zeroAddress);
      expect(CONTRACTS.liquidityPool).toBe(zeroAddress);
      expect(CONTRACTS.priceOracle).toBe(zeroAddress);
      expect(CONTRACTS.token).toBe(zeroAddress);
    });

    it('should have valid hex address format', () => {
      Object.values(CONTRACTS).forEach((addr) => {
        expect(addr).toMatch(/^0x[0-9a-f]{40}$/);
      });
    });
  });

  describe('FEES', () => {
    it('should have contribution and creation fee fallbacks', () => {
      expect(FEES).toHaveProperty('contribution');
      expect(FEES).toHaveProperty('creation');
    });

    it('should have contribution fee as 0.00005 ETH', () => {
      expect(FEES.contribution).toBe(BigInt('50000000000000'));
    });

    it('should have creation fee as 0.0001 ETH', () => {
      expect(FEES.creation).toBe(BigInt('100000000000000'));
    });
  });
});

describe('areContractsDeployed', () => {
  it('should be a function', () => {
    const { areContractsDeployed } = require('./contracts');
    expect(typeof areContractsDeployed).toBe('function');
  });
});
