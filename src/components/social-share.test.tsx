import { render, screen } from '@testing-library/react';
import { SocialShare } from './social-share';
import type { Story } from '@/types/ghostwriter';

const mockStory: Story = {
  storyId: 'story-1',
  title: 'Test Story',
  template: 'A [ADJECTIVE] hero.',
  storyType: 'normal',
  category: 'adventure',
  totalSlots: 5,
  filledSlots: 5,
  slotDetails: [],
  creator: '0x1234567890123456789012345678901234567890',
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  status: 'complete',
  completionTimestamp: new Date().toISOString(),
  shareCount: 3,
};

describe('SocialShare', () => {
  it('should render share heading', () => {
    render(<SocialShare story={mockStory} />);
    expect(screen.getByText(/Share this story/i)).toBeInTheDocument();
  });

  it('should render copy link button', () => {
    render(<SocialShare story={mockStory} />);
    expect(screen.getByRole('button', { name: /Copy Link/i })).toBeInTheDocument();
  });

  it('should render Twitter button', () => {
    render(<SocialShare story={mockStory} />);
    expect(screen.getByRole('button', { name: /Twitter/i })).toBeInTheDocument();
  });

  it('should render Farcaster button', () => {
    render(<SocialShare story={mockStory} />);
    expect(screen.getByRole('button', { name: /Farcaster/i })).toBeInTheDocument();
  });

  it('should show share count when greater than zero', () => {
    render(<SocialShare story={mockStory} />);
    expect(screen.getByText(/Shared 3 times/i)).toBeInTheDocument();
  });

  it('should not show share count when zero', () => {
    const storyWithZeroShares = { ...mockStory, shareCount: 0 };
    render(<SocialShare story={storyWithZeroShares} />);
    expect(screen.queryByText(/Shared/i)).not.toBeInTheDocument();
  });

  it('should call onShare when copy link is clicked', async () => {
    const onShare = jest.fn();
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    render(<SocialShare story={mockStory} onShare={onShare} />);
    const copyButton = screen.getByRole('button', { name: /Copy Link/i });
    copyButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onShare).toHaveBeenCalled();
  });
});
