import { CONTRACTS, LIQUIDITY_POOL_ABI, NFT_ABI, STORY_MANAGER_ABI, TOKEN_ABI } from '@/lib/contracts';
import { NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { base, baseSepolia, hardhat } from 'viem/chains';

function getChain() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532');
  if (chainId === 8453) return base;
  if (chainId === 31337) return hardhat;
  return baseSepolia;
}

function getRpcUrl() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532');
  if (chainId === 8453) return process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  if (chainId === 31337) return 'http://127.0.0.1:8545';
  return process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
}

export async function GET(request: Request) {
  try {
    const chain = getChain();
    const publicClient = createPublicClient({ chain, transport: http(getRpcUrl()) });
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');

    let isAdmin = false;
    if (userAddress) {
        const owner = await publicClient.readContract({
            address: CONTRACTS.storyManager,
            abi: STORY_MANAGER_ABI,
            functionName: 'owner',
        }) as `0x${string}`;

        if (userAddress.toLowerCase() === owner.toLowerCase()) {
            isAdmin = true;
        }
    }

    if (!isAdmin && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [totalNFTs, totalStories, activeStories, poolBalanceWei, tokenTotalSupply] = await Promise.all([
      publicClient.readContract({ address: CONTRACTS.nft, abi: NFT_ABI, functionName: 'totalSupply' }) as Promise<bigint>,
      publicClient.readContract({ address: CONTRACTS.storyManager, abi: STORY_MANAGER_ABI, functionName: 'getTotalStories' }) as Promise<bigint>,
      publicClient.readContract({ address: CONTRACTS.storyManager, abi: STORY_MANAGER_ABI, functionName: 'getActiveStoriesCount' }) as Promise<bigint>,
      publicClient.readContract({ address: CONTRACTS.liquidityPool, abi: LIQUIDITY_POOL_ABI, functionName: 'getBalance' }) as Promise<bigint>,
      publicClient.readContract({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: 'totalSupply' }) as Promise<bigint>,
    ]);

    return NextResponse.json({
      meta: { chainId: chain.id, neynarActive: !!process.env.NEYNAR_API_KEY },
      counts: {
        nftsGenerated: totalNFTs.toString(),
        storiesCreated: totalStories.toString(),
        activeStories: activeStories.toString(),
        completedStories: (totalStories - activeStories).toString(),
        uniqueActiveAddresses: '0',
        liquidityWei: poolBalanceWei.toString(),
        tokenTotalSupply: tokenTotalSupply.toString(),
        farcasterMentions: '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}