export const useReadContract = jest.fn().mockReturnValue({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
});
export const useWriteContract = jest.fn().mockReturnValue({
  writeContractAsync: jest.fn(),
  writeContract: jest.fn(),
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
});
export const useWaitForTransactionReceipt = jest.fn().mockReturnValue({
  data: undefined,
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
});
export const useAccount = jest.fn();
export const useConnect = jest.fn();
export const useDisconnect = jest.fn();
export const useConfig = jest.fn();
export const useChainId = jest.fn();
export const useSwitchChain = jest.fn();
export const useBlockNumber = jest.fn();
export const useEstimateGas = jest.fn();
export const useSendTransaction = jest.fn();
export const useWatchContractEvent = jest.fn();