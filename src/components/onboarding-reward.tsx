'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Smartphone } from 'lucide-react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

export function OnboardingReward() {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    const hasSeen = typeof window !== 'undefined' ? localStorage.getItem('gw_onboarding_seen') : true;
    if (!hasSeen && address) {
      setOpen(true);
    }
  }, [address]);

  const handleClaim = () => {
    localStorage.setItem('gw_onboarding_seen', 'true');
    toast.success('Reward claimed! 2 free tokens granted.');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-slate-900 border-purple-500/30">
        <DialogHeader className="flex flex-col items-center text-center p-6">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Star className="h-8 w-8 text-purple-400 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-bold mb-2">Welcome to GhostWriter</DialogTitle>
          <DialogDescription className="text-slate-400 mb-6">
            Add GhostWriter to your Farcaster favorites or Base App bookmarks to unlock 2 FREE contribution tokens!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col w-full gap-3 px-6 pb-6">
          <Button onClick={handleClaim} className="h-12 bg-white text-black font-bold w-full">
            <Smartphone className="mr-2 h-4 w-4" /> I've added it!
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-500 w-full">
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}