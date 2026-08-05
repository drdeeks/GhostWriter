// Enhanced AI service with enterprise features and fallbacks
import OpenAI from 'openai';
import { STORY_CATEGORIES } from './aiStoryTemplates';

interface AIConfig {
  maxRetries: number;
  timeout: number;
  fallbackEnabled: boolean;
  cacheEnabled: boolean;
  temperature: number;
  maxTokens: number;
  systemPromptAppend: string;
}

// A provider that speaks the OpenAI Chat Completions API shape - true for
// OpenAI itself, OpenRouter, and Mistral (all via the same SDK, just a
// different baseURL/key/model). Tried in order; if one throws, the next
// is tried before falling back to the deterministic template generator.
interface ChatProvider {
  name: string;
  client: OpenAI;
  model: string;
}

const DEFAULT_PROVIDER_ORDER = ['openai', 'openrouter', 'mistral', 'cloudflare'] as const;
type ProviderName = (typeof DEFAULT_PROVIDER_ORDER)[number];

interface GeneratedStory {
  title: string;
  template: string;
  wordTypes: string[];
  generatedBy: 'AI' | 'Template' | 'Cache';
  confidence?: number;
  processingTime?: number;
}

// Exports for external use
export type StoryTypeName = 'mini' | 'normal' | 'epic';
export const aiService = {
  getInstance: () => aiServiceInstance,
  clearCache: () => aiServiceInstance.clearCache(),
  generateStory: (category: string) => aiServiceInstance.generateStory(category),
  generateStorySuggestions: (category: string, storyType: StoryTypeName, count: number) => 
    aiServiceInstance.generateStorySuggestions(category, storyType, count),
  moderateWord: (word: string) => aiServiceInstance.moderateWord(word),
  moderateWordInternal: (word: string) => aiServiceInstance.moderateWordInternal(word),
};

export const moderateWord = async (word: string): Promise<boolean> => {
  return aiServiceInstance.moderateWord(word);
};

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories?: string[];
  suggestion?: string;
}

