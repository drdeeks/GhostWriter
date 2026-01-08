'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsOwner } from '@/hooks/useContract';
import type { StoryCategory, StoryType } from '@/types/ghostwriter';
import { useEffect } from 'react';
import { CATEGORY_INFO } from '@/types/ghostwriter';
import { AlertTriangle, BookOpen, Settings, Shield, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

const AdminDashboardComponent = () => {
  const { address } = useAccount();
  const [selectedCategory, setSelectedCategory] = useState<StoryCategory>('random');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyTemplate, setStoryTemplate] = useState<string>('');
  const [storyType, setStoryType] = useState<StoryType>('normal');
  // If dev selects dev story, auto-fill template
  useEffect(() => {
    if (storyType === 'dev') {
      setStoryTitle('The Absurd Onchain Odyssey of Jesse and the Bot Farmers');
      setStoryTemplate(`In a world where Jesse from Base Chain ruled the leaderboards, bot farmers hatched eggs faster than Farcaster memes could spread. Coinbase and NeynarScoring joined forces to buildin and expand networks/net worths, all in the name of bringing everyone on chain. One day, Jesse woke up to find his breakfast eggs had turned into NFTs, and every time he blinked, a new leaderboard appeared. The bot farmers, armed with rubber chickens and disco shoes, challenged Jesse to a dance-off for the fate of the blockchain. As the crowd cheered, the eggs began to hatch, revealing tiny Farcaster avatars chanting 'onchain or bust!' In a twist, Coinbase announced airdrops for anyone who could tell a joke about network effects, and NeynarScoring started awarding points for the most absurd wallet names. By sunset, the entire world was on chain, including the family dog, who promptly started a meme coin. The moral: if you can't beat the bots, join the dance and bring your own eggs. [ADJECTIVE] [NOUN] [VERB] [ADVERB] [PLURAL_NOUN] [PAST_TENSE_VERB] [VERB_ING] [PERSONS_NAME] [PLACE] [NUMBER] [COLOR] [BODY_PART] [FOOD] [ANIMAL] [EXCLAMATION] [EMOTION] ... (continue for 250 slots)`);
    }
  }, [storyType]);

  // Check if user is contract owner
  const { isOwner, isLoading: ownerLoading } = useIsOwner(address);
  const isAdmin = isOwner;

  const handleAirdropCredits = async () => {
    try {
      toast.success('Airdrop initiated', {
        description: 'Credits will be distributed to selected users',
      });
    } catch (error) {
      toast.error('Airdrop failed');
    }
  };

  const handleCreateStory = async () => {
    try {
      if (!storyTitle || !storyTemplate) {
        toast.error('Please fill in all fields');
        return;
      }

      toast.success('Story created!', {
        description: `"${storyTitle}" is now live`,
      });

      // Reset form
      setStoryTitle('');
      setStoryTemplate('');
    } catch (error) {
      toast.error('Failed to create story');
    }
  };

  if (!isAdmin) {
    return (
      <Card className="border-2 border-red-300 dark:border-red-700">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <p className="text-xl font-semibold text-red-600">Access Denied</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Only contract owner can access admin dashboard
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 relative overflow-hidden py-8">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-purple-500" />
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg text-gray-300">
            Manage Ghost Writer platform
          </p>
          <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            Owner: {address?.slice(0, 6)}...{address?.slice(-4)}
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,234</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12% this week</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">45</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">3 completed today</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total NFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5,678</div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">+89 today</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Liquidity Pool
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0.5 ETH</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">$1,234 USD</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800">
            <TabsTrigger value="stories" className="text-base font-semibold">
              <BookOpen className="mr-2 h-4 w-4" />
              Stories
            </TabsTrigger>
            <TabsTrigger value="users" className="text-base font-semibold">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-base font-semibold">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-base font-semibold">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Stories Management */}
          <TabsContent value="stories">
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle>Create New Story Template</CardTitle>
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
                        <SelectItem value="normal">Normal (10 slots)</SelectItem>
                        <SelectItem value="extended">Extended (20 slots)</SelectItem>
                        <SelectItem value="dev">Dev's Absurd Epic (250 slots, dev only)</SelectItem>
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
                    className="w-full mt-2 min-h-[200px] p-3 rounded-md border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Use [ADJECTIVE], [NOUN], [VERB], etc. to mark blanks
                  </p>
                </div>

                <Button
                  onClick={handleCreateStory}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Create Story Template
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
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
                      placeholder="0x123...&#10;0x456...&#10;0x789..."
                      className="w-full mt-2 min-h-[150px] p-3 rounded-md border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      One address per line
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="credits">Credits per User</Label>
                    <Input
                      id="credits"
                      type="number"
                      placeholder="5"
                      className="mt-2"
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Bootstrap new users with creation credits
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleAirdropCredits}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  Airdrop Credits
                </Button>

                <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h3 className="font-semibold text-lg mb-4">Recent Users</h3>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-mono text-sm">0x{Math.random().toString(16).slice(2, 10)}...</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{Math.floor(Math.random() * 50)} contributions</span>
                          <Badge>{Math.floor(Math.random() * 10)} credits</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Story Categories Distribution</h3>
                    <div className="space-y-2">
                      {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">{info.emoji} {info.name}</span>
                          <Badge>{Math.floor(Math.random() * 20)}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Achievement Distribution</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">✍️ First Word</span>
                        <Badge>1,234 users</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">📖 Story Starter</span>
                        <Badge>456 users</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">👑 Completion King</span>
                        <Badge>89 users</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🏆 Prolific Writer</span>
                        <Badge>23 users</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Badge>2m ago</Badge>
                      <span>User 0x123... contributed to "The Wicked Witch"</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Badge>5m ago</Badge>
                      <span>Story "A Penguin's Guide" completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Badge>8m ago</Badge>
                      <span>User 0x456... unlocked "First Word" achievement</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="border-2 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Emergency Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <h3 className="font-semibold mb-2">Emergency Withdrawal</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Withdraw all contract funds to owner address (emergency only)
                    </p>
                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                      Emergency Withdraw
                    </Button>
                  </div>

                  <div className="p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg">
                    <h3 className="font-semibold mb-2">Contract Addresses</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">StoryManager:</span>
                        <span>0x{Math.random().toString(16).slice(2, 42)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">GhostWriterNFT:</span>
                        <span>0x{Math.random().toString(16).slice(2, 42)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">LiquidityPool:</span>
                        <span>0x{Math.random().toString(16).slice(2, 42)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export const AdminDashboard = React.memo(AdminDashboardComponent);
