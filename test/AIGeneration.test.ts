
import { POST } from '@/app/api/generate-story/route';
import { NextResponse } from 'next/server';

describe('AI Generation API', () => {
  it('should return a story template for a valid category', async () => {
    const request = new Request('http://localhost/api/generate-story', {
      method: 'POST',
      body: JSON.stringify({ category: 'Adventure' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.title).toBeDefined();
    expect(body.template).toBeDefined();
    expect(body.wordTypes).toBeDefined();
  });

  it('should return 400 for an invalid category', async () => {
    const request = new Request('http://localhost/api/generate-story', {
      method: 'POST',
      body: JSON.stringify({ category: 'InvalidCategory' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid input', async () => {
    const request = new Request('http://localhost/api/generate-story', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
