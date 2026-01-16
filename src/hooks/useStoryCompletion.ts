'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';
import { useState, useCallback } from 'react';

export function useStoryCompletion() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const resetProgress = useCallback(() => {
    setProgress(0);
    setError(null);
  }, []);

  const processCompletionBatch = useCallback(async (
    storyId: string,
    startPosition: number,
    endPosition: number
  ) => {
    const batchSize = endPosition - startPosition + 1;
    if (batchSize > 50) {
      throw new Error('Batch size cannot exceed 50');
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.storyManager,
      abi: STORY_MANAGER_ABI,
      functionName: 'processCompletionBatch',
      args: [storyId, BigInt(startPosition), BigInt(endPosition)],
    });

    return hash;
  }, [writeContractAsync]);

  const finalizeStory = useCallback(async (storyId: string) => {
    const hash = await writeContractAsync({
      address: CONTRACTS.storyManager,
      abi: STORY_MANAGER_ABI,
      functionName: 'finalizeStory',
      args: [storyId],
    });

    return hash;
  }, [writeContractAsync]);

  const completeStoryFull = useCallback(async (storyId: string, totalSlots: number) => {
    try {
      setError(null);
      const batchSize = 50;
      const batches = Math.ceil(totalSlots / batchSize);
      const totalSteps = batches + 1; // +1 for finalization
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize + 1;
        const end = Math.min((i + 1) * batchSize, totalSlots);
        
        await processCompletionBatch(storyId, start, end);
        setProgress(((i + 1) / totalSteps) * 100);
      }

      await finalizeStory(storyId);
      setProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [processCompletionBatch, finalizeStory]);

  return {
    processCompletionBatch,
    finalizeStory,
    completeStoryFull,
    isProcessing: isPending || isConfirming,
    progress,
    error,
    resetProgress,
  };
}
