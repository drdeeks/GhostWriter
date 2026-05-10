'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function ShareCast({ storyId, title }: { storyId: string, title: string }) {
  const handleShare = () => {
    const text = `I just contributed to "${title}" on GhostWriter! Check out the story and add your own word:`;
    const url = `${window.location.origin}/story/${storyId}`;
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`;
    window.open(warpcastUrl, '_blank');
    toast.success('Warpcast share opened!');
  };

  return <Button onClick={handleShare} className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500"><Share2 className="h-4 w-4" /> Share to Farcaster</Button>;
}