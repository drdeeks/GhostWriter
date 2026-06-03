jest.mock('@/lib/ai-service', () => ({
  aiService: {
    moderateWord: jest.fn(),
    generateStorySuggestions: jest.fn(),
  },
}));

describe('Integration: Word Moderation Flow', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('@/lib/ai-service', () => ({
      aiService: {
        moderateWord: jest.fn(),
        generateStorySuggestions: jest.fn(),
      },
    }));
  });

  it('should moderate word and return approval', async () => {
    const { aiService } = require('@/lib/ai-service');
    aiService.moderateWord.mockResolvedValue({
      isAppropriate: true,
      confidence: 0.95,
    });

    const { POST } = require('@/app/api/moderate-word/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ word: 'adventure' }),
    };

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isProfane).toBe(false);
    expect(aiService.moderateWord).toHaveBeenCalledWith('adventure');
  });

  it('should moderate word and return rejection', async () => {
    const { aiService } = require('@/lib/ai-service');
    aiService.moderateWord.mockResolvedValue({
      isAppropriate: false,
      confidence: 0.99,
      suggestion: 'Inappropriate word',
      categories: ['harassment'],
    });

    const { POST } = require('@/app/api/moderate-word/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ word: 'badword' }),
    };

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isProfane).toBe(true);
    expect(data.reason).toBe('Inappropriate word');
  });

  it('should return 500 on internal error', async () => {
    const { aiService } = require('@/lib/ai-service');
    aiService.moderateWord.mockRejectedValue(new Error('Service unavailable'));

    const { POST } = require('@/app/api/moderate-word/route');
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ word: 'test' }),
    };

    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
  });
});

describe('Integration: Farcaster User Lookup Flow', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should validate address and return placeholder', async () => {
    const { GET } = require('@/app/api/farcaster-user/route');
    const mockRequest = {
      url: 'http://localhost/api/farcaster-user?address=0x1234567890123456789012345678901234567890',
    };

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.address).toBe('0x1234567890123456789012345678901234567890');
    expect(data.fid).toBeNull();
    expect(data.note).toBeDefined();
  });

  it('should reject invalid addresses', async () => {
    const { GET } = require('@/app/api/farcaster-user/route');
    const mockRequest = {
      url: 'http://localhost/api/farcaster-user?address=not-an-address',
    };

    const response = await GET(mockRequest);
    expect(response.status).toBe(400);
  });

  it('should reject missing address', async () => {
    const { GET } = require('@/app/api/farcaster-user/route');
    const mockRequest = {
      url: 'http://localhost/api/farcaster-user',
    };

    const response = await GET(mockRequest);
    expect(response.status).toBe(400);
  });
});
