'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Avatar, Name, Identity, Address, EthBalance } from '@coinbase/onchainkit/identity';
import { Ghost } from 'lucide-react';
import { GenerativeBackground } from '@/components/GenerativeBackground';
import { OnboardingReward } from '@/components/onboarding-reward';

const CHAINS = [
  { id: 8453, name: 'Base', color: 'text-blue-400' },
  { id: 10143, name: 'Monad', color: 'text-purple-400' },
  { id: 42161, name: 'Arbitrum', color: 'text-cyan-400' },
  { id: 1, name: 'Ethereum', color: 'text-indigo-400' },
] as const;

export default function Home() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [selectedChain, setSelectedChain] = useState(8453);
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const context = await sdk.context;
        if (context?.user) {
          setIsFarcaster(true);
        }
      } catch {
        setIsFarcaster(false);
      }
    };
    checkFarcaster();
  }, []);

  useEffect(() => {
    if (mounted && isConnected && address) {
      const timer = setTimeout(() => router.push('/app'), 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, router, mounted]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020203]">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border-t-2 border-[#6A0DAD] animate-spin" />
          <div className="absolute inset-2 rounded-full border-t-2 border-[#00FFFF] animate-spin" style={{ animationDuration: '12s' }} />
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

      <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-4">
        <div className="text-center space-y-8" style={{ animation: 'fade-in 1s cubic-bezier(0.32, 0.72, 0, 1) forwards' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6A0DAD]/10 border border-[#6A0DAD]/20 text-[10px] uppercase tracking-[0.3em] font-black text-[#6A0DAD]">
            Ghost Writer
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
            Ghost <span className="text-gradient">Writer</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-xl mx-auto">
            Community storytelling onchain. Every word mints a hidden NFT.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedChain(chain.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                  selectedChain === chain.id
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                <span className={chain.id === selectedChain ? chain.color : ''}>{chain.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <Wallet>
              <ConnectWallet className="glass px-12 py-5 rounded-full text-lg font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all duration-500 active:scale-95">
                <span className="flex items-center gap-3">
                  <Avatar className="h-6 w-6" />
                  <span>I wasn&apos;t here..</span>
                </span>
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink icon="wallet" href="/app">
                  Enter Ghost Writer
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>

          {isFarcaster && (
            <p className="text-xs text-[#00FFFF] uppercase tracking-widest">
              Farcaster Mini App Detected
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
