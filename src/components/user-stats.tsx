'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { UserStats } from '@/types/ghostwriter';
import { TrendingUp, Award, Sparkles, PenTool } from 'lucide-react';

interface UserStatsDisplayProps {
  stats: UserStats;
}

export function UserStatsDisplay({ stats }: UserStatsDisplayProps) {
  const statsData = [
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
      label: 'NFTs Owned',
      value: stats.nftsOwned,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
  );
}
