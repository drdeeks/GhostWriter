import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';
import type { Story, StoryType } from '@/types/ghostwriter';
import { useReadContracts } from 'wagmi';

export function useStories(storyIds: string[] | undefined) {
  const ids = (storyIds || []).filter(Boolean);

  const contracts = ids.map((id) => ({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getStory' as const,
    args: [id] as const,
  }));

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  });

  const stories = (data || [])
    .map((r) => (r.status === 'success' ? (r.result as any) : null))
    .filter(Boolean)
    .map((story) => mapContractStory(story)) as Story[];

  return { stories, isLoading, error, refetchAll: refetch };
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
    category: mapStoryCategory(contractStory?.category),
    totalSlots: Number(contractStory?.totalSlots ?? 0),
    filledSlots: Number(contractStory?.filledSlots ?? 0),
    slotDetails: [],
    creator: contractStory?.creator ?? '',
    createdAt: createdAt ?? '',
    completedAt,
    status,
    completionTimestamp: completedAt,
    shareCount: Number(contractStory?.shareCount ?? 0),
  };
}

function mapStoryType(value: number | bigint | undefined): StoryType {
  if (value === undefined || value === null) return 'normal';
  const numeric = typeof value === 'bigint' ? Number(value) : value;
  if (numeric === 0) return 'mini';
  if (numeric === 1) return 'normal';
  if (numeric === 2) return 'epic';
  return 'normal';
}

function mapStoryStatus(value: number | bigint | undefined, completedAt: string | null) {
  if (value === undefined || value === null) return completedAt ? 'complete' : 'active';
  const numeric = typeof value === 'bigint' ? Number(value) : value;
  return numeric === 1 ? 'complete' : 'active';
}

function mapStoryCategory(value: number | bigint | undefined) {
  if (value === undefined || value === null) return 'random';
  const numeric = typeof value === 'bigint' ? Number(value) : value;

  const categories = [
    'adventure',
    'fantasy',
    'comedy',
    'mystery',
    'scifi',
    'horror',
    'romance',
    'crypto',
    'sports',
    'animals',
    'school',
    'superheroes',
    'friendship',
    'holidays',
    'food',
    'nature',
    'history',
    'random',
  ] as const;

  return categories[numeric] ?? 'random';
}

function normalizeTimestamp(value: number | bigint | undefined): string | null {
  if (value === undefined || value === null) return null;
  const numeric = typeof value === 'bigint' ? Number(value) : value;
  if (numeric === 0) return null;
  return new Date(numeric * 1000).toISOString();
}
