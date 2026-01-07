import { useReadContract } from 'wagmi';
import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';

export function useActiveStoriesCount() {
  const { data: activeStories, isLoading, isError } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getActiveStoriesCount',
  });

  return { 
    activeStories: Number(activeStories) || 0, 
    isLoading, 
    isError 
  };
}
