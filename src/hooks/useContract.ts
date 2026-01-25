import { CONTRACTS, FEES, NFT_ABI, STORY_MANAGER_ABI } from '@/lib/contracts';
import type { StoryType, UserStats as UserStatsType } from '@/types/ghostwriter';
import { useState } from 'react';
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useFees } from './useFees';

/**
 * Hook for reading and writing to Story Manager contract
 */
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

// Helper function to convert category string to enum
function getCategoryEnum(category: string): number {
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
  ];

  const index = categories.indexOf(category.toLowerCase());
  return index >= 0 ? index : categories.length - 1; // Default to 'random'
}

/**
 * Hook for reading story data
 */
export function useStory(storyId: string | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getStory',
    args: storyId ? [storyId] : undefined,
    query: {
      enabled: !!storyId,
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      retryDelay: 1000,
    },
  });

  return {
    story: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading all story IDs
 */
export function useAllStories() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getAllStoryIds',
    query: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      retryDelay: 1000,
    },
  });

  return {
    storyIds: data as string[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading user stats
 */
export function useUserStats(address: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      retryDelay: 1000,
    },
  });

  const stats = data ? mapUserStats(data, address) : null;

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
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

/**
 * Hook for reading slot details
 */
export function useSlot(storyId: string | undefined, position: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getSlot',
    args: storyId ? [storyId, BigInt(position)] : undefined,
    query: {
      enabled: !!storyId && position > 0,
    },
  });

  return {
    slot: data,
    isLoading,
    error,
  };
}

/**
 * Hook for reading NFT data
 */
export function useNFT(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.nft,
    abi: NFT_ABI,
    functionName: 'getNFTData',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return {
    nft: data,
    isLoading,
    error,
  };
}

/**
 * Hook for reading user's NFT balance
 */
export function useUserNFTs(address: `0x${string}` | undefined) {
  const { data: balance } = useReadContract({
    address: CONTRACTS.nft,
    abi: NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    nftCount: balance ? Number(balance) : 0,
  };
}

/**
 * Hook for reading user achievements
 */
export function useUserAchievements(address: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getUserAchievements',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    achievements: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading leaderboard data
 */
export function useLeaderboard(offset: number = 0, limit: number = 50) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getLeaderboard',
    args: [BigInt(offset), BigInt(limit)],
  });

  return {
    leaderboard: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading user rank
 */
export function useUserRank(address: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getUserRank',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    rank: data ? Number(data) : 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking if address is contract owner
 */
export function useIsOwner(address: `0x${string}` | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'owner',
    query: {
      enabled: !!address,
    },
  });

  return {
    isOwner: data?.toLowerCase() === address?.toLowerCase(),
    owner: data,
    isLoading,
    error,
  };
}

/**
 * Hook for getting total stories count
 */
export function useTotalStories() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getTotalStories',
  });

  return {
    totalStories: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

/**
 * Hook for getting total NFT supply
 */
export function useTotalNFTs() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.nft,
    abi: NFT_ABI,
    functionName: 'totalSupply',
  });

  return {
    totalNFTs: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

/**
 * Hook for waiting for transaction confirmation
 */
export function useTransactionStatus(hash: `0x${string}` | undefined) {
  const { data: receipt, isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    receipt,
    isLoading,
    isSuccess,
  };
}
