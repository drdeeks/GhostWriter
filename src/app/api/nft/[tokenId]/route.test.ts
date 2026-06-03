// Mock the GET function to handle params
import { GET as originalGET } from '@/app/api/nft/[tokenId]/route';
const GET = async (request: NextRequest) => {
  // Extract tokenId from URL for testing
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const tokenId = pathParts[pathParts.length - 1] || '1';
  
  // Call the original function with both parameters
  return originalGET(request, { params: Promise.resolve({ tokenId }) });
};
import { CONTRACTS, NFT_ABI, STORY_MANAGER_ABI } from '@/lib/contracts';
import { createPublicClient, http } from 'viem';

// Use the mock from test-utils
import { NextRequest, NextResponse } from '@/test-utils/next-mocks';

// Mock external dependencies
jest.mock('next/server', () => ({
  NextResponse: NextResponse,
}));

// Add mockClientConfig for viem
const mockTransport = {
  request: jest.fn(),
  value: undefined,
  key: 'mockTransport',
  name: 'MockTransport',
};

const mockClientConfig = {
  chain: {
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
  },
  transport: http(),
};

// Mock viem
const mockClientConfig = {
  chain: {
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
  },
  transport: http(),
};

jest.mock('viem', () => ({
  createPublicClient: jest.fn().mockImplementation((config) => ({
    readContract: jest.fn(),
    multicall: jest.fn(),
  })),
  http: jest.fn(() => ({})),
  base: { id: 8453 },
  baseSepolia: { id: 84532 },
}));

jest.mock('@/lib/contracts', () => ({
  CONTRACTS: {
    nft: '0x1234567890123456789012345678901234567890',
    storyManager: '0x0987654321098765432109876543210987654321',
  },
  NFT_ABI: [],
  STORY_MANAGER_ABI: [],
}));

// Mock fetch for Farcaster API
global.fetch = jest.fn();

