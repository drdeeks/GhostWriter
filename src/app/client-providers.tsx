'use client';

import '@coinbase/onchainkit/styles.css';
import farcasterMiniAppConnector from '@farcaster/miniapp-wagmi-connector';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { Toaster } from 'sonner';
import FarcasterWrapper from '@/components/FarcasterWrapper';
import { ONCHAINKIT_API_KEY, ONCHAINKIT_PROJECT_ID, isOnchainKitConfigured } from './config/onchainkit';

export function ClientProviders({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
      },
    },
  }), []);

  const wagmiConfig = useMemo(() => {
    // Safely initialize connectors with fallback
    const connectors = [];

    try {
      connectors.push(farcasterMiniAppConnector());
    } catch (e) {
      console.warn('Farcaster connector failed to initialize:', e);
    }

    connectors.push(
      injected(),
      coinbaseWallet({
        appName: 'Ghost Writer',
        appLogoUrl: 'https://ghost-writer-three.vercel.app/icon.png',
      }),
      walletConnect({
        projectId: ONCHAINKIT_PROJECT_ID,
      })
    );

    return createConfig({
      chains: [base, baseSepolia],
      connectors,
      transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
      },
      ssr: false,
    });
  }, []);

  useEffect(() => {
    // Force mount after a short delay to prevent splash screen hang
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    // Load performance monitor async
    import('@/lib/performance')
      .then(({ PerformanceMonitor }) => {
        PerformanceMonitor.getInstance().initialize();
      })
      .catch((err) => {
        console.warn('Performance monitor failed to load:', err);
      });

    return () => clearTimeout(mountTimer);
  }, []);

  const chain = Number(process.env.NEXT_PUBLIC_CHAIN_ID) === base.id ? base : baseSepolia;

  // Prevent rendering until mounted to avoid splash hang
  if (!isMounted) {
    return null;
  }

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
              {children}
            </FarcasterWrapper>
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
          </OnchainKitProvider>
        ) : (
          <>
            <FarcasterWrapper>
              {children}
            </FarcasterWrapper>
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
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
