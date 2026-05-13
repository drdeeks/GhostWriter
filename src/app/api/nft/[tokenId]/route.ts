import { CONTRACTS, NFT_ABI, STORY_MANAGER_ABI } from '@/lib/contracts';
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
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

const chain = getChain();
const publicClient = createPublicClient({ chain, transport: http(getRpcUrl()) });

export async function GET(request: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  try {
    const tokenIdNum = parseInt(tokenId);
    const rawNftData = (await publicClient.readContract({
      address: CONTRACTS.nft,
      abi: NFT_ABI,
      functionName: 'getNFTData',
      args: [BigInt(tokenIdNum)],
    })) as any;

    const data = {
      storyId: rawNftData[0],
      storyTitle: rawNftData[1],
      wordPosition: Number(rawNftData[2]),
      totalWords: Number(rawNftData[3]),
      wordType: rawNftData[4],
      contributedWord: rawNftData[5],
      contributor: rawNftData[6],
      timestamp: Number(rawNftData[7]),
      storyComplete: rawNftData[8],
      revealed: rawNftData[9],
      isCreatorNFT: rawNftData[10],
    };

    const origin = new URL(request.url).origin;
    const isBaseOrFarcaster = request.headers.get('user-agent')?.includes('Farcaster') || request.headers.get('user-agent')?.includes('Base');

    let displayName = data.contributor.slice(0, 6) + '...' + data.contributor.slice(-4);
    if (isBaseOrFarcaster) {
        try {
            const fcRes = await fetch(`${origin}/api/farcaster-user?address=${data.contributor}`);
            const fcData = await fcRes.json();
            if (fcData.username) displayName = `@${fcData.username}`;
        } catch (e) {}
    }

    const metadata = {
      name: `Ghost Writer #${tokenId} - ${data.revealed ? 'Revealed' : 'Pending'}`,
      description: data.revealed
        ? `Completed story contribution. Word: ${data.contributedWord}. Revealed on ${new Date(data.timestamp * 1000).toISOString().split('T')[0]}.`
        : `Pending reveal. Position ${data.wordPosition}/${data.totalWords} in story "${data.storyTitle}".`,
      image: `${origin}/api/nft/${tokenId}/image${!data.revealed ? '?hidden=true' : ''}`,
      attributes: [
        { trait_type: 'Story', value: data.storyTitle },
        { trait_type: 'Position', value: `${data.wordPosition}/${data.totalWords}` },
        { trait_type: 'User', value: displayName },
        { trait_type: 'Status', value: data.revealed ? 'Completed/Revealed' : 'Pending/Hidden' },
      ],
    };

    if (data.revealed) {
        metadata.attributes.push({ trait_type: 'Completed Date', value: new Date(data.timestamp * 1000).toISOString().split('T')[0] });
    }

    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}