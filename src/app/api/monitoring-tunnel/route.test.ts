import { POST } from './route';
import { NextRequest } from '@/test-utils/next-mocks';
import { NextResponse } from '@/test-utils/next-mocks';

global.fetch = jest.fn();

describe('/api/monitoring-tunnel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should proxy request to Sentry successfully', async () => {
    const mockFetch = fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    
    const testData = { event: 'test', data: { key: 'value' } };
    const req = new NextRequest('http://localhost:3000/api/monitoring-tunnel', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
    
    const response = await POST(req);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://sentry.io/api/[YOUR_PROJECT_ID]/envelope/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(testData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer '),
        },
      })
    );
  });

  it('should handle Sentry API errors', async () => {
    const mockFetch = fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      status: 500,
      json: jest.fn().mockResolvedValue({ error: 'Sentry error' }),
    });
    
    const testData = { event: 'test' };
    const req = new NextRequest('http://localhost:3000/api/monitoring-tunnel', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
    
    const response = await POST(req);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Unknown error');
  });

  it('should handle fetch errors', async () => {
    const mockFetch = fetch as jest.Mock;
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    const testData = { event: 'test' };
    const req = new NextRequest('http://localhost:3000/api/monitoring-tunnel', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
    
    const response = await POST(req);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Network error');
  });

  it('should return 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/monitoring-tunnel', {
      method: 'POST',
      body: 'invalid json',
    });
    
    const response = await POST(req);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Unknown error');
  });
});