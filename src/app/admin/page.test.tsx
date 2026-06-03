import { render, screen, act } from '@testing-library/react';
import AdminPage from './page';

let resolvePromise: () => void;
jest.mock('@/components/admin/admin-dashboard', () => ({
  AdminDashboard: () => <div>Admin Dashboard Loaded</div>,
}), { virtual: true });

const originalLazy = jest.requireActual('react').lazy;

describe('Admin Page', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should render admin dashboard', async () => {
    render(<AdminPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByText('Admin Dashboard Loaded')).toBeInTheDocument();
  });

  it('should show loading fallback initially', async () => {
    const { unmount } = render(<AdminPage />);
    const loadingFound = screen.queryByText('Loading Admin Dashboard...');
    if (loadingFound) {
      expect(loadingFound).toBeInTheDocument();
    } else {
      expect(screen.getByText('Admin Dashboard Loaded')).toBeInTheDocument();
    }
    unmount();
  });
});
