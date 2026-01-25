import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from './client-providers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Ghost Writer",
  description: "Storytelling NFT Game - Collaborative storytelling where contributions mint hidden NFTs that reveal when stories complete. Each word earns creation credits on Base Chain.",
  manifest: '/.well-known/farcaster.json',
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    title: "Ghost Writer - NFT Game",
    description: "Collaborative stories with hidden NFTs that reveal on completion. Earn rewards on Base Chain.",
    images: [
      {
        url: "https://ghost-writer-three.vercel.app/hero.png",
        width: 1200,
        height: 630,
        alt: "Ghost Writer Hero",
      },
    ],
    type: "website",
  },
  other: {
    // Farcaster Frame v2 metadata
    "fc:frame": "vNext",
    "fc:frame:image": "https://ghost-writer-three.vercel.app/hero.png",
    "fc:frame:image:aspect_ratio": "1.91:1",
    "fc:frame:button:1": "Start Writing",
    "fc:frame:button:1:action": "launch_frame",
    "fc:frame:button:1:target": "https://ghost-writer-three.vercel.app",
    "fc:frame:button:1:post_url": "https://ghost-writer-three.vercel.app/api/webhook",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta property="fc:frame:splash_image_url" content="https://ghost-writer-three.vercel.app/splash.png" />
        <meta property="fc:frame:splash_background_color" content="#0f172a" />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
