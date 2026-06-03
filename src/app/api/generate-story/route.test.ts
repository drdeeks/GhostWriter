jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(data),
    }),
  },
}));

jest.mock('@/lib/ai-service', () => ({
  aiService: {
    generateStorySuggestions: jest.fn(),
  },
}));

jest.mock('@/lib/contracts', () => ({
  CONTRACTS: {
    storyManager: '0x1234567890123456789012345678901234567890',
  },
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({
    signTypedData: jest.fn().mockResolvedValue('0xsignature'),
  })),
}));

const { aiService } = require('@/lib/ai-service');

describe('POST /api/generate-story', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.STORY_TEMPLATE_SIGNER_PRIVATE_KEY = '0x' + 'aa'.repeat(32);
    process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS = '0x1234567890123456789012345678901234567890';
    aiService.generateStorySuggestions.mockResolvedValue([
      {
        title: 'Test Story',
        template: 'A [ADJECTIVE] hero.',
        wordTypes: ['adjective'],
        generatedBy: 'AI',
      },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should return 400 when category is missing', async () => {
    const { POST } = require('@/app/api/generate-story/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    };
    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });

  it('should return 400 when storyType is invalid', async () => {
    const { POST } = require('@/app/api/generate-story/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        category: 'adventure',
        storyType: 'invalid',
        userAddress: '0x1234567890123456789012345678901234567890',
      }),
    };
    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });

  it('should return 400 when userAddress is invalid', async () => {
    const { POST } = require('@/app/api/generate-story/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        category: 'adventure',
        storyType: 'normal',
        userAddress: 'invalid',
      }),
    };
    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });

  it('should return 500 when signer private key is missing', async () => {
    delete process.env.STORY_TEMPLATE_SIGNER_PRIVATE_KEY;
    const { POST } = require('@/app/api/generate-story/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        category: 'adventure',
        storyType: 'normal',
        userAddress: '0x1234567890123456789012345678901234567890',
      }),
    };
    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
  });

  it('should return 500 when StoryManager address is missing', async () => {
    delete process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS;
    const { POST } = require('@/app/api/generate-story/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        category: 'adventure',
        storyType: 'normal',
        userAddress: '0x1234567890123456789012345678901234567890',
      }),
    };
    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
  });

  it('should return suggestions with signatures when valid', async () => {
    const { POST } = require('@/app/api/generate-story/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        category: 'adventure',
        storyType: 'normal',
        userAddress: '0x1234567890123456789012345678901234567890',
      }),
    };
    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].title).toBe('Test Story');
    expect(data.suggestions[0].signature).toBe('0xsignature');
    expect(data.meta).toBeDefined();
    expect(data.meta.count).toBe(1);
  });
});
