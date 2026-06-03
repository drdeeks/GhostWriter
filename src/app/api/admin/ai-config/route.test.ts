jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(data),
    }),
  },
}));

describe('GET /api/admin/ai-config', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should return default AI config', async () => {
    const { GET } = require('@/app/api/admin/ai-config/route');
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.model).toBe('gpt-4o-mini');
    expect(data.temperature).toBe(0.9);
    expect(data.maxTokens).toBe(700);
    expect(data.timeout).toBe(10000);
    expect(data.systemPromptAppend).toBe('');
  });

  it('should return custom AI config from env', async () => {
    process.env.OPENAI_MODEL = 'gpt-4';
    process.env.OPENAI_TEMPERATURE = '0.5';
    process.env.OPENAI_MAX_TOKENS = '500';
    process.env.OPENAI_TIMEOUT_MS = '15000';
    process.env.AI_STORY_SYSTEM_PROMPT_APPEND = 'Test prompt';

    const { GET } = require('@/app/api/admin/ai-config/route');
    const response = await GET();
    const data = await response.json();
    expect(data.model).toBe('gpt-4');
    expect(data.temperature).toBe(0.5);
    expect(data.maxTokens).toBe(500);
    expect(data.timeout).toBe(15000);
    expect(data.systemPromptAppend).toBe('Test prompt');

    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_TEMPERATURE;
    delete process.env.OPENAI_MAX_TOKENS;
    delete process.env.OPENAI_TIMEOUT_MS;
    delete process.env.AI_STORY_SYSTEM_PROMPT_APPEND;
  });
});
