import { renderHook } from '@testing-library/react';
import { useActiveStoriesCount } from '@/hooks/useActiveStoriesCount';

jest.mock('wagmi', () => ({
  useChainId: jest.fn(() => 8453),
  useReadContract: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));

describe('useActiveStoriesCount', () => {
  it('should return 0 when no data available', () => {
    const { result } = renderHook(() => useActiveStoriesCount());
    expect(result.current.activeStories).toBe(0);
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useActiveStoriesCount());
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should return error state', () => {
    const { result } = renderHook(() => useActiveStoriesCount());
    expect(typeof result.current.isError).toBe('boolean');
  });

  it('should return active stories count when available', () => {
    const { useReadContract } = require('wagmi');
    useReadContract.mockReturnValue({
      data: BigInt(5),
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useActiveStoriesCount());
    expect(result.current.activeStories).toBe(5);
  });

  it('should handle null data gracefully', () => {
    const { useReadContract } = require('wagmi');
    useReadContract.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useActiveStoriesCount());
    expect(result.current.activeStories).toBe(0);
  });
});
