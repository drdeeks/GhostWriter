'use client';

import type { Story } from '@/types/ghostwriter';
import { Check, Copy, MessageCircle, Share2, Twitter } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';

type SocialShareProps = {
  story: Story;
  onShare?: () => void;
};

export function SocialShare({ story, onShare }: SocialShareProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + `/story/${story.storyId}` : '';
  const shareText = `Check out this hilarious Ghost Writer story: "${story.title}" 👻✨`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);

      if (onShare) {
        onShare();
      }
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');

    if (onShare) {
      onShare();
    }
  };

  const handleShareFarcaster = () => {
    // Farcaster share - opens in Warpcast with pre-filled cast
    const farcasterText = `${shareText}\n\n${shareUrl}`;
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(farcasterText)}`;
    window.open(warpcastUrl, '_blank', 'width=600,height=600');

    if (onShare) {
      onShare();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Share2 className="h-4 w-4" />
        Share this story:
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Copy Link */}
        <Button
          onClick={handleCopyLink}
          className="gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-300 dark:border-purple-700 px-3 py-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Link
            </>
          )}
        </Button>

        {/* Twitter */}
        <Button
          onClick={handleShareTwitter}
          className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-300 dark:border-blue-700 px-3 py-2"
        >
          <Twitter className="h-4 w-4 text-blue-500" />
          Twitter
        </Button>

        {/* Farcaster */}
        <Button
          onClick={handleShareFarcaster}
          className="gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-300 dark:border-purple-700 px-3 py-2"
        >
          <MessageCircle className="h-4 w-4 text-purple-500" />
          Farcaster
        </Button>
      </div>

      {story.shareCount > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Shared {story.shareCount} {story.shareCount === 1 ? 'time' : 'times'}
        </div>
      )}
    </div>
  );
}
