import FarcasterWrapper from "@/components/FarcasterWrapper";
import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "Ghost Writer",
  description: "Storytelling NFT Game - Collaborative storytelling where contributions mint hidden NFTs that reveal when stories complete. Each word earns creation credits on Base Chain.",
  icons: {
    icon: '/icon.png',
  },
  // Open Graph / general social sharing
  openGraph: {
    title: "Ghost Writer - NFT Game",
    description: "Collaborative stories with hidden NFTs that reveal on completion. Earn rewards on Base Chain.",
    images: [
      {
        url: "https://ghost-writer-three.vercel.app/splash.png",
        width: 1200,
        height: 630,
        alt: "Ghost Writer Splash",
      },
    ],
    type: "website",
  },
  // Farcaster Mini App frame metadata
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://ghost-writer-three.vercel.app/splash.png",
    "fc:frame:button:1": "Start Writing",
    "fc:frame:button:1:action": "launch_frame",
    "fc:frame:button:1:target": "https://ghost-writer-three.vercel.app",
    "fc:frame:splashImageUrl": "https://ghost-writer-three.vercel.app/splash.png",
    "fc:frame:splashBackgroundColor": "#000000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <FarcasterWrapper>
            {children}
          </FarcasterWrapper>
        </Providers>
      </body>
    </html>
  );
}
