'use client';

import { useStoryManager, useIsOwner } from '@/hooks/useContract';
import { useActiveStoriesCount } from '@/hooks/useActiveStoriesCount';
import type { StoryType } from '@/types/ghostwriter';
import { AlertCircle, DollarSign, Loader2, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const STORY_CATEGORIES = [
  "Adventure",
  "Fantasy",
  "Comedy",
  "Mystery",
  "Sci-Fi",
  "Sports",
  "Animals",
  "School",
  "Superheroes",
  "Friendship",
  "Holidays",
  "Food",
  "Nature",
  "History",
];
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface StoryCreationModalProps {
  open: boolean;
  onClose: () => void;
  creationCredits: number;
  onSubmit: (storyType: StoryType) => void;
}

export function StoryCreationModal({ open, onClose, creationCredits, onSubmit }: StoryCreationModalProps) {
  const [selectedType, setSelectedType] = useState<StoryType>('normal');
  const [selectedCategory, setSelectedCategory] = useState<string>(STORY_CATEGORIES[0]);
  const { createStory, isPending } = useStoryManager();
  const { activeStories, isLoading: isActiveStoriesLoading } = useActiveStoriesCount();
  const { address } = useAccount();
  const { isOwner } = useIsOwner(address);

  const storyTypes = [
    {
      type: 'normal' as StoryType,
      title: 'Normal Story',
      words: '~50 words',
      slots: '10 slots',
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
      slots: '20 slots',
      duration: 'Classic length',
      icon: '📖',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      type: 'epic' as StoryType,
      title: 'Epic Story',
      words: '~500 words',
      slots: '50 slots',
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

    if (!isActiveStoriesLoading && activeStories >= 15) {
      toast.error('Story limit reached', {
        description: 'There are already 15 active stories. Please complete or wait for a story to finish before creating a new one.',
      });
      return;
    }

    const storyId = `story_${Date.now()}`;

    // Generate story template via API
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: selectedCategory }),
    });

    if (!response.ok) {
      toast.error('Failed to generate story template');
      return;
    }

    const { title, template, wordTypes } = await response.json();

    const result = await createStory(storyId, title, template, selectedType, selectedCategory, wordTypes);

    if (result.success) {
      onSubmit(selectedType);
      onClose();
    } else {
      toast.error('Story creation failed', {
        description: result.error || 'Please try again',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
            <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory} className="flex flex-wrap gap-2">
              {STORY_CATEGORIES.map((cat) => (
                <RadioGroupItem key={cat} value={cat} id={cat} />
              ))}
              {STORY_CATEGORIES.map((cat) => (
                <Label key={cat} htmlFor={cat} className={`px-3 py-1 rounded cursor-pointer border ${selectedCategory === cat ? 'bg-blue-200 border-blue-500' : 'bg-gray-100 border-gray-300'}`}>{cat}</Label>
              ))}
            </RadioGroup>
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
            <RadioGroup value={selectedType} onValueChange={(value: string) => setSelectedType(value as StoryType)}>
              <div className="space-y-3">
                {storyTypes.map((story) => (
                  <Card
                    key={story.type}
                    className={`cursor-pointer transition-all duration-200 ${selectedType === story.type
                      ? `ring-4 ring-offset-2 ring-blue-500 ${story.bgColor} ${story.borderColor} border-2`
                      : `${story.borderColor} border-2 hover:border-blue-400`
                      } ${story.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !story.disabled && setSelectedType(story.type)}
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
            onClick={onClose}
            disabled={isPending}
            className="flex-1 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || creationCredits < 1 || (!isActiveStoriesLoading && activeStories >= 15)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {(!isActiveStoriesLoading && activeStories >= 15) ? 'Limit Reached' : 'Create Story'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
