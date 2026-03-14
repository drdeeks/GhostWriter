'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTRACTS, LIQUIDITY_POOL_ABI, NFT_ABI, STORY_MANAGER_ABI, TOKEN_ABI } from '@/lib/contracts';
import { useFees } from '@/hooks/useFees';
import { useIsOwner, useUserStats } from '@/hooks/useContract';
import { CATEGORY_INFO, WORD_TYPE_DEFINITIONS } from '@/types/ghostwriter';
import type { StoryCategory, StoryType } from '@/types/ghostwriter';
import { BookOpen, Coins, Settings, Shield, Users, Wrench } from 'lucide-react';
import { parseEther, parseUnits } from 'viem';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAccount, useReadContract, useReadContracts, useSignMessage, useWriteContract } from 'wagmi';

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

  const index = categories.indexOf(category.toLowerCase());
  return index >= 0 ? index : categories.length - 1;
}

function getStoryTypeEnum(storyType: StoryType): number {
  if (storyType === 'mini') return 0;
  if (storyType === 'normal') return 1;
  return 2;
}

function extractWordTypes(template: string): string[] {
  const out: string[] = [];
  const regex = /\[([A-Z_]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    out.push(match[1].toLowerCase());
  }

  return out;
}

const TOKEN_BUCKETS: { id: number; label: string }[] = [
  { id: 0, label: 'Community' },
  { id: 1, label: 'Rewards' },
  { id: 2, label: 'Liquidity' },
  { id: 3, label: 'Treasury' },
  { id: 4, label: 'Team' },
  { id: 5, label: 'Partners' },
  { id: 6, label: 'Reserved' },
];

function AdminDashboardComponent() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const { isOwner, isLoading: ownerLoading } = useIsOwner(address);
  const { creationFee } = useFees();
  const { stats: ownerStats } = useUserStats(address);

  const [selectedCategory, setSelectedCategory] = useState<StoryCategory>('random');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyTemplate, setStoryTemplate] = useState<string>('');
  const [storyType, setStoryType] = useState<StoryType>('normal');

  const [creditAddresses, setCreditAddresses] = useState('');
  const [creditsPerUser, setCreditsPerUser] = useState('1');

  // Seed credits helper
  const [seedLimit, setSeedLimit] = useState('250');
  const [isSeedingAddresses, setIsSeedingAddresses] = useState(false);

  const [tokenRecipients, setTokenRecipients] = useState('');
  const [tokenAmounts, setTokenAmounts] = useState('');

  const [poolWithdrawEth, setPoolWithdrawEth] = useState('');
  const [templateSigner, setTemplateSigner] = useState('');

  // Protocol config
  const [newMaxActiveStories, setNewMaxActiveStories] = useState('');

  // Admin AI story suggestions
  type AdminStorySuggestion = {
    title: string;
    template: string;
    wordTypes: string[];
    generatedBy?: string;
  };
  const [adminExtraInstructions, setAdminExtraInstructions] = useState('');
  const [adminSuggestions, setAdminSuggestions] = useState<AdminStorySuggestion[] | null>(null);
  const [adminSuggestionIndex, setAdminSuggestionIndex] = useState(0);
  const [isGeneratingAdminSuggestions, setIsGeneratingAdminSuggestions] = useState(false);

  // Admin story lifecycle overrides
  const [forceCompleteStoryId, setForceCompleteStoryId] = useState('');

  // NFT metadata tools
  const [forceRevealTokenId, setForceRevealTokenId] = useState('');
  const [forceRevealStoryId, setForceRevealStoryId] = useState('');
  const [refreshTokenId, setRefreshTokenId] = useState('');
  const [refreshStoryId, setRefreshStoryId] = useState('');
  const [nftHiddenBaseUri, setNftHiddenBaseUri] = useState('');
  const [nftRevealedBaseUri, setNftRevealedBaseUri] = useState('');

  // Token buckets
  const [selectedTokenBucket, setSelectedTokenBucket] = useState<string>('0');
  const [bucketCapTokens, setBucketCapTokens] = useState('');
  const [tokenMintTo, setTokenMintTo] = useState('');
  const [tokenMintAmount, setTokenMintAmount] = useState('');

  // Admin calls
  const [finalizeStoryId, setFinalizeStoryId] = useState('');
  const [batchStoryId, setBatchStoryId] = useState('');
  const [batchStart, setBatchStart] = useState('1');
  const [batchEnd, setBatchEnd] = useState('50');

  const { data: storyTemplateSigner } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'storyTemplateSigner',
  });

  const { data: maxActiveStories } = useReadContract({
    address: CONTRACTS.storyManager,
    abi: STORY_MANAGER_ABI,
    functionName: 'maxActiveStories',
  });

  const { data: tokenMaxSupply } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: 'MAX_SUPPLY',
  });

  type AdminMetricsResponse = {
    meta: {
      chainId: number;
      storyManagerFromBlock: string;
      tokenFromBlock: string;
      tokenHolderCandidateCap: number;
      generatedAt: string;
      warnings?: string[];
    };
    counts: {
      nftsGenerated: string;
      storiesCreated: string;
      storiesCreatedByEvents: string;
      wordsContributed: string;
      completedStories: string;
      completedStoriesByEvents: string;
      activeStories: string;
      finalizedStoriesByEvents: string;
      uniqueActiveAddresses: string;
      liquidityWei: string;
      tokenTotalSupply: string;
      tokenHoldersApprox: string;
    };
  };

  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);

  useEffect(() => {
    async function fetchAiConfig() {
      try {
        const res = await fetch('/api/admin/ai-config');
        if (res.ok) {
          const config = await res.json();
          setAiConfig(config);
        }
      } catch (error) {
        console.error('Failed to fetch AI config', error);
      }
    }
    fetchAiConfig();
  }, []);

  const refreshMetrics = async () => {
    setIsRefreshingMetrics(true);
    setMetricsError(null);
    try {
      const res = await fetch('/api/admin/metrics', { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.details || err?.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as AdminMetricsResponse;
      setMetrics(json);
    } catch (e: any) {
      setMetricsError(e?.message || 'Failed to fetch metrics');
    } finally {
      setIsRefreshingMetrics(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poolBalanceWei = metrics ? BigInt(metrics.counts.liquidityWei) : 0n;

  const parsedWordTypes = useMemo(() => extractWordTypes(storyTemplate), [storyTemplate]);
  const invalidWordTypes = useMemo(() => {
    return parsedWordTypes.filter((t) => !(t in WORD_TYPE_DEFINITIONS));
  }, [parsedWordTypes]);

  const slotConfig = useMemo(() => {
    switch (storyType) {
      case 'mini': return { min: 5, max: 10, label: '5-10' };
      case 'normal': return { min: 10, max: 15, label: '10-15' };
      case 'epic': return { min: 15, max: 25, label: '15-25' };
      default: return { min: 10, max: 15, label: '10-15' };
    }
  }, [storyType]);

  const isStoryFormValid = useMemo(() => {
    if (!storyTitle.trim()) return false;
    if (!storyTemplate.trim()) return false;
    if (invalidWordTypes.length > 0) return false;
    if (parsedWordTypes.length < slotConfig.min || parsedWordTypes.length > slotConfig.max) return false;
    return true;
  }, [storyTitle, storyTemplate, invalidWordTypes.length, parsedWordTypes.length, slotConfig]);

  const isAdmin = !!address && !ownerLoading && isOwner;

  const isTokenConfigured = CONTRACTS.token.toLowerCase() !== '0x0000000000000000000000000000000000000000';

  const { data: tokenBucketInfos } = useReadContracts({
    contracts: isTokenConfigured
      ? TOKEN_BUCKETS.map((b) => ({
          address: CONTRACTS.token,
          abi: TOKEN_ABI,
          functionName: 'getBucketInfo' as const,
          args: [b.id] as const,
        }))
      : [],
    query: {
      enabled: isAdmin && isTokenConfigured,
      // token bucket stats should be fairly dynamic during admin ops
      refetchInterval: 15_000,
    },
  });

  const selectedBucketInfo = useMemo(() => {
    const idx = TOKEN_BUCKETS.findIndex((b) => String(b.id) === String(selectedTokenBucket));
    const row: any = idx >= 0 ? (tokenBucketInfos as any)?.[idx] : null;
    if (!row || row.status !== 'success') return null;
    const result = row.result as readonly [bigint, bigint, bigint];
    return { cap: result[0], minted: result[1], remaining: result[2] };
  }, [selectedTokenBucket, tokenBucketInfos]);

  const handleCreateStory = async () => {
    try {
      if (!isStoryFormValid) {
        toast.error('Story template invalid', {
          description: `Expected ${slotConfig.label} placeholders; found ${parsedWordTypes.length}.`,
        });
        return;
      }

      // Owner-only story creation uses onchain createStory.
      // Note: contract still requires owner to have at least 1 creation credit.
      const storyId = `admin_story_${Date.now()}`;

      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'createStory',
        args: [
          storyId,
          storyTitle.trim(),
          storyTemplate.trim(),
          getStoryTypeEnum(storyType),
          getCategoryEnum(selectedCategory),
          parsedWordTypes,
        ],
        value: creationFee,
      } as any);

      toast.success('Story created', { description: `Tx: ${hash}` });
      setStoryTitle('');
      setStoryTemplate('');
    } catch (e: any) {
      toast.error('Story creation failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleSeedCreditsAddresses = async () => {
    if (!address) return;

    try {
      setIsSeedingAddresses(true);

      const limit = Math.max(1, Math.min(2000, Number(seedLimit || '250')));
      const ts = Date.now();
      const signature = await signMessageAsync({
        message: `GhostWriter Admin Active Addresses\nTimestamp: ${ts}`,
      });

      const res = await fetch('/api/admin/active-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature,
          timestamp: ts,
          limit,
          includeCreators: true,
          includeContributors: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.details || err?.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const addrs = (json?.addresses || []) as string[];
      if (!Array.isArray(addrs) || addrs.length === 0) {
        toast.error('No active addresses found');
        return;
      }

      setCreditAddresses(addrs.join('\n'));
      toast.success('Loaded active addresses', { description: `${addrs.length} wallets` });
    } catch (e: any) {
      toast.error('Failed to load active addresses', { description: e?.message || 'Unknown error' });
    } finally {
      setIsSeedingAddresses(false);
    }
  };

  const handleAirdropCredits = async () => {
    try {
      const users = creditAddresses
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean) as `0x${string}`[];

      const perUser = Number(creditsPerUser);
      if (users.length === 0) {
        toast.error('No addresses provided');
        return;
      }
      if (!Number.isFinite(perUser) || perUser <= 0 || perUser > 100) {
        toast.error('Invalid credits amount', { description: 'Must be 1-100' });
        return;
      }

      const amounts = users.map(() => BigInt(perUser));

      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'airdropCredits',
        args: [users, amounts],
      } as any);

      toast.success('Credits airdropped', { description: `Tx: ${hash}` });
      setCreditAddresses('');
    } catch (e: any) {
      toast.error('Airdrop failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleSelfCredit = async () => {
    if (!address) return;
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'airdropCredits',
        args: [[address], [1n]],
      } as any);
      toast.success('Credited owner', { description: `Tx: ${hash}` });
    } catch (e: any) {
      toast.error('Failed to credit owner', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleTokenAirdrop = async () => {
    try {
      const recipients = tokenRecipients
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean) as `0x${string}`[];

      const amountsLines = tokenAmounts
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (recipients.length === 0) {
        toast.error('No recipients provided');
        return;
      }
      if (amountsLines.length !== recipients.length) {
        toast.error('Amounts mismatch', { description: 'Provide one amount per recipient line.' });
        return;
      }

      // Token is 18 decimals (ERC20 default)
      const amounts = amountsLines.map((a) => parseUnits(a, 18));

      const bucket = Number(selectedTokenBucket);
      if (!Number.isFinite(bucket) || bucket < 0 || bucket > 6) {
        toast.error('Invalid bucket');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.token,
        abi: TOKEN_ABI,
        functionName: 'airdropFromBucket',
        args: [bucket, recipients, amounts],
      } as any);

      toast.success('Token airdrop submitted', { description: `Tx: ${hash}` });
      setTokenRecipients('');
      setTokenAmounts('');
    } catch (e: any) {
      toast.error('Token airdrop failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleFinalizeStory = async () => {
    try {
      if (!finalizeStoryId.trim()) {
        toast.error('StoryId required');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'finalizeStory',
        args: [finalizeStoryId.trim()],
      } as any);

      toast.success('Finalize submitted', { description: `Tx: ${hash}` });
      setFinalizeStoryId('');
      await refreshMetrics();
    } catch (e: any) {
      toast.error('Finalize failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleProcessBatch = async () => {
    try {
      if (!batchStoryId.trim()) {
        toast.error('StoryId required');
        return;
      }
      const start = Number(batchStart);
      const end = Number(batchEnd);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end < start) {
        toast.error('Invalid batch range');
        return;
      }
      if (end - start + 1 > 50) {
        toast.error('Batch too large', { description: 'Max 50 slots per call' });
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'processCompletionBatch',
        args: [batchStoryId.trim(), BigInt(start), BigInt(end)],
      } as any);

      toast.success('Batch submitted', { description: `Tx: ${hash}` });
      await refreshMetrics();
    } catch (e: any) {
      toast.error('Batch failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handlePoolWithdraw = async () => {
    try {
      const amountWei = poolWithdrawEth ? parseEther(poolWithdrawEth) : 0n;
      if (amountWei <= 0n) {
        toast.error('Invalid withdraw amount');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.liquidityPool,
        abi: LIQUIDITY_POOL_ABI,
        functionName: 'withdraw',
        args: [amountWei],
      } as any);

      toast.success('Withdraw submitted', { description: `Tx: ${hash}` });
      setPoolWithdrawEth('');
    } catch (e: any) {
      toast.error('Withdraw failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleSetSigner = async () => {
    try {
      if (!templateSigner.trim().startsWith('0x') || templateSigner.trim().length !== 42) {
        toast.error('Invalid signer address');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'setStoryTemplateSigner',
        args: [templateSigner.trim()],
      } as any);

      toast.success('Signer updated', { description: `Tx: ${hash}` });
      setTemplateSigner('');
    } catch (e: any) {
      toast.error('Failed to update signer', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleSetMaxActiveStories = async () => {
    try {
      const n = Number(newMaxActiveStories);
      if (!Number.isFinite(n) || n <= 0 || n > 500) {
        toast.error('Invalid max active stories', { description: 'Must be 1-500' });
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'setMaxActiveStories',
        args: [BigInt(n)],
      } as any);

      toast.success('Max active stories updated', { description: `Tx: ${hash}` });
      setNewMaxActiveStories('');
      await refreshMetrics();
    } catch (e: any) {
      toast.error('Failed to update max stories', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const adminMessage = (ts: number) => `GhostWriter Admin Generate Story\nTimestamp: ${ts}`;

  const handleGenerateAdminSuggestions = async () => {
    if (!address) return;

    try {
      setIsGeneratingAdminSuggestions(true);

      const ts = Date.now();
      const signature = await signMessageAsync({ message: adminMessage(ts) });

      const res = await fetch('/api/admin/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature,
          timestamp: ts,
          category: selectedCategory,
          storyType,
          extraInstructions: adminExtraInstructions,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.details || err?.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const suggestions = (json?.suggestions || []) as AdminStorySuggestion[];
      if (!Array.isArray(suggestions) || suggestions.length !== 5) {
        throw new Error('Expected 5 suggestions');
      }

      setAdminSuggestions(suggestions);
      setAdminSuggestionIndex(0);
      toast.success('Generated 5 admin suggestions');
    } catch (e: any) {
      toast.error('Admin generation failed', { description: e?.message || 'Unknown error' });
    } finally {
      setIsGeneratingAdminSuggestions(false);
    }
  };

  const applySelectedAdminSuggestion = () => {
    if (!adminSuggestions || adminSuggestions.length === 0) return;
    const s = adminSuggestions[adminSuggestionIndex] ?? adminSuggestions[0];
    if (!s) return;

    setStoryTitle(s.title);
    setStoryTemplate(s.template);
    setAdminSuggestions(null);
    setAdminSuggestionIndex(0);
  };

  const handleForceCompleteStory = async () => {
    try {
      if (!forceCompleteStoryId.trim()) {
        toast.error('Story ID required');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.storyManager,
        abi: STORY_MANAGER_ABI,
        functionName: 'forceCompleteStory',
        args: [forceCompleteStoryId.trim()],
      } as any);

      toast.success('Force complete submitted', { description: `Tx: ${hash}` });
      setForceCompleteStoryId('');
      await refreshMetrics();
    } catch (e: any) {
      toast.error('Force complete failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleForceRevealToken = async () => {
    try {
      const id = Number(forceRevealTokenId);
      if (!Number.isFinite(id) || id <= 0) {
        toast.error('Invalid tokenId');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.nft,
        abi: NFT_ABI,
        functionName: 'forceRevealToken',
        args: [BigInt(id)],
      } as any);

      toast.success('Force reveal token submitted', { description: `Tx: ${hash}` });
      setForceRevealTokenId('');
    } catch (e: any) {
      toast.error('Force reveal token failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleForceRevealStory = async () => {
    try {
      if (!forceRevealStoryId.trim()) {
        toast.error('Story ID required');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.nft,
        abi: NFT_ABI,
        functionName: 'forceRevealStory',
        args: [forceRevealStoryId.trim()],
      } as any);

      toast.success('Force reveal story submitted', { description: `Tx: ${hash}` });
      setForceRevealStoryId('');
    } catch (e: any) {
      toast.error('Force reveal story failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleRefreshTokenMetadata = async () => {
    try {
      const id = Number(refreshTokenId);
      if (!Number.isFinite(id) || id <= 0) {
        toast.error('Invalid tokenId');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.nft,
        abi: NFT_ABI,
        functionName: 'refreshTokenMetadata',
        args: [BigInt(id)],
      } as any);

      toast.success('Refresh token metadata submitted', { description: `Tx: ${hash}` });
      setRefreshTokenId('');
    } catch (e: any) {
      toast.error('Refresh token failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleRefreshStoryMetadata = async () => {
    try {
      if (!refreshStoryId.trim()) {
        toast.error('Story ID required');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.nft,
        abi: NFT_ABI,
        functionName: 'refreshStoryMetadata',
        args: [refreshStoryId.trim()],
      } as any);

      toast.success('Refresh story metadata submitted', { description: `Tx: ${hash}` });
      setRefreshStoryId('');
    } catch (e: any) {
      toast.error('Refresh story failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleUpdateNftBaseUris = async () => {
    try {
      if (!nftHiddenBaseUri.trim() || !nftRevealedBaseUri.trim()) {
        toast.error('Both base URIs required');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.nft,
        abi: NFT_ABI,
        functionName: 'updateBaseURIs',
        args: [nftHiddenBaseUri.trim(), nftRevealedBaseUri.trim()],
      } as any);

      toast.success('NFT base URIs updated', { description: `Tx: ${hash}` });
      setNftHiddenBaseUri('');
      setNftRevealedBaseUri('');
    } catch (e: any) {
      toast.error('Update base URIs failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleSetBucketCap = async () => {
    try {
      const bucket = Number(selectedTokenBucket);
      if (!Number.isFinite(bucket) || bucket < 0 || bucket > 6) {
        toast.error('Invalid bucket');
        return;
      }
      const cap = bucketCapTokens ? parseUnits(bucketCapTokens, 18) : 0n;
      if (cap <= 0n) {
        toast.error('Invalid bucket cap');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.token,
        abi: TOKEN_ABI,
        functionName: 'setBucketCap',
        args: [bucket, cap],
      } as any);

      toast.success('Bucket cap updated', { description: `Tx: ${hash}` });
      setBucketCapTokens('');
    } catch (e: any) {
      toast.error('Set bucket cap failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  const handleMintFromBucket = async () => {
    try {
      const bucket = Number(selectedTokenBucket);
      if (!Number.isFinite(bucket) || bucket < 0 || bucket > 6) {
        toast.error('Invalid bucket');
        return;
      }
      if (!tokenMintTo.trim().startsWith('0x') || tokenMintTo.trim().length !== 42) {
        toast.error('Invalid recipient');
        return;
      }
      const amount = tokenMintAmount ? parseUnits(tokenMintAmount, 18) : 0n;
      if (amount <= 0n) {
        toast.error('Invalid amount');
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.token,
        abi: TOKEN_ABI,
        functionName: 'mintFromBucket',
        args: [bucket, tokenMintTo.trim(), amount],
      } as any);

      toast.success('Mint submitted', { description: `Tx: ${hash}` });
      setTokenMintTo('');
      setTokenMintAmount('');
    } catch (e: any) {
      toast.error('Mint failed', { description: e?.shortMessage || e?.message || 'Unknown error' });
    }
  };

  if (!isAdmin) {
    return (
      <Card className="border-2 border-red-300 dark:border-red-700">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <p className="text-xl font-semibold text-red-600">Access Denied</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Only contract owner can access admin dashboard</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 relative overflow-hidden py-8">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }}
      />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-purple-500" />
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg text-gray-300">Owner-only contract operations & onchain monitoring</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              Owner: {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
            <Badge className="bg-gray-800 text-gray-200">Creation credits: {ownerStats?.creationCredits ?? 0}</Badge>
            {(ownerStats?.creationCredits ?? 0) === 0 && (
              <Button onClick={handleSelfCredit} className="h-7 px-2 text-xs" variant="secondary">
                Grant self 1 credit
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-400">
            Metrics: {metrics?.meta?.generatedAt ? new Date(metrics.meta.generatedAt).toLocaleString() : 'loading...'}
            {metricsError ? ` • Error: ${metricsError}` : ''}
            {metrics?.meta?.warnings?.length ? ` • Warnings: ${metrics.meta.warnings.join(' | ')}` : ''}
          </div>
          <Button onClick={refreshMetrics} disabled={isRefreshingMetrics} variant="secondary" className="h-8">
            {isRefreshingMetrics ? 'Refreshing…' : 'Refresh metrics'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">NFTs Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? Number(metrics.counts.nftsGenerated) : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Stories Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? Number(metrics.counts.storiesCreated) : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Words Contributed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? Number(metrics.counts.wordsContributed) : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Liquidity (ETH)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{poolBalanceWei ? (Number(poolBalanceWei) / 1e18).toFixed(4) : '0.0000'}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? Number(metrics.counts.activeStories) : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? Number(metrics.counts.completedStories) : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Finalized Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? Number(metrics.counts.finalizedStoriesByEvents) : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users (unique addresses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? Number(metrics.counts.uniqueActiveAddresses) : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Token Holders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? Number(metrics.counts.tokenHoldersApprox) : 0}</div>
              <p className="text-xs text-gray-500 mt-1">Approx (scans up to {metrics?.meta?.tokenHolderCandidateCap ?? 0} addresses)</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Token Total Supply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? (BigInt(metrics.counts.tokenTotalSupply) / 10n ** 18n).toString() : '0'}</div>
              <p className="text-xs text-gray-500 mt-1">Displayed in whole tokens (18 decimals)</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 h-14 bg-gray-800/80 backdrop-blur-sm border-2 border-purple-500/30">
            <TabsTrigger value="stories" className="text-base font-semibold text-gray-200 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <BookOpen className="mr-2 h-4 w-4" />
              Stories
            </TabsTrigger>
            <TabsTrigger value="users" className="text-base font-semibold text-gray-200 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Users className="mr-2 h-4 w-4" />
              Creation Credits
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-base font-semibold text-gray-200 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Coins className="mr-2 h-4 w-4" />
              Token Buckets/Pool
            </TabsTrigger>
            <TabsTrigger value="calls" className="text-base font-semibold text-gray-200 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Wrench className="mr-2 h-4 w-4" />
              Admin Calls
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-base font-semibold text-gray-200 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories">
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle>Owner: Create Story (manual or admin AI)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-gray-700/60 rounded-xl p-4 bg-gray-900/40 space-y-3">
                  <div className="text-sm text-gray-300 font-semibold">Admin AI (optional)</div>
                  <div className="text-xs text-gray-400">
                    Generates 5 suggestions you can pick from, then you still create onchain via owner-only <code>createStory</code>.
                  </div>
                  <div>
                    <Label>Extra instructions (optional)</Label>
                    <textarea
                      value={adminExtraInstructions}
                      onChange={(e) => setAdminExtraInstructions(e.target.value)}
                      placeholder="e.g. Make it an EPIC prologue for the season. Theme: haunted library + crypto mystery. Keep it PG." 
                      className="w-full mt-2 min-h-[90px] p-3 rounded-xl border-2 border-gray-600/50 bg-gray-800/80 backdrop-blur-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Button
                      onClick={handleGenerateAdminSuggestions}
                      disabled={isGeneratingAdminSuggestions}
                      variant="secondary"
                      className="h-9"
                    >
                      {isGeneratingAdminSuggestions ? 'Generating…' : 'Generate 5 admin suggestions'}
                    </Button>
                    {adminSuggestions && adminSuggestions.length === 5 && (
                      <Button onClick={applySelectedAdminSuggestion} className="h-9">
                        Use selected suggestion
                      </Button>
                    )}
                  </div>

                  {adminSuggestions && (
                    <div className="mt-2 space-y-2">
                      <Label className="text-sm">Pick 1 of 5:</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {adminSuggestions.map((s, idx) => (
                          <button
                            key={`${s.title}-${idx}`}
                            type="button"
                            onClick={() => setAdminSuggestionIndex(idx)}
                            className={`text-left p-3 rounded border ${idx === adminSuggestionIndex ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 bg-gray-950/30'} hover:border-cyan-400 transition`}
                          >
                            <div className="font-semibold text-gray-100">{s.title}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {s.generatedBy ? `Source: ${s.generatedBy}` : ''} • Slots: {s.wordTypes?.length ?? 0}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">{s.template.slice(0, 160)}…</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="story-title">Story Title</Label>
                    <Input
                      id="story-title"
                      placeholder="The Wicked Witch That Lived in the Trashcan"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="story-type">Story Type</Label>
                    <Select value={storyType} onValueChange={(value) => setStoryType(value as StoryType)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mini">Mini (10 slots)</SelectItem>
                        <SelectItem value="normal">Normal (20 slots)</SelectItem>
                        <SelectItem value="epic">Epic (35 slots)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as StoryCategory)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            {info.emoji} {info.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template">Story Template</Label>
                  <textarea
                    id="template"
                    placeholder="Once upon a time, there was a [ADJECTIVE] witch who lived in a [NOUN]..."
                    value={storyTemplate}
                    onChange={(e) => setStoryTemplate(e.target.value)}
                    className="w-full mt-2 min-h-[200px] p-3 rounded-xl border-2 border-gray-600/50 bg-gray-800/80 backdrop-blur-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  />

                  <div className="mt-3 text-xs text-gray-300 space-y-1">
                    <div>
                      Placeholders: {parsedWordTypes.length}/{slotConfig.label}
                      {(parsedWordTypes.length < slotConfig.min || parsedWordTypes.length > slotConfig.max) && (
                        <span className="text-red-300"> (must be within range)</span>
                      )}
                    </div>
                    {invalidWordTypes.length > 0 && (
                      <div className="text-red-300">
                        Unsupported types: {invalidWordTypes.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleCreateStory}
                  disabled={!isStoryFormValid}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                >
                  Create Story (onchain)
                </Button>

                <p className="text-xs text-gray-400">
                  Note: this consumes 1 creation credit and requires the LiquidityPool to be configured with this StoryManager.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle>Seed / Airdrop Creation Credits (in-app)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border border-gray-700/60 bg-gray-900/40 p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-200">Seed helper</div>
                  <div className="text-xs text-gray-400">
                    Fetches unique active wallets (story creators + contributors) from on-chain events and populates the address list below.
                  </div>
                  <div className="flex gap-2 items-end">
                    <div>
                      <Label>Max wallets</Label>
                      <Input value={seedLimit} onChange={(e) => setSeedLimit(e.target.value)} className="mt-2 w-28" type="number" min="1" max="2000" />
                    </div>
                    <Button onClick={handleSeedCreditsAddresses} disabled={isSeedingAddresses} variant="secondary" className="h-10">
                      {isSeedingAddresses ? 'Loading…' : 'Load active wallets'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addresses">Wallet Addresses</Label>
                    <textarea
                      id="addresses"
                      value={creditAddresses}
                      onChange={(e) => setCreditAddresses(e.target.value)}
                      placeholder={`0x123...\n0x456...\n0x789...`}
                      className="w-full mt-2 min-h-[150px] p-3 rounded-xl border-2 border-gray-600/50 bg-gray-800/80 backdrop-blur-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-2">One address per line</p>
                  </div>

                  <div>
                    <Label htmlFor="credits">Credits per User</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={creditsPerUser}
                      onChange={(e) => setCreditsPerUser(e.target.value)}
                      className="mt-2"
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Must be 1-100</p>
                  </div>
                </div>

                <Button
                  onClick={handleAirdropCredits}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  Airdrop Credits (onchain)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                  <CardTitle>GhostWriterToken Buckets + Airdrops</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Bucket</Label>
                      <Select value={selectedTokenBucket} onValueChange={setSelectedTokenBucket}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOKEN_BUCKETS.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-2">
                        Max supply: {tokenMaxSupply ? ((tokenMaxSupply as bigint) / 10n ** 18n).toString() : '0'} GWT
                      </p>
                    </div>

                    <div className="text-sm text-gray-300">
                      <div className="font-semibold">Selected bucket stats</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Cap: {selectedBucketInfo ? (selectedBucketInfo.cap / 10n ** 18n).toString() : '—'} • Minted:{' '}
                        {selectedBucketInfo ? (selectedBucketInfo.minted / 10n ** 18n).toString() : '—'} • Remaining:{' '}
                        {selectedBucketInfo ? (selectedBucketInfo.remaining / 10n ** 18n).toString() : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Set bucket cap (tokens, 18 decimals)</Label>
                      <Input value={bucketCapTokens} onChange={(e) => setBucketCapTokens(e.target.value)} placeholder="1000000" className="mt-2" />
                      <Button onClick={handleSetBucketCap} className="w-full mt-2" variant="secondary">
                        Update bucket cap
                      </Button>
                    </div>
                    <div>
                      <Label>Mint (single)</Label>
                      <Input value={tokenMintTo} onChange={(e) => setTokenMintTo(e.target.value)} placeholder="0x..." className="mt-2 font-mono" />
                      <Input value={tokenMintAmount} onChange={(e) => setTokenMintAmount(e.target.value)} placeholder="250" className="mt-2" />
                      <Button onClick={handleMintFromBucket} className="w-full mt-2">
                        Mint from bucket
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Recipients (one per line)</Label>
                    <textarea
                      value={tokenRecipients}
                      onChange={(e) => setTokenRecipients(e.target.value)}
                      placeholder={`0x123...\n0x456...`}
                      className="w-full mt-2 min-h-[120px] p-3 rounded-xl border-2 border-gray-600/50 bg-gray-800/80 backdrop-blur-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>Amounts (one per line, decimals allowed; 18 decimals)</Label>
                    <textarea
                      value={tokenAmounts}
                      onChange={(e) => setTokenAmounts(e.target.value)}
                      placeholder={`1000\n250`}
                      className="w-full mt-2 min-h-[120px] p-3 rounded-xl border-2 border-gray-600/50 bg-gray-800/80 backdrop-blur-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono text-sm"
                    />
                  </div>
                  <Button onClick={handleTokenAirdrop} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                    Airdrop Tokens from Bucket (onchain)
                  </Button>

                  {tokenBucketInfos && (
                    <div className="pt-2">
                      <div className="text-xs text-gray-400 mb-2">All buckets</div>
                      <div className="space-y-1 text-xs text-gray-300">
                        {TOKEN_BUCKETS.map((b, idx) => {
                          const row: any = (tokenBucketInfos as any)?.[idx];
                          if (!row || row.status !== 'success') {
                            return (
                              <div key={b.id} className="flex justify-between">
                                <span>{b.label}</span>
                                <span className="text-gray-500">loading…</span>
                              </div>
                            );
                          }
                          const [cap, minted, remaining] = row.result as readonly [bigint, bigint, bigint];
                          return (
                            <div key={b.id} className="flex justify-between">
                              <span>{b.label}</span>
                              <span>
                                cap {(cap / 10n ** 18n).toString()} • minted {(minted / 10n ** 18n).toString()} • rem{' '}
                                {(remaining / 10n ** 18n).toString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle>LiquidityPool Withdraw (owner)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-300">
                    Pool balance: {poolBalanceWei ? (Number(poolBalanceWei) / 1e18).toFixed(6) : '0.000000'} ETH
                  </div>

                  <div>
                    <Label>Withdraw amount (ETH)</Label>
                    <Input value={poolWithdrawEth} onChange={(e) => setPoolWithdrawEth(e.target.value)} placeholder="0.1" className="mt-2" />
                  </div>

                  <Button onClick={handlePoolWithdraw} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    Withdraw
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Process Completion Batch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Story ID</Label>
                    <Input value={batchStoryId} onChange={(e) => setBatchStoryId(e.target.value)} placeholder="story_..." className="mt-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start</Label>
                      <Input value={batchStart} onChange={(e) => setBatchStart(e.target.value)} placeholder="1" className="mt-2" />
                    </div>
                    <div>
                      <Label>End</Label>
                      <Input value={batchEnd} onChange={(e) => setBatchEnd(e.target.value)} placeholder="50" className="mt-2" />
                    </div>
                  </div>
                  <Button onClick={handleProcessBatch} className="w-full">Submit batch</Button>
                  <p className="text-xs text-gray-400">Max 50 positions per call (contract limit).</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Finalize Story (mint creator NFT)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Story ID</Label>
                    <Input value={finalizeStoryId} onChange={(e) => setFinalizeStoryId(e.target.value)} placeholder="story_..." className="mt-2" />
                  </div>
                  <Button onClick={handleFinalizeStory} className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                    Finalize
                  </Button>
                  <p className="text-xs text-gray-400">Finalization is idempotent and will revert if already finalized.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle>Force Complete Story (owner)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Story ID</Label>
                    <Input value={forceCompleteStoryId} onChange={(e) => setForceCompleteStoryId(e.target.value)} placeholder="story_..." className="mt-2" />
                  </div>
                  <Button onClick={handleForceCompleteStory} className="w-full" variant="destructive">
                    Force complete
                  </Button>
                  <p className="text-xs text-gray-400">
                    This marks the story COMPLETE on-chain. Any unfilled slots will be auto-filled off-chain from the word pool for display.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle>NFT Reveal / Metadata Tools (owner)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Force reveal tokenId</Label>
                      <Input value={forceRevealTokenId} onChange={(e) => setForceRevealTokenId(e.target.value)} placeholder="1" className="mt-2" />
                      <Button onClick={handleForceRevealToken} className="w-full mt-2" variant="secondary">
                        Force reveal token
                      </Button>
                    </div>
                    <div>
                      <Label>Force reveal storyId</Label>
                      <Input value={forceRevealStoryId} onChange={(e) => setForceRevealStoryId(e.target.value)} placeholder="story_..." className="mt-2" />
                      <Button onClick={handleForceRevealStory} className="w-full mt-2" variant="secondary">
                        Force reveal story
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Refresh tokenId metadata</Label>
                      <Input value={refreshTokenId} onChange={(e) => setRefreshTokenId(e.target.value)} placeholder="1" className="mt-2" />
                      <Button onClick={handleRefreshTokenMetadata} className="w-full mt-2" variant="secondary">
                        Refresh token metadata
                      </Button>
                    </div>
                    <div>
                      <Label>Refresh storyId metadata</Label>
                      <Input value={refreshStoryId} onChange={(e) => setRefreshStoryId(e.target.value)} placeholder="story_..." className="mt-2" />
                      <Button onClick={handleRefreshStoryMetadata} className="w-full mt-2" variant="secondary">
                        Refresh story metadata
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Update NFT base URIs</Label>
                    <Input value={nftHiddenBaseUri} onChange={(e) => setNftHiddenBaseUri(e.target.value)} placeholder="https://.../hidden/" className="mt-2" />
                    <Input value={nftRevealedBaseUri} onChange={(e) => setNftRevealedBaseUri(e.target.value)} placeholder="https://.../revealed/" className="mt-2" />
                    <Button onClick={handleUpdateNftBaseUris} className="w-full mt-2">
                      Update base URIs
                    </Button>
                  </div>

                  <p className="text-xs text-gray-400">
                    Metadata refresh emits EIP-4906 events so marketplaces re-index.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Protocol Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Story template signer (EIP-712)</Label>
                    <div className="text-xs text-gray-400 mt-1">Current: {storyTemplateSigner ? String(storyTemplateSigner) : '0x0'}</div>
                    <div className="flex gap-2 mt-2">
                      <Input value={templateSigner} onChange={(e) => setTemplateSigner(e.target.value)} placeholder="0x..." className="font-mono" />
                      <Button onClick={handleSetSigner}>Update</Button>
                    </div>
                  </div>
<<<<<<< HEAD
                  <div className="text-xs text-gray-400">
                    Contract addresses: StoryManager {CONTRACTS.storyManager}, NFT {CONTRACTS.nft}, Token {CONTRACTS.token}, Pool {CONTRACTS.liquidityPool}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>AI Configuration (from Environment)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiConfig ? (
                    <>
                      <div>
                        <Label>Model</Label>
                        <p className="text-sm text-gray-300">{aiConfig.model}</p>
                      </div>
                      <div>
                        <Label>Temperature</Label>
                        <p className="text-sm text-gray-300">{aiConfig.temperature}</p>
                      </div>
                      <div>
                        <Label>Max Tokens</Label>
                        <p className="text-sm text-gray-300">{aiConfig.maxTokens}</p>
                      </div>
                      <div>
                        <Label>Timeout (ms)</Label>
                        <p className="text-sm text-gray-300">{aiConfig.timeout}</p>
                      </div>
                      <div>
                        <Label>System Prompt Append</Label>
                        <p className="text-sm text-gray-300">{aiConfig.systemPromptAppend || '(not set)'}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Loading AI configuration...</p>
                  )}
                </CardContent>
              </Card>
            </div>
=======
                </div>

                <div>
                  <Label>Max active stories</Label>
                  <div className="text-xs text-gray-400 mt-1">Current: {maxActiveStories ? String(maxActiveStories) : '—'}</div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newMaxActiveStories}
                      onChange={(e) => setNewMaxActiveStories(e.target.value)}
                      placeholder="15"
                      type="number"
                      className="w-32"
                    />
                    <Button onClick={handleSetMaxActiveStories}>Update</Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">This is enforced on-chain (story creation will revert if exceeded).</p>
                </div>

                <div className="text-xs text-gray-400">
                  Contract addresses: StoryManager {CONTRACTS.storyManager}, NFT {CONTRACTS.nft}, Token {CONTRACTS.token}, Pool {CONTRACTS.liquidityPool}
                </div>
              </CardContent>
            </Card>
>>>>>>> e7d611f (expanded management attributes and updated API's and back end logic)
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export const AdminDashboard = AdminDashboardComponent;
export default AdminDashboardComponent;
