'use client';

import type { LeaderboardEntry } from '@/types/ghostwriter';
import { Award, ChevronLeft, ChevronRight, Loader2, Medal, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function Leaderboard() {
  const { address } = useAccount();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [userRank, setUserRank] = useState<number | null>(null);
  const entriesPerPage = 50;

  // In production, fetch from contract
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual contract call
        // const leaderboardData = await readContract({
        //   address: STORY_MANAGER_ADDRESS,
        //   abi: StoryManagerABI,
        //   functionName: 'getLeaderboard',
        //   args: [(currentPage - 1) * entriesPerPage, entriesPerPage]
        // });

        // Mock data for now
        const mockEntries: LeaderboardEntry[] = [];
        for (let i = 0; i < Math.min(50, 1000 - (currentPage - 1) * entriesPerPage); i++) {
          const rank = (currentPage - 1) * entriesPerPage + i + 1;
          mockEntries.push({
            rank,
            address: `0x${Math.random().toString(16).slice(2, 42)}`,
            contributions: Math.floor(Math.random() * 1000) + 100 - rank,
            completedStories: Math.floor(Math.random() * 50) + 5,
            achievements: Math.floor(Math.random() * 6),
          });
        }

        setEntries(mockEntries);

        // Check user's rank
        if (address) {
          // TODO: Fetch actual user rank from contract
          setUserRank(Math.floor(Math.random() * 1000) + 1);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage, address]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 10) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    if (rank <= 50) return 'bg-gradient-to-r from-purple-400 to-blue-500';
    if (rank <= 100) return 'bg-gradient-to-r from-blue-400 to-indigo-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const totalPages = Math.ceil(1000 / entriesPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-10 w-10 text-yellow-500" />
            <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Leaderboard
            </h1>
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Top 1000 Contributors • Ranked by Total Words
          </p>
          {userRank && userRank <= 1000 && (
            <div className="mt-4">
              <Badge className={`${getRankBadgeColor(userRank)} text-white text-lg px-6 py-2`}>
                Your Rank: #{userRank}
              </Badge>
            </div>
          )}
        </div>

        {/* Leaderboard Card */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b-2 border-purple-200 dark:border-purple-800">
            <CardTitle className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                Showing {(currentPage - 1) * entriesPerPage + 1}-{Math.min(currentPage * entriesPerPage, 1000)}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="border border-gray-300 px-3 py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="border border-gray-300 px-3 py-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry: LeaderboardEntry, index: number) => (
                  <div
                    key={`${entry.address}-${index}`}
                    className={`flex items-center gap-4 p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors ${address?.toLowerCase() === entry.address.toLowerCase()
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                      : ''
                      }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-16">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Address */}
                    <div className="flex-1">
                      <div className="font-mono text-sm font-semibold">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </div>
                      {address?.toLowerCase() === entry.address.toLowerCase() && (
                        <Badge className="mt-1 text-xs bg-blue-100 text-blue-800">
                          You
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {entry.contributions}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                          {entry.completedStories}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Stories</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {entry.achievements}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Badges</div>
                      </div>
                    </div>

                    {/* Badge for top ranks */}
                    {entry.rank <= 100 && (
                      <Badge className={`${getRankBadgeColor(entry.rank)} text-white`}>
                        {entry.rank <= 10 ? 'Elite' : entry.rank <= 50 ? 'Pro' : 'Rising Star'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Info */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage} of {totalPages} • Total: 1,000 ranked contributors
        </div>
      </div>
    </div>
  );
}