// Internal implementation
class AIServiceInstance {
  private static instance: AIServiceInstance;
  private providers: ChatProvider[] = [];
  // Kept separately: OpenAI's /moderations endpoint is OpenAI-specific,
  // not something OpenRouter/Mistral/Workers AI replicate.
  private openaiForModeration: OpenAI | null = null;
  private config: AIConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
      timeout: parseInt(process.env.AI_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || '10000', 10),
      fallbackEnabled: true,
      cacheEnabled: true,
      temperature: parseFloat(process.env.AI_TEMPERATURE || process.env.OPENAI_TEMPERATURE || '0.9'),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || process.env.OPENAI_MAX_TOKENS || '700', 10),
      systemPromptAppend: process.env.AI_STORY_SYSTEM_PROMPT_APPEND || '',
      ...config,
    };

    this.initializeProviders();
  }

  static getInstance(config?: Partial<AIConfig>): AIServiceInstance {
    if (!AIServiceInstance.instance) {
      AIServiceInstance.instance = new AIServiceInstance(config);
    }
    return AIServiceInstance.instance;
  }

  // Builds the ordered list of configured OpenAI-API-compatible providers.
  // Order is customizable via AI_PROVIDER_ORDER (comma-separated, e.g.
  // "mistral,openrouter,openai"); any provider without credentials set is
  // skipped. Cloudflare Workers AI isn't in this list - it's binding-based,
  // not HTTP, and is tried separately in generateWithAI/moderateWordInternal.
  private initializeProviders(): void {
    const order = (process.env.AI_PROVIDER_ORDER
      ?.split(',')
      .map((p) => p.trim().toLowerCase())
      .filter((p): p is ProviderName => (DEFAULT_PROVIDER_ORDER as readonly string[]).includes(p))
      ?? DEFAULT_PROVIDER_ORDER);

    for (const name of order) {
      if (name === 'openai' && process.env.OPENAI_API_KEY) {
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: this.config.timeout,
        });
        this.providers.push({ name: 'openai', client, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' });
        this.openaiForModeration = client;
      } else if (name === 'openrouter' && process.env.OPENROUTER_API_KEY) {
        this.providers.push({
          name: 'openrouter',
          client: new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1',
            timeout: this.config.timeout,
          }),
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        });
      } else if (name === 'mistral' && process.env.MISTRAL_API_KEY) {
        this.providers.push({
          name: 'mistral',
          client: new OpenAI({
            apiKey: process.env.MISTRAL_API_KEY,
            baseURL: 'https://api.mistral.ai/v1',
            timeout: this.config.timeout,
          }),
          model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        });
      }
      // 'cloudflare' is handled separately via the Workers AI binding.
    }
  }

  private getCacheKey(type: string, input: string): string {
    return `${type}:${input.toLowerCase()}`;
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.config.cacheEnabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async generateStory(category: string): Promise<GeneratedStory> {
    // Backwards-compatible default
    return (await this.generateStorySuggestions(category, 'normal', 1))[0];
  }

  async generateStorySuggestions(
    category: string,
    storyType: StoryTypeName,
    count: number
  ): Promise<GeneratedStory[]> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey('story', `${category}:${storyType}:${count}`);

    // Check cache first
    const cached = this.getFromCache<GeneratedStory[]>(cacheKey);
    if (cached) {
      return cached.map((s) => ({ ...s, generatedBy: 'Cache' }));
    }

    // Validate category
    const categoryObj = STORY_CATEGORIES.find(
      (cat) => cat.name.toLowerCase() === category.toLowerCase()
    );

    if (!categoryObj) {
      throw new Error(`Invalid category: ${category}`);
    }

    const expectedSlots = this.expectedSlots(storyType);
    const results: GeneratedStory[] = [];

    for (let i = 0; i < count; i++) {
      const generated = await this.generateWithFailover(categoryObj, expectedSlots);
      const processingTime = performance.now() - startTime;

      if (generated) {
        results.push({ ...generated, generatedBy: 'AI', processingTime });
      } else {
        // Every configured provider failed (or none are configured) - last resort.
        const fallback = this.generateDeterministicMadLib(categoryObj, expectedSlots);
        results.push({ ...fallback, generatedBy: 'Template', processingTime });
      }
    }

    this.setCache(cacheKey, results);
    return results;
  }

  // Tries each configured chat provider in order (each gets maxRetries
  // attempts before moving to the next), then Cloudflare Workers AI as a
  // final AI attempt. Returns null only if every provider failed/is
  // unconfigured, so the caller can fall back to the template generator.
  private async generateWithFailover(
    categoryObj: typeof STORY_CATEGORIES[0],
    expectedSlots: number
  ): Promise<Omit<GeneratedStory, 'generatedBy' | 'processingTime'> | null> {
    for (const provider of this.providers) {
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          const raw = await this.generateWithProvider(provider, categoryObj, expectedSlots);
          if (raw.wordTypes.length !== expectedSlots) {
            throw new Error(`${provider.name} returned ${raw.wordTypes.length} slots; expected ${expectedSlots}`);
          }
          return raw;
        } catch (error) {
          console.warn(`${provider.name} attempt ${attempt} failed:`, error);
          if (attempt !== this.config.maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
          }
        }
      }
    }

    try {
      const raw = await this.generateWithWorkersAI(categoryObj, expectedSlots);
      if (raw && raw.wordTypes.length === expectedSlots) {
        return raw;
      }
    } catch (error) {
      console.warn('Cloudflare Workers AI attempt failed:', error);
    }

    return null;
  }

  private expectedSlots(storyType: StoryTypeName): number {
    if (storyType === 'mini') {
      // 5-10 slots
      return Math.floor(Math.random() * (10 - 5 + 1) + 5);
    }
    if (storyType === 'normal') {
      // 10-15 slots
      return Math.floor(Math.random() * (15 - 10 + 1) + 10);
    }
    // 15-25 slots for epic
    return Math.floor(Math.random() * (25 - 15 + 1) + 15);
  }

  private buildStoryMessages(categoryObj: typeof STORY_CATEGORIES[0], expectedSlots: number) {
    return [
      {
        role: 'system' as const,
        content: `You are a creative story generator for a Mad Libs-style game.

Category: ${categoryObj.name}
Description: ${categoryObj.description}

Requirements:
- Include exactly ${expectedSlots} word placeholders using [WORD_TYPE] format
- Use valid word types: adjective, noun, verb, adverb, plural_noun, past_tense_verb, verb_ing, persons_name, place, number, color, body_part, food, animal, exclamation, emotion
- Make it fun, creative, and appropriate for all ages
- Provide a catchy title
- Format: Title on first line, story on subsequent lines
${this.config.systemPromptAppend}`,
      },
      {
        role: 'user' as const,
        content: `Generate a ${categoryObj.name.toLowerCase()} story with exactly ${expectedSlots} placeholders.`,
      },
    ];
  }

  private async generateWithProvider(
    provider: ChatProvider,
    categoryObj: typeof STORY_CATEGORIES[0],
    expectedSlots: number
  ): Promise<Omit<GeneratedStory, 'generatedBy' | 'processingTime'>> {
    const completion = await provider.client.chat.completions.create({
      model: provider.model,
      messages: this.buildStoryMessages(categoryObj, expectedSlots),
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    const generatedText = completion.choices[0]?.message?.content || '';
    return this.parseGeneratedStory(generatedText);
  }

  // Cloudflare Workers AI runs open models directly on Cloudflare's own
  // infrastructure via a Worker binding (not an HTTP call), so it's only
  // reachable when this code is actually running inside the deployed
  // Worker - getCloudflareContext throws outside that environment, which
  // is expected and just means this provider is skipped.
  private async generateWithWorkersAI(
    categoryObj: typeof STORY_CATEGORIES[0],
    expectedSlots: number
  ): Promise<Omit<GeneratedStory, 'generatedBy' | 'processingTime'> | null> {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext({ async: true });
    const ai = (env as any).AI;
    if (!ai) return null;

    const model = process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
    const response = await ai.run(model, {
      messages: this.buildStoryMessages(categoryObj, expectedSlots),
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    const generatedText = response?.response || '';
    return this.parseGeneratedStory(generatedText);
  }

  private generateDeterministicMadLib(
    categoryObj: typeof STORY_CATEGORIES[0],
    expectedSlots: number
  ): Omit<GeneratedStory, 'generatedBy' | 'processingTime'> {
    const validTypes = [
      'adjective',
      'noun',
      'verb',
      'adverb',
      'plural_noun',
      'past_tense_verb',
      'verb_ing',
      'persons_name',
      'place',
      'number',
      'color',
      'body_part',
      'food',
      'animal',
      'exclamation',
      'emotion',
    ] as const;

    // Pick a title seed from the category templates (they are short prompts).
    const seed = categoryObj.templates[Math.floor(Math.random() * categoryObj.templates.length)];
    const title = (seed.split('.')[0] || `${categoryObj.name} Story`).slice(0, 100);

    const wordTypes: string[] = [];
    for (let i = 0; i < expectedSlots; i++) {
      wordTypes.push(validTypes[i % validTypes.length]);
    }

    // Ensure exact placeholder count in template by rebuilding from the wordTypes list.
    const template = this.buildTemplateFromWordTypes(wordTypes, categoryObj.name);

    return {
      title,
      template,
      wordTypes,
      confidence: 0.7,
    };
  }

  private buildTemplateFromWordTypes(wordTypes: string[], categoryName: string): string {
    const placeholders = wordTypes.map((t) => `[${t.toUpperCase()}]`);

    // Deterministic, exact consumption: each placeholder appears once.
    const intro = `Welcome to this ${categoryName.toLowerCase()} tale:`;
    const sentences: string[] = [intro];

    for (let i = 0; i < placeholders.length; i += 5) {
      const chunk = placeholders.slice(i, i + 5);
      sentences.push(`It was ${chunk.join(' ')}.`);
    }

    return sentences.join(' ');
  }

  private parseGeneratedStory(text: string): Omit<GeneratedStory, 'generatedBy' | 'processingTime'> {
    const lines = text.split('\n').filter(line => line.trim());
    const title = lines[0]?.trim().replace(/^["]|["]$/g, '') || 'Generated Story';
    const template = lines.slice(1).join(' ').trim();

    const WORD_TYPE_REGEX = /\[([A-Z_]+)\]/g;
    const validTypes = [
      'adjective', 'noun', 'verb', 'adverb', 'plural_noun',
      'past_tense_verb', 'verb_ing', 'persons_name', 'place',
      'number', 'color', 'body_part', 'food', 'animal',
      'exclamation', 'emotion'
    ];

    const wordTypes: string[] = [];
    let match;
    while ((match = WORD_TYPE_REGEX.exec(template)) !== null) {
      const type = match[1].toLowerCase();
      if (validTypes.includes(type)) {
        wordTypes.push(type);
      }
    }

    if (!template || wordTypes.length === 0) {
      throw new Error('Invalid story generated');
    }

    return {
      title: title.substring(0, 100),
      template: template.substring(0, 1000),
      wordTypes,
      confidence: 0.9,
    };
  }

  private generateFromTemplate(categoryObj: typeof STORY_CATEGORIES[0]): Omit<GeneratedStory, 'generatedBy' | 'processingTime'> {
    const template = categoryObj.templates[
      Math.floor(Math.random() * categoryObj.templates.length)
    ];

    const title = template.split('.')[0]?.trim() || `${categoryObj.name} Story`;

    const WORD_TYPE_REGEX = /\[([A-Z_]+)\]/g;
    const validTypes = [
      'adjective', 'noun', 'verb', 'adverb', 'plural_noun',
      'past_tense_verb', 'verb_ing', 'persons_name', 'place',
      'number', 'color', 'body_part', 'food', 'animal',
      'exclamation', 'emotion'
    ];

    const wordTypes: string[] = [];
    let match;
    while ((match = WORD_TYPE_REGEX.exec(template)) !== null) {
      const type = match[1].toLowerCase();
      if (validTypes.includes(type)) {
        wordTypes.push(type);
      }
    }

    return {
      title,
      template,
      wordTypes,
      confidence: 0.7,
    };
  }

  async moderateWord(word: string): Promise<boolean> {
    const result = await this.moderateWordInternal(word);
    return !result.isAppropriate;
  }

  async moderateWordInternal(word: string): Promise<ModerationResult> {
    const cacheKey = this.getCacheKey('moderation', word);

    // Check cache first
    const cached = this.getFromCache<ModerationResult>(cacheKey);
    if (cached) return cached;

    // Basic validation
    if (!word || word.length < 1 || word.length > 50) {
      return {
        isAppropriate: false,
        confidence: 1.0,
        suggestion: 'Word must be 1-50 characters long',
      };
    }

    // Try AI moderation (OpenAI-specific endpoint; other providers don't have an equivalent)
    if (this.openaiForModeration) {
      try {
        const moderation = await this.openaiForModeration.moderations.create({
          input: word,
        });

        const result = moderation.results[0];
        const isAppropriate = !result.flagged;

        const moderationResult: ModerationResult = {
          isAppropriate,
          confidence: 0.95,
          categories: result.flagged ? Object.keys(result.categories).filter(key => result.categories[key as keyof typeof result.categories]) : undefined,
        };

        this.setCache(cacheKey, moderationResult);
        return moderationResult;
      } catch (error) {
        console.warn('AI moderation failed, using fallback:', error);
      }
    }

    // Fallback moderation
    const result = this.basicModeration(word);
    this.setCache(cacheKey, result);
    return result;
  }

  private basicModeration(word: string): ModerationResult {
    const inappropriatePatterns = [
      /\b(fuck|shit|damn|hell|ass|bitch|crap)\b/i,
      /\b(sex|porn|nude|naked)\b/i,
      /\b(kill|die|death|murder)\b/i,
      /\b(hate|stupid|idiot|dumb)\b/i,
    ];

    const isInappropriate = inappropriatePatterns.some(pattern => pattern.test(word));

    return {
      isAppropriate: !isInappropriate,
      confidence: 0.7,
      suggestion: isInappropriate ? 'Please choose a more appropriate word' : undefined,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getStats(): { cacheSize: number; cacheHitRate: number } {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }
}

// Singleton instance
const aiServiceInstance = AIServiceInstance.getInstance();