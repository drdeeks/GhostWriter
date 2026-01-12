'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

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

import { NFTCollection } from '@/components/nft-collection';
import { StoryCard } from '@/components/story-card';
import { UserStatsDisplay } from '@/components/user-stats';
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
  const [farcasterUser, setFarcasterUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Contract data with performance monitoring
  const { storyIds, isLoading: storyIdsLoading, refetch: refetchStories } = useAllStories();
  const { stories, isLoading: storiesLoading, refetchAll } = useStories(storyIds);
  const { stats: userStats, refetch: refetchStats } = useUserStats(address);

  // Enhanced Farcaster initialization
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        
        await performance.measureAsync('farcaster-init', async () => {
          await farcaster.initialize();
          const context = farcaster.getContext();
          
          if (farcaster.isInMiniApp() && context?.user) {
            setFarcasterUser(context.user.username || null);
            haptic.trigger('light'); // Welcome haptic
            
            // Request notification permission for mini-app
            await farcaster.requestNotificationPermission();
          }
        });
      } catch (error) {
        console.error('Initialization failed:', error);
      } finally {
        setIsLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-300">Initializing Ghost Writer...</p>
        </div>
      </div>
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
          {address && (
            <p className="text-xs text-gray-500 font-mono mt-1 md:mt-2 break-all">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
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
          <TabsList className="grid w-full grid-cols-4 mb-8 h-14 bg-gray-900/80 backdrop-blur-md border-2 border-gray-800 shadow-xl">
            <TabsTrigger
              value="stories"
              className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Active ({activeStories.length})
            </TabsTrigger>

            <TabsTrigger
              value="completed"
              className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Complete ({completedStories.length})
            </TabsTrigger>

            <TabsTrigger
              value="how-to-play"
              className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50"
            >
              ❓ How to Play
            </TabsTrigger>

            <TabsTrigger
              value="collection"
              className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/50"
            >
              🖼️ My NFTs ({userStats?.nftsOwned ?? 0})
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
              <Card className="border-2 border-dashed border-gray-700 bg-gray-900/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-xl font-semibold text-gray-300 mb-2">No active stories yet</p>
                  <p className="text-gray-500">
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
              <Card className="border-2 border-dashed border-gray-700 bg-gray-900/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Sparkles className="h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-xl font-semibold text-gray-300 mb-2">No completed stories yet</p>
                  <p className="text-gray-500">Be the first to finish one!</p>
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
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                  🎮 How to Play Ghost Writer
                </h2>
                <p className="text-xl text-gray-300">
                  Build community through collaborative storytelling and earn rewards!
                </p>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Getting Started */}
                <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-950/20 to-emerald-950/20 backdrop-blur-sm">
                  <CardHeader>
                    <h3 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                      🚀 Getting Started
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-green-400 font-bold text-lg">1.</span>
                        <div>
                          <p className="font-semibold text-gray-200">Connect Your Wallet</p>
                          <p className="text-sm text-gray-400">Link your Web3 wallet to start playing</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-400 font-bold text-lg">2.</span>
                        <div>
                          <p className="font-semibold text-gray-200">Earn Creation Credits</p>
                          <p className="text-sm text-gray-400">Contribute words to stories to earn credits</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-400 font-bold text-lg">3.</span>
                        <div>
                          <p className="font-semibold text-gray-200">Create Your Story</p>
                          <p className="text-sm text-gray-400">Use credits to start your own mad libs story</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* How It Works */}
                <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-cyan-950/20 backdrop-blur-sm">
                  <CardHeader>
                    <h3 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                      ⚙️ How It Works
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-blue-400 font-bold text-lg">•</span>
                        <div>
                          <p className="font-semibold text-gray-200">Community Templates</p>
                          <p className="text-sm text-gray-400">Story templates with blanks for collaborative filling</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-blue-400 font-bold text-lg">•</span>
                        <div>
                          <p className="font-semibold text-gray-200">Community Contributions</p>
                          <p className="text-sm text-gray-400">Players fill in words to complete the story</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-blue-400 font-bold text-lg">•</span>
                        <div>
                          <p className="font-semibold text-gray-200">NFT Rewards</p>
                          <p className="text-sm text-gray-400">Each contribution mints a unique NFT</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Story Types */}
                <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-pink-950/20 backdrop-blur-sm">
                  <CardHeader>
                    <h3 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                      📚 Story Types
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="border-l-4 border-cyan-500 pl-4">
                        <p className="font-semibold text-cyan-400">Mini Stories (10 slots)</p>
                        <p className="text-sm text-gray-400">Quick, fun stories for fast gameplay</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <p className="font-semibold text-purple-400">Normal Stories (20 slots)</p>
                        <p className="text-sm text-gray-400">Balanced stories with moderate length</p>
                      </div>
                      <div className="border-l-4 border-orange-500 pl-4">
                        <p className="font-semibold text-orange-400">Epic Stories (200 slots)</p>
                        <p className="text-sm text-gray-400">Massive collaborative storytelling</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-950/20 to-orange-950/20 backdrop-blur-sm">
                  <CardHeader>
                    <h3 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                      🏆 Achievements
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✍️</span>
                        <div>
                          <p className="font-semibold text-gray-200">First Word</p>
                          <p className="text-sm text-gray-400">Contribute your first word</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📖</span>
                        <div>
                          <p className="font-semibold text-gray-200">Story Starter</p>
                          <p className="text-sm text-gray-400">Create your first story</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">👑</span>
                        <div>
                          <p className="font-semibold text-gray-200">Completion King</p>
                          <p className="text-sm text-gray-400">Final word on 5+ stories</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏆</span>
                        <div>
                          <p className="font-semibold text-gray-200">Prolific Writer</p>
                          <p className="text-sm text-gray-400">Contribute to 50+ stories</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Game Rules */}
              <Card className="border-2 border-gray-600 bg-gray-900/50 backdrop-blur-sm">
                <CardHeader>
                  <h3 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
                    📋 Game Rules
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-200 mb-2">Contribution Rules</h4>
                      <ul className="space-y-1 text-sm text-gray-400">
                        <li>• Words must be 3-30 characters</li>
                        <li>• One contribution per story slot</li>
                        <li>• Pay 0.00005 ETH per contribution</li>
                        <li>• Earn 1 creation credit per contribution</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-200 mb-2">Creation Rules</h4>
                      <ul className="space-y-1 text-sm text-gray-400">
                        <li>• Need creation credits to start stories</li>
                        <li>• Pay 0.0001 ETH to create a story</li>
                        <li>• Templates use [WORD_TYPE] placeholders</li>
                        <li>• Stories complete when all slots are filled</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <div className="text-center">
                <p className="text-lg text-gray-300 mb-4">Ready to start creating hilarious stories?</p>
                <Button
                  onClick={() => setShowCreationModal(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 h-12 px-8 text-lg font-semibold"
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
        </Suspense>
      </div>
    </div>
  );
}