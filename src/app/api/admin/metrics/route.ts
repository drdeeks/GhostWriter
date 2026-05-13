import { CONTRACTS, LIQUIDITY_POOL_ABI, NFT_ABI, STORY_MANAGER_ABI, TOKEN_ABI } from '@/lib/contracts';
import { NextResponse } from 'next/server';
import { createPublicClient, http, type Address, type Log } from 'viem';
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

export async function GET() {
  try {
    const chain = getChain();
    const publicClient = createPublicClient({ chain, transport: http(getRpcUrl()) });

    const warnings: string[] = [];
    const isZero = (addr: string) => addr.toLowerCase() === '0x0000000000000000000000000000000000000000';

    if (isZero(CONTRACTS.storyManager)) {
      return NextResponse.json(
        { error: 'StoryManager address not configured', details: 'Set NEXT_PUBLIC_STORY_MANAGER_ADDRESS' },
        { status: 500 }
      );
    }
    if (isZero(CONTRACTS.nft)) warnings.push('NEXT_PUBLIC_NFT_CONTRACT_ADDRESS not configured; nftsGenerated will be 0');
    if (isZero(CONTRACTS.liquidityPool)) warnings.push('NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS not configured; liquidityWei will be 0');
    if (isZero(CONTRACTS.token)) warnings.push('NEXT_PUBLIC_TOKEN_ADDRESS not configured; token stats will be 0');

    const storyManagerFromBlock = envBigInt('STORY_MANAGER_DEPLOYMENT_BLOCK') ?? 0n;
    const tokenFromBlock = envBigInt('TOKEN_DEPLOYMENT_BLOCK') ?? 0n;

    // Core onchain reads (fast)
    const [totalNFTs, totalStories, activeStories, poolBalanceWei, tokenTotalSupply] = await Promise.all([
      isZero(CONTRACTS.nft)
        ? Promise.resolve(0n)
        : (publicClient.readContract({
            address: CONTRACTS.nft,
            abi: NFT_ABI,
            functionName: 'totalSupply',
          }) as Promise<bigint>),
      publicClient.readContract({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'getTotalStories',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'getActiveStoriesCount',
      }) as Promise<bigint>,
      isZero(CONTRACTS.liquidityPool)
        ? Promise.resolve(0n)
        : (publicClient.readContract({
            address: CONTRACTS.liquidityPool,
            abi: LIQUIDITY_POOL_ABI,
            functionName: 'getBalance',
          }) as Promise<bigint>),
      isZero(CONTRACTS.token)
        ? Promise.resolve(0n)
        : (publicClient.readContract({
            address: CONTRACTS.token,
            abi: TOKEN_ABI,
            functionName: 'totalSupply',
          }) as Promise<bigint>),
    ]);

    // StoryManager event-based stats
    const [storyCreatedLogs, wordContributedLogs, storyCompletedLogs, storyFinalizedLogs] = await Promise.all([
      publicClient.getLogs({
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
        fromBlock: storyManagerFromBlock,
      }),
      publicClient.getLogs({
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
        fromBlock: storyManagerFromBlock,
      }),
      publicClient.getLogs({
        address: CONTRACTS.storyManager,
        event: {
          type: 'event',
          name: 'StoryCompleted',
          anonymous: false,
          inputs: [
            { indexed: true, name: 'storyId', type: 'string' },
            { indexed: false, name: 'completedAt', type: 'uint256' },
          ],
        },
        fromBlock: storyManagerFromBlock,
      }),
      publicClient.getLogs({
        address: CONTRACTS.storyManager,
        event: {
          type: 'event',
          name: 'StoryFinalized',
          anonymous: false,
          inputs: [
            { indexed: true, name: 'storyId', type: 'string' },
            { indexed: true, name: 'creatorTokenId', type: 'uint256' },
          ],
        },
        fromBlock: storyManagerFromBlock,
      }),
    ]);

    const wordsContributed = BigInt(wordContributedLogs.length);
    const storiesCreated = BigInt(storyCreatedLogs.length);
    const storiesCompleted = BigInt(storyCompletedLogs.length);
    const storiesFinalized = BigInt(storyFinalizedLogs.length);

    // Unique active addresses: anyone who created a story or contributed a word
    const activeAddressSet = new Set<string>();
    for (const l of storyCreatedLogs) {
      const creator = (l as any).args?.creator as Address | undefined;
      if (creator) activeAddressSet.add(creator.toLowerCase());
    }
    for (const l of wordContributedLogs) {
      const contributor = (l as any).args?.contributor as Address | undefined;
      if (contributor) activeAddressSet.add(contributor.toLowerCase());
    }

    let tokenHolderCount = 0;

    if (!isZero(CONTRACTS.token)) {
      // Token holders: index Transfer events and count addresses with balance>0
      // NOTE: this can be expensive on large histories; we cap unique candidates.
      const transferLogs = await publicClient.getLogs({
        address: CONTRACTS.token,
        event: {
          type: 'event',
          name: 'Transfer',
          anonymous: false,
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
          ],
        },
        fromBlock: tokenFromBlock,
      });

      const candidates = new Set<string>();
      for (const l of transferLogs as Log[]) {
        const from = (l as any).args?.from as Address | undefined;
        const to = (l as any).args?.to as Address | undefined;
        if (from && from !== '0x0000000000000000000000000000000000000000') candidates.add(from.toLowerCase());
        if (to && to !== '0x0000000000000000000000000000000000000000') candidates.add(to.toLowerCase());
        if (candidates.size > 500) break;
      }

      const candidateList = Array.from(candidates) as Address[];

      if (candidateList.length > 0) {
        const calls = candidateList.map((addr) => ({
          address: CONTRACTS.token,
          abi: TOKEN_ABI,
          functionName: 'balanceOf',
          args: [addr],
        })) as any;

        const balances = await publicClient.multicall({
          contracts: calls,
          allowFailure: true,
        });

        for (const res of balances) {
          const bal = (res.status === 'success' ? (res.result as bigint) : 0n) ?? 0n;
          if (bal > 0n) tokenHolderCount++;
        }
      }
    }

    const completedStoriesOnchain = totalStories > activeStories ? totalStories - activeStories : 0n;

    return NextResponse.json({
      meta: {
        chainId: chain.id,
        storyManagerFromBlock: storyManagerFromBlock.toString(),
        tokenFromBlock: tokenFromBlock.toString(),
        tokenHolderCandidateCap: 500,
        generatedAt: new Date().toISOString(),
        warnings,
      },
      counts: {
        nftsGenerated: totalNFTs.toString(),
        storiesCreated: totalStories.toString(),
        storiesCreatedByEvents: storiesCreated.toString(),
        wordsContributed: wordsContributed.toString(),
        completedStories: completedStoriesOnchain.toString(),
        completedStoriesByEvents: storiesCompleted.toString(),
        activeStories: activeStories.toString(),
        finalizedStoriesByEvents: storiesFinalized.toString(),
        uniqueActiveAddresses: String(activeAddressSet.size),
        liquidityWei: poolBalanceWei.toString(),
        tokenTotalSupply: tokenTotalSupply.toString(),
        tokenHoldersApprox: String(tokenHolderCount),
      },
    });
  } catch (error: any) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to compute admin metrics', details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
