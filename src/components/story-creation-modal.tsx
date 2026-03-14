'use client';

import { useStoryManager, useIsOwner } from '@/hooks/useContract';
import { useActiveStoriesCount } from '@/hooks/useActiveStoriesCount';
import type { StoryType } from '@/types/ghostwriter';
import { AlertCircle, DollarSign, Loader2, PlusCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

type StorySuggestion = {
  storyId: string;
  title: string;
  template: string;
  wordTypes: string[];
  expiresAt: string | number;
  signature: `0x${string}`;
  generatedBy?: 'AI' | 'Template' | 'Cache';
};

type CategoryOption = { value: string; label: string };

const STORY_CATEGORIES: CategoryOption[] = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'scifi', label: 'Sci-Fi' },
  { value: 'horror', label: 'Horror' },
  { value: 'romance', label: 'Romance' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'sports', label: 'Sports' },
  { value: 'animals', label: 'Animals' },
  { value: 'school', label: 'School' },
  { value: 'superheroes', label: 'Superheroes' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'holidays', label: 'Holidays' },
  { value: 'food', label: 'Food' },
  { value: 'nature', label: 'Nature' },
  { value: 'history', label: 'History' },
  { value: 'random', label: 'Random' },
];

interface StoryCreationModalProps {
  open: boolean;
  onClose: () => void;
  creationCredits: number;
  onSubmit: (storyType: StoryType) => void;
}

