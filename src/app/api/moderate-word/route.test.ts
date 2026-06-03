import { POST } from './route';
import { NextRequest } from '@/test-utils/next-mocks';
import { aiService } from '@/lib/ai-service';
const { moderateWord } = aiService;
import { NextResponse } from '@/test-utils/next-mocks';

// Mock the external dependencies
jest.mock('@/lib/ai-service', () => ({
  moderateWord: jest.fn(),
}));

describe('/api/moderate-word', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if word is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/moderate-word', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Word is required');
  });

  it('should return 400 if word is too short', async () => {
    const req = new NextRequest('http://localhost:3000/api/moderate-word', {
      method: 'POST',
      body: JSON.stringify({ word: 'a' }),
    });
    
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Word must be at least 2 characters long');
  });

  it('should return 400 if word is too long', async () => {
    const longWord = 'a'.repeat(101);
    const req = new NextRequest('http://localhost:3000/api/moderate-word', {
      method: 'POST',
      body: JSON.stringify({ word: longWord }),
    });
    
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Word must be less than 100 characters long');
  });

  it('should return moderation result for clean word', async () => {
    const mockModerateWord = moderateWord as jest.Mock;
    mockModerateWord.mockResolvedValue(false);
    
    const req = new NextRequest('http://localhost:3000/api/moderate-word', {
      method: 'POST',
      body: JSON.stringify({ word: 'hello' }),
    });
    
    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      word: 'hello',
      isFlagged: false,
      categories: {},
    });
  });

  it('should return moderation result for flagged word', async () => {
    const mockModerateWord = moderateWord as jest.Mock;
    mockModerateWord.mockResolvedValue(true);
    
    const req = new NextRequest('http://localhost:3000/api/moderate-word', {
      method: 'POST',
      body: JSON.stringify({ word: 'badword' }),
    });
    
    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      word: 'badword',
      isFlagged: true,
      categories: {},
    });
  });

  it('should handle moderation service errors', async () => {
    const mockModerateWord = moderateWord as jest.Mock;
    mockModerateWord.mockRejectedValue(new Error('Moderation error'));
    
    const req = new NextRequest('http://localhost:3000/api/moderate-word', {
      method: 'POST',
      body: JSON.stringify({ word: 'test' }),
    });
    
    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to moderate word');
  });
});