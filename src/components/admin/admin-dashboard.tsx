'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTRACTS, LIQUIDITY_POOL_ABI, STORY_MANAGER_ABI, TOKEN_ABI } from '@/lib/contracts';
import { useFees } from '@/hooks/useFees';
import { useIsOwner, useUserStats } from '@/hooks/useContract';
import { CATEGORY_INFO, WORD_TYPE_DEFINITIONS } from '@/types/ghostwriter';
import type { StoryCategory, StoryType } from '@/types/ghostwriter';
import { BookOpen, Coins, Settings, Shield, Users, Wrench } from 'lucide-react';
import { parseEther, parseUnits } from 'viem';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';

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

function AdminDashboardComponent() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { isOwner, isLoading: ownerLoading } = useIsOwner(address);
  const { creationFee } = useFees();
  const { stats: ownerStats } = useUserStats(address);

  const [selectedCategory, setSelectedCategory] = useState<StoryCategory>('random');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyTemplate, setStoryTemplate] = useState<string>('');
  const [storyType, setStoryType] = useState<StoryType>('normal');

  const [creditAddresses, setCreditAddresses] = useState('');
  const [creditsPerUser, setCreditsPerUser] = useState('1');

  const [tokenRecipients, setTokenRecipients] = useState('');
  const [tokenAmounts, setTokenAmounts] = useState('');

  const [poolWithdrawEth, setPoolWithdrawEth] = useState('');
  const [templateSigner, setTemplateSigner] = useState('');

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

      const hash = await writeContractAsync({
        address: CONTRACTS.token,
        abi: TOKEN_ABI,
        functionName: 'airdrop',
        args: [recipients, amounts],
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
              Credits
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-base font-semibold text-gray-200 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Coins className="mr-2 h-4 w-4" />
              Tokens/Pool
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
                <CardTitle>Owner: Create Initial Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                <CardTitle>Airdrop Creation Credits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  <CardTitle>GhostWriterToken Airdrop (mint)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    Airdrop Tokens (onchain)
                  </Button>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export const AdminDashboard = AdminDashboardComponent;
export default AdminDashboardComponent;