export function StoryCreationModal({ open, onClose, creationCredits, onSubmit }: StoryCreationModalProps) {
  const [selectedType, setSelectedType] = useState<StoryType>('normal');
  const [selectedCategory, setSelectedCategory] = useState<string>(STORY_CATEGORIES[0]!.value);
  const { createStoryApproved, isPending } = useStoryManager();
  const { activeStories, maxActiveStories, isLoading: isActiveStoriesLoading } = useActiveStoriesCount();
  const { address } = useAccount();
  const { isOwner } = useIsOwner(address);

  const [suggestions, setSuggestions] = useState<StorySuggestion[] | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(0);

  const selectedSuggestion = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return null;
    return suggestions[selectedSuggestionIndex] ?? suggestions[0];
  }, [suggestions, selectedSuggestionIndex]);

  const resetSuggestions = () => {
    setSuggestions(null);
    setSelectedSuggestionIndex(0);
  };

  const handleClose = () => {
    resetSuggestions();
    onClose();
  };

  const storyTypes = [
    {
      type: 'mini' as StoryType,
      title: 'Mini Story',
      words: '~50 words',
      slots: '5-10 slots',
      duration: 'Quick & fun!',
      icon: '⚡',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      type: 'normal' as StoryType,
      title: 'Normal Story',
      words: '~100 words',
      slots: '10-15 slots',
      duration: 'Classic length',
      icon: '📖',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      type: 'epic' as StoryType,
      title: 'Epic Story',
      words: '~150 words',
      slots: '15-25 slots',
      duration: 'A grand saga!',
      icon: '🔥',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      disabled: !isOwner,
    },
  ];

  const handleSubmit = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (creationCredits < 1) {
      toast.error('Insufficient creation credits', {
        description: 'Contribute to stories to earn creation credits',
      });
      return;
    }

    if (!isActiveStoriesLoading && activeStories >= maxActiveStories) {
      toast.error('Story limit reached', {
        description: `There are already ${maxActiveStories} active stories. Please complete or wait for a story to finish before creating a new one.`,
      });
      return;
    }

    // Step 1: generate suggestions (server-signed approvals)
    if (!suggestions) {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          storyType: selectedType,
          userAddress: address,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        toast.error('Failed to generate story suggestions', {
          description: err?.details || err?.error || `HTTP ${response.status}`,
        });
        return;
      }

      const data = await response.json();
      const nextSuggestions = (data?.suggestions || []) as StorySuggestion[];

      if (!Array.isArray(nextSuggestions) || nextSuggestions.length !== 5) {
        toast.error('Story suggestion service error', {
          description: 'Expected 5 suggestions',
        });
        return;
      }

      setSuggestions(nextSuggestions);
      setSelectedSuggestionIndex(0);
      return;
    }

    // Step 2: pick one suggestion and create onchain
    if (!selectedSuggestion) {
      toast.error('No suggestion selected');
      return;
    }

    const result = await createStoryApproved(
      selectedSuggestion.storyId,
      selectedSuggestion.title,
      selectedSuggestion.template,
      selectedType,
      selectedCategory,
      selectedSuggestion.wordTypes,
      BigInt(selectedSuggestion.expiresAt),
      selectedSuggestion.signature
    );

    if (result.success) {
      onSubmit(selectedType);
      handleClose();
    } else {
      toast.error('Story creation failed', {
        description: result.error || 'Please try again',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Story
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose your story length and start a new collaborative narrative
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Selection */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Choose Story Category:</Label>
            <RadioGroup
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                resetSuggestions();
              }}
              className="flex flex-wrap gap-2"
            >
              {STORY_CATEGORIES.map((cat) => (
                <RadioGroupItem key={cat.value} value={cat.value} id={cat.value} />
              ))}
              {STORY_CATEGORIES.map((cat) => (
                <Label
                  key={cat.value}
                  htmlFor={cat.value}
                  className={`px-3 py-1 rounded cursor-pointer border ${selectedCategory === cat.value ? 'bg-blue-200 border-blue-500' : 'bg-gray-100 border-gray-300'}`}
                >
                  {cat.label}
                </Label>
              ))}
            </RadioGroup>

            {suggestions && (
              <div className="mt-4 space-y-2">
                <Label className="text-base font-semibold block">Pick 1 of 5 suggestions:</Label>
                <div className="grid grid-cols-1 gap-2">
                  {suggestions.map((s, idx) => (
                    <button
                      key={s.storyId}
                      type="button"
                      onClick={() => setSelectedSuggestionIndex(idx)}
                      className={`text-left p-3 rounded border ${idx === selectedSuggestionIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'} hover:border-blue-400 transition`}
                    >
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {s.generatedBy ? `Source: ${s.generatedBy}` : ''} • Slots: {s.wordTypes?.length ?? 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {s.template.slice(0, 160)}...
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Credits Info */}
          <div className={`rounded-lg p-4 border-2 ${creationCredits > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {creationCredits > 0 ? (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    {creationCredits} Credit{creationCredits !== 1 ? 's' : ''} Available
                  </Badge>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-red-800 dark:text-red-200">
                      No creation credits
                    </span>
                  </>
                )}
              </div>
            </div>
            {creationCredits === 0 && (
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                Contribute to stories to earn creation credits (1 contribution = 1 credit)
              </p>
            )}
          </div>

          {/* Story Type Selection */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Choose Story Length:</Label>
            <RadioGroup
              value={selectedType}
              onValueChange={(value: string) => {
                setSelectedType(value as StoryType);
                resetSuggestions();
              }}
            >
              <div className="space-y-3">
                {storyTypes.map((story) => (
                  <Card
                    key={story.type}
                    className={`cursor-pointer transition-all duration-200 ${story.bgColor} ${selectedType === story.type
                      ? `ring-4 ring-offset-2 ring-blue-500 ${story.borderColor} border-2`
                      : `${story.borderColor} border-2 hover:border-blue-400`
                      } ${story.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (story.disabled) return;
                      setSelectedType(story.type);
                      resetSuggestions();
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value={story.type} id={story.type} disabled={story.disabled} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{story.icon}</span>
                            <Label htmlFor={story.type} className="text-lg font-bold cursor-pointer">
                              {story.title}
                            </Label>
                            {story.disabled && (
                              <Badge className="text-xs border border-gray-300">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>📝 {story.words}</span>
                            <span>🎯 {story.slots}</span>
                            <span>⏱️ {story.duration}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Fee Info */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">Fee: $0.10 + gas</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              1 creation credit will be consumed
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || creationCredits < 1 || (!isActiveStoriesLoading && activeStories >= maxActiveStories)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {suggestions ? 'Creating...' : 'Generating...'}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {(!isActiveStoriesLoading && activeStories >= maxActiveStories)
                  ? 'Limit Reached'
                  : suggestions
                    ? 'Create Story'
                    : 'Generate 5 Suggestions'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
