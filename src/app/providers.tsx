'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';
import { base } from 'wagmi/chains';
import { ONCHAINKIT_API_KEY, ONCHAINKIT_PROJECT_ID } from './config/onchainkit';

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Ghost Writer NFT Game',
      preference: 'smartWalletOnly',
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5_000,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={ONCHAINKIT_API_KEY}
          projectId={ONCHAINKIT_PROJECT_ID}
          chain={base}
          config={{
            appearance: {
              name: 'Ghost Writer',
              logo: 'https://cdn.builder.io/api/v1/image/assets/TEMP/9756b3248bdd48d596519e7d98958e9df5588654dadf0bb17a71fc435bcb37b3?placeholderIfAbsent=true&apiKey=ad3941e5ec034c87bd50708c966e7b84',
              mode: 'auto',
              theme: 'default',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
