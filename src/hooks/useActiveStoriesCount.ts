import { useChainId, useReadContract } from 'wagmi';
import { STORY_MANAGER_ABI, getContractsForChain } from '@/lib/contracts';

export function useActiveStoriesCount() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { data: activeStories, isLoading, isError } = useReadContract({
    address: contracts.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getActiveStoriesCount',
  });

  return {
    activeStories: Number(activeStories) || 0,
    isLoading,
    isError
  };
}
