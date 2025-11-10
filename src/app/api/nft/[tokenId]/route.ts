import { CONTRACTS, NFT_ABI } from '@/lib/contracts';
import { NextRequest, NextResponse } from 'next/server';
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
function generateRevealedStoryText(
  template: string,
  slots: SlotData[],
  userWord: string,
  userPosition: number
): string {
  let storyText = template;

  // Replace all [WORD_TYPE] placeholders with actual words
  slots.forEach((slot, index) => {
    if (slot.filled) {
      const placeholder = `[${slot.wordType.toUpperCase()}]`;
      let replacement = slot.word;

      // Bold the user's contributed word
      if (slot.position === userPosition) {
        replacement = `**${slot.word}**`;
      }

      storyText = storyText.replace(placeholder, replacement);
    }
  });

  return storyText;
}

/**
 * Generate Mad Libs-style template with blank lines and word type hints
 */
function generateMadLibsTemplate(template: string, slots: SlotData[]): string {
  let madLibsText = '';

  // Split template into parts and reconstruct with blanks
  slots.forEach((slot, index) => {
    const placeholder = `[${slot.wordType.toUpperCase()}]`;
    const blankLine = '____________________'; // 20 underscores

    if (template.includes(placeholder)) {
      // Replace placeholder with blank line and word type hint
      madLibsText = template.replace(
        placeholder,
        `${blankLine}\n(${slot.wordType})`
      );
    }
  });

  return madLibsText || template; // Fallback to original template if no replacements
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
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 400 }
      );
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

    if (!nftData) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Get story data to build complete context
    const rawStoryData = await publicClient.readContract({
      address: CONTRACTS.storyManager,
      abi: [
        {
          inputs: [{ name: "storyId", type: "string" }],
          name: "getStory",
          outputs: [
            {
              components: [
                { name: "storyId", type: "string" },
                { name: "title", type: "string" },
                { name: "template", type: "string" },
                { name: "storyType", type: "uint8" },
                { name: "totalSlots", type: "uint256" },
                { name: "filledSlots", type: "uint256" },
                { name: "creator", type: "address" },
                { name: "createdAt", type: "uint256" },
                { name: "completedAt", type: "uint256" },
                { name: "status", type: "uint8" },
              ],
              name: "",
              type: "tuple",
            },
          ],
          stateMutability: "view",
          type: "function",
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

    // Get all slots for the story
    const slots: SlotData[] = [];
    for (let i = 1; i <= storyData.totalSlots; i++) {
      const rawSlotData = await publicClient.readContract({
        address: CONTRACTS.storyManager,
        abi: [
          {
            inputs: [
              { name: "storyId", type: "string" },
              { name: "position", type: "uint256" },
            ],
            name: "getSlot",
            outputs: [
              {
                components: [
                  { name: "position", type: "uint256" },
                  { name: "wordType", type: "string" },
                  { name: "filled", type: "boolean" },
                  { name: "word", type: "string" },
                  { name: "contributor", type: "address" },
                  { name: "nftId", type: "uint256" },
                  { name: "timestamp", type: "uint256" },
                ],
                name: "",
                type: "tuple",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: 'getSlot',
        args: [nftData.storyId, BigInt(i)],
        authorizationList: [],
      }) as any;

      const slot: SlotData = {
        position: Number(rawSlotData[0]),
        wordType: rawSlotData[1],
        filled: rawSlotData[2],
        word: rawSlotData[3],
        contributor: rawSlotData[4],
        nftId: Number(rawSlotData[5]),
        timestamp: Number(rawSlotData[6]),
      };
      slots.push(slot);
    }

    // Generate metadata based on NFT type
    let metadata: any;

    if (nftData.isCreatorNFT) {
      // Creator NFT - shows Mad Libs template
      const madLibsTemplate = generateMadLibsTemplate(storyData.template, slots);

      metadata = {
        name: `Ghost Writer - "${storyData.title}" (Creator Edition)`,
        description: `Original Mad Libs template for "${storyData.title}". This creator NFT contains the complete story structure with blank spaces for all word contributions.`,
        image: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nft/${tokenId}/image`,
        attributes: [
          {
            trait_type: 'Type',
            value: 'Creator NFT',
          },
          {
            trait_type: 'Story',
            value: storyData.title,
          },
          {
            trait_type: 'Story ID',
            value: storyData.storyId,
          },
          {
            trait_type: 'Created',
            value: new Date(storyData.createdAt * 1000).toISOString().split('T')[0],
          },
          {
            trait_type: 'Status',
            value: 'Complete',
          },
        ],
        properties: {
          storyId: storyData.storyId,
          storyTitle: storyData.title,
          template: madLibsTemplate,
          totalSlots: storyData.totalSlots,
          creator: storyData.creator,
          createdAt: storyData.createdAt,
          completedAt: storyData.completedAt,
        },
      };
    } else {
      // Contributor NFT
      if (!nftData.revealed) {
        // Hidden state
        metadata = {
          name: `Ghost Writer #${tokenId}`,
          description: `A mysterious word contribution to "${storyData.title}". Position ${nftData.wordPosition}/${nftData.totalWords} - ${nftData.wordType}. The story awaits completion...`,
          image: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nft/${tokenId}/image`,
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
          nftData.contributedWord,
          nftData.wordPosition
        );

        metadata = {
          name: `Ghost Writer #${tokenId} - Revealed`,
          description: `Story revealed! Your "${nftData.contributedWord}" contribution appears in bold. "${storyData.title}" is now complete.`,
          image: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nft/${tokenId}/image`,
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

    return NextResponse.json(metadata);

  } catch (error) {
    console.error('Error generating NFT metadata:', error);
    return NextResponse.json(
      { error: 'Failed to generate NFT metadata' },
      { status: 500 }
    );
  }
}
