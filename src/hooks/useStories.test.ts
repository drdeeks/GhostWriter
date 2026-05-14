import { renderHook } from '@testing-library/react';
import { useStories } from './useStories';
import { useReadContracts } from 'wagmi';

// Mock wagmi
jest.mock('wagmi', () => ({
  useReadContracts: jest.fn(),
}));

// Mock contracts lib
jest.mock('@/lib/contracts', () => ({
  CONTRACTS: {
    storyManager: '0xStoryManager' as `0x${string}`,
  },
  STORY_MANAGER_ABI: [],
}));

describe('useStories Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockStoryIds = ['1', '2'];
  const mockData = [
    {
      status: 'success',
      result: {
        storyId: '1',
        title: 'Story 1',
        storyType: 0,
        category: 0,
        totalSlots: 10,
        filledSlots: 5,
        creator: '0xCreator1',
        createdAt: BigInt(1625097600), // 2021-07-01
        status: 0,
      },
    },
    {
      status: 'success',
      result: {
        storyId: '2',
        title: 'Story 2',
        storyType: 1,
        category: 1,
        totalSlots: 20,
        filledSlots: 10,
        creator: '0xCreator2',
        createdAt: BigInt(1625184000), // 2021-07-02
        status: 0,
      },
    },
  ];

  beforeEach(() => {
    (useReadContracts as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle contract read errors gracefully', async () => {
    (useReadContracts as jest.Mock).mockReturnValue({
      data: undefined,
      error: new Error('Contract read failed'),
      isLoading: false,
    });

    const { result } = renderHook(() => useStories([]));
    expect(result.current.stories).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isLoading).toBe(false);
  });

  it('should filter out failed contract reads', () => {
    (useReadContracts as jest.Mock).mockReturnValue({
      data: [
        { status: 'failure', error: new Error('Read failed') },
        {
          status: 'success',
          result: {
            storyId: '1',
            title: 'Valid Story',
            storyType: 0,
            category: 0,
            totalSlots: 10,
            filledSlots: 5,
            creator: '0xCreator',
            createdAt: BigInt(1625097600),
            status: 0,
          },
        },
      ],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useStories(['1']));
    expect(result.current.stories).toHaveLength(1);
    expect(result.current.stories[0].title).toBe('Valid Story');
  });

  it('should return mapped stories', () => {
    const { result } = renderHook(() => useStories(mockStoryIds));

    expect(result.current.stories).toHaveLength(2);
    expect(result.current.stories[0].storyId).toBe('1');
    expect(result.current.stories[0].title).toBe('Story 1');
    expect(result.current.stories[1].storyId).toBe('2');
    expect(result.current.stories[1].title).toBe('Story 2');
  });

  it('should handle empty or undefined storyIds', () => {
    (useReadContracts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useStories(undefined));
    expect(result.current.stories).toHaveLength(0);

    const { result: result2 } = renderHook(() => useStories([]));
    expect(result2.current.stories).toHaveLength(0);
  });

  it('should memoize returned stories array', () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] | undefined }) => useStories(ids),
      { initialProps: { ids: mockStoryIds } }
    );

    const firstStories = result.current.stories;

    // Rerender with same IDs
    rerender({ ids: mockStoryIds });

    expect(result.current.stories).toBe(firstStories);
  });

  it('should update stories when data changes', () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] | undefined }) => useStories(ids),
      { initialProps: { ids: mockStoryIds } }
    );

    const firstStories = result.current.stories;

    // Simulate data change from useReadContracts
    (useReadContracts as jest.Mock).mockReturnValue({
      data: [mockData[0]], // Only one story now
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    rerender({ ids: mockStoryIds });

    expect(result.current.stories).not.toBe(firstStories);
    expect(result.current.stories).toHaveLength(1);
  });

  it('should filter out failed contract reads', () => {
    (useReadContracts as jest.Mock).mockReturnValue({
      data: [
        mockData[0],
        { status: 'failure', error: new Error('Failed to read') },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useStories(mockStoryIds));

    expect(result.current.stories).toHaveLength(1);
    expect(result.current.stories[0].storyId).toBe('1');
  });
});
