'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { Toaster } from 'sonner';
import { useEffect } from 'react';

import { ONCHAINKIT_API_KEY, ONCHAINKIT_PROJECT_ID, isOnchainKitConfigured } from './config/onchainkit';
import FarcasterWrapper from '@/components/FarcasterWrapper';
import { PerformanceMonitor } from '@/lib/performance';
import { FarcasterManager } from '@/lib/farcaster-enhanced';

// Enhanced Wagmi config for Farcaster Mini Apps
const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [], // No external connectors for Farcaster Mini Apps
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: false,
});

// Enhanced query client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

function EnhancedProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize performance monitoring
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.initialize();

    // Initialize Farcaster manager
    const farcasterManager = FarcasterManager.getInstance();
    farcasterManager.initialize();

    // Cleanup on unmount
    return () => {
      performanceMonitor.cleanup();
    };
  }, []);

  return (
    <>
      {children}
      <Toaster 
        theme="dark"
        position="top-center"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'hsl(220 18% 10%)',
            border: '1px solid hsl(220 15% 20%)',
            color: 'hsl(210 40% 98%)',
          },
          className: 'mobile-toast',
        }}
      />
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const chain = process.env.NODE_ENV === 'production' ? base : baseSepolia;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {isOnchainKitConfigured() ? (
          <OnchainKitProvider
            apiKey={ONCHAINKIT_API_KEY}
            projectId={ONCHAINKIT_PROJECT_ID}
            chain={chain}
            config={{
              appearance: {
                name: 'Ghost Writer',
                logo: '/icon.png',
                mode: 'dark',
                theme: 'cyberpunk',
              },
              wallet: {
                display: 'modal',
              },
            }}
          >
            <FarcasterWrapper>
              <EnhancedProviders>
                {children}
              </EnhancedProviders>
            </FarcasterWrapper>
          </OnchainKitProvider>
        ) : (
          <FarcasterWrapper>
            <EnhancedProviders>
              {children}
            </EnhancedProviders>
          </FarcasterWrapper>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
