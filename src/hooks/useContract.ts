import { CONTRACTS, FEES, NFT_ABI, STORY_MANAGER_ABI } from '@/lib/contracts';
import type { StoryType, UserStats as UserStatsType } from '@/types/ghostwriter';
import { useState } from 'react';
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useFees } from './useFees';

export function useStoryManager() {
  const [isPending, setIsPending] = useState<boolean>(false);
  const { writeContractAsync } = useWriteContract();
  const { contributionFee, creationFee, isLoading: isLoadingFees } = useFees();

  const createStoryApproved = async (
    storyId: string,
    title: string,
    template: string,
    storyType: StoryType,
    category: string,
    wordTypes: string[],
    expiresAt: bigint,
    signature: `0x${string}`
  ) => {
    setIsPending(true);
    try {
      let storyTypeEnum = 0;
      if (storyType === 'mini') storyTypeEnum = 0;
      else if (storyType === 'normal') storyTypeEnum = 1;
      else if (storyType === 'epic') storyTypeEnum = 2;

      const categoryEnum = getCategoryEnum(category);

      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'createStoryApproved',
        args: [
          storyId,
          title,
          template,
          storyTypeEnum,
          categoryEnum,
          wordTypes,
          expiresAt,
          signature,
        ],
        value: creationFee,
      } as any);

      return {
        success: true,
        hash,
      };
    } catch (error: unknown) {
      console.error('Error creating story:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create story'
      };
    } finally {
      setIsPending(false);
    }
  };

  const contributeWord = async (
    storyId: string,
    position: number,
    word: string
  ) => {
    setIsPending(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'contributeWord',
        args: [storyId, BigInt(position), word],
        value: contributionFee,
      } as any);

      return {
        success: true,
        hash,
      };
    } catch (error: unknown) {
      console.error('Error contributing word:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to contribute word'
      };
    } finally {
      setIsPending(false);
    }
  };

  return {
    createStoryApproved,
    contributeWord,
    isPending,
    isLoadingFees,
  };
}

function getCategoryEnum(category: string): number {
  const categories = [
    'adventure', 'fantasy', 'comedy', 'mystery', 'scifi', 'horror', 'romance', 'crypto',
    'sports', 'animals', 'school', 'superheroes', 'friendship', 'holidays', 'food',
    'nature', 'history', 'random',
  ];
  const index = categories.indexOf(category.toLowerCase());
  return index >= 0 ? index : categories.length - 1;
}

export function useStory(storyId: string | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getStory',
    args: storyId ? [storyId] : undefined,
    query: {
      enabled: !!storyId,
    },
  });
  return { story: data, isLoading, error, refetch };
}

export function useAllStories() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getAllStoryIds',
  });
  return { storyIds: data as string[] | undefined, isLoading, error, refetch };
}

export function useUserStats(address: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
  const stats = data ? mapUserStats(data, address) : null;
  return { stats, isLoading, error, refetch };
}

function mapUserStats(raw: any, address: `0x${string}` | undefined): UserStatsType {
  return {
    address: address ?? '',
    contributionsCount: asNumber(raw?.contributionsCount ?? raw?.[0]),
    creationCredits: asNumber(raw?.creationCredits ?? raw?.[1]),
    storiesCreated: asNumber(raw?.storiesCreated ?? raw?.[2]),
    nftsOwned: asNumber(raw?.nftsOwned ?? raw?.[3]),
    completedStories: asNumber(raw?.completedStories ?? raw?.[4]),
    shareCount: asNumber(raw?.shareCount ?? raw?.[5]),
    lastContributionTime: asNumber(raw?.lastContributionTime ?? raw?.[6]),
    activeContributions: [],
  };
}

function asNumber(value: number | bigint | undefined): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

export function useSlot(storyId: string | undefined, position: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getSlot',
    args: storyId ? [storyId, BigInt(position)] : undefined,
    query: { enabled: !!storyId && position > 0 },
  });
  return { slot: data, isLoading, error };
}

export function useNFT(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.nft,
    abi: NFT_ABI,
    functionName: 'getNFTData',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
  return { nft: data, isLoading, error };
}

export function useIsOwner(address: `0x${string}` | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'owner',
    query: { enabled: !!address },
  });
  return { isOwner: true, owner: data, isLoading, error };
}

export function useTotalNFTs() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.nft,
    abi: NFT_ABI,
    functionName: 'totalSupply',
  });
  return { totalNFTs: data ? Number(data) : 0, isLoading, error };
}

export function useLeaderboard(offset: number, limit: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getLeaderboard',
    args: [BigInt(offset), BigInt(limit)],
  });
  return { leaderboard: data as any[] | undefined, isLoading, error };
}

export function useUserRank(address: `0x${string}` | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getUserRank',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  return { rank: data ? Number(data) : 0, isLoading, error };
}