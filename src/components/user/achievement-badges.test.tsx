import { render, screen } from '@testing-library/react';
import { AchievementBadges } from './achievement-badges';
import type { Achievement } from '@/types/ghostwriter';

const mockUnlockedAchievement: Achievement = {
  id: 'first_word',
  name: 'First Word',
  description: 'Contributed your first word',
  icon: '📝',
  unlocked: true,
  unlockedAt: new Date().toISOString(),
};

const mockLockedAchievement: Achievement = {
  id: 'story_starter',
  name: 'Story Starter',
  description: 'Created your first story',
  icon: '📖',
  unlocked: false,
};

describe('AchievementBadges', () => {
  it('should render achievements heading', () => {
    render(<AchievementBadges achievements={[mockUnlockedAchievement]} />);
    expect(screen.getByText(/Achievements/i)).toBeInTheDocument();
  });

  it('should show unlocked count', () => {
    render(<AchievementBadges achievements={[mockUnlockedAchievement]} />);
    expect(screen.getAllByText(/1\//).length).toBeGreaterThan(0);
  });

  it('should show unlocked achievement name', () => {
    render(<AchievementBadges achievements={[mockUnlockedAchievement]} />);
    expect(screen.getByText('First Word')).toBeInTheDocument();
  });

  it('should show locked achievement name', () => {
    render(<AchievementBadges achievements={[mockLockedAchievement]} />);
    expect(screen.getByText('Story Starter')).toBeInTheDocument();
  });

  it('should show lock icon for locked achievements', () => {
    render(<AchievementBadges achievements={[mockLockedAchievement]} />);
    expect(screen.getByText('Story Starter')).toBeInTheDocument();
  });

  it('should show progress message when no achievements unlocked', () => {
    render(<AchievementBadges achievements={[mockLockedAchievement]} />);
    expect(screen.getByText(/Start contributing to unlock achievements/i)).toBeInTheDocument();
  });

  it('should show keep going message when some unlocked', () => {
    render(
      <AchievementBadges achievements={[mockUnlockedAchievement, mockLockedAchievement]} />
    );
    expect(screen.getByText(/Keep going!/i)).toBeInTheDocument();
  });

  it('should show unlocked date for unlocked achievements', () => {
    render(<AchievementBadges achievements={[mockUnlockedAchievement]} />);
    expect(screen.getByText(/Unlocked/i)).toBeInTheDocument();
  });
});
