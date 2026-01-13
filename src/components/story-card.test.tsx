import React from 'react';
import { render, screen } from '@testing-library/react';
import { StoryCard } from './story-card';

// Mock the story data with required fields
const mockStory = {
  id: 1,
  title: 'Test Story',
  category: 'adventure',
  storyType: 'mini',
  totalSlots: 10,
  filledSlots: 5,
  isCompleted: false,
  createdAt: new Date().toISOString(),
  creator: '0x1234567890123456789012345678901234567890',
  template: 'Once upon a time...',
  contributions: [],
};

describe('StoryCard', () => {
  it('should render story card component', () => {
    render(<StoryCard story={mockStory} />);
    
    expect(screen.getByText(/Test Story/)).toBeInTheDocument();
    expect(screen.getByText('MINI')).toBeInTheDocument();
  });

  it('should show contribute button', () => {
    render(<StoryCard story={mockStory} />);
    
    expect(screen.getByText(/Contribute/)).toBeInTheDocument();
  });
});
