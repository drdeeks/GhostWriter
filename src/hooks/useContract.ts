import { useFarcaster } from '@/components/FarcasterWrapper';
import { CONTRACTS, FEES, NFT_ABI, STORY_MANAGER_ABI } from '@/lib/contracts';
import type { StoryType } from '@/types/ghostwriter';
import { useState } from 'react';
import { useReadContract, useWaitForTransactionReceipt } from 'wagmi';

/**
 * Hook for reading and writing to Story Manager contract
 */
export function useStoryManager() {
  const { isMiniApp } = useFarcaster();
  const [isPending, setIsPending] = useState<boolean>(false);

  const createStory = async (
    storyId: string,
    title: string,
    template: string,
    storyType: StoryType,
    wordTypes: string[]
  ) => {
    setIsPending(true);
    try {
      const storyTypeEnum = storyType === 'mini' ? 0 : storyType === 'epic' ? 2 : 1;

      if (isMiniApp) {
        // Use Farcaster SDK for mini app transactions
        // For Farcaster Mini Apps, transactions are handled through frame actions
        // This is a placeholder - actual implementation would use frame transaction flow
        console.log('Farcaster mini app transaction for createStory:', {
          contractAddress: CONTRACTS.storyManager,
          functionName: 'createStory',
          args: [storyId, title, template, storyTypeEnum, wordTypes],
          value: FEES.creation.toString(),
        });

        // Placeholder return - actual implementation would initiate frame transaction
        return {
          success: false,
          error: 'Farcaster frame transaction flow not yet implemented'
        };
      } else {
        // For non-mini app contexts, this would need external wallet integration
        throw new Error('External wallet transactions not implemented for non-mini app context');
      }
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
      if (isMiniApp) {
        // Use Farcaster SDK for mini app transactions
        // For Farcaster Mini Apps, transactions are handled through frame actions
        // This is a placeholder - actual implementation would use frame transaction flow
        console.log('Farcaster mini app transaction for contributeWord:', {
          contractAddress: CONTRACTS.storyManager,
          functionName: 'contributeWord',
          args: [storyId, BigInt(position), word],
          value: FEES.contribution.toString(),
        });

        // Placeholder return - actual implementation would initiate frame transaction
        return {
          success: false,
          error: 'Farcaster frame transaction flow not yet implemented'
        };
      } else {
        // For non-mini app contexts, this would need external wallet integration
        throw new Error('External wallet transactions not implemented for non-mini app context');
      }
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
    createStory,
    contributeWord,
    isPending,
  };
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
    },
  });

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
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
