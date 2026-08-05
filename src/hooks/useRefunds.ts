'use client';

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { STORY_MANAGER_ABI, getContractsForChain } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useState } from 'react';

export function useRefunds() {
  const { address } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: pendingRefund, refetch } = useReadContract({
    address: contracts.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'pendingRefunds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const withdrawRefund = async () => {
    if (!pendingRefund || pendingRefund === 0n) {
      setError('No refund available');
      return;
    }
    
    try {
      setError(null);
      await writeContractAsync({
        address: contracts.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'withdrawRefund',
      });
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    pendingRefund: pendingRefund || 0n,
    pendingRefundFormatted: pendingRefund ? formatEther(pendingRefund) : '0',
    withdrawRefund,
    isPending: isPending || isConfirming,
    error,
    refetch,
  };
}
