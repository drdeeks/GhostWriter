import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, STORY_MANAGER_ABI, NFT_ABI, FEES } from '@/lib/contracts';
import type { StoryType } from '@/types/ghostwriter';
import { useState } from 'react';

/**
 * Hook for reading and writing to Story Manager contract
 */
export function useStoryManager() {
  const { writeContractAsync } = useWriteContract();
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
      
      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'createStory',
        args: [storyId, title, template, storyTypeEnum, wordTypes],
        value: FEES.creation,
      });

      return { success: true, hash };
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
        value: FEES.contribution,
      });

      return { success: true, hash };
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
