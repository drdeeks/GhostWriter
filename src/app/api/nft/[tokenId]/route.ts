import { CONTRACTS, NFT_ABI, STORY_MANAGER_ABI } from '@/lib/contracts';
import { NextRequest, NextResponse } from 'next/server';
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

interface SlotData {
  position: number;
  wordType: string;
  filled: boolean;
  word: string;
  contributor: string;
  nftId: number;
  timestamp: number;
}

/**
 * Generate complete story text with user's word bolded
 */
function generateRevealedStoryText(template: string, slots: SlotData[], userPosition: number): string {
  const ordered = [...slots].sort((a, b) => a.position - b.position);
  let i = 0;

  // Replace placeholders in-order so repeated word types map deterministically to positions.
  return template.replace(/\[[A-Za-z_]+\]/g, (placeholder) => {
    const slot = ordered[i++];
    if (!slot || !slot.filled) return placeholder;

    if (slot.position === userPosition) {
      return `**${slot.word}**`;
    }

    return slot.word;
  });
}


/**
 * GET /api/nft/[tokenId] - Generate dynamic NFT metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  try {
    const tokenIdNum = parseInt(tokenId);

    if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    if (CONTRACTS.nft.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { error: 'NFT contract address not configured', details: 'Set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS' },
        { status: 500 }
      );
    }
    if (CONTRACTS.storyManager.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { error: 'StoryManager address not configured', details: 'Set NEXT_PUBLIC_STORY_MANAGER_ADDRESS' },
        { status: 500 }
      );
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

    if (!nftData) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Get story data to build complete context
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
      creator: (rawStoryData.creator ?? rawStoryData[7]) as string,
      createdAt: Number(rawStoryData.createdAt ?? rawStoryData[8]),
      completedAt: Number(rawStoryData.completedAt ?? rawStoryData[9]),
      status: Number(rawStoryData.status ?? rawStoryData[10]),
      shareCount: Number(rawStoryData.shareCount ?? rawStoryData[11]),
    };

    // Fetch all slots via multicall (much faster and more reliable than sequential reads)
    const slotCalls = Array.from({ length: storyData.totalSlots }, (_, idx) => {
      const pos = BigInt(idx + 1);
      return {
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'getSlot' as const,
        args: [nftData.storyId, pos] as const,
      };
    });

    const slotResults = await publicClient.multicall({ contracts: slotCalls as any });

    const slots: SlotData[] = slotResults
      .map((r: any) => (r.status === 'success' ? (r.result as any) : null))
      .filter(Boolean)
      .map((raw: any) => ({
        position: Number(raw.position ?? raw[0]),
        wordType: raw.wordType ?? raw[1],
        filled: Boolean(raw.filled ?? raw[2]),
        word: raw.word ?? raw[3],
        contributor: (raw.contributor ?? raw[4]) as string,
        nftId: Number(raw.nftId ?? raw[5]),
        timestamp: Number(raw.timestamp ?? raw[6]),
      }));

    // Generate metadata based on NFT type
    let metadata: any;

    if (nftData.isCreatorNFT) {
      // Creator NFT - Only includes: user name/FID, story title, category, date created
      // Fetch Farcaster user info for creator (best-effort)
      const origin = new URL(request.url).origin;
      let creatorName = '';
      let creatorFid = '';

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const farcasterResponse = await fetch(`${origin}/api/farcaster-user?address=${storyData.creator}`, {
          signal: controller.signal,
          // Avoid caching stale identity data
          cache: 'no-store',
        });

        clearTimeout(timeout);

        if (farcasterResponse.ok) {
          const farcasterData = await farcasterResponse.json();
          creatorName = farcasterData.username || farcasterData.displayName || '';
          creatorFid = farcasterData.fid ? `FID: ${farcasterData.fid}` : '';
        }
      } catch (error) {
        console.warn('Failed to fetch Farcaster user info:', error);
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
      const dateCreated = new Date(storyData.createdAt * 1000).toISOString().split('T')[0];

      // Format creator name display
      const creatorDisplay = creatorName 
        ? `@${creatorName}${creatorFid ? ` (${creatorFid})` : ''}`
        : creatorFid || storyData.creator.slice(0, 6) + '...' + storyData.creator.slice(-4);

      metadata = {
        name: `Ghost Writer Creator - "${storyData.title}"`,
        description: `Creator NFT for "${storyData.title}" by ${creatorDisplay}. Created on ${dateCreated}.`,
        image: `${origin}/api/nft/${tokenId}/image`,
        attributes: [
          {
            trait_type: 'Creator',
            value: creatorDisplay,
          },
          {
            trait_type: 'Story Title',
            value: storyData.title,
          },
          {
            trait_type: 'Category',
            value: category,
          },
          {
            trait_type: 'Story Type',
            value: storyTypeName,
          },
          {
            trait_type: 'Date Created',
            value: dateCreated,
          },
        ],
        properties: {
          creator: storyData.creator,
          creatorName: creatorName || null,
          creatorFid: creatorFid || null,
          storyTitle: storyData.title,
          category: category,
          storyType: storyTypeName,
          dateCreated: dateCreated,
          storyId: storyData.storyId,
        },
      };
    } else {
      // Contributor NFT
      if (!nftData.revealed) {
        // Hidden state
        const origin = new URL(request.url).origin;

        metadata = {
          name: `Ghost Writer #${tokenId} - Hidden`,
          description: `This NFT is hidden until the story is complete. Contribute to reveal!`,
          image: `${origin}/api/nft/${tokenId}/image?hidden=true`,
          attributes: [
            {
              trait_type: 'Story',
              value: storyData.title,
            },
            {
              trait_type: 'Position',
              value: `${nftData.wordPosition}/${nftData.totalWords}`,
            },
            {
              trait_type: 'Word Type',
              value: nftData.wordType,
            },
            {
              trait_type: 'Status',
              value: 'Hidden',
            },
            {
              trait_type: 'Contribution Date',
              value: new Date(nftData.contributionTimestamp * 1000).toISOString().split('T')[0],
            },
          ],
        };
      } else {
        // Revealed state - show complete story with bolded word
        const fullStoryText = generateRevealedStoryText(
          storyData.template,
          slots,
          nftData.wordPosition
        );

        const origin = new URL(request.url).origin;

        metadata = {
          name: `Ghost Writer #${tokenId} - Revealed`,
          description: `Story revealed! Your "${nftData.contributedWord}" contribution appears in bold. "${storyData.title}" is now complete.`,
          image: `${origin}/api/nft/${tokenId}/image`,
          attributes: [
            {
              trait_type: 'Story',
              value: storyData.title,
            },
            {
              trait_type: 'Position',
              value: `${nftData.wordPosition}/${nftData.totalWords}`,
            },
            {
              trait_type: 'Word Type',
              value: nftData.wordType,
            },
            {
              trait_type: 'Contributed Word',
              value: nftData.contributedWord,
            },
            {
              trait_type: 'Status',
              value: 'Revealed',
            },
            {
              trait_type: 'Contribution Date',
              value: new Date(nftData.contributionTimestamp * 1000).toISOString().split('T')[0],
            },
          ],
          properties: {
            storyId: storyData.storyId,
            storyTitle: storyData.title,
            fullStoryText: fullStoryText,
            contributedWord: nftData.contributedWord,
            wordPosition: nftData.wordPosition,
            contributor: nftData.contributor,
            contributionTimestamp: nftData.contributionTimestamp,
          },
        };
      }
    }

    return NextResponse.json(metadata, {
      headers: {
        // Keep metadata fresh: reveal state changes from hidden -> revealed
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Error generating NFT metadata:', error);
    return NextResponse.json(
      { error: 'Failed to generate NFT metadata' },
      { status: 500 }
    );
  }
}
