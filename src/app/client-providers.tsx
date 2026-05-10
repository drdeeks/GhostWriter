'use client';

import '@coinbase/onchainkit/styles.css';
import farcasterMiniAppConnector from '@farcaster/miniapp-wagmi-connector';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useMemo, createContext, useContext, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia, hardhat } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { Toaster } from 'sonner';
import FarcasterWrapper from '@/components/FarcasterWrapper';
import { ONCHAINKIT_API_KEY, ONCHAINKIT_PROJECT_ID, isOnchainKitConfigured } from './config/onchainkit';

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
};

const ChainContext = createContext<{
    activeChainId: number;
    setChainId: (id: number) => void;
}>({ activeChainId: 84532, setChainId: () => {} });

export const useActiveChain = () => useContext(ChainContext);

export function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [activeChainId, setActiveChainId] = useState(84532);

  const wagmiConfig = useMemo(() => createConfig({
    chains: [base, baseSepolia, monadTestnet, hardhat],
    connectors: [
      farcasterMiniAppConnector(),
      injected(),
      coinbaseWallet({
        appName: 'Ghost Writer',
        appLogoUrl: 'https://ghostwriter.meme/icon.png',
      }),
      walletConnect({
        projectId: ONCHAINKIT_PROJECT_ID,
      }),
    ],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
      [monadTestnet.id]: http(),
      [hardhat.id]: http('http://127.0.0.1:8545'),
    },
    ssr: false,
  }), []);

  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen bg-[#020203]" />;
  }

  const chain = activeChainId === 8453 ? base : 
                activeChainId === 10143 ? monadTestnet : 
                activeChainId === 31337 ? hardhat : 
                baseSepolia;

  return (
    <ChainContext.Provider value={{ activeChainId, setChainId: setActiveChainId }}>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
            apiKey={ONCHAINKIT_API_KEY}
            projectId={ONCHAINKIT_PROJECT_ID}
            chain={chain}
            config={{
                appearance: { name: 'Ghost Writer', mode: 'dark', theme: 'cyberpunk' }
            }}
        >
            <FarcasterWrapper>
              {children}
            </FarcasterWrapper>
            <Toaster theme="dark" position="top-center" />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
    </ChainContext.Provider>
  );
}