import { renderHook, act } from '@testing-library/react';
import { useRefunds } from './useRefunds';

const mockRefetch = jest.fn();
const mockWriteContractAsync = jest.fn();

jest.mock('wagmi', () => ({
  useChainId: jest.fn(() => 8453),
  useAccount: jest.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
  useReadContract: jest.fn(() => ({
    data: undefined,
    refetch: mockRefetch,
  })),
  useWriteContract: jest.fn(() => ({
    writeContractAsync: mockWriteContractAsync,
    data: undefined,
    isPending: false,
  })),
  useWaitForTransactionReceipt: jest.fn(() => ({
    isLoading: false,
  })),
}));

describe('useRefunds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useReadContract, useWriteContract } = require('wagmi');
    useReadContract.mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
    });
    useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      data: undefined,
      isPending: false,
    });
  });

  it('should return pendingRefund as 0n when no data', () => {
    const { result } = renderHook(() => useRefunds());
    expect(result.current.pendingRefund).toBe(0n);
  });

  it('should return formatted pendingRefund', () => {
    const { result } = renderHook(() => useRefunds());
    expect(typeof result.current.pendingRefundFormatted).toBe('string');
  });

  it('should return withdrawRefund function', () => {
    const { result } = renderHook(() => useRefunds());
    expect(typeof result.current.withdrawRefund).toBe('function');
  });

  it('should return isPending state', () => {
    const { result } = renderHook(() => useRefunds());
    expect(typeof result.current.isPending).toBe('boolean');
  });

  it('should return error state', () => {
    const { result } = renderHook(() => useRefunds());
    expect(result.current.error).toBeNull();
  });

  it('should return refetch function', () => {
    const { result } = renderHook(() => useRefunds());
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should set error when withdrawing with no refund', async () => {
    const { result } = renderHook(() => useRefunds());
    await act(async () => {
      await result.current.withdrawRefund();
    });
    expect(result.current.error).toBe('No refund available');
  });

  it('should call writeContractAsync when refund available', async () => {
    const { useReadContract, useWriteContract } = require('wagmi');
    useReadContract.mockReturnValue({
      data: BigInt('100000000000000'),
      refetch: mockRefetch,
    });
    useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync.mockResolvedValue('0xtxhash'),
      data: undefined,
      isPending: false,
    });

    const { result } = renderHook(() => useRefunds());
    await act(async () => {
      await result.current.withdrawRefund();
    });
    expect(mockWriteContractAsync).toHaveBeenCalled();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should set error when writeContractAsync fails', async () => {
    const { useReadContract, useWriteContract } = require('wagmi');
    useReadContract.mockReturnValue({
      data: BigInt('100000000000000'),
      refetch: mockRefetch,
    });
    useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync.mockRejectedValue(new Error('Transaction failed')),
      data: undefined,
      isPending: false,
    });

    const { result } = renderHook(() => useRefunds());
    await act(async () => {
      await expect(result.current.withdrawRefund()).rejects.toThrow('Transaction failed');
    });
    expect(result.current.error).toBe('Transaction failed');
  });
});
