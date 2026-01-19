# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Ghost Writer is a collaborative storytelling NFT game on Base Chain where users contribute words to AI-generated story templates. Each contribution mints a unique NFT.

**Stack**: Next.js 16 (App Router) + Hardhat | TypeScript | Tailwind CSS v4 | Wagmi/Viem | OnchainKit

## Development Commands

```bash
# Frontend
npm run dev              # Start development server
npm run build            # Production build
npm run ts-check         # TypeScript validation
npm run lint             # ESLint

# Smart Contracts
npm run compile          # Compile Solidity contracts
npm test                 # Run contract tests (Hardhat/Chai)
npm run test:gas         # Contract tests with gas report
npm run test:coverage    # Contract coverage

# Frontend Tests
npm run test:frontend    # Run Jest tests
npm run test:frontend:watch     # Watch mode
npm run test:frontend:coverage  # With coverage

# Deployment
npm run deploy:baseSepolia   # Deploy to Base Sepolia testnet
npm run deploy:base          # Deploy to Base mainnet
npm run verify               # Verify contracts on Basescan
```

## Architecture

### Smart Contracts (`contracts/`)
- **GhostWriterNFT.sol** - ERC-721 with hidden/revealed states for contributor and creator NFTs
- **StoryManager.sol** - Core game logic: story creation, word contributions, achievements, leaderboards
- **LiquidityPool.sol** - Fee collection and fund management
- **PriceOracle.sol** - USD to ETH conversion with Chainlink integration

### Frontend (`src/`)
- **app/** - Next.js App Router pages and API routes
  - `api/generate-story/` - OpenAI story generation with fallback templates
  - `api/moderate-word/` - AI content moderation
  - `api/nft/[tokenId]/` - NFT metadata and dynamic SVG images
- **components/** - React components (UI primitives in `ui/`)
- **hooks/** - Custom hooks for contract interactions (`useContract`, `useStories`, `useFees`, etc.)
- **lib/contracts.ts** - Contract addresses and ABIs

### Key Flow
1. User creates story → StoryManager validates credits → Initializes slots
2. User contributes word → StoryManager mints hidden NFT → Awards credit
3. Story completes → Batch process (50 slots each) → Reveal NFTs → Mint creator NFT

## Environment Setup

Required in `.env`:
```
PRIVATE_KEY=             # Deployer wallet
NEXT_PUBLIC_CHAIN_ID=84532  # 84532 (Sepolia) or 8453 (mainnet)
OPENAI_API_KEY=          # Optional - enables AI features

# After deployment
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=
```

## Testing

- Contract tests: `test/GhostWriter.test.js` (Hardhat + Chai)
- Frontend tests: Colocated with components (e.g., `story-card.test.tsx`)
- Uses Jest + React Testing Library for frontend

## Security Patterns

- ReentrancyGuard on all state-changing functions
- Pull-over-push refund pattern (prevents gas griefing)
- Batch processing for large story operations (prevents DoS)
- Price oracle circuit breaker for manipulation prevention
