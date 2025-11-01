'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ACHIEVEMENT_DEFINITIONS, type Achievement } from '@/types/ghostwriter';
import { Lock } from 'lucide-react';

type AchievementBadgesProps = {
  achievements: Achievement[];
};

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  // Merge user achievements with all definitions
  const allAchievements = Object.values(ACHIEVEMENT_DEFINITIONS).map((def: Achievement) => {
    const userAchievement = achievements.find((a: Achievement) => a.id === def.id);
    return userAchievement || def;
  });

  const unlockedCount = allAchievements.filter((a: Achievement) => a.unlocked).length;

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold">🏆 Achievements</span>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg px-4 py-1">
            {unlockedCount}/{allAchievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAchievements.map((achievement: Achievement) => (
            <div
              key={achievement.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                achievement.unlocked
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 shadow-lg hover:shadow-xl hover:scale-105'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
              }`}
            >
              {/* Locked Overlay */}
              {!achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
              )}

              {/* Icon */}
              <div className="text-4xl mb-2 text-center">{achievement.icon}</div>

              {/* Name */}
              <h3
                className={`text-lg font-bold text-center mb-1 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {achievement.name}
              </h3>

              {/* Description */}
              <p
                className={`text-sm text-center ${
                  achievement.unlocked
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {achievement.description}
              </p>

              {/* Unlocked Date */}
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Message */}
        {unlockedCount === 0 && (
          <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
            <p className="text-lg">Start contributing to unlock achievements!</p>
          </div>
        )}

        {unlockedCount > 0 && unlockedCount < allAchievements.length && (
          <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
            <p className="text-lg">Keep going! {allAchievements.length - unlockedCount} more to unlock!</p>
          </div>
        )}

        {unlockedCount === allAchievements.length && (
          <div className="mt-6 text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              🎉 Achievement Master! 🎉
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              You've unlocked all achievements!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
