import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';
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

function envBigInt(name: string): bigint | null {
  const raw = process.env[name];
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

type Body = {
  address: string;
  signature: `0x${string}`;
  timestamp: number;
  limit?: number;
  includeCreators?: boolean;
  includeContributors?: boolean;
};

function adminMessage(timestamp: number) {
  return `GhostWriter Admin Active Addresses\nTimestamp: ${timestamp}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<Body>;

    const address = body.address;
    const signature = body.signature;
    const timestamp = body.timestamp;

    if (!address || typeof address !== 'string' || !isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    if (!signature || typeof signature !== 'string') {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (!timestamp || typeof timestamp !== 'number') {
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 });
    }

    // Replay window (5 min)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Admin signature expired' }, { status: 401 });
    }

    const sigOk = await verifyMessage({
      address: address as Address,
      message: adminMessage(timestamp),
      signature,
    });

    if (!sigOk) {
      return NextResponse.json({ error: 'Invalid admin signature' }, { status: 401 });
    }

    if (CONTRACTS.storyManager.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { error: 'StoryManager address not configured', details: 'Set NEXT_PUBLIC_STORY_MANAGER_ADDRESS' },
        { status: 500 }
      );
    }

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

    const limit = Math.max(1, Math.min(2000, Number(body.limit ?? 250)));
    const includeCreators = body.includeCreators ?? true;
    const includeContributors = body.includeContributors ?? true;

    const fromBlock = envBigInt('STORY_MANAGER_DEPLOYMENT_BLOCK') ?? 0n;

    const creators = new Set<string>();
    const contributors = new Set<string>();

    if (includeCreators) {
      const storyCreatedLogs = await publicClient.getLogs({
        address: CONTRACTS.storyManager,
        event: {
          type: 'event',
          name: 'StoryCreated',
          anonymous: false,
          inputs: [
            { indexed: true, name: 'storyId', type: 'string' },
            { indexed: true, name: 'creator', type: 'address' },
            { indexed: false, name: 'storyType', type: 'uint8' },
            { indexed: false, name: 'totalSlots', type: 'uint256' },
          ],
        },
        fromBlock,
      });

      for (const l of storyCreatedLogs as any[]) {
        const c = (l as any).args?.creator as Address | undefined;
        if (c) creators.add(c.toLowerCase());
        if (creators.size + contributors.size >= limit) break;
      }
    }

    if (includeContributors && creators.size + contributors.size < limit) {
      const wordContributedLogs = await publicClient.getLogs({
        address: CONTRACTS.storyManager,
        event: {
          type: 'event',
          name: 'WordContributed',
          anonymous: false,
          inputs: [
            { indexed: true, name: 'storyId', type: 'string' },
            { indexed: false, name: 'position', type: 'uint256' },
            { indexed: true, name: 'contributor', type: 'address' },
            { indexed: false, name: 'nftId', type: 'uint256' },
          ],
        },
        fromBlock,
      });

      for (const l of wordContributedLogs as any[]) {
        const c = (l as any).args?.contributor as Address | undefined;
        if (c) contributors.add(c.toLowerCase());
        if (creators.size + contributors.size >= limit) break;
      }
    }

    const merged = new Set<string>();
    for (const a of creators) merged.add(a);
    for (const a of contributors) merged.add(a);

    const addresses = Array.from(merged).slice(0, limit);

    return NextResponse.json({
      meta: {
        chainId: chain.id,
        fromBlock: fromBlock.toString(),
        limit,
        includeCreators,
        includeContributors,
        generatedAt: new Date().toISOString(),
      },
      counts: {
        creators: creators.size,
        contributors: contributors.size,
        unique: merged.size,
        returned: addresses.length,
      },
      addresses,
    });
  } catch (error: any) {
    console.error('Admin active-addresses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active addresses', details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
