import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';
import { aiService, type StoryTypeName } from '@/lib/ai-service';
import { NextResponse } from 'next/server';
import { createPublicClient, http, isAddress, verifyMessage, type Address } from 'viem';
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

type Body = {
  address: string;
  signature: `0x${string}`;
  timestamp: number;
  category: string;
  storyType: StoryTypeName;
  extraInstructions?: string;
};

function adminMessage(timestamp: number) {
  return `GhostWriter Admin Generate Story\nTimestamp: ${timestamp}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<Body>;

    const address = body.address;
    const signature = body.signature;
    const timestamp = body.timestamp;
    const category = body.category;
    const storyType = body.storyType;

    if (!address || typeof address !== 'string' || !isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    if (!signature || typeof signature !== 'string') {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (!timestamp || typeof timestamp !== 'number') {
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 });
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (!storyType || (storyType !== 'mini' && storyType !== 'normal' && storyType !== 'epic')) {
      return NextResponse.json({ error: 'Invalid storyType' }, { status: 400 });
    }

    // Basic replay window (5 minutes)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Admin signature expired' }, { status: 401 });
    }

    const ok = await verifyMessage({
      address: address as Address,
      message: adminMessage(timestamp),
      signature,
    });

    if (!ok) {
      return NextResponse.json({ error: 'Invalid admin signature' }, { status: 401 });
    }

    // Confirm this address is the current onchain owner
    const chain = getChain();
    const publicClient = createPublicClient({ chain, transport: http(getRpcUrl()) });

    const owner = (await publicClient.readContract({
      address: CONTRACTS.storyManager,
      abi: STORY_MANAGER_ABI,
      functionName: 'owner',
    })) as Address;

    if (owner.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const suggestions = await aiService.generateStorySuggestionsAdmin(
      category,
      storyType,
      5,
      body.extraInstructions || ''
    );

    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        title: s.title,
        template: s.template,
        wordTypes: s.wordTypes,
        generatedBy: s.generatedBy,
      })),
      meta: { timestamp: new Date().toISOString(), count: 5 },
    });
  } catch (error: any) {
    console.error('Admin generate-story error:', error);
    return NextResponse.json(
      { error: 'Admin story generation failed', details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
