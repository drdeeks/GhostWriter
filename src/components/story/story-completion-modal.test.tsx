import { render, screen } from '@testing-library/react';
import { StoryCompletionModal } from '@/components/story/story-completion-modal';

jest.mock('@/hooks/useStoryCompletion', () => ({
  useStoryCompletion: jest.fn(() => ({
    completeStoryFull: jest.fn().mockResolvedValue(undefined),
    isProcessing: false,
    progress: 0,
    error: null,
    resetProgress: jest.fn(),
  })),
}));

jest.mock('@/lib/haptic', () => ({
  useHaptic: jest.fn(() => ({
    trigger: jest.fn(),
    setEnabled: jest.fn(),
    isEnabled: jest.fn(() => true),
  })),
}));

describe('StoryCompletionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    storyId: 'story-1',
    storyTitle: 'Test Story',
    totalSlots: 10,
  };

  it('should render modal when open', () => {
    render(<StoryCompletionModal {...defaultProps} />);
    expect(screen.getByText(/Story Complete!/i)).toBeInTheDocument();
  });

  it('should display story title', () => {
    render(<StoryCompletionModal {...defaultProps} />);
    expect(screen.getByText(/Test Story/i)).toBeInTheDocument();
  });

  it('should show processing info', () => {
    render(<StoryCompletionModal {...defaultProps} />);
    expect(screen.getByText(/Processing 10 contributions/i)).toBeInTheDocument();
  });

  it('should show reveal NFTs button', () => {
    render(<StoryCompletionModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Reveal NFTs/i })).toBeInTheDocument();
  });

  it('should list completion features', () => {
    render(<StoryCompletionModal {...defaultProps} />);
    expect(screen.getByText(/All contributor NFTs will be revealed/i)).toBeInTheDocument();
    expect(screen.getByText(/Creator NFT will be minted/i)).toBeInTheDocument();
    expect(screen.getByText(/Achievements will be unlocked/i)).toBeInTheDocument();
  });

  it('should show processing state when isProcessing', () => {
    const { useStoryCompletion } = require('@/hooks/useStoryCompletion');
    useStoryCompletion.mockReturnValue({
      completeStoryFull: jest.fn().mockResolvedValue(undefined),
      isProcessing: true,
      progress: 50,
      error: null,
      resetProgress: jest.fn(),
    });

    render(<StoryCompletionModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Processing... 50%/i })).toBeDisabled();
  });

  it('should show error when present', () => {
    const { useStoryCompletion } = require('@/hooks/useStoryCompletion');
    useStoryCompletion.mockReturnValue({
      completeStoryFull: jest.fn().mockResolvedValue(undefined),
      isProcessing: false,
      progress: 0,
      error: 'Transaction failed',
      resetProgress: jest.fn(),
    });

    render(<StoryCompletionModal {...defaultProps} />);
    expect(screen.getByText(/Error: Transaction failed/i)).toBeInTheDocument();
  });
});
