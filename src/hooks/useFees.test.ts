import { renderHook } from '@testing-library/react';
import { useFees } from '@/hooks/useFees';
import { FEES } from '@/lib/contracts';

jest.mock('wagmi', () => ({
  useChainId: jest.fn(() => 8453),
  useReadContract: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));

describe('useFees', () => {
  it('should return fallback fees when contract data unavailable', () => {
    const { result } = renderHook(() => useFees());
    expect(result.current.contributionFee).toBe(FEES.contribution);
    expect(result.current.creationFee).toBe(FEES.creation);
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useFees());
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should return error state', () => {
    const { result } = renderHook(() => useFees());
    expect(typeof result.current.isError).toBe('boolean');
  });

  it('should use contract data when available', () => {
    const { useReadContract } = require('wagmi');
    useReadContract.mockImplementation(({ functionName }: any) => {
      if (functionName === 'getContributionFee') {
        return { data: BigInt('100000000000000'), isLoading: false, isError: false };
      }
      if (functionName === 'getCreationFee') {
        return { data: BigInt('200000000000000'), isLoading: false, isError: false };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    const { result } = renderHook(() => useFees());
    expect(result.current.contributionFee).toBe(BigInt('100000000000000'));
    expect(result.current.creationFee).toBe(BigInt('200000000000000'));
  });
});
