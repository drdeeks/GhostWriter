export type StoryType = 'mini' | 'normal' | 'epic';
export type StoryStatus = 'active' | 'complete';
export type NFTStatus = 'hidden' | 'revealed';

export type StoryCategory =
  | 'fantasy'
  | 'scifi'
  | 'comedy'
  | 'horror'
  | 'adventure'
  | 'mystery'
  | 'romance'
  | 'crypto'
  | 'random';

export type WordType =
  | 'adjective'
  | 'noun'
  | 'verb'
  | 'adverb'
  | 'plural_noun'
  | 'past_tense_verb'
  | 'verb_ing'
  | 'persons_name'
  | 'place'
  | 'number'
  | 'color'
  | 'body_part'
  | 'food'
  | 'animal'
  | 'exclamation'
  | 'emotion';

export type WordTypeInfo = {
  type: WordType;
  displayName: string;
  description: string;
  examples: string[];
  minLength: number;
  maxLength: number;
};

export type SlotDetail = {
  position: number;
  wordType: WordType;
  required: boolean;
  filled: boolean;
  word: string | null;
  contributor: string | null;
  nftId: string | null;
  timestamp: string | null;
};

export type Story = {
  storyId: string;
  title: string;
  template: string;
  storyType: StoryType;
  category: StoryCategory;
  totalSlots: number;
  filledSlots: number;
  slotDetails: SlotDetail[];
  creator: string;
  createdAt: string;
  completedAt: string | null;
  status: StoryStatus;
  completionTimestamp: string | null;
  shareCount: number;
};

export type NFTMetadata = {
  nftId: string;
  name: string;
  description: string;
  image: string;
  attributes: {
    storyId: string;
    storyTitle: string;
    wordPosition: number;
    totalWords: number;
    wordType: string;
    contributedWord: string;
    fullStorySnippet?: string;
    contributionTimestamp: string;
    contributorAddress: string;
    completionTimestamp?: string;
    status: NFTStatus;
    storyComplete: boolean;
  };
};

export type UserStats = {
  address: string;
  contributionsCount: number;
  creationCredits: number;
  storiesCreated: number;
  nftsOwned: number;
  completedStories: number;
  shareCount: number;
  lastContributionTime: number;
  activeContributions: Array<{
    storyId: string;
    position: number;
    nftId: string;
  }>;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
};

export type LeaderboardEntry = {
  rank: number;
  address: string;
  contributions: number;
  completedStories: number;
  achievements: number;
};

export type ContributionResult = {
  success: boolean;
  nftId?: string;
  message: string;
  creditEarned?: boolean;
};

export type StoryCreationParams = {
  storyType: StoryType;
  category: StoryCategory;
  userAddress: string;
};

export type StoryCreationResult = {
  success: boolean;
  storyId?: string;
  message: string;
  creditConsumed?: boolean;
};

export const ACHIEVEMENT_DEFINITIONS: Record<string, Achievement> = {
  first_word: {
    id: 'first_word',
    name: 'First Word',
    description: 'Contributed your first word',
    icon: '✍️',
    unlocked: false,
  },
  story_starter: {
    id: 'story_starter',
    name: 'Story Starter',
    description: 'Created your first story',
    icon: '📖',
    unlocked: false,
  },
  completion_king: {
    id: 'completion_king',
    name: 'Completion King',
    description: 'Contributed the final word to 5 stories',
    icon: '👑',
  unlocked: false,
  },
  prolific_writer: {
    id: 'prolific_writer',
    name: 'Prolific Writer',
    description: 'Contributed to 50+ stories',
    icon: '🏆',
    unlocked: false,
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Story you created completed in <24 hours',
    icon: '⚡',
    unlocked: false,
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Contributed between 12am-6am',
    icon: '🦉',
    unlocked: false,
  },
};

export const CATEGORY_INFO: Record<StoryCategory, { name: string; emoji: string; description: string }> = {
  fantasy: {
    name: 'Fantasy',
    emoji: '🧙',
    description: 'Magical worlds and mythical creatures',
  },
  scifi: {
    name: 'Sci-Fi',
    emoji: '🚀',
    description: 'Futuristic technology and space adventures',
  },
  comedy: {
    name: 'Comedy',
    emoji: '😂',
    description: 'Hilarious and absurd scenarios',
  },
  horror: {
    name: 'Horror',
    emoji: '👻',
    description: 'Spooky and frightening tales',
  },
  adventure: {
    name: 'Adventure',
    emoji: '🗺️',
    description: 'Exciting journeys and quests',
  },
  mystery: {
    name: 'Mystery',
    emoji: '🔍',
    description: 'Puzzles and unsolved cases',
  },
  romance: {
    name: 'Romance',
    emoji: '💕',
    description: 'Love stories and relationships',
  },
  crypto: {
    name: 'Crypto',
    emoji: '₿',
    description: 'Blockchain and web3 themed',
  },
  random: {
    name: 'Random',
    emoji: '🎲',
    description: 'Anything goes!',
  },
};

