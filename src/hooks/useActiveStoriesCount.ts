import { useReadContract } from 'wagmi';
import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';

export function useActiveStoriesCount() {
  const { data: activeStories, isLoading, isError } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getActiveStoriesCount',
  });

  const { data: maxActiveStories } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'maxActiveStories',
  });

  return {
    activeStories: Number(activeStories) || 0,
    maxActiveStories: Number(maxActiveStories) || 15,
    isLoading,
    isError,
  };
}
