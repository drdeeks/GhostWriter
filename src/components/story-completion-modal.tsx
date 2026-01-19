'use client';

import { useStoryCompletion } from '@/hooks/useStoryCompletion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useHaptic } from '@/lib/haptic';
import { useEffect, useCallback } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyTitle: string;
  totalSlots: number;
}

export function StoryCompletionModal({ isOpen, onClose, storyId, storyTitle, totalSlots }: Props) {
  const { completeStoryFull, isProcessing, progress, error, resetProgress } = useStoryCompletion();
  const haptic = useHaptic();

  const triggerSuccessHaptic = useCallback(() => {
    haptic.trigger('success');
  }, [haptic]);

  useEffect(() => {
    if (isOpen) {
      triggerSuccessHaptic();
      resetProgress();
    }
  }, [isOpen, triggerSuccessHaptic, resetProgress]);

  const handleComplete = async () => {
    try {
      haptic.trigger('medium');
      await completeStoryFull(storyId, totalSlots);
      haptic.trigger('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Completion failed:', err);
      haptic.trigger('error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 Story Complete!</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-center text-lg font-semibold">{storyTitle}</p>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900 mb-2">
              Processing {totalSlots} contributions...
            </p>
            {isProcessing && (
              <Progress value={progress} className="h-2" />
            )}
            {error && (
              <p className="text-sm text-red-600 mt-2">
                Error: {error}
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>✨ All contributor NFTs will be revealed</p>
            <p>🎨 Creator NFT will be minted</p>
            <p>🏆 Achievements will be unlocked</p>
          </div>

          <button
            onClick={handleComplete}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
          >
            {isProcessing ? `Processing... ${Math.round(progress)}%` : 'Reveal NFTs 🎁'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
