import { render, screen } from '@testing-library/react';
import { ContributionModal } from '@/components/contribution-modal';
import type { Story } from '@/types/ghostwriter';

const mockStory: Story = {
  storyId: 'story-1',
  title: 'Test Story',
  template: 'A [ADJECTIVE] hero went on a [NOUN] quest.',
  storyType: 'normal',
  category: 'adventure',
  totalSlots: 10,
  filledSlots: 3,
  slotDetails: [],
  creator: '0x1234567890123456789012345678901234567890',
  createdAt: new Date().toISOString(),
  completedAt: null,
  status: 'active',
  completionTimestamp: null,
  shareCount: 0,
};

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('ContributionModal', () => {
  it('should render null when story is null', () => {
    const { container } = render(
      <ContributionModal open={true} onClose={() => {}} story={null} onSubmit={() => {}} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render modal when story is provided', () => {
    render(
      <ContributionModal open={true} onClose={() => {}} story={mockStory} onSubmit={() => {}} />
    );
    expect(screen.getByText(/Contribute to Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Story/i)).toBeInTheDocument();
  });

  it('should display story progress', () => {
    render(
      <ContributionModal open={true} onClose={() => {}} story={mockStory} onSubmit={() => {}} />
    );
    expect(screen.getByText(/Story Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/10 words/i)).toBeInTheDocument();
  });

  it('should display word type badge', () => {
    render(
      <ContributionModal open={true} onClose={() => {}} story={mockStory} onSubmit={() => {}} />
    );
    expect(screen.getByText(/Word Type Needed:/i)).toBeInTheDocument();
    const badges = screen.getAllByText(/Adjective/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should render input field', () => {
    render(
      <ContributionModal open={true} onClose={() => {}} story={mockStory} onSubmit={() => {}} />
    );
    const input = screen.getByPlaceholderText(/Enter a/i);
    expect(input).toBeInTheDocument();
  });

  it('should render submit and cancel buttons', () => {
    render(
      <ContributionModal open={true} onClose={() => {}} story={mockStory} onSubmit={() => {}} />
    );
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contribute Word/i })).toBeInTheDocument();
  });

  it('should display fee information', () => {
    render(
      <ContributionModal open={true} onClose={() => {}} story={mockStory} onSubmit={() => {}} />
    );
    expect(screen.getByText(/Fee: \$0\.05 \+ gas/i)).toBeInTheDocument();
  });

  it('should show character count', () => {
    render(
      <ContributionModal open={true} onClose={() => {}} story={mockStory} onSubmit={() => {}} />
    );
    expect(screen.getByText(/characters/i)).toBeInTheDocument();
    expect(screen.getByText(/3 min/i)).toBeInTheDocument();
  });
});
