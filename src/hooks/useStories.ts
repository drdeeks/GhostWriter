import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';
import type { Story, StoryType } from '@/types/ghostwriter';
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
  const stories = results
    .map((r) => r.data)
    .filter(Boolean)
    .map((story) => mapContractStory(story)) as Story[];
  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;
  const refetchAll = () => results.forEach((r) => r.refetch && r.refetch());

  return { stories, isLoading, error, refetchAll };
}

// Normalize contract tuple into frontend Story shape
function mapContractStory(contractStory: any): Story {
  const storyType = mapStoryType(contractStory?.storyType);
  const createdAt = normalizeTimestamp(contractStory?.createdAt);
  const completedAt = normalizeTimestamp(contractStory?.completedAt);
  const status = mapStoryStatus(contractStory?.status, completedAt);

  return {
    storyId: contractStory?.storyId ?? '',
    title: contractStory?.title ?? 'Untitled Story',
    template: contractStory?.template ?? '',
    storyType,
    category: 'random',
    totalSlots: Number(contractStory?.totalSlots ?? 0),
    filledSlots: Number(contractStory?.filledSlots ?? 0),
    slotDetails: [],
    creator: contractStory?.creator ?? '',
    createdAt: createdAt ?? '',
    completedAt,
    status,
    completionTimestamp: completedAt,
    shareCount: 0,
  };
}

function mapStoryType(value: number | bigint | undefined): StoryType {
  if (value === undefined || value === null) return 'normal';
  const numeric = typeof value === 'bigint' ? Number(value) : value;
  if (numeric === 1) return 'extended';
  if (numeric === 2) return 'dev';
  return 'normal';
}

function mapStoryStatus(value: number | bigint | undefined, completedAt: string | null) {
  if (value === undefined || value === null) return completedAt ? 'complete' : 'active';
  const numeric = typeof value === 'bigint' ? Number(value) : value;
  return numeric === 1 ? 'complete' : 'active';
}

function normalizeTimestamp(value: number | bigint | undefined): string | null {
  if (value === undefined || value === null) return null;
  const numeric = typeof value === 'bigint' ? Number(value) : value;
  if (numeric === 0) return null;
  return new Date(numeric * 1000).toISOString();
}
