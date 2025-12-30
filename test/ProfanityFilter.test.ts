
import { POST } from '@/app/api/moderate-word/route';
import { NextResponse } from 'next/server';

describe('Profanity Filter API', () => {
  it('should return isProfane: true for profane words', async () => {
    const profaneWords = ['badword', 'anotherbadword'];

    for (const word of profaneWords) {
      const request = new Request('http://localhost/api/moderate-word', {
        method: 'POST',
        body: JSON.stringify({ word }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await POST(request);
      const body = await response.json();
      expect(body.isProfane).toBe(true);
    }
  });

  it('should return isProfane: false for clean words', async () => {
    const cleanWords = ['hello', 'world', 'nice'];

    for (const word of cleanWords) {
      const request = new Request('http://localhost/api/moderate-word', {
        method: 'POST',
        body: JSON.stringify({ word }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await POST(request);
      const body = await response.json();
      expect(body.isProfane).toBe(false);
    }
  });

  it('should return 400 for invalid input', async () => {
    const request = new Request('http://localhost/api/moderate-word', {
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
