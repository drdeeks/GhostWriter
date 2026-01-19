import { NextRequest, NextResponse } from 'next/server';
import { CONTRACTS, NFT_ABI, STORY_MANAGER_ABI } from '@/lib/contracts';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

function getChain() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532');
  return chainId === 8453 ? base : baseSepolia;
}

function getRpcUrl() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532');
  if (chainId === 8453) {
    return process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  }
  return process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
}

const chain = getChain();
const publicClient = createPublicClient({ chain, transport: http(getRpcUrl()) });

function escapeXml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, Math.max(0, max - 1)) + '…';
}

interface NFTData {
  storyId: string;
  storyTitle: string;
  wordPosition: number;
  totalWords: number;
  wordType: string;
  contributedWord: string;
  contributor: string;
  contributionTimestamp: number;
  storyComplete: boolean;
  revealed: boolean;
  isCreatorNFT: boolean;
  fullStoryTemplate: string;
}

interface StoryData {
  storyId: string;
  title: string;
  template: string;
  storyType: number;
  category: number;
  totalSlots: number;
  filledSlots: number;
  creator: string;
  createdAt: number;
  completedAt: number;
  status: number;
  shareCount: number;
}

/**
 * Generate SVG image for NFT based on token ID
 * Creator NFTs show: user name/FID, story title, category, date created
 * Contributor NFTs show story context
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  const { searchParams } = new URL(request.url);
  const hidden = searchParams.get('hidden') === 'true';

  try {
    const tokenIdNum = parseInt(tokenId);

    if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
      return new NextResponse('Invalid token ID', { status: 400 });
    }

    if (CONTRACTS.nft.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return new NextResponse('NFT contract address not configured', { status: 500 });
    }
    if (CONTRACTS.storyManager.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return new NextResponse('StoryManager address not configured', { status: 500 });
    }

    // Get NFT data from contract
    const rawNftData = (await publicClient.readContract({
      address: CONTRACTS.nft,
      abi: NFT_ABI,
      functionName: 'getNFTData',
      args: [BigInt(tokenIdNum)],
    })) as any;

    const nftData: NFTData = {
      storyId: rawNftData[0],
      storyTitle: rawNftData[1],
      wordPosition: Number(rawNftData[2]),
      totalWords: Number(rawNftData[3]),
      wordType: rawNftData[4],
      contributedWord: rawNftData[5],
      contributor: rawNftData[6],
      contributionTimestamp: Number(rawNftData[7]),
      storyComplete: rawNftData[8],
      revealed: rawNftData[9],
      isCreatorNFT: rawNftData[10],
      fullStoryTemplate: rawNftData[11],
    };

    let svg = '';

    if (nftData.isCreatorNFT) {
      // Creator NFT - Only show: user name/FID, story title, category, date created
      // Get story data for category
      const rawStoryData = (await publicClient.readContract({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'getStory',
        args: [nftData.storyId],
      })) as any;

      const storyData: StoryData = {
        storyId: rawStoryData.storyId ?? rawStoryData[0],
        title: rawStoryData.title ?? rawStoryData[1],
        template: rawStoryData.template ?? rawStoryData[2],
        storyType: Number(rawStoryData.storyType ?? rawStoryData[3]),
        category: Number(rawStoryData.category ?? rawStoryData[4]),
        totalSlots: Number(rawStoryData.totalSlots ?? rawStoryData[5]),
        filledSlots: Number(rawStoryData.filledSlots ?? rawStoryData[6]),
        creator: rawStoryData.creator ?? rawStoryData[7],
        createdAt: Number(rawStoryData.createdAt ?? rawStoryData[8]),
        completedAt: Number(rawStoryData.completedAt ?? rawStoryData[9]),
        status: Number(rawStoryData.status ?? rawStoryData[10]),
        shareCount: Number(rawStoryData.shareCount ?? rawStoryData[11]),
      };

      // Get Farcaster user info
      let creatorDisplay = storyData.creator.slice(0, 6) + '...' + storyData.creator.slice(-4);
      try {
        const origin = new URL(request.url).origin;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const farcasterResponse = await fetch(`${origin}/api/farcaster-user?address=${storyData.creator}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeout);
        if (farcasterResponse.ok) {
          const farcasterData = await farcasterResponse.json();
          const username = farcasterData.username || farcasterData.displayName || '';
          const fid = farcasterData.fid;
          if (username) {
            creatorDisplay = `@${username}${fid ? ` (FID: ${fid})` : ''}`;
          } else if (fid) {
            creatorDisplay = `FID: ${fid}`;
          }
        }
      } catch (error) {
        // Use default display
      }

      const storyTypeNames = ['Mini', 'Normal', 'Epic'];
      const storyTypeName = storyTypeNames[storyData.storyType] || 'Normal';

      const categoryNames = [
        'Adventure',
        'Fantasy',
        'Comedy',
        'Mystery',
        'Sci-Fi',
        'Horror',
        'Romance',
        'Crypto',
        'Sports',
        'Animals',
        'School',
        'Superheroes',
        'Friendship',
        'Holidays',
        'Food',
        'Nature',
        'History',
        'Random',
      ];

      const category = categoryNames[storyData.category] || 'Random';
      const dateCreated = new Date(storyData.createdAt * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Generate creator NFT SVG
      const safeTitle = escapeXml(truncate(storyData.title, 60));
      const safeCreator = escapeXml(truncate(creatorDisplay, 48));

      svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#2D1B69;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1A1A2A;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#D4AF37;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#bg)"/>
        
        <!-- Header -->
        <text x="512" y="80" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="42" font-weight="bold">
          GHOST WRITER
        </text>
        <text x="512" y="120" text-anchor="middle" fill="#D4AF37" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
          CREATOR EDITION
        </text>
        
        <!-- Story Title -->
        <text x="512" y="220" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="36" font-weight="bold">
          "${safeTitle}"
        </text>
        
        <!-- Creator Info -->
        <text x="512" y="320" text-anchor="middle" fill="#F59E0B" font-family="Arial, sans-serif" font-size="28" font-weight="bold">
          Created by
        </text>
        <text x="512" y="360" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="32" font-weight="bold">
          ${safeCreator}
        </text>
        
        <!-- Category -->
        <text x="512" y="450" text-anchor="middle" fill="#D4AF37" font-family="Arial, sans-serif" font-size="24">
          Category: ${escapeXml(category)}
        </text>
        <text x="512" y="480" text-anchor="middle" fill="#D4AF37" font-family="Arial, sans-serif" font-size="20">
          Type: ${escapeXml(storyTypeName)}
        </text>
        
        <!-- Date Created -->
        <text x="512" y="500" text-anchor="middle" fill="#F3F4F6" font-family="Arial, sans-serif" font-size="22">
          Created: ${dateCreated}
        </text>
        
        <!-- Decorative Elements -->
        <circle cx="512" cy="700" r="80" fill="url(#accent)" opacity="0.2"/>
        <text x="512" y="710" text-anchor="middle" fill="#D4AF37" font-family="Arial, sans-serif" font-size="48">
          ✍️
        </text>
        
        <!-- Footer -->
        <text x="512" y="950" text-anchor="middle" fill="#6B7280" font-family="Arial, sans-serif" font-size="18">
          Token ID: #${tokenId}
        </text>
      </svg>
      `;
    } else {
      // Contributor NFT - show hidden or revealed state
      if (hidden || !nftData.revealed) {
        // Hidden state
        svg = `
        <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#2D1B69;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1A1A2A;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="1024" height="1024" fill="url(#bg)"/>
          <text x="512" y="100" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
            GHOST WRITER
          </text>
          <text x="512" y="200" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="32">
            "${escapeXml(truncate(nftData.storyTitle, 60))}"
          </text>
          <text x="512" y="350" text-anchor="middle" fill="#F3F4F6" font-family="Arial, sans-serif" font-size="28">
            Position: ${nftData.wordPosition}/${nftData.totalWords}
          </text>
          <text x="512" y="400" text-anchor="middle" fill="#F3F4F6" font-family="Arial, sans-serif" font-size="24">
            Word Type: ${escapeXml(truncate(nftData.wordType, 24))}
          </text>
          <circle cx="512" cy="600" r="120" fill="#D4AF37" opacity="0.3"/>
          <text x="512" y="610" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48">
            🔒
          </text>
          <text x="512" y="750" text-anchor="middle" fill="#F59E0B" font-family="Arial, sans-serif" font-size="28" font-style="italic">
            "Your word awaits reveal..."
          </text>
        </svg>
        `;
      } else {
        // Revealed state - show word contribution
        svg = `
        <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#2D1B69;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1A1A2A;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="1024" height="1024" fill="url(#bg)"/>
          <text x="512" y="100" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
            GHOST WRITER
          </text>
          <text x="512" y="200" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="32">
            "${escapeXml(truncate(nftData.storyTitle, 60))}"
          </text>
          <text x="512" y="350" text-anchor="middle" fill="#10B981" font-family="Arial, sans-serif" font-size="36" font-weight="bold">
            Your Contribution:
          </text>
          <text x="512" y="420" text-anchor="middle" fill="#3B82F6" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
            "${escapeXml(truncate(nftData.contributedWord, 24))}"
          </text>
          <text x="512" y="500" text-anchor="middle" fill="#F3F4F6" font-family="Arial, sans-serif" font-size="24">
            Position ${nftData.wordPosition}/${nftData.totalWords} • ${escapeXml(truncate(nftData.wordType, 24))}
          </text>
          <text x="512" y="600" text-anchor="middle" fill="#D4AF37" font-family="Arial, sans-serif" font-size="28">
            ✨ Story Complete ✨
          </text>
        </svg>
        `;
      }
    }

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        // Keep images reasonably fresh for hidden -> revealed transitions
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Error generating NFT image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
