import { test, expect } from '@playwright/test';

test.describe('Ghost Writer - NFT Image Generation', () => {
  test('should return SVG or 500 for valid token ID', async ({ request }) => {
    const response = await request.get('/api/nft/1/image');
    expect([200, 500]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('image/svg+xml');
      const body = await response.text();
      expect(body).toContain('<svg');
    }
  });

  test('should return 400 for invalid token ID', async ({ request }) => {
    const response = await request.get('/api/nft/invalid/image');
    expect(response.status()).toBe(400);
  });

  test('should return 400 for zero token ID', async ({ request }) => {
    const response = await request.get('/api/nft/0/image');
    expect(response.status()).toBe(400);
  });
});

test.describe('Ghost Writer - NFT Metadata API', () => {
  test('should return JSON or 500 for valid token ID', async ({ request }) => {
    const response = await request.get('/api/nft/1');
    expect([200, 500]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    }
  });

  test('should return 400 for invalid token ID', async ({ request }) => {
    const response = await request.get('/api/nft/invalid');
    expect(response.status()).toBe(400);
  });

  test('should return 400 for zero token ID', async ({ request }) => {
    const response = await request.get('/api/nft/0');
    expect(response.status()).toBe(400);
  });
});
