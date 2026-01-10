import { NextRequest, NextResponse } from 'next/server';
import { CONTRACTS, NFT_ABI } from '@/lib/contracts';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Create public client for reading from blockchain
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

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
  totalSlots: number;
  filledSlots: number;
  creator: string;
  createdAt: number;
  completedAt: number;
  status: number;
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

    // Get NFT data from contract
    const rawNftData = await publicClient.readContract({
      address: CONTRACTS.nft,
      abi: NFT_ABI,
      functionName: 'getNFTData',
      args: [BigInt(tokenId)],
      authorizationList: [],
    }) as any;

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
      const rawStoryData = await publicClient.readContract({
        address: CONTRACTS.storyManager,
        abi: [
          {
            inputs: [{ name: 'storyId', type: 'string' }],
            name: 'getStory',
            outputs: [
              {
                components: [
                  { name: 'storyId', type: 'string' },
                  { name: 'title', type: 'string' },
                  { name: 'template', type: 'string' },
                  { name: 'storyType', type: 'uint8' },
                  { name: 'totalSlots', type: 'uint256' },
                  { name: 'filledSlots', type: 'uint256' },
                  { name: 'creator', type: 'address' },
                  { name: 'createdAt', type: 'uint256' },
                  { name: 'completedAt', type: 'uint256' },
                  { name: 'status', type: 'uint8' },
                ],
                name: '',
                type: 'tuple',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'getStory',
        args: [nftData.storyId],
        authorizationList: [],
      }) as any;

      const storyData: StoryData = {
        storyId: rawStoryData[0],
        title: rawStoryData[1],
        template: rawStoryData[2],
        storyType: Number(rawStoryData[3]),
        totalSlots: Number(rawStoryData[4]),
        filledSlots: Number(rawStoryData[5]),
        creator: rawStoryData[6],
        createdAt: Number(rawStoryData[7]),
        completedAt: Number(rawStoryData[8]),
        status: Number(rawStoryData[9]),
      };

      // Get Farcaster user info
      let creatorDisplay = storyData.creator.slice(0, 6) + '...' + storyData.creator.slice(-4);
      try {
        const farcasterResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farcaster-user?address=${storyData.creator}`
        );
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

      // Map story type to category
      const storyTypeNames = ['Normal', 'Epic'];
      const category = storyTypeNames[storyData.storyType] || 'Normal';
      const dateCreated = new Date(storyData.createdAt * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Generate creator NFT SVG
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
          "${storyData.title}"
        </text>
        
        <!-- Creator Info -->
        <text x="512" y="320" text-anchor="middle" fill="#F59E0B" font-family="Arial, sans-serif" font-size="28" font-weight="bold">
          Created by
        </text>
        <text x="512" y="360" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="32" font-weight="bold">
          ${creatorDisplay}
        </text>
        
        <!-- Category -->
        <text x="512" y="450" text-anchor="middle" fill="#D4AF37" font-family="Arial, sans-serif" font-size="24">
          Category: ${category}
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
            "${nftData.storyTitle}"
          </text>
          <text x="512" y="350" text-anchor="middle" fill="#F3F4F6" font-family="Arial, sans-serif" font-size="28">
            Position: ${nftData.wordPosition}/${nftData.totalWords}
          </text>
          <text x="512" y="400" text-anchor="middle" fill="#F3F4F6" font-family="Arial, sans-serif" font-size="24">
            Word Type: ${nftData.wordType}
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
            "${nftData.storyTitle}"
          </text>
          <text x="512" y="350" text-anchor="middle" fill="#10B981" font-family="Arial, sans-serif" font-size="36" font-weight="bold">
            Your Contribution:
          </text>
          <text x="512" y="420" text-anchor="middle" fill="#3B82F6" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
            "${nftData.contributedWord}"
          </text>
          <text x="512" y="500" text-anchor="middle" fill="#F3F4F6" font-family="Arial, sans-serif" font-size="24">
            Position ${nftData.wordPosition}/${nftData.totalWords} • ${nftData.wordType}
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
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating NFT image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
