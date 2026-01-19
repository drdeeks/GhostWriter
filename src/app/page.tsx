'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';

// ── Enhanced Hooks ───────────────────────────────────────
import { useHaptic } from '@/lib/haptic';
import { useFarcasterEnhanced } from '@/lib/farcaster-enhanced';
import { usePerformanceMonitor } from '@/lib/performance';
import { useAllStories, useUserStats } from '@/hooks/useContract';
import { useStories } from '@/hooks/useStories';

// ── Lazy Components ──────────────────────────────────────
const ContributionModal = React.lazy(() =>
  import('@/components/contribution-modal').then((mod) => ({
    default: mod.ContributionModal,
  })),
);
const StoryCreationModal = React.lazy(() =>
  import('@/components/story-creation-modal').then((mod) => ({
    default: mod.StoryCreationModal,
  })),
);
const StoryCompletionModal = React.lazy(() =>
  import('@/components/story-completion-modal').then((mod) => ({
    default: mod.StoryCompletionModal,
  })),
);
const LoadingScreen = React.lazy(() =>
  import('@/components/LoadingScreen').then((mod) => ({
    default: mod.LoadingScreen,
  })),
);

import { NFTCollection } from '@/components/nft-collection';
import { StoryCard } from '@/components/story-card';
import { UserStatsDisplay } from '@/components/user-stats';
import { RefundBanner } from '@/components/refund-banner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Icons & Utils ────────────────────────────────────────
import {
  AlertCircle,
  Award,
  BookOpen,
  Loader2,
  PlusCircle,
  Sparkles,
  Trophy,
  Smartphone,
  Zap,
} from 'lucide-react';

import { areContractsDeployed } from '@/lib/contracts';
import type { Story, StoryType } from '@/types/ghostwriter';

