import { render, screen } from '@testing-library/react';
import AdminConsole from './admin-console';

jest.mock('@/components/admin/admin-dashboard', () => ({
  AdminDashboard: () => <div>Admin Dashboard</div>,
}));

describe('AdminConsole', () => {
  it('should render admin dashboard', () => {
    render(<AdminConsole />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
