'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Story } from '@/types/ghostwriter';
import { Lock, Sparkles, Users, Clock } from 'lucide-react';

interface StoryCardProps {
  story: Story;
  onContribute: (storyId: string) => void;
  onViewStory: (storyId: string) => void;
}

import React from 'react';

const StoryCardComponent = ({ story, onContribute, onViewStory }: StoryCardProps) => {
  const progress = (story.filledSlots / story.totalSlots) * 100;
  const isComplete = story.status === 'complete';

  const storyTypeColors = {
    mini: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    epic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 overflow-hidden relative">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge className={`${storyTypeColors[story.storyType]} font-semibold px-3 py-1`}>
            {story.storyType.toUpperCase()}
          </Badge>
          {isComplete && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
        <h3 className="text-xl font-bold leading-tight text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {isComplete ? '🎉' : '🔒'} {story.title}
        </h3>
      </CardHeader>

      <CardContent className="relative space-y-4 pb-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Users className="h-4 w-4" />
              Progress
            </span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {story.filledSlots}/{story.totalSlots}
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-3 bg-gray-200 dark:bg-gray-700"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {story.totalSlots - story.filledSlots} slots remaining
          </p>
        </div>

        {/* Story Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{story.filledSlots} contributors</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative pt-4 border-t border-gray-200 dark:border-gray-700">
        {isComplete ? (
          <Button
            onClick={() => onViewStory(story.storyId)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            View Story
          </Button>
        ) : (
          <Button
            onClick={() => onContribute(story.storyId)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Lock className="mr-2 h-4 w-4" />
            Contribute ($0.05)
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export const StoryCard = React.memo(StoryCardComponent);
