import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';
import { useReadContract } from 'wagmi';

export function useStories(storyIds: string[] | undefined) {
  // Fetch all stories in parallel
  const results = (storyIds || []).map((id) =>
    useReadContract({
      address: CONTRACTS.storyManager,
      abi: STORY_MANAGER_ABI,
      functionName: 'getStory',
      args: [id],
      query: { enabled: !!id },
    })
  );

  // Map to story objects and loading/error states
  const stories = results.map((r) => r.data);
  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;
  const refetchAll = () => results.forEach((r) => r.refetch && r.refetch());

  return { stories, isLoading, error, refetchAll };
}
