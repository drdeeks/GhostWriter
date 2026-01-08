'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStoryManager } from '@/hooks/useContract';
import { useSlot } from '@/hooks/useContract';
import type { Story, WordType } from '@/types/ghostwriter';
import { WORD_TYPE_DEFINITIONS } from '@/types/ghostwriter';
import { DollarSign, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

interface ContributionModalProps {
  open: boolean;
  onClose: () => void;
  story: Story | null;
  onSubmit: (word: string) => void;
}

export function ContributionModal({ open, onClose, story, onSubmit }: ContributionModalProps) {
  const [word, setWord] = useState<string>('');
  const { contributeWord, isPending } = useStoryManager();
  const { address } = useAccount();

  if (!story) return null;

  // Get next word type needed from contract
  const nextPosition = story.filledSlots + 1;
  const { slot: nextSlot, isLoading: slotLoading } = useSlot(story.storyId, nextPosition);
  const wordType = (nextSlot?.wordType || 'adjective') as WordType;
  const wordInfo = WORD_TYPE_DEFINITIONS[wordType];

  const handleSubmit = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!word || word.length < wordInfo.minLength || word.length > wordInfo.maxLength) {
      toast.error(`Word must be between ${wordInfo.minLength} and ${wordInfo.maxLength} characters`);
      return;
    }

    // Moderate word via API
    const response = await fetch('/api/moderate-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      toast.error('Failed to moderate word');
      return;
    }

    const { isProfane } = await response.json();

    if (isProfane) {
      toast.error('Inappropriate word', {
        description: 'Please choose a different word',
      });
      return;
    }

    const result = await contributeWord(story.storyId, nextPosition, word);

    if (result.success) {
      onSubmit(word);
      setWord('');
      onClose();
    } else {
      toast.error('Contribution failed', {
        description: result.error || 'Please try again',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Contribute to Story
          </DialogTitle>
          <DialogDescription className="text-base">
            Add your word to <span className="font-semibold text-purple-600 dark:text-purple-400">{story.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Story Progress</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {story.filledSlots}/{story.totalSlots} words
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                style={{ width: `${(story.filledSlots / story.totalSlots) * 100}%` }}
              />
            </div>
          </div>

          {/* Word Type Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-lg font-bold text-gray-900 dark:text-white">
                Word Type Needed:
              </Label>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm px-3 py-1">
                {wordInfo.displayName}
              </Badge>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {wordInfo.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {wordInfo.examples.map((example, index) => (
                <Badge key={index} className="text-xs border border-gray-300">
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="word" className="text-base font-semibold">
              Your {wordInfo.displayName}:
            </Label>
            <Input
              id="word"
              value={word}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWord(e.target.value)}
              placeholder={`Enter a ${wordInfo.displayName.toLowerCase()}...`}
              className="text-lg h-12 border-2 border-gray-300 dark:border-gray-600 focus:border-purple-500"
              maxLength={wordInfo.maxLength}
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {word.length}/{wordInfo.maxLength} characters ({wordInfo.minLength} min)
            </p>
          </div>

          {/* Fee Info */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">Fee: $0.05 + gas</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              You'll earn 1 creation credit after contributing
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !word || word.length < wordInfo.minLength}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Contributing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Contribute Word
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