export default function Home() {
  const { address } = useAccount();
  const haptic = useHaptic();
  const farcaster = useFarcasterEnhanced();
  const performance = usePerformanceMonitor();

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedStoryData, setCompletedStoryData] = useState<{ id: string; title: string; slots: number } | null>(null);
  const [farcasterUser, setFarcasterUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Contract data with performance monitoring
  const { storyIds, isLoading: storyIdsLoading, refetch: refetchStories } = useAllStories();
  const { stories, isLoading: storiesLoading, refetchAll } = useStories(storyIds);
  const { stats: userStats, refetch: refetchStats } = useUserStats(address);

  // Enhanced Farcaster initialization
  useEffect(() => {
    const init = async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        setIsLoading(true);
        
        const initPromise = performance.measureAsync('farcaster-init', async () => {
          await farcaster.initialize();
          const context = farcaster.getContext();
          
          if (farcaster.isInMiniApp() && context?.user) {
            setFarcasterUser(context.user.username || null);
            haptic.trigger('light');
            await farcaster.requestNotificationPermission();
          }
        });
        
        // Bug #38 fix: Clear timeout on success
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Initialization timeout')), 5000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);
        
        // Clear timeout if init succeeded
        if (timeoutId) clearTimeout(timeoutId);
      } catch (error) {
        console.error('Initialization failed:', error);
        if (timeoutId) clearTimeout(timeoutId);
      } finally {
        setIsInitialized(true);
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    init();
  }, [farcaster, haptic, performance]);

  const contractsDeployed = areContractsDeployed();

  // Derived story lists with performance optimization
  const validStories = React.useMemo(() => 
    (stories || []).filter(Boolean) as Story[], 
    [stories]
  );
  
  const activeStories = React.useMemo(() => 
    validStories.filter((s) => s.status === 'active'), 
    [validStories]
  );
  
  const completedStories = React.useMemo(() => 
    validStories.filter((s) => s.status === 'complete'), 
    [validStories]
  );

  const handleContribute = (storyId: string) => {
    haptic.trigger('medium'); // Haptic feedback for interaction
    
    const story = stories.find((s) => s.storyId === storyId);
    if (story) {
      setSelectedStory(story);
      setShowContributionModal(true);
    }
  };

  const handleSubmitContribution = async (word: string) => {
    try {
      haptic.trigger('light');
      toast.success('Processing contribution...');
      
      await performance.measureAsync('contribution-submit', async () => {
        await refetchStats();
        await refetchStories();
      });
      
      setShowContributionModal(false);
      haptic.trigger('success');
      
      toast.success('Contribution successful!', {
        description: `You contributed "${word}" and earned 1 creation credit!`,
      });

      // Check if story is now complete
      if (selectedStory && selectedStory.filledSlots + 1 >= selectedStory.totalSlots) {
        setCompletedStoryData({
          id: selectedStory.storyId,
          title: selectedStory.title,
          slots: selectedStory.totalSlots,
        });
        setShowCompletionModal(true);
      }

      // Send Farcaster notification if in mini-app
      if (farcaster.isInMiniApp()) {
        await farcaster.sendNotification(
          'Contribution Success!',
          `You contributed "${word}" to a story!`
        );
      }
    } catch (error) {
      haptic.trigger('error');
      toast.error('Contribution failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const handleCreateStory = async (storyType: StoryType) => {
    try {
      haptic.trigger('medium');
      toast.success('Creating story...');
      
      await performance.measureAsync('story-creation', async () => {
        await refetchStats();
        await refetchStories();
      });
      
      setShowCreationModal(false);
      haptic.trigger('success');
      toast.success('Story created!');

      // Send Farcaster notification if in mini-app
      if (farcaster.isInMiniApp()) {
        await farcaster.sendNotification(
          'Story Created!',
          'Your new story is ready for contributions!'
        );
      }
    } catch (error) {
      haptic.trigger('error');
      toast.error('Creation failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const handleShareStory = async (storyId: string, title: string) => {
    haptic.trigger('light');
    await farcaster.shareStory(storyId, title);
  };

  if (isLoading) {
    return (
      <Suspense fallback={null}>
        <LoadingScreen isLoading={true} minDisplayTime={800} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 relative overflow-hidden">
      {/* Enhanced ambient effects for mobile */}
      <div className="absolute top-0 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl relative z-10">
        {/* Enhanced Header with mobile optimization */}
        <div className="mb-8 md:mb-12 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-orange-500/5 blur-3xl -z-10" />
          
          {/* Mobile-optimized title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
            👻 Ghost Writer
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-2 md:mb-3 font-medium">
            Community Storytelling • NFT Rewards
          </p>

          {/* Farcaster user display with enhanced styling */}
          {farcasterUser && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-cyan-400" />
              <p className="text-sm text-cyan-400 font-semibold">
                Welcome back, @{farcasterUser}!
              </p>
              <Zap className="h-4 w-4 text-cyan-400 animate-pulse" />
            </div>
          )}

          {/* Mobile-optimized address display */}
          {address ? (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Wallet>
                <ConnectWallet>
                  <WalletDropdown>
                    <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com">
                      Wallet
                    </WalletDropdownLink>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </ConnectWallet>
              </Wallet>
            </div>
          ) : (
            <div className="flex items-center justify-center mt-4">
              <ConnectWallet className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200" />
            </div>
          )}

          {/* Mini-app indicator */}
          {farcaster.isInMiniApp() && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-cyan-500/20 rounded-full text-xs text-cyan-300">
              <Smartphone className="h-3 w-3" />
              Farcaster Mini App
            </div>
          )}
        </div>

        {/* Contract warning */}
        {!contractsDeployed && (
          <Alert className="mb-8 border-2 border-orange-500/50 bg-orange-950/30 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-200">
              Smart contracts not yet deployed. Please deploy contracts and update .env with addresses.
              <br />
              <code className="text-xs mt-2 block text-orange-300">npm run deploy:baseSepolia</code>
            </AlertDescription>
          </Alert>
        )}

        {/* Refund Banner */}
        {address && <RefundBanner />}

        {/* User Stats */}
        {contractsDeployed && address && (
          <div className="mb-10">
            <UserStatsDisplay
              stats={{
                address: address,
                contributionsCount: userStats?.contributionsCount ?? 0,
                creationCredits: userStats?.creationCredits ?? 0,
                storiesCreated: userStats?.storiesCreated ?? 0,
                nftsOwned: userStats?.nftsOwned ?? 0,
                completedStories: userStats?.completedStories ?? 0,
                shareCount: userStats?.shareCount ?? 0,
                lastContributionTime: userStats?.lastContributionTime ?? 0,
                activeContributions: userStats?.activeContributions ?? [],
              }}
            />
          </div>
        )}

        {/* Leaderboard / Achievements navigation */}
        <div className="mb-6 flex justify-center gap-4">
          <a href="/leaderboard">
            <Button className="gap-2 border-2 border-orange-500/50 hover:bg-orange-500/10 bg-gray-900/50 backdrop-blur-sm text-orange-300 hover:text-orange-200 transition-all">
              <Trophy className="h-5 w-5 text-orange-400" />
              View Leaderboard
            </Button>
          </a>

          {userStats && userStats.contributionsCount > 0 && (
            <Button className="gap-2 border-2 border-purple-500/50 hover:bg-purple-500/10 bg-gray-900/50 backdrop-blur-sm text-purple-300 hover:text-purple-200 transition-all">
              <Award className="h-5 w-5 text-purple-400" />
              My Achievements ({userStats.contributionsCount})
            </Button>
          )}
        </div>

        {/* ── Main Tabs ──────────────────────────────────────── */}
        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 md:mb-8 h-auto md:h-14 bg-gray-900/80 backdrop-blur-md border-2 border-gray-800 shadow-xl p-1">
            <TabsTrigger
              value="stories"
              className="text-xs md:text-base font-semibold py-2 md:py-3 px-1 md:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 flex flex-col md:flex-row items-center gap-1 md:gap-2"
            >
              <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
              <span className="whitespace-nowrap">Active</span>
              <span className="text-[10px] md:text-sm">({activeStories.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="completed"
              className="text-xs md:text-base font-semibold py-2 md:py-3 px-1 md:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 flex flex-col md:flex-row items-center gap-1 md:gap-2"
            >
              <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
              <span className="whitespace-nowrap">Done</span>
              <span className="text-[10px] md:text-sm">({completedStories.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="how-to-play"
              className="text-xs md:text-base font-semibold py-2 md:py-3 px-1 md:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50 flex flex-col md:flex-row items-center gap-1"
            >
              <span className="text-base md:text-lg">❓</span>
              <span className="whitespace-nowrap">Guide</span>
            </TabsTrigger>

            <TabsTrigger
              value="collection"
              className="text-xs md:text-base font-semibold py-2 md:py-3 px-1 md:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/50 flex flex-col md:flex-row items-center gap-1"
            >
              <span className="text-base md:text-lg">🖼️</span>
              <span className="whitespace-nowrap">NFTs</span>
              <span className="text-[10px] md:text-sm">({userStats?.nftsOwned ?? 0})</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Stories */}
          <TabsContent value="stories" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  📚 Active Stories
                </h2>
                <p className="text-gray-400 mt-1">Contribute to unlock creation</p>
              </div>
              <Button
                onClick={() => setShowCreationModal(true)}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200 h-12 px-6 text-base font-semibold"
                disabled={!contractsDeployed}
              >
                <PlusCircle className="h-5 w-5" />
                Create Story
              </Button>
            </div>

            {storyIdsLoading || storiesLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              </div>
            ) : activeStories.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-600/50 bg-gray-800/30 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="h-16 w-16 text-gray-500 mb-4" />
                  <p className="text-xl font-semibold text-gray-300 mb-2">No active stories yet</p>
                  <p className="text-gray-400">
                    {contractsDeployed ? 'Be the first to create one!' : 'Deploy contracts to get started'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeStories.map((story) => (
                  <StoryCard
                    key={story.storyId}
                    story={story}
                    onContribute={handleContribute}
                    onViewStory={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Stories */}
          <TabsContent value="completed" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ✨ Completed Stories
              </h2>
              <p className="text-gray-400 mt-1">Read hilarious completed narratives</p>
            </div>

            {completedStories.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-600/50 bg-gray-800/30 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Sparkles className="h-16 w-16 text-gray-500 mb-4" />
                  <p className="text-xl font-semibold text-gray-300 mb-2">No completed stories yet</p>
                  <p className="text-gray-400">Be the first to finish one!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedStories.map((story) => (
                  <StoryCard
                    key={story.storyId}
                    story={story}
                    onContribute={handleContribute}
                    onViewStory={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* How to Play */}
          <TabsContent value="how-to-play" className="animate-in fade-in-50 duration-500">
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 px-2 md:px-4">
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-fluid-3xl md:text-fluid-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3 md:mb-4">
                  🎮 How to Play
                </h2>
                <p className="text-fluid-base md:text-fluid-lg text-gray-300 px-4">
                  Collaborative storytelling with NFT rewards
                </p>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                {/* Getting Started */}
                <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-950/20 to-emerald-950/20 backdrop-blur-sm">
                  <CardHeader className="pb-3 md:pb-4">
                    <h3 className="text-fluid-lg md:text-fluid-xl font-bold text-green-400 flex items-center gap-2">
                      🚀 Getting Started
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-start gap-2 md:gap-3">
                        <span className="text-green-400 font-bold text-fluid-base md:text-fluid-lg flex-shrink-0">1.</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">Connect Wallet</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Link your Web3 wallet to start</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 md:gap-3">
                        <span className="text-green-400 font-bold text-fluid-base md:text-fluid-lg flex-shrink-0">2.</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">Earn Credits</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Contribute words to earn credits</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 md:gap-3">
                        <span className="text-green-400 font-bold text-fluid-base md:text-fluid-lg flex-shrink-0">3.</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">Create Story</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Use credits to start your story</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* How It Works */}
                <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-cyan-950/20 backdrop-blur-sm">
                  <CardHeader className="pb-3 md:pb-4">
                    <h3 className="text-fluid-lg md:text-fluid-xl font-bold text-blue-400 flex items-center gap-2">
                      ⚙️ How It Works
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-start gap-2 md:gap-3">
                        <span className="text-blue-400 font-bold text-fluid-base flex-shrink-0">•</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">Templates</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Story templates with blanks to fill</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 md:gap-3">
                        <span className="text-blue-400 font-bold text-fluid-base flex-shrink-0">•</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">Contributions</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Players fill words to complete</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 md:gap-3">
                        <span className="text-blue-400 font-bold text-fluid-base flex-shrink-0">•</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">NFT Rewards</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Each word mints a unique NFT</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Story Types */}
                <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-pink-950/20 backdrop-blur-sm">
                  <CardHeader className="pb-3 md:pb-4">
                    <h3 className="text-fluid-lg md:text-fluid-xl font-bold text-purple-400 flex items-center gap-2">
                      📚 Story Types
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="space-y-2 md:space-y-3">
                      <div className="border-l-4 border-cyan-500 pl-3 md:pl-4">
                        <p className="font-semibold text-cyan-400 text-fluid-sm md:text-fluid-base">Mini (10 slots)</p>
                        <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Quick fun stories</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-3 md:pl-4">
                        <p className="font-semibold text-purple-400 text-fluid-sm md:text-fluid-base">Normal (20 slots)</p>
                        <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Balanced length</p>
                      </div>
                      <div className="border-l-4 border-orange-500 pl-3 md:pl-4">
                        <p className="font-semibold text-orange-400 text-fluid-sm md:text-fluid-base">Epic (200 slots)</p>
                        <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Massive collaboration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-950/20 to-orange-950/20 backdrop-blur-sm">
                  <CardHeader className="pb-3 md:pb-4">
                    <h3 className="text-fluid-lg md:text-fluid-xl font-bold text-yellow-400 flex items-center gap-2">
                      🏆 Achievements
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-xl md:text-2xl flex-shrink-0">✍️</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">First Word</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Your first contribution</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-xl md:text-2xl flex-shrink-0">📖</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">Story Starter</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Create your first story</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-xl md:text-2xl flex-shrink-0">👑</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-fluid-sm md:text-fluid-base">Completion King</p>
                          <p className="text-fluid-xs md:text-fluid-sm text-gray-400 break-words">Final word on 5+ stories</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Game Rules */}
              <Card className="border-2 border-gray-600/50 bg-gray-800/50 backdrop-blur-sm">
                <CardHeader className="pb-3 md:pb-4">
                  <h3 className="text-fluid-lg md:text-fluid-xl font-bold text-gray-200 flex items-center gap-2">
                    📋 Game Rules
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-200 mb-2 text-fluid-sm md:text-fluid-base">Contribution</h4>
                      <ul className="space-y-1 text-fluid-xs md:text-fluid-sm text-gray-400">
                        <li className="break-words">• Words: 3-30 characters</li>
                        <li className="break-words">• One per story slot</li>
                        <li className="break-words">• Pay 0.00005 ETH</li>
                        <li className="break-words">• Earn 1 credit</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-200 mb-2 text-fluid-sm md:text-fluid-base">Creation</h4>
                      <ul className="space-y-1 text-fluid-xs md:text-fluid-sm text-gray-400">
                        <li className="break-words">• Need credits to start</li>
                        <li className="break-words">• Pay 0.0001 ETH</li>
                        <li className="break-words">• AI-generated templates</li>
                        <li className="break-words">• Complete when full</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <div className="text-center pt-2 md:pt-4">
                <p className="text-fluid-base md:text-fluid-lg text-gray-300 mb-3 md:mb-4 px-4">Ready to create stories?</p>
                <Button
                  onClick={() => setShowCreationModal(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 h-11 md:h-12 px-6 md:px-8 text-fluid-base md:text-fluid-lg font-semibold"
                  disabled={!contractsDeployed}
                >
                  Create Your First Story
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* NFT Collection */}
          <TabsContent value="collection" className="animate-in fade-in-50 duration-500">
            <NFTCollection address={address} />
          </TabsContent>
        </Tabs>

        {/* ── Modals ─────────────────────────────────────────── */}
        <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <ContributionModal
            open={showContributionModal}
            onClose={() => setShowContributionModal(false)}
            story={selectedStory}
            onSubmit={handleSubmitContribution}
          />
          <StoryCreationModal
            open={showCreationModal}
            onClose={() => setShowCreationModal(false)}
            creationCredits={userStats?.creationCredits ?? 0}
            onSubmit={handleCreateStory}
          />
          {completedStoryData && (
            <StoryCompletionModal
              isOpen={showCompletionModal}
              onClose={() => {
                setShowCompletionModal(false);
                setCompletedStoryData(null);
                refetchStories();
              }}
              storyId={completedStoryData.id}
              storyTitle={completedStoryData.title}
              totalSlots={completedStoryData.slots}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}