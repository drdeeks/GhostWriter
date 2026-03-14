import { SocialShare } from '@/components/social-share';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CONTRACTS, STORY_MANAGER_ABI } from '@/lib/contracts';
import { pickWordFromPool } from '@/lib/word-pool';
import type { Story } from '@/types/ghostwriter';
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

type SlotData = {
  position: number;
  wordType: string;
  filled: boolean;
  word: string;
};

function renderStory(params: { storyId: string; template: string; slots: SlotData[]; fillMissing: boolean }) {
  const ordered = [...params.slots].sort((a, b) => a.position - b.position);
  let i = 0;
  return params.template.replace(/\[[A-Za-z_]+\]/g, (placeholder) => {
    const slot = ordered[i++];
    if (!slot) return placeholder;

    if (slot.filled) return slot.word;
    if (!params.fillMissing) return placeholder;

    return pickWordFromPool({ storyId: params.storyId, position: slot.position, wordType: slot.wordType });
  });
}

export default async function StoryPage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;

  if (CONTRACTS.storyManager.toLowerCase() === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Story viewer unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            StoryManager address is not configured.
          </CardContent>
        </Card>
      </div>
    );
  }

  const chain = getChain();
  const publicClient = createPublicClient({ chain, transport: http(getRpcUrl()) });

  const rawStory = (await publicClient.readContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'getStory',
    args: [storyId],
  })) as any;

  const totalSlots = Number(rawStory.totalSlots ?? rawStory[5] ?? 0);
  const filledSlots = Number(rawStory.filledSlots ?? rawStory[6] ?? 0);
  const status = Number(rawStory.status ?? rawStory[10] ?? 0); // 0 active, 1 complete

  const slotCalls = Array.from({ length: totalSlots }, (_, idx) => {
    const pos = BigInt(idx + 1);
    return {
      address: CONTRACTS.storyManager,
      abi: STORY_MANAGER_ABI,
      functionName: 'getSlot' as const,
      args: [storyId, pos] as const,
    };
  });

  const slotResults = totalSlots
    ? await publicClient.multicall({ contracts: slotCalls as any, allowFailure: true })
    : [];

  const slots: SlotData[] = (slotResults as any[])
    .map((r) => (r.status === 'success' ? (r.result as any) : null))
    .filter(Boolean)
    .map((raw: any) => ({
      position: Number(raw.position ?? raw[0]),
      wordType: raw.wordType ?? raw[1],
      filled: Boolean(raw.filled ?? raw[2]),
      word: raw.word ?? raw[3],
    }));

  const title = (rawStory.title ?? rawStory[1] ?? 'Untitled') as string;
  const template = (rawStory.template ?? rawStory[2] ?? '') as string;

  const fullText = renderStory({
    storyId,
    template,
    slots,
    // When COMPLETE but not fully filled (forced complete), fill remaining with local pool.
    fillMissing: status === 1,
  });

  // Minimal Story shape for SocialShare
  const storyForShare: Story = {
    storyId,
    title,
    template,
    storyType: 'normal',
    category: 'random',
    totalSlots,
    filledSlots,
    slotDetails: [],
    creator: (rawStory.creator ?? rawStory[7] ?? '') as string,
    createdAt: new Date(Number(rawStory.createdAt ?? rawStory[8] ?? 0) * 1000).toISOString(),
    completedAt: null,
    status: status === 1 ? 'complete' : 'active',
    completionTimestamp: null,
    shareCount: Number(rawStory.shareCount ?? rawStory[11] ?? 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        <Card className="border-2 border-purple-500/30 bg-gray-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {title}
            </CardTitle>
            <div className="text-xs text-gray-400">
              Status: {status === 1 ? 'Complete' : 'Active'} • Slots: {filledSlots}/{totalSlots}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="whitespace-pre-wrap rounded-xl border border-gray-700/60 bg-gray-950/40 p-4 text-gray-100 leading-relaxed">
              {fullText}
            </div>
            <SocialShare story={storyForShare} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