describe('GET /api/nft/[tokenId]', () => {
  const originalEnv = process.env;
  const mockRequest = (tokenId: string, origin = 'http://localhost:3000') => {
    const req = new NextRequest(`${origin}/api/nft/${tokenId}`);
    return req;
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_CHAIN_ID = '84532';
    process.env.BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';
    
    (createPublicClient as jest.Mock).mockReturnValue({
      readContract: jest.fn(),
      multicall: jest.fn(),
    });
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Happy path - Creator NFT
  it('should return 200 and creator NFT metadata for valid token ID', async () => {
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 1,
        name: 'Test Chain',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['http://localhost:8545'] } },
      },
    });
    
    (publicClient.readContract as jest.Mock)
      .mockResolvedValueOnce([
        'story1',
        'Test Story',
        0,
        5,
        '',
        '',
        '0x123',
        1234567890,
        true,
        true,
        true,
        'A [ADJECTIVE] story about [NOUN].',
      ]) // NFT data
      .mockResolvedValueOnce({
        storyId: 'story1',
        title: 'Test Story',
        template: 'A [ADJECTIVE] story about [NOUN].',
        storyType: 1,
        category: 0,
        totalSlots: 5,
        filledSlots: 5,
        creator: '0x123',
        createdAt: 1234567890,
        completedAt: 1234567900,
        status: 2,
        shareCount: 0,
      }); // Story data
    
    (publicClient.multicall as jest.Mock).mockResolvedValue([
      { status: 'success', result: { position: 1, wordType: 'ADJECTIVE', filled: true, word: 'happy', contributor: '0x123', nftId: 1, timestamp: 1234567891 } },
      { status: 'success', result: { position: 2, wordType: 'NOUN', filled: true, word: 'dragon', contributor: '0x456', nftId: 2, timestamp: 1234567892 } },
    ]);
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ username: 'testuser', fid: 123 }),
    });
    
    const response = await GET(mockRequest('1'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.name).toContain('Creator - "Test Story"');
    expect(data.attributes).toEqual(expect.arrayContaining([
      expect.objectContaining({ trait_type: 'Creator', value: '@testuser (FID: 123)' }),
    ]));
    // @ts-ignore
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  });

  // Happy path - Contributor NFT (hidden)
  it('should return 200 and hidden contributor NFT metadata', async () => {
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 1,
        name: 'Test Chain',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['http://localhost:8545'] } },
      },
    });
    
    (publicClient.readContract as jest.Mock)
      .mockResolvedValueOnce([
        'story1',
        'Test Story',
        1,
        5,
        'ADJECTIVE',
        'happy',
        '0x456',
        1234567891,
        false,
        false,
        false,
        'A [ADJECTIVE] story about [NOUN].',
      ]) // NFT data
      .mockResolvedValueOnce({
        storyId: 'story1',
        title: 'Test Story',
        template: 'A [ADJECTIVE] story about [NOUN].',
        storyType: 1,
        category: 0,
        totalSlots: 5,
        filledSlots: 3,
        creator: '0x123',
        createdAt: 1234567890,
        completedAt: 0,
        status: 1,
        shareCount: 0,
      }); // Story data
    
    const response = await GET(mockRequest('1'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.name).toContain('Hidden');
    expect(data.attributes).toEqual(expect.arrayContaining([
      expect.objectContaining({ trait_type: 'Status', value: 'Hidden' }),
    ]));
  });

  // Happy path - Contributor NFT (revealed)
  it('should return 200 and revealed contributor NFT metadata', async () => {
    const publicClient = createPublicClient({});
    
    (publicClient.readContract as jest.Mock)
      .mockResolvedValueOnce([
        'story1',
        'Test Story',
        1,
        5,
        'ADJECTIVE',
        'happy',
        '0x456',
        1234567891,
        true,
        true,
        false,
        'A [ADJECTIVE] story about [NOUN].',
      ]) // NFT data
      .mockResolvedValueOnce({
        storyId: 'story1',
        title: 'Test Story',
        template: 'A [ADJECTIVE] story about [NOUN].',
        storyType: 1,
        category: 0,
        totalSlots: 5,
        filledSlots: 5,
        creator: '0x123',
        createdAt: 1234567890,
        completedAt: 1234567900,
        status: 2,
        shareCount: 0,
      }); // Story data
    
    (publicClient.multicall as jest.Mock).mockResolvedValue([
      { status: 'success', result: { position: 1, wordType: 'ADJECTIVE', filled: true, word: 'happy', contributor: '0x456', nftId: 1, timestamp: 1234567891 } },
      { status: 'success', result: { position: 2, wordType: 'NOUN', filled: true, word: 'dragon', contributor: '0x789', nftId: 2, timestamp: 1234567892 } },
    ]);
    
    const response = await GET(mockRequest('1'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.name).toContain('Revealed');
    expect(data.description).toContain('Your "happy" contribution');
    expect(data.properties.fullStoryText).toContain('happy');
  });

  // Error conditions
  it('should return 400 for invalid token ID', async () => {
    const response = await GET(mockRequest('invalid'));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid token ID');
  });

  it('should return 400 for negative token ID', async () => {
    const response = await GET(mockRequest('-1'));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid token ID');
  });

  it('should return 500 when NFT contract is not configured', async () => {
    jest.resetModules();
    const { CONTRACTS } = require('@/lib/contracts');
    CONTRACTS.nft = '0x0000000000000000000000000000000000000000';
    
    const { GET: UpdatedGET } = require('@/app/api/nft/[tokenId]/route');
    const response = await UpdatedGET(mockRequest('1'));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('NFT contract address not configured');
  });

  it('should return 500 when StoryManager is not configured', async () => {
    jest.resetModules();
    const { CONTRACTS } = require('@/lib/contracts');
    CONTRACTS.storyManager = '0x0000000000000000000000000000000000000000';
    
    const { GET: UpdatedGET } = require('@/app/api/nft/[tokenId]/route');
    const response = await UpdatedGET(mockRequest('1'));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('StoryManager address not configured');
  });

  it('should return 404 when NFT is not found', async () => {
    const publicClient = createPublicClient({});
    (publicClient.readContract as jest.Mock).mockResolvedValueOnce(null);
    
    const response = await GET(mockRequest('999'));
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('NFT not found');
  });

  it('should return 500 when contract read fails', async () => {
    const publicClient = createPublicClient({});
    (publicClient.readContract as jest.Mock).mockRejectedValue(new Error('Contract error'));
    
    const response = await GET(mockRequest('1'));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Failed to generate NFT metadata');
  });

  // Edge cases
  it('should handle zero token ID', async () => {
    const response = await GET(mockRequest('0'));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid token ID');
  });

  it('should handle very large token ID', async () => {
    const publicClient = createPublicClient({});
    (publicClient.readContract as jest.Mock).mockResolvedValueOnce([
      'story1', 'Test Story', 0, 5, '', '', '0x123', 1234567890, true, true, true, 'A [ADJECTIVE] story.',
    ]);
    
    const response = await GET(mockRequest('999999999999'));
    expect(response.status).toBe(200);
  });

  it('should handle missing Farcaster user info gracefully', async () => {
    const publicClient = createPublicClient({});
    
    (publicClient.readContract as jest.Mock)
      .mockResolvedValueOnce([
        'story1', 'Test Story', 0, 5, '', '', '0x123', 1234567890, true, true, true, 'A [ADJECTIVE] story.',
      ])
      .mockResolvedValueOnce({
        storyId: 'story1',
        title: 'Test Story',
        template: 'A [ADJECTIVE] story.',
        storyType: 1,
        category: 0,
        totalSlots: 5,
        filledSlots: 5,
        creator: '0x123',
        createdAt: 1234567890,
        completedAt: 1234567900,
        status: 2,
        shareCount: 0,
      });
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    
    const response = await GET(mockRequest('1'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.attributes).toEqual(expect.arrayContaining([
      expect.objectContaining({ trait_type: 'Creator', value: '0x123...7890' }),
    ]));
  });

  it('should handle Farcaster API errors gracefully', async () => {
    const publicClient = createPublicClient({});
    
    (publicClient.readContract as jest.Mock)
      .mockResolvedValueOnce([
        'story1', 'Test Story', 0, 5, '', '', '0x123', 1234567890, true, true, true, 'A [ADJECTIVE] story.',
      ])
      .mockResolvedValueOnce({
        storyId: 'story1',
        title: 'Test Story',
        template: 'A [ADJECTIVE] story.',
        storyType: 1,
        category: 0,
        totalSlots: 5,
        filledSlots: 5,
        creator: '0x123',
        createdAt: 1234567890,
        completedAt: 1234567900,
        status: 2,
        shareCount: 0,
      });
    
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    
    const response = await GET(mockRequest('1'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.attributes).toEqual(expect.arrayContaining([
      expect.objectContaining({ trait_type: 'Creator', value: '0x123...7890' }),
    ]));
  });

  // Input validation
  it('should validate token ID format', async () => {
    const response = await GET(mockRequest('abc'));
    expect(response.status).toBe(400);
  });

  it('should handle missing token ID', async () => {
    const response = await GET(new NextRequest('http://localhost:3000/api/nft/'));
    expect(response.status).toBe(400);
  });

  // Response format
  it('should return correct cache headers for creator NFT', async () => {
    const publicClient = createPublicClient({});
    
    (publicClient.readContract as jest.Mock)
      .mockResolvedValueOnce([
        'story1', 'Test Story', 0, 5, '', '', '0x123', 1234567890, true, true, true, 'A [ADJECTIVE] story.',
      ])
      .mockResolvedValueOnce({
        storyId: 'story1',
        title: 'Test Story',
        template: 'A [ADJECTIVE] story.',
        storyType: 1,
        category: 0,
        totalSlots: 5,
        filledSlots: 5,
        creator: '0x123',
        createdAt: 1234567890,
        completedAt: 1234567900,
        status: 2,
        shareCount: 0,
      });
    
    const response = await GET(mockRequest('1'));
    // @ts-ignore
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  });

  it('should return correct cache headers for contributor NFT', async () => {
    const publicClient = createPublicClient({});
    
    (publicClient.readContract as jest.Mock)
      .mockResolvedValueOnce([
        'story1', 'Test Story', 1, 5, 'ADJECTIVE', 'happy', '0x456', 1234567891, true, true, false, 'A [ADJECTIVE] story.',
      ])
      .mockResolvedValueOnce({
        storyId: 'story1',
        title: 'Test Story',
        template: 'A [ADJECTIVE] story.',
        storyType: 1,
        category: 0,
        totalSlots: 5,
        filledSlots: 5,
        creator: '0x123',
        createdAt: 1234567890,
        completedAt: 1234567900,
        status: 2,
        shareCount: 0,
      });
    
    (publicClient.multicall as jest.Mock).mockResolvedValue([
      { status: 'success', result: { position: 1, wordType: 'ADJECTIVE', filled: true, word: 'happy', contributor: '0x456', nftId: 1, timestamp: 1234567891 } },
    ]);
    
    const response = await GET(mockRequest('1'));
    // @ts-ignore
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  });
});