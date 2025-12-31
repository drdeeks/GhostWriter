
import { useReadContract } from 'wagmi';
import { StoryManagerABI } from '@/lib/contracts';
import { STORY_MANAGER_ADDRESS } from '@/lib/config';

export function useActiveStoriesCount() {
  const { data: activeStories, isLoading, isError } = useReadContract({
    address: STORY_MANAGER_ADDRESS,
    abi: StoryManagerABI,
    functionName: 'getActiveStoriesCount',
  });

  return { activeStories: Number(activeStories), isLoading, isError };
}
