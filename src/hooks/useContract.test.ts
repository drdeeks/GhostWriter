import { renderHook, act } from '@testing-library/react';
import { useStoryManager, useContract, useStory, useAllStories, useUserStats, useSlot, useNFT, useUserNFTs, useUserAchievements, useLeaderboard, useUserRank, useIsOwner, useTotalStories, useTotalNFTs, useTransactionStatus } from './useContract';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, FEES } from '@/lib/contracts';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useChainId: jest.fn(() => 8453),
  useReadContract: jest.fn(),
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}));

// Mock useFees hook
jest.mock('./useFees', () => ({
  useFees: jest.fn(() => ({
    contributionFee: BigInt(1000000000000000), // 0.001 ETH
    creationFee: BigInt(2000000000000000), // 0.002 ETH
    isLoading: false,
    isError: false,
  })),
}));

describe('useContract', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContractAsync: jest.fn().mockResolvedValue('0x123'),
    });
    
    (useReadContract as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isSuccess: false,
    });
  });

  describe('useStoryManager', () => {
    it('should create story successfully', async () => {
      const { result } = renderHook(() => useStoryManager());
      
      await act(async () => {
        const response = await result.current.createStoryApproved(
          'story1',
          'Test Story',
          'A test story template',
          'normal',
          'adventure',
          ['noun', 'verb'],
          BigInt(1234567890),
          '0xsignature'
        );
        
        expect(response.success).toBe(true);
        expect(response.hash).toBe('0x123');
      });
    });

    it('should handle story creation error', async () => {
      const mockWrite = jest.fn().mockRejectedValue(new Error('Failed to create story'));
      (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: mockWrite });
      
      const { result } = renderHook(() => useStoryManager());
      
      await act(async () => {
        const response = await result.current.createStoryApproved(
          'story1',
          'Test Story',
          'A test story template',
          'normal',
          'adventure',
          ['noun', 'verb'],
          BigInt(1234567890),
          '0xsignature'
        );
        
        expect(response.success).toBe(false);
        expect(response.error).toContain('Failed to create story');
      });
    });

    it('should contribute word successfully', async () => {
      const { result } = renderHook(() => useStoryManager());
      
      await act(async () => {
        const response = await result.current.contributeWord('story1', 1, 'test');
        
        expect(response.success).toBe(true);
        expect(response.hash).toBe('0x123');
      });
    });

    it('should handle word contribution error', async () => {
      const mockWrite = jest.fn().mockRejectedValue(new Error('Failed to contribute'));
      (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: mockWrite });
      
      const { result } = renderHook(() => useStoryManager());
      
      await act(async () => {
        const response = await result.current.contributeWord('story1', 1, 'test');
        
        expect(response.success).toBe(false);
        expect(response.error).toContain('Failed to contribute');
      });
    });
  });

  describe('useStory', () => {
    it('should return story data', () => {
      const mockData = {
        id: 'story1',
        title: 'Test Story',
        template: 'A test story',
        storyType: 1,
        category: 0,
        wordTypes: ['noun', 'verb'],
        expiresAt: BigInt(1234567890),
        isCompleted: false,
      };
      
      (useReadContract as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { result } = renderHook(() => useStory('story1'));
      
      expect(result.current.story).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle undefined storyId', () => {
      (useReadContract as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { result } = renderHook(() => useStory(undefined));
      
      expect(result.current.story).toBeNull();
    });
  });

  describe('useAllStories', () => {
    it('should return all story IDs', () => {
      const mockData = ['story1', 'story2', 'story3'];
      
      (useReadContract as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { result } = renderHook(() => useAllStories());
      
      expect(result.current.storyIds).toEqual(mockData);
    });
  });

  describe('useUserStats', () => {
    it('should return user stats', () => {
      const mockData = [10, 5, 2, 8, 1, 3, 1234567890];
      
      (useReadContract as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { result } = renderHook(() => useUserStats('0x123'));
      
      expect(result.current.stats).toEqual({
        address: '0x123',
        contributionsCount: 10,
        creationCredits: 5,
        storiesCreated: 2,
        nftsOwned: 8,
        completedStories: 1,
        shareCount: 3,
        lastContributionTime: 1234567890,
        activeContributions: [],
      });
    });
  });

  describe('useSlot', () => {
    it('should return slot data', () => {
      const mockData = {
        word: 'test',
        contributor: '0x123',
        timestamp: BigInt(1234567890),
        isRevealed: true,
      };
      
      (useReadContract as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(() => useSlot('story1', 1));
      
      expect(result.current.slot).toEqual(mockData);
    });
  });

  describe('useNFT', () => {
    it('should return NFT data', () => {
      const mockData = {
        storyId: 'story1',
        title: 'Test Story',
        storyType: 1,
        position: 5,
        wordType: 'noun',
        word: 'test',
        contributor: '0x123',
        timestamp: BigInt(1234567890),
        isRevealed: true,
        isCreatorNFT: false,
        template: 'A test story',
      };
      
      (useReadContract as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(() => useNFT(BigInt(1)));
      
      expect(result.current.nft).toEqual(mockData);
    });
  });

  describe('useUserNFTs', () => {
    it('should return NFT count', () => {
      (useReadContract as jest.Mock).mockReturnValue({
        data: BigInt(5),
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(() => useUserNFTs('0x123'));
      
      expect(result.current.nftCount).toBe(5);
    });
  });

  describe('useUserAchievements', () => {
    it('should return user achievements', () => {
      const mockData = [true, false, true, true];
      
      (useReadContract as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { result } = renderHook(() => useUserAchievements('0x123'));
      
      expect(result.current.achievements).toEqual(mockData);
    });
  });

  describe('useLeaderboard', () => {
    it('should return leaderboard data', () => {
      const mockData = [
        { user: '0x123', score: BigInt(100) },
        { user: '0x456', score: BigInt(90) },
      ];
      
      (useReadContract as jest.Mock).mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { result } = renderHook(() => useLeaderboard(0, 10));
      
      expect(result.current.leaderboard).toEqual(mockData);
    });
  });

  describe('useUserRank', () => {
    it('should return user rank', () => {
      (useReadContract as jest.Mock).mockReturnValue({
        data: BigInt(5),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { result } = renderHook(() => useUserRank('0x123'));
      
      expect(result.current.rank).toBe(5);
    });
  });

  describe('useIsOwner', () => {
    it('should return isOwner true when address matches', () => {
      (useReadContract as jest.Mock).mockReturnValue({
        data: '0x123',
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(() => useIsOwner('0x123'));
      
      expect(result.current.isOwner).toBe(true);
    });

    it('should return isOwner false when address does not match', () => {
      (useReadContract as jest.Mock).mockReturnValue({
        data: '0x456',
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(() => useIsOwner('0x123'));
      
      expect(result.current.isOwner).toBe(false);
    });
  });

  describe('useTotalStories', () => {
    it('should return total stories count', () => {
      (useReadContract as jest.Mock).mockReturnValue({
        data: BigInt(42),
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(() => useTotalStories());
      
      expect(result.current.totalStories).toBe(42);
    });
  });

  describe('useTotalNFTs', () => {
    it('should return total NFTs count', () => {
      (useReadContract as jest.Mock).mockReturnValue({
        data: BigInt(100),
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(() => useTotalNFTs());
      
      expect(result.current.totalNFTs).toBe(100);
    });
  });

  describe('useTransactionStatus', () => {
    it('should return transaction status', () => {
      const mockReceipt = { status: 'success', transactionHash: '0x123' };
      
      (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
        data: mockReceipt,
        isLoading: false,
        isSuccess: true,
      });
      
      const { result } = renderHook(() => useTransactionStatus('0x123'));
      
      expect(result.current.receipt).toEqual(mockReceipt);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useContract', () => {
    it('should return useStoryManager', () => {
      const { result } = renderHook(() => useContract());
      
      expect(result.current.createStoryApproved).toBeDefined();
      expect(result.current.contributeWord).toBeDefined();
      expect(result.current.isPending).toBeDefined();
    });
  });
});