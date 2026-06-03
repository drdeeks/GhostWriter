import { render, screen } from '@testing-library/react';
import { Leaderboard } from '@/components/leaderboard';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
}));

jest.mock('@/hooks/useContract', () => ({
  useLeaderboard: jest.fn(() => ({
    leaderboard: [],
    isLoading: false,
  })),
  useUserRank: jest.fn(() => ({
    rank: 0,
    isLoading: false,
  })),
}));

describe('Leaderboard', () => {
  it('should display leaderboard heading', () => {
    render(<Leaderboard />);
    expect(screen.getByText(/Leaderboard/i)).toBeInTheDocument();
  });

  it('should show top 1000 contributors description', () => {
    render(<Leaderboard />);
    expect(screen.getByText(/Top 1000 Contributors/i)).toBeInTheDocument();
  });

  it('should show pagination controls', () => {
    render(<Leaderboard />);
    expect(screen.getByText(/Page 1 of 20/i)).toBeInTheDocument();
    expect(screen.getByText(/1,000 ranked contributors/i)).toBeInTheDocument();
  });

  it('should show empty state when no entries', () => {
    render(<Leaderboard />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('should show showing range in header', () => {
    render(<Leaderboard />);
    expect(screen.getByText(/Showing 1-50/i)).toBeInTheDocument();
  });
});