export const WORD_TYPE_DEFINITIONS: Record<WordType, WordTypeInfo> = {
  adjective: {
    type: 'adjective',
    displayName: 'Adjective',
    description: 'Describes a noun',
    examples: ['sparkly', 'enormous', 'mysterious'],
    minLength: 3,
    maxLength: 20,
  },
  noun: {
    type: 'noun',
    displayName: 'Noun',
    description: 'Person, place, or thing',
    examples: ['teapot', 'wizard', 'blockchain'],
    minLength: 3,
    maxLength: 25,
  },
  verb: {
    type: 'verb',
    displayName: 'Verb',
    description: 'Action word',
    examples: ['dance', 'explode', 'whisper'],
    minLength: 3,
    maxLength: 20,
  },
  adverb: {
    type: 'adverb',
    displayName: 'Adverb',
    description: 'Describes a verb',
    examples: ['quickly', 'mysteriously', 'loudly'],
    minLength: 3,
    maxLength: 20,
  },
  plural_noun: {
    type: 'plural_noun',
    displayName: 'Plural Noun',
    description: 'Multiple things',
    examples: ['dragons', 'cupcakes', 'computers'],
    minLength: 3,
    maxLength: 25,
  },
  past_tense_verb: {
    type: 'past_tense_verb',
    displayName: 'Past Tense Verb',
    description: 'Action that happened',
    examples: ['jumped', 'created', 'vanished'],
    minLength: 3,
    maxLength: 20,
  },
  verb_ing: {
    type: 'verb_ing',
    displayName: 'Verb Ending in -ing',
    description: 'Present participle',
    examples: ['running', 'coding', 'singing'],
    minLength: 3,
    maxLength: 20,
  },
  persons_name: {
    type: 'persons_name',
    displayName: "Person's Name",
    description: 'First name',
    examples: ['Alice', 'Vitalik', 'Satoshi'],
    minLength: 3,
    maxLength: 30,
  },
  place: {
    type: 'place',
    displayName: 'Place',
    description: 'Location',
    examples: ['Tokyo', 'moon', 'basement'],
    minLength: 3,
    maxLength: 30,
  },
  number: {
    type: 'number',
    displayName: 'Number',
    description: 'Any number',
    examples: ['42', '1000', '7'],
    minLength: 1,
    maxLength: 10,
  },
  color: {
    type: 'color',
    displayName: 'Color',
    description: 'Color description',
    examples: ['purple', 'neon green', 'invisible'],
    minLength: 3,
    maxLength: 20,
  },
  body_part: {
    type: 'body_part',
    displayName: 'Body Part',
    description: 'Part of body',
    examples: ['elbow', 'eyebrow', 'toe'],
    minLength: 3,
    maxLength: 20,
  },
  food: {
    type: 'food',
    displayName: 'Food',
    description: 'Edible item',
    examples: ['pizza', 'cucumber', 'ramen'],
    minLength: 3,
    maxLength: 20,
  },
  animal: {
    type: 'animal',
    displayName: 'Animal',
    description: 'Creature',
    examples: ['penguin', 'dragon', 'tardigrade'],
    minLength: 3,
    maxLength: 20,
  },
  exclamation: {
    type: 'exclamation',
    displayName: 'Exclamation',
    description: 'Interjection',
    examples: ['Wow', 'Yikes', 'Eureka'],
    minLength: 2,
    maxLength: 15,
  },
  emotion: {
    type: 'emotion',
    displayName: 'Emotion',
    description: 'Feeling',
    examples: ['joy', 'confusion', 'excitement'],
    minLength: 3,
    maxLength: 20,
  },
};

export const STORY_TYPE_INFO: Record<StoryType, { totalWords: number; playerSlots: number; fee: string }> = {
  mini: { totalWords: 50, playerSlots: 10, fee: '$0.05' },
  normal: { totalWords: 100, playerSlots: 20, fee: '$0.05' },
  epic: { totalWords: 1000, playerSlots: 200, fee: '$0.05' },
};
