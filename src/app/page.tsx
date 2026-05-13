'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { toast } from 'sonner';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';

// ── High-End Hooks ───────────────────────────────
import { useHaptic } from '@/lib/haptic';
import { useFarcasterEnhanced } from '@/lib/farcaster-enhanced';
import { usePerformanceMonitor } from '@/lib/performance';
import { useAllStories, useUserStats, useIsOwner } from '@/hooks/useContract';
import { useStories } from '@/hooks/useStories';
import { useActiveChain } from './client-providers';

// ── Components ──────────────────────────────
import { GenerativeBackground } from '@/components/GenerativeBackground';
import { OnboardingReward } from '@/components/onboarding-reward';
import { Loader2, PlusCircle, Smartphone, Zap, Shield, Share2, BookOpen, Star, Ghost, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Styled Wrappers ────────────────────────────
const DoubleBezel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`group relative p-[1px] rounded-[2.5rem] bg-white/5 ring-1 ring-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/10 ${className}`}>
    <div className="relative overflow-hidden rounded-[calc(2.5rem-1px)] bg-[#050506] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] h-full">
      {children}
    </div>
  </div>
);

export default function Home() {
  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const { activeChainId, setChainId } = useActiveChain();
  const haptic = useHaptic();
  const farcaster = useFarcasterEnhanced();
  const { isOwner } = useIsOwner(address);

  const [isLoading, setIsLoading] = useState(true);
  const [farcasterUser, setFarcasterUser] = useState<string | null>(null);

  // Contract data
  const { storyIds } = useAllStories();
  const { stories } = useStories(storyIds);
  const { stats: userStats } = useUserStats(address);

  useEffect(() => {
    const init = async () => {
      try {
        await farcaster.initialize();
        if (farcaster.isInMiniApp() && farcaster.getContext()?.user) {
          setFarcasterUser(farcaster.getContext()?.user?.username || null);
        }
      } catch (e) {
        console.error('Init failed', e);
      } finally {
        setTimeout(() => setIsLoading(false), 1200);
      }
    };
    init();
  }, [farcaster]);

  const toggleChain = () => {
      const nextId = activeChainId === 84532 ? 10143 : 84532;
      setChainId(nextId);
      switchChain({ chainId: nextId });
      toast.success(`Switched network`);
  };

  const activeStories = useMemo(() => (stories || []).filter(s => s?.status === 'active'), [stories]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020203]">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border-t-2 border-[#6A0DAD] animate-spin" />
          <div className="absolute inset-2 rounded-full border-t-2 border-[#00FFFF] animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Ghost className="h-8 w-8 text-white opacity-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020203] text-slate-100 selection:bg-purple-500/30 font-sans">
      <GenerativeBackground />
      <OnboardingReward />
      
      {/* Dynamic Island Navigation */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-2 rounded-full glass shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center gap-2 pl-4 pr-2">
            <img src="https://customer-assets.emergentagent.com/wingman/45802f0c-1827-493b-822a-b9a4a7be2894/attachments/e96392fa54474f309bee3a1179384afc_IMG_1101.jpeg" className="h-6 w-6 rounded-md shadow-lg" alt="GhostWriter" />
            <div className="text-xs font-black tracking-widest text-white uppercase hidden md:block">GhostWriter</div>
        </div>
        <div className="w-px h-4 bg-white/10" />
        
        {/* Chain Toggle */}
        <Button 
            variant="ghost" 
            onClick={toggleChain}
            className="h-9 px-3 rounded-full text-[10px] uppercase font-black text-white/60 hover:text-white"
        >
            <Repeat className="h-3 w-3 mr-2 text-[#00FFFF]" />
            SWITCH NETWORK
        </Button>

        <div className="w-px h-4 bg-white/10" />
        
        <div className="flex gap-1">
            {isOwner && (
                <a href="/admin">
                    <Button variant="ghost" className="h-9 px-3 rounded-full text-[10px] uppercase font-bold hover:bg-white/5 text-purple-400">Admin</Button>
                </a>
            )}
            <Wallet>
                <ConnectWallet className="h-9 px-4 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5" />
            </Wallet>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-40 max-w-6xl relative z-10">
        
        {/* Cinematic Hero */}
        <section className="mb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6A0DAD]/10 border border-[#6A0DAD]/20 text-[10px] uppercase tracking-[0.3em] font-black text-[#6A0DAD] mb-10 animate-fade-in-up">
            <Star className="h-3 w-3" /> Gamma Evolution
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 animate-fade-in-up delay-100">
            Ghost <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#00FFFF] to-[#6A0DAD]">Writer</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-slate-400 font-medium leading-relaxed mb-12 animate-fade-in-up delay-200">
            A community storytelling game. Build narratives onchain and mint your legacy as a unique artifact.
          </p>

          <div className="flex flex-wrap justify-center gap-6 animate-fade-in-up delay-300">
            <Button className="group h-16 px-10 rounded-full bg-white text-black font-black text-lg hover:scale-105 active:scale-95 transition-all duration-500 shadow-xl shadow-white/5">
              START WRITING
              <div className="ml-4 w-10 h-10 rounded-full bg-black/5 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <PlusCircle className="h-5 w-5" />
              </div>
            </Button>
            <Button variant="outline" className="h-16 px-10 rounded-full border-white/10 bg-white/5 backdrop-blur-2xl hover:bg-white/10 transition-all font-black text-lg uppercase tracking-wider">
              Explore Nodes
            </Button>
          </div>
        </section>

        {/* Feature Bento */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-40">
          <DoubleBezel className="md:col-span-8 md:row-span-2">
            <div className="p-12 h-full flex flex-col justify-between min-h-[500px] bg-gradient-to-tr from-[#6A0DAD]/5 to-transparent">
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Active Narratives</div>
                <h3 className="text-4xl font-black mb-6">Current Nodes</h3>
                <p className="text-slate-400 max-w-sm font-medium">Join the algorithmic flow of community creativity. Every contribution is an immutable node in the ghost story.</p>
              </div>
              
              <div className="mt-12 space-y-3">
                {activeStories.slice(0, 3).map((story, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-[#6A0DAD]/20 flex items-center justify-center text-[#6A0DAD] font-black text-xl">
                        {story.title.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{story.title}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{story.category} • {story.filledSlots}/{story.totalSlots} Fragments</div>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DoubleBezel>

          <DoubleBezel className="md:col-span-4">
            <div className="p-10 h-full bg-gradient-to-br from-[#6A0DAD]/10 to-transparent flex flex-col justify-center">
              <Shield className="h-10 w-10 text-[#6A0DAD] mb-6" />
              <h4 className="text-2xl font-black mb-3">Immutability</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Pure on-chain logic. Secured by EIP-712 signatures and hardwired admin protocols.</p>
            </div>
          </DoubleBezel>

          <DoubleBezel className="md:col-span-4">
            <div className="p-10 h-full bg-gradient-to-br from-[#00FFFF]/10 to-transparent flex flex-col justify-center">
              <Share2 className="h-10 w-10 text-[#00FFFF] mb-6" />
              <h4 className="text-2xl font-black mb-3">Syntactic Flow</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Integrated social telemetry. Share your contributions directly to Farcaster and across the blockchain.</p>
            </div>
          </DoubleBezel>
        </section>

        {/* NFT Legacy */}
        <section className="mb-40 flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Digital Inheritance</div>
            <h2 className="text-6xl font-black mb-8 tracking-tighter">Your Legacy.</h2>
            <p className="text-xl text-slate-400 mb-10 max-w-md font-medium leading-relaxed">Every contribution mints a high-fidelity SVG artifact. Locked during creation, revealed at completion.</p>
            
            <div className="flex gap-6">
              <div className="flex-1 p-8 rounded-[2rem] bg-white/5 border border-white/5 ring-1 ring-white/5 shadow-2xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">MINTED</div>
                <div className="text-4xl font-black text-[#00FFFF]">{userStats?.nftsOwned ?? 0}</div>
              </div>
              <div className="flex-1 p-8 rounded-[2rem] bg-white/5 border border-white/5 ring-1 ring-white/5 shadow-2xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">CREDITS</div>
                <div className="text-4xl font-black text-[#6A0DAD]">{userStats?.creationCredits ?? 0}</div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-2/5 aspect-[4/5] relative">
            <DoubleBezel className="h-full">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-[#6A0DAD]/30 to-transparent">
                <div className="text-8xl mb-8 animate-pulse grayscale brightness-150">🔒</div>
                <div className="text-[10px] uppercase tracking-[0.6em] font-black text-slate-500 mb-4">Pending Reveal</div>
                <div className="text-2xl font-bold tracking-tighter text-white/40">FRAGMENT #842</div>
                <div className="mt-4 px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono text-slate-600">STORY_PHANTASM_ALPHA</div>
              </div>
            </DoubleBezel>
          </div>
        </section>

        {/* Unified Footer */}
        <footer className="pt-32 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
              <img src="https://customer-assets.emergentagent.com/wingman/45802f0c-1827-493b-822a-b9a4a7be2894/attachments/e96392fa54474f309bee3a1179384afc_IMG_1101.jpeg" className="h-10 w-10 rounded-lg grayscale hover:grayscale-0 transition-all opacity-50 hover:opacity-100" alt="GhostWriter" />
              <div className="text-[10px] font-black tracking-[0.4em] text-slate-600 uppercase">Community Storytelling Game</div>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="#" className="hover:text-[#00FFFF] transition-all">Protocol</a>
            <a href="#" className="hover:text-[#6A0DAD] transition-all">Warpcast</a>
            <a href="#" className="hover:text-white transition-all">Infrastructure</a>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px) blur(10px); }
          to { opacity: 1; transform: translateY(0) blur(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        .delay-100 { animation-delay: 0.15s; }
        .delay-200 { animation-delay: 0.3s; }
        .delay-300 { animation-delay: 0.45s; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );      
}