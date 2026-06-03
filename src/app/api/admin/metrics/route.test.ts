jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(data),
    }),
  },
}));

jest.mock('@/lib/contracts', () => ({
  CONTRACTS: {
    storyManager: '0x0000000000000000000000000000000000000000',
    nft: '0x0000000000000000000000000000000000000000',
    liquidityPool: '0x0000000000000000000000000000000000000000',
    token: '0x0000000000000000000000000000000000000000',
  },
  STORY_MANAGER_ABI: [],
  NFT_ABI: [],
  LIQUIDITY_POOL_ABI: [],
  TOKEN_ABI: [],
}));

describe('GET /api/admin/metrics', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should return 500 when StoryManager not configured', async () => {
    const { GET } = require('@/app/api/admin/metrics/route');
    const response = await GET();
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('StoryManager');
  });
});
