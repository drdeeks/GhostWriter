import { render, screen } from '@testing-library/react';
import LeaderboardPage from './page';

jest.mock('@/components/leaderboard', () => ({
  Leaderboard: () => <div>Leaderboard Component</div>,
}));

describe('Leaderboard Page', () => {
  it('should render leaderboard component', () => {
    render(<LeaderboardPage />);
    expect(screen.getByText('Leaderboard Component')).toBeInTheDocument();
  });
});
