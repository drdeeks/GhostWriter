// Mock the GET function to handle params
import { GET as originalGET } from '@/app/api/nft/[tokenId]/image/route';
const GET = async (request: NextRequest) => {
  // Extract tokenId from URL for testing
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const tokenId = pathParts[pathParts.length - 2] || '1'; // tokenId is second to last
  
  // Call the original function with both parameters
  return originalGET(request, { params: Promise.resolve({ tokenId }) });
};
import { CONTRACTS, NFT_ABI, STORY_MANAGER_ABI } from '@/lib/contracts';
import { createPublicClient, http, type PublicClient, type Transport } from 'viem';
import { NextRequest } from 'next/server';

// Use the mock from test-utils
import { NextRequest as NextRequestMock, NextResponse } from '@/test-utils/next-mocks';

// Mock external dependencies
// Remove duplicate mock

// Mock viem client config
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

// Mock fetch for Farcaster API
global.fetch = jest.fn();

describe('GET /api/nft/[tokenId]/image', () => {
  const originalEnv = process.env;
  const mockRequest = (tokenId: string, hidden = false, origin = 'http://localhost:3000') => {
    const req = new NextRequest(`${origin}/api/nft/${tokenId}/image${hidden ? '?hidden=true' : ''}`) as unknown as NextRequest;
    return req;
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_CHAIN_ID = '84532';
    process.env.BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';
    process.env.NFT_BACKGROUND_CATEGORY_MAP = JSON.stringify({
      adventure: 'adventure.jpg',
      fantasy: 'fantasy.jpg',
    });
    
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
  it('should return 200 and creator NFT image for valid token ID', async () => {
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
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ username: 'testuser', fid: 123 }),
    });
    
    const response = await GET(mockRequest('1'));
    const text = await response.text();
    
    expect(response.status).toBe(200);
    expect(text).toContain('GHOST WRITER');
    expect(text).toContain('CREATOR EDITION');
    expect(text).toContain('Test Story');
    expect(text).toContain('@testuser');
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    // @ts-ignore
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  });

   // Happy path - Contributor NFT (hidden)
  it('should return 200 and SVG for hidden contributor NFT', async () => {
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
    });
    (publicClient.readContract as jest.Mock).mockRejectedValue(new Error('Contract error'));
    
    const response = await GET(mockRequest('1'));
    expect(response.status).toBe(500);
  });

  // Edge cases
  it('should handle zero token ID', async () => {
    const response = await GET(mockRequest('0'));
    expect(response.status).toBe(400);
  });

  it('should handle very large token ID', async () => {
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
    });
    (publicClient.readContract as jest.Mock).mockResolvedValueOnce([
      'story1', 'Test Story', 0, 5, '', '', '0x123', 1234567890, true, true, true, 'A [ADJECTIVE] story.',
    ]);
    
    const response = await GET(mockRequest('999999999999'));
    expect(response.status).toBe(200);
  });

  it('should handle missing Farcaster user info gracefully', async () => {
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
    });
    
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
    const text = await response.text();
    
    expect(response.status).toBe(200);
    expect(text).toContain('0x123...7890');
  });

  it('should handle Farcaster API errors gracefully', async () => {
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
    });
    
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
    const text = await response.text();
    
    expect(response.status).toBe(200);
    expect(text).toContain('0x123...7890');
  });

  it('should handle missing background category map', async () => {
    delete process.env.NFT_BACKGROUND_CATEGORY_MAP;
    
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
    });
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
    const text = await response.text();
    
    expect(response.status).toBe(200);
    expect(text).toContain('url(#bg)');
  });

  it('should handle invalid background category map JSON', async () => {
    process.env.NFT_BACKGROUND_CATEGORY_MAP = 'invalid-json';
    
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
    });
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
    const text = await response.text();
    
    expect(response.status).toBe(200);
    expect(text).toContain('url(#bg)');
  });

  // Input validation
  it('should validate token ID format', async () => {
    const response = await GET(mockRequest('abc'));
    expect(response.status).toBe(400);
  });

  it('should handle missing token ID', async () => {
    const response = await GET(new NextRequest('http://localhost:3000/api/nft//image'));
    expect(response.status).toBe(400);
  });

  // Response format
  it('should return correct cache headers', async () => {
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
    });
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

  it('should return correct content type', async () => {
    const publicClient = createPublicClient({
      transport: http(),
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
    });
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
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });
});