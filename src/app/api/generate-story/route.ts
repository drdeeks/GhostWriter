import { CONTRACTS } from '@/lib/contracts';
import { aiService, type StoryTypeName } from '@/lib/ai-service';
import { NextResponse } from 'next/server';
import { base, baseSepolia } from 'viem/chains';
import { concatHex, isAddress, keccak256, toBytes, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

function getChain() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532');
  return chainId === 8453 ? base : baseSepolia;
}

function getCategoryEnum(category: string): number {
  const categories = [
    'adventure',
    'fantasy',
    'comedy',
    'mystery',
    'scifi',
    'horror',
    'romance',
    'crypto',
    'sports',
    'animals',
    'school',
    'superheroes',
    'friendship',
    'holidays',
    'food',
    'nature',
    'history',
    'random',
  ];

  const idx = categories.indexOf(category.toLowerCase());
  return idx >= 0 ? idx : categories.length - 1;
}

function getStoryTypeEnum(storyType: StoryTypeName): number {
  if (storyType === 'mini') return 0;
  if (storyType === 'normal') return 1;
  return 2;
}

const ZERO32 = (`0x${'00'.repeat(32)}`) as Hex;

function hashWordTypes(wordTypes: string[]): Hex {
  let acc: Hex = ZERO32;
  for (const wt of wordTypes) {
    const wtHash = keccak256(toBytes(wt));
    acc = keccak256(concatHex([acc, wtHash]));
  }
  return acc;
}

/**
 * POST /api/generate-story
 * Returns EXACTLY 5 story suggestions + EIP-712 signatures for StoryManager.createStoryApproved.
 */
export async function POST(request: Request) {
  const startTime = performance.now();

  try {
    const body = await request.json().catch(() => ({}));
    const { category, storyType, userAddress } = body;

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (!storyType || (storyType !== 'mini' && storyType !== 'normal' && storyType !== 'epic')) {
      return NextResponse.json({ error: 'Invalid storyType' }, { status: 400 });
    }

    if (!userAddress || typeof userAddress !== 'string' || !isAddress(userAddress)) {
      return NextResponse.json({ error: 'Invalid userAddress' }, { status: 400 });
    }

    if (!process.env.STORY_TEMPLATE_SIGNER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Server signer not configured', details: 'Missing STORY_TEMPLATE_SIGNER_PRIVATE_KEY' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS || !isAddress(process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS)) {
      return NextResponse.json(
        { error: 'StoryManager address not configured', details: 'Missing NEXT_PUBLIC_STORY_MANAGER_ADDRESS' },
        { status: 500 }
      );
    }

    const chain = getChain();

    const suggestions = await aiService.generateStorySuggestions(category, storyType, 5);

    const account = privateKeyToAccount(process.env.STORY_TEMPLATE_SIGNER_PRIVATE_KEY as Hex);
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 15 * 60);

    const domain = {
      name: 'GhostWriterStoryManager',
      version: '1',
      chainId: chain.id,
      verifyingContract: CONTRACTS.storyManager as Address,
    };

    const types = {
      CreateStory: [
        { name: 'creator', type: 'address' },
        { name: 'storyId', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'template', type: 'string' },
        { name: 'storyType', type: 'uint8' },
        { name: 'category', type: 'uint8' },
        { name: 'wordTypesHash', type: 'bytes32' },
        { name: 'expiresAt', type: 'uint256' },
      ],
    } as const;

    const now = Date.now();

    const response = [];
    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i];
      const storyId = `story_${now}_${i}`;

      const wordTypesHash = hashWordTypes(s.wordTypes);

      const message = {
        creator: userAddress as Address,
        storyId,
        title: s.title,
        template: s.template,
        storyType: getStoryTypeEnum(storyType),
        category: getCategoryEnum(category),
        wordTypesHash,
        expiresAt,
      } as const;

      const signature = await account.signTypedData({
        domain,
        types,
        primaryType: 'CreateStory',
        message,
      });

      response.push({
        storyId,
        title: s.title,
        template: s.template,
        wordTypes: s.wordTypes,
        generatedBy: s.generatedBy,
        expiresAt: expiresAt.toString(),
        signature,
      });
    }

    const processingTime = performance.now() - startTime;

    return NextResponse.json(
      {
        suggestions: response,
        meta: {
          processingTime: Math.round(processingTime),
          timestamp: new Date().toISOString(),
          count: response.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-Processing-Time': processingTime.toString(),
        },
      }
    );
  } catch (error: any) {
    const processingTime = performance.now() - startTime;

    console.error('Story generation error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    return NextResponse.json(
      {
        error: 'Story generation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        meta: {
          processingTime: Math.round(processingTime),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
