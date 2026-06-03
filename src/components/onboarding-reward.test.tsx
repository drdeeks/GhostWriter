"use client";

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingReward } from './onboarding-reward';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

describe('OnboardingReward', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    
    // Mock useAccount to return a connected account
    (useAccount as jest.Mock).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
    });
  });

  it('renders when onboarding not seen and address is available', () => {
    render(<OnboardingReward />);
    
    expect(screen.getByText('Welcome to GhostWriter')).toBeInTheDocument();
    expect(screen.getByText(/Add GhostWriter to your Farcaster favorites/)).toBeInTheDocument();
  });

  it('does not render when onboarding has been seen', () => {
    localStorage.setItem('gw_onboarding_seen', 'true');
    
    render(<OnboardingReward />);
    
    expect(screen.queryByText('Welcome to GhostWriter')).not.toBeInTheDocument();
  });

  it('does not render when no address is available', () => {
    (useAccount as jest.Mock).mockReturnValue({ address: undefined });
    
    render(<OnboardingReward />);
    
    expect(screen.queryByText('Welcome to GhostWriter')).not.toBeInTheDocument();
  });

  it('calls handleClaim when primary button is clicked', () => {
    render(<OnboardingReward />);
    
    fireEvent.click(screen.getByRole('button', { name: /I've added it!/i }));
    
    expect(localStorage.getItem('gw_onboarding_seen')).toBe('true');
    expect(toast.success).toHaveBeenCalledWith('Reward claimed! 2 free tokens granted.');
  });

  it('closes dialog when secondary button is clicked', () => {
    render(<OnboardingReward />);
    
    fireEvent.click(screen.getByRole('button', { name: /Maybe later/i }));
    
    expect(localStorage.getItem('gw_onboarding_seen')).toBeNull();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('sets localStorage when handleClaim is called', () => {
    render(<OnboardingReward />);
    
    fireEvent.click(screen.getByRole('button', { name: /I've added it!/i }));
    
    expect(localStorage.getItem('gw_onboarding_seen')).toBe('true');
  });

  it('shows success toast when reward is claimed', () => {
    render(<OnboardingReward />);
    
    fireEvent.click(screen.getByRole('button', { name: /I've added it!/i }));
    
    expect(toast.success).toHaveBeenCalledWith('Reward claimed! 2 free tokens granted.');
  });
});