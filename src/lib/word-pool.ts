import { keccak256, toBytes } from 'viem';

export type WordTypeKey =
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

const WORD_POOLS: Record<Exclude<WordTypeKey, 'number'>, string[]> = {
  adjective: ['mysterious', 'glittery', 'ancient', 'spooky', 'brave', 'chaotic', 'tiny', 'gigantic', 'sassy', 'legendary'],
  noun: ['lantern', 'spaceship', 'typewriter', 'pumpkin', 'treasure', 'taco', 'robot', 'castle', 'mirror', 'notebook'],
  verb: ['whisper', 'launch', 'juggle', 'discover', 'sprint', 'vanish', 'summon', 'trade', 'decode', 'dance'],
  adverb: ['boldly', 'mysteriously', 'silently', 'happily', 'dramatically', 'carefully', 'wildly', 'suddenly', 'awkwardly', 'secretly'],
  plural_noun: ['pirates', 'dragons', 'cookies', 'aliens', 'ghosts', 'unicorns', 'widgets', 'bananas', 'champions', 'rainbows'],
  past_tense_verb: ['jumped', 'laughed', 'escaped', 'teleported', 'assembled', 'bargained', 'invented', 'shouted', 'spun', 'cheered'],
  verb_ing: ['running', 'floating', 'coding', 'laughing', 'sneaking', 'dreaming', 'digging', 'singing', 'plotting', 'wandering'],
  persons_name: ['Alex', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Sam', 'Avery', 'Quinn', 'Sky'],
  place: ['Base City', 'Moon Harbor', 'Neon Alley', 'Crystal Cave', 'Hidden Library', 'Stormy Beach', 'Pixel Plaza', 'Old Tavern', 'Sky Bridge', 'Underground Lab'],
  color: ['purple', 'blue', 'gold', 'silver', 'crimson', 'emerald', 'midnight', 'neon', 'amber', 'obsidian'],
  body_part: ['elbow', 'kneecap', 'eyebrow', 'thumb', 'shoulder', 'ankle', 'nose', 'toe', 'chin', 'forehead'],
  food: ['taco', 'pizza', 'ramen', 'pancake', 'cookie', 'sushi', 'burrito', 'noodle', 'mango', 'donut'],
  animal: ['otter', 'penguin', 'tiger', 'hamster', 'eagle', 'octopus', 'koala', 'llama', 'fox', 'dolphin'],
  exclamation: ['Wow', 'Yikes', 'Huzzah', 'Boom', 'Eureka', 'Nope', 'Zing', 'Aha', 'Whoa', 'Sheesh'],
  emotion: ['joy', 'panic', 'curiosity', 'pride', 'confusion', 'excitement', 'relief', 'wonder', 'nerves', 'gratitude'],
};

function hashToIndex(seed: string, modulo: number): number {
  if (modulo <= 0) return 0;
  const h = keccak256(toBytes(seed));
  return Number(BigInt(h) % BigInt(modulo));
}

/**
 * Deterministically picks a fallback word for a given word type.
 * Intended for forced-complete stories where some slots were never filled on-chain.
 */
export function pickWordFromPool(params: { storyId: string; position: number; wordType: string }): string {
  const wt = params.wordType.toLowerCase() as WordTypeKey;
  const seed = `${params.storyId}:${params.position}:${wt}`;

  if (wt === 'number') {
    const n = (hashToIndex(seed, 99) + 1).toString();
    return n;
  }

  const pool = WORD_POOLS[wt as Exclude<WordTypeKey, 'number'>] ?? WORD_POOLS.noun;
  return pool[hashToIndex(seed, pool.length)]!;
}
