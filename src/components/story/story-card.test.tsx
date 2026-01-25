import React from 'react';
import { render, screen } from '@testing-library/react';
import { StoryCard } from './story-card';

// Mock the story data with required fields
const mockStory = {
  id: 1,
  storyId: 'test-story-1',
  title: 'Test Story',
  category: 'adventure' as const,
  storyType: 'normal' as const,
  totalSlots: 10,
  filledSlots: 5,
  isCompleted: false,
  createdAt: new Date().toISOString(),
  completedAt: null,
  completionTimestamp: null,
  creator: '0x1234567890123456789012345678901234567890',
  template: 'Once upon a time...',
  contributions: [],
  slotDetails: [],
  status: 'active' as const,
  shareCount: 0,
};

describe('StoryCard', () => {
  const mockProps = {
    story: mockStory,
    onContribute: jest.fn(),
    onViewStory: jest.fn(),
  };

  it('should render story card component', () => {
    render(<StoryCard {...mockProps} />);
    
    expect(screen.getByText(/Test Story/)).toBeInTheDocument();
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
  });

  it('should show contribute button', () => {
    render(<StoryCard {...mockProps} />);
    
    expect(screen.getByText(/Contribute/)).toBeInTheDocument();
  });
});
