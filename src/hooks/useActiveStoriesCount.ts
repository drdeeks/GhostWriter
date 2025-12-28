import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';
import { useReadContract } from 'wagmi';

/**
 * Hook for reading the number of active stories
 */
export function useActiveStoriesCount() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getActiveStoriesCount',
  });

  return {
    activeStories: data ? Number(data) : 0,
    isLoading,
    error,
    refetch,
  };
}
