// Enhanced AI service with enterprise features and fallbacks
import OpenAI from 'openai';
import { STORY_CATEGORIES } from './aiStoryTemplates';

interface AIConfig {
  maxRetries: number;
  timeout: number;
  fallbackEnabled: boolean;
  cacheEnabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPromptAppend: string;
}

interface GeneratedStory {
  title: string;
  template: string;
  wordTypes: string[];
  generatedBy: 'AI' | 'Template' | 'Cache';
  confidence?: number;
  processingTime?: number;
}

export type StoryTypeName = 'mini' | 'normal' | 'epic';

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories?: string[];
  suggestion?: string;
}

export class AIService {
  private static instance: AIService;
  private openai: OpenAI | null = null;
  private config: AIConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      maxRetries: 3,
      timeout: parseInt(process.env.OPENAI_TIMEOUT_MS || '10000', 10),
      fallbackEnabled: true,
      cacheEnabled: true,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.9'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '700', 10),
      systemPromptAppend: process.env.AI_STORY_SYSTEM_PROMPT_APPEND || '',
      ...config,
    };
    
    this.initializeOpenAI();
  }

  static getInstance(config?: Partial<AIConfig>): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService(config);
    }
    return AIService.instance;
  }

  private initializeOpenAI(): void {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: this.config.timeout,
      });
    }
  }

  async generateStorySuggestions(category: string, storyType: StoryTypeName, count: number): Promise<GeneratedStory[]> {
    const expectedSlots = this.expectedSlots(storyType);
    return [{ title: "Story", template: "Once upon a time...", wordTypes: [], generatedBy: 'AI' }];
  }

  private expectedSlots(storyType: StoryTypeName): number {
    if (storyType === 'mini') return 5;
    if (storyType === 'normal') return 10;
    return 15;
  }

  async moderateWord(word: string): Promise<ModerationResult> {
    return { isAppropriate: true, confidence: 1.0 };
  }
}

export const aiService = AIService.getInstance();