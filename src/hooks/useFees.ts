import { useReadContract } from 'wagmi';
import { CONTRACTS, STORY_MANAGER_ABI, FEES } from '@/lib/contracts';
import { useEffect, useState } from 'react';

/**
 * Hook to get current contribution and creation fees in ETH
 * Fees are dynamic based on current ETH/USD price
 */
export function useFees() {
  const [retryCount, setRetryCount] = useState(0);

  const { data: contributionFee, isLoading: isLoadingContribution, isError: isErrorContribution } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getContributionFee',
  });

  const { data: creationFee, isLoading: isLoadingCreation, isError: isErrorCreation } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getCreationFee',
  });

  // Retry on error
  useEffect(() => {
    if ((isErrorContribution || isErrorCreation) && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isErrorContribution, isErrorCreation, retryCount]);

  return {
    contributionFee: contributionFee || FEES.contribution,
    creationFee: creationFee || FEES.creation,
    isLoading: isLoadingContribution || isLoadingCreation,
    isError: isErrorContribution || isErrorCreation,
  };
}
