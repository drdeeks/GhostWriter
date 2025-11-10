import FarcasterWrapper from "@/components/FarcasterWrapper";
import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

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

export const metadata: Metadata = {
  title: "Ghost Writer",
  description: "Community Storytelling • NFT Rewards • Base Chain",
  icons: {
    icon: '/icon.png',
  },
  other: {
    "fc:frame": JSON.stringify({ "version": "next", "imageUrl": "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_eef894e2-9571-49f4-820b-75c4415f4244-jBSXrQuX5LQc8ZgP4ui9o25wgBYd85", "button": { "title": "Open with Ohara", "action": { "type": "launch_frame", "name": "Response Formats", "url": "https://any-park-417.app.ohara.ai", "splashImageUrl": "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg", "splashBackgroundColor": "#ffffff" } } }
    )
  }
};
