import { render, screen } from '@testing-library/react';
import { UserStatsDisplay } from './user-stats';
import type { UserStats } from '@/types/ghostwriter';

const mockStats: UserStats = {
  address: '0x1234567890123456789012345678901234567890',
  contributionsCount: 10,
  creationCredits: 5,
  storiesCreated: 2,
  nftsOwned: 8,
  completedStories: 3,
  shareCount: 7,
  lastContributionTime: Math.floor(Date.now() / 1000) - 3600,
  activeContributions: [],
};

describe('UserStatsDisplay', () => {
  it('should render words contributed stat', () => {
    render(<UserStatsDisplay stats={mockStats} />);
    expect(screen.getByText('Words Contributed')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render creation credits stat', () => {
    render(<UserStatsDisplay stats={mockStats} />);
    expect(screen.getByText('Creation Credits')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render stories created stat', () => {
    render(<UserStatsDisplay stats={mockStats} />);
    expect(screen.getByText('Stories Created')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render stories completed stat', () => {
    render(<UserStatsDisplay stats={mockStats} />);
    expect(screen.getByText('Stories Completed')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render stories shared stat', () => {
    render(<UserStatsDisplay stats={mockStats} />);
    expect(screen.getByText('Stories Shared')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('should render NFTs owned stat', () => {
    render(<UserStatsDisplay stats={mockStats} />);
    expect(screen.getByText('NFTs Owned')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should render last contribution time', () => {
    render(<UserStatsDisplay stats={mockStats} />);
    expect(screen.getByText('Last Contribution')).toBeInTheDocument();
    expect(screen.getByText(/1h ago/i)).toBeInTheDocument();
  });

  it('should show Never when lastContributionTime is 0', () => {
    const statsWithNoContribution = { ...mockStats, lastContributionTime: 0 };
    render(<UserStatsDisplay stats={statsWithNoContribution} />);
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('should show Just now for recent contributions', () => {
    const statsWithRecent = { ...mockStats, lastContributionTime: Math.floor(Date.now() / 1000) };
    render(<UserStatsDisplay stats={statsWithRecent} />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });
});
