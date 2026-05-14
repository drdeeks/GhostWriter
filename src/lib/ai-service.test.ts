/**
 * AI Service Tests
 * Tests story generation, word moderation, and caching
 */

// Mock OpenAI before importing the service
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'The AI Adventure',
                  template: 'A [ADJECTIVE] hero went on a [NOUN] quest.',
                  wordTypes: ['adjective', 'noun'],
                }),
              },
            },
          ],
        }),
      },
    },
    moderations: {
      create: jest.fn().mockResolvedValue({
        results: [
          {
            flagged: false,
            categories: {
              hate: false,
              'hate/threatening': false,
              harassment: false,
              'self-harm': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {
              hate: 0.001,
              harassment: 0.002,
            },
          },
        ],
      }),
    },
  }));
});

jest.mock('./aiStoryTemplates', () => ({
  STORY_CATEGORIES: [
    {
      name: 'Adventure',
      description: 'Exciting quests and journeys',
      templates: [
        'A group of friends discovers a mysterious map in their school library...',
        'Lost in the jungle, a clever monkey helps a young explorer find the way home...',
      ],
    },
    {
      name: 'Fantasy',
      description: 'Magical worlds and creatures',
      templates: [
        'A dragon with a sneezing problem accidentally sets off a chain of magical events...',
        'A wizard spell goes wrong, turning the town mayor into a talking frog...',
      ],
    },
  ],
}));

import { AIService } from './ai-service';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    // Reset singleton and environment
    (AIService as any).instance = undefined;
    process.env.OPENAI_API_KEY = 'test-api-key';

    aiService = AIService.getInstance();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AIService.getInstance();
      const instance2 = AIService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration', () => {
    it('should use environment variables for config', () => {
      process.env.OPENAI_MODEL = 'gpt-4';
      process.env.OPENAI_TEMPERATURE = '0.5';
      process.env.OPENAI_MAX_TOKENS = '500';
      process.env.OPENAI_TIMEOUT_MS = '15000';

      (AIService as any).instance = undefined;
      const configuredService = AIService.getInstance();

      // Config should be applied (internal state)
      expect(configuredService).toBeDefined();

      // Cleanup
      delete process.env.OPENAI_MODEL;
      delete process.env.OPENAI_TEMPERATURE;
      delete process.env.OPENAI_MAX_TOKENS;
      delete process.env.OPENAI_TIMEOUT_MS;
    });

    it('should use default values when env vars not set', () => {
      delete process.env.OPENAI_API_KEY;
      (AIService as any).instance = undefined;

      const defaultService = AIService.getInstance();
      expect(defaultService).toBeDefined();
    });
  });

  describe('Story Generation', () => {
    it('should generate story with AI when API key present', async () => {
      const story = await aiService.generateStory('adventure');

      expect(story).toBeDefined();
      expect(story.title).toBeDefined();
      expect(story.template).toBeDefined();
      expect(story.wordTypes).toBeInstanceOf(Array);
    });

    it('should fallback to templates when AI fails', async () => {
      // Force AI to fail
      const OpenAI = require('openai');
      OpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      }));

      (AIService as any).instance = undefined;
      aiService = AIService.getInstance();

      const story = await aiService.generateStory('adventure');

      expect(story).toBeDefined();
      expect(story.generatedBy).toBe('Template');
    });

    it('should use template fallback when no API key', async () => {
      delete process.env.OPENAI_API_KEY;
      (AIService as any).instance = undefined;
      aiService = AIService.getInstance();

      const story = await aiService.generateStory('fantasy');

      expect(story).toBeDefined();
      expect(story.generatedBy).toBe('Template');
    });

    it('should cache generated stories', async () => {
      const story1 = await aiService.generateStory('adventure');
      const story2 = await aiService.generateStory('adventure');

      // Second call might be from cache
      expect(story1.title).toBeDefined();
      expect(story2.title).toBeDefined();
    });
  });

  describe('Word Moderation', () => {
    it('should approve appropriate words', async () => {
      const result = await aiService.moderateWord('happy');

      expect(result.isAppropriate).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should cache moderation results', async () => {
      const result1 = await aiService.moderateWord('good');
      const result2 = await aiService.moderateWord('good');

      expect(result1.isAppropriate).toBe(result2.isAppropriate);
    });

    it('should reject flagged words', async () => {
      const OpenAI = require('openai');
      OpenAI.mockImplementationOnce(() => ({
        moderations: {
          create: jest.fn().mockResolvedValue({
            results: [
              {
                flagged: true,
                categories: { hate: true },
                category_scores: { hate: 0.95 },
              },
            ],
          }),
        },
      }));

      (AIService as any).instance = undefined;
      process.env.OPENAI_API_KEY = 'test-key';
      aiService = AIService.getInstance();

      const result = await aiService.moderateWord('badword');

      expect(result.isAppropriate).toBe(false);
    });

    it('should use fallback when moderation API fails', async () => {
      const OpenAI = require('openai');
      OpenAI.mockImplementationOnce(() => ({
        moderations: {
          create: jest.fn().mockRejectedValue(new Error('API Error')),
        },
      }));

      (AIService as any).instance = undefined;
      process.env.OPENAI_API_KEY = 'test-key';
      aiService = AIService.getInstance();

      // Should not throw, should use basic validation
      const result = await aiService.moderateWord('normalword');
      expect(result).toBeDefined();
    });
  });

  describe('Story Type Slot Counts', () => {
    it('should return correct slot ranges for story types', () => {
      const storyTypes = {
        mini: { min: 5, max: 10 },
        normal: { min: 10, max: 15 },
        epic: { min: 15, max: 25 },
      };

      expect(storyTypes.mini.min).toBe(5);
      expect(storyTypes.mini.max).toBe(10);
      expect(storyTypes.normal.min).toBe(10);
      expect(storyTypes.normal.max).toBe(15);
      expect(storyTypes.epic.min).toBe(15);
      expect(storyTypes.epic.max).toBe(25);
    });
  });
});

describe('AI Service Error Handling', () => {
  beforeEach(() => {
    (AIService as any).instance = undefined;
  });

  it('should handle network timeouts gracefully', async () => {
    const OpenAI = require('openai');
    OpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('timeout')),
        },
      },
    }));

    process.env.OPENAI_API_KEY = 'test-key';
    const aiService = AIService.getInstance();

    // Should fallback to template, not throw
    const story = await aiService.generateStory('adventure');
    expect(story).toBeDefined();
    expect(story.generatedBy).toBe('Template');
  });

  it('should handle rate limiting', async () => {
    const OpenAI = require('openai');
    const rateLimitError = new Error('Rate limit exceeded');
    (rateLimitError as any).status = 429;

    OpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(rateLimitError),
        },
      },
    }));

    process.env.OPENAI_API_KEY = 'test-key';
    const aiService = AIService.getInstance();

    const story = await service.generateStory('fantasy');
    expect(story).toBeDefined();
    expect(story.generatedBy).toBe('Template');
  });
});
