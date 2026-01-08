'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { UserStats } from '@/types/ghostwriter';
import { Award, CheckCircle, Clock, PenTool, Share2, Sparkles, TrendingUp } from 'lucide-react';

interface UserStatsDisplayProps {
  stats: UserStats;
}

const UserStatsDisplayComponent = ({ stats }: UserStatsDisplayProps) => {
  const formatLastContributionTime = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const statsData = React.useMemo(() => [
    {
      label: 'Words Contributed',
      value: stats.contributionsCount,
      icon: PenTool,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Creation Credits',
      value: stats.creationCredits,
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Stories Created',
      value: stats.storiesCreated,
      icon: Award,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Stories Completed',
      value: stats.completedStories,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Stories Shared',
      value: stats.shareCount,
      icon: Share2,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'NFTs Owned',
      value: stats.nftsOwned,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ], [stats]);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`${stat.bgColor} border-2 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-default backdrop-blur-sm`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-lg ${stat.bgColor} ring-2 ring-white dark:ring-gray-900`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last Contribution Time */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-900">
              <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Last Contribution
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatLastContributionTime(stats.lastContributionTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const UserStatsDisplay = React.memo(UserStatsDisplayComponent);
