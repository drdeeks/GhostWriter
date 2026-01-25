import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from './client-providers';

export const dynamic = 'force-dynamic';

const frame = {
  version: "1",
  imageUrl: "https://ghost-writer-three.vercel.app/hero.png",
  button: {
    title: "Start Writing",
    action: {
      type: "launch_frame",
      name: "Ghost Writer",
      url: "https://ghost-writer-three.vercel.app",
      splashImageUrl: "https://ghost-writer-three.vercel.app/splash.png",
      splashBackgroundColor: "#0f172a"
    }
  }
};

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
        height: 800,
        alt: "Ghost Writer Hero",
      },
    ],
    type: "website",
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://ghost-writer-three.vercel.app/hero.png",
    "fc:frame:image:aspect_ratio": "3:2",
    "fc:frame:button:1": "Start Writing",
    "fc:frame:button:1:action": "launch_frame",
    "fc:frame:button:1:target": "https://ghost-writer-three.vercel.app",
    "fc:miniapp": JSON.stringify(frame),
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
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
