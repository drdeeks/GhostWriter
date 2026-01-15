/**
 * Contract addresses and ABIs for Ghost Writer
 * Update these after deployment
 */

// Contract addresses (update after deployment)
export const CONTRACTS = {
  nft: (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  storyManager: (process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  liquidityPool: (process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  priceOracle: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
};

// Chain configuration
export const CHAIN_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532"), // Default to Base Sepolia
  baseSepolia: 84532,
  base: 8453,
  modeSepolia: 919,
  mode: 34443,
};

// Fee amounts (dynamic - fetched from contract)
export const FEES = {
  contribution: BigInt("50000000000000"), // Fallback: 0.00005 ETH
  creation: BigInt("100000000000000"), // Fallback: 0.0001 ETH
};

// Story Manager ABI (essential functions only)
export const STORY_MANAGER_ABI = [
  {
    inputs: [],
    name: "getContributionFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCreationFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "storyId", type: "string" },
      { name: "title", type: "string" },
      { name: "template", type: "string" },
      { name: "storyType", type: "uint8" },
      { name: "category", type: "uint8" },
      { name: "wordTypes", type: "string[]" },
    ],
    name: "createStory",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveStoriesCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "storyId", type: "string" },
      { name: "position", type: "uint256" },
      { name: "word", type: "string" },
    ],
    name: "contributeWord",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "storyId", type: "string" }],
    name: "getStory",
    outputs: [
      {
        components: [
          { name: "storyId", type: "string" },
          { name: "title", type: "string" },
          { name: "template", type: "string" },
          { name: "storyType", type: "uint8" },
          { name: "totalSlots", type: "uint256" },
          { name: "filledSlots", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "createdAt", type: "uint256" },
          { name: "completedAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserStats",
    outputs: [
      {
        components: [
          { name: "contributionsCount", type: "uint256" },
          { name: "creationCredits", type: "uint256" },
          { name: "storiesCreated", type: "uint256" },
          { name: "nftsOwned", type: "uint256" },
          { name: "completedStories", type: "uint256" },
          { name: "shareCount", type: "uint256" },
          { name: "lastContributionTime", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllStoryIds",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "storyId", type: "string" },
      { name: "position", type: "uint256" },
    ],
    name: "getSlot",
    outputs: [
      {
        components: [
          { name: "position", type: "uint256" },
          { name: "wordType", type: "string" },
          { name: "filled", type: "boolean" },
          { name: "word", type: "string" },
          { name: "contributor", type: "address" },
          { name: "nftId", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "CONTRIBUTION_FEE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "CREATION_FEE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserAchievements",
    outputs: [
      {
        components: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "unlocked", type: "bool" },
          { name: "unlockedAt", type: "uint256" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    name: "getLeaderboard",
    outputs: [
      {
        components: [
          { name: "user", type: "address" },
          { name: "contributions", type: "uint256" },
          { name: "rank", type: "uint256" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserRank",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalStories",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "storyId", type: "string" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "storyType", type: "uint8" },
      { indexed: false, name: "totalSlots", type: "uint256" },
    ],
    name: "StoryCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "storyId", type: "string" },
      { indexed: false, name: "position", type: "uint256" },
      { indexed: true, name: "contributor", type: "address" },
      { indexed: false, name: "nftId", type: "uint256" },
    ],
    name: "WordContributed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "storyId", type: "string" },
      { indexed: false, name: "completedAt", type: "uint256" },
    ],
    name: "StoryCompleted",
    type: "event",
  },
] as const;

// NFT Contract ABI (essential functions only)
export const NFT_ABI = [
  {
    inputs: [
      { name: "creator", type: "address" },
      { name: "storyId", type: "string" },
      { name: "storyTitle", type: "string" },
      { name: "fullStoryTemplate", type: "string" },
    ],
    name: "mintCreatorNFT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getNFTData",
    outputs: [
      {
        components: [
          { name: "storyId", type: "string" },
          { name: "storyTitle", type: "string" },
          { name: "wordPosition", type: "uint256" },
          { name: "totalWords", type: "uint256" },
          { name: "wordType", type: "string" },
          { name: "contributedWord", type: "string" },
          { name: "contributor", type: "address" },
          { name: "contributionTimestamp", type: "uint256" },
          { name: "storyComplete", type: "boolean" },
          { name: "revealed", type: "boolean" },
          { name: "isCreatorNFT", type: "boolean" },
          { name: "fullStoryTemplate", type: "string" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "storyId", type: "string" }],
    name: "getStoryTokens",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Helper to check if contracts are deployed
export function areContractsDeployed(): boolean {
  return (
    CONTRACTS.nft !== "0x0000000000000000000000000000000000000000" &&
    CONTRACTS.storyManager !== "0x0000000000000000000000000000000000000000"
  );
}
