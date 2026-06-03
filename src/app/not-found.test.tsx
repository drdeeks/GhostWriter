import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound page', () => {
  it('should render 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should render page not found message', () => {
    render(<NotFound />);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<NotFound />);
    expect(screen.getByText(/The page you're looking for doesn't exist/)).toBeInTheDocument();
  });

  it('should have a go home link', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: /Go Home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
