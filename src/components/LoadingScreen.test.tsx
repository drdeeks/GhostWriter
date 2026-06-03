import { render, screen, act } from '@testing-library/react';
import { LoadingScreen } from './LoadingScreen';

jest.useFakeTimers();

describe('LoadingScreen', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('should render when isLoading is true', () => {
    render(<LoadingScreen isLoading={true} />);
    expect(screen.getByText(/Ghost Writer/i)).toBeInTheDocument();
  });

  it('should not render when isLoading is false', () => {
    render(<LoadingScreen isLoading={false} />);
    expect(screen.queryByText(/Ghost Writer/i)).not.toBeInTheDocument();
  });

  it('should show default loading message', () => {
    render(<LoadingScreen isLoading={true} />);
    expect(screen.getByText(/Initializing your storytelling experience/i)).toBeInTheDocument();
  });

  it('should show custom message when provided', () => {
    render(<LoadingScreen isLoading={true} message="Custom loading..." />);
    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });

  it('should hide after minDisplayTime when isLoading becomes false', () => {
    const { rerender } = render(<LoadingScreen isLoading={true} minDisplayTime={500} />);
    expect(screen.getByText(/Ghost Writer/i)).toBeInTheDocument();

    rerender(<LoadingScreen isLoading={false} minDisplayTime={500} />);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText(/Ghost Writer/i)).not.toBeInTheDocument();
  });

  it('should render spinner', () => {
    render(<LoadingScreen isLoading={true} />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
