# 👻 Ghost Writer - AI-Powered Community Storytelling NFT Game

A collaborative storytelling game on Base Chain where users contribute words to AI-generated story templates. Each contribution mints a unique NFT, and story creators receive auto-minted creator NFTs when stories complete.

## 🎯 Overview

**Ghost Writer** is a unique Web3 game that combines:
- 🤖 **AI-Powered Story Generation** - Dynamic story templates using OpenAI GPT-4o-mini
- 🛡️ **AI Word Moderation** - Intelligent content filtering with OpenAI Moderation API
- 👥 **Community-Driven Storytelling** - Players collaborate to fill story templates
- 🔒 **Progressive NFTs** - Hidden contributor NFTs that reveal when stories complete
- 🎨 **Creator NFTs** - Auto-minted NFTs for story creators with minimal metadata
- 🏆 **Rewards & Achievements** - Leaderboards and achievement badges for active contributors
- 💎 **Base Chain** - Low fees, fast transactions
- 📱 **Farcaster Mini App** - Native Farcaster integration

### Key Features

- **AI Story Generation**: Stories are dynamically generated using OpenAI based on selected categories (Adventure, Fantasy, Comedy, Mystery, Sci-Fi, Sports, Animals, School, Superheroes, Friendship, Holidays, Food, Nature, History)
- **AI Word Moderation**: All word contributions are checked using OpenAI Moderation API for inappropriate content
- **Dual NFT System**: 
  - **Contributor NFTs**: Hidden until story completion, then revealed with full story context
  - **Creator NFTs**: Auto-minted when stories complete, containing only: creator name/FID, story title, category, and date created
- **Creation Credits**: 1 contribution = 1 creation credit = ability to create your own story
- **Three Story Types**: Normal (~50 words, 10 slots), Extended (~100 words, 20 slots), Epic (~500 words, 50 slots)
- **Leaderboards**: Top 1000 contributors ranked by activity
- **Admin Portal**: Owner-only dashboard for platform management
- **Economic Model**: 100% of fees → liquidity pool

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or Coinbase Wallet
- Base Sepolia testnet ETH (get from [Base faucet](https://www.base.org/faucet))
- OpenAI API key (optional, for AI features - see [AI Integration Guide](./docs/AI_INTEGRATION.md))
- (Optional) Private key for contract deployment

### Installation

```bash
# Clone and install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your configuration:
# - Add OpenAI API key (for AI features)
# - Add OnchainKit API key
# - Configure RPC URLs
# - Add contract addresses after deployment
```

### Running Locally

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

**Note**: AI features work without API keys (fallback to templates), but for full functionality, configure `OPENAI_API_KEY` in your `.env` file.

---

## 🤖 AI Features

### Story Generation

Stories are dynamically generated using OpenAI GPT-4o-mini when users create new stories:

1. User selects a category (Adventure, Fantasy, etc.)
2. System calls `/api/generate-story` with category
3. OpenAI generates a Mad Libs-style template with word placeholders
4. Story is created on-chain with the generated template

**Fallback**: If OpenAI API key is not configured, the system uses predefined templates from `src/lib/aiStoryTemplates.ts`.

See [AI Story Generation Flow](./docs/AI_STORY_GENERATION_FLOW.md) for detailed architecture.

### Word Moderation

All word contributions are checked using OpenAI Moderation API:

1. User submits a word
2. System calls `/api/moderate-word` to check content
3. Word is validated for profanity, hate speech, violence, etc.
4. If approved, word is submitted to blockchain

**Fallback**: If OpenAI API key is not configured, basic validation (length checks) is performed.

### Configuration

Add to your `.env`:
```env
OPENAI_API_KEY=sk-your_key_here
```

See [AI Integration Guide](./docs/AI_INTEGRATION.md) for complete setup instructions.

---

## 📦 Smart Contracts

### Architecture

The system consists of 3 main contracts:

#### 1. **GhostWriterNFT.sol** (ERC-721)
- Mints hidden NFTs for each word contribution
- Enforces one mint per user per position per story
- Reveals NFTs when story completes
- Auto-mints creator NFTs with minimal metadata

**Key Functions:**
- `mintHiddenNFT()` - Mint NFT with hidden word (only StoryManager)
- `mintCreatorNFT()` - Auto-mint creator NFT (only StoryManager)
- `revealStoryNFTs()` - Reveal all NFTs for completed story
- `getNFTData()` - Get metadata for a token

#### 2. **StoryManager.sol** (Game Logic)
- Manages story creation and word contributions
- Tracks user stats and creation credits
- Forwards fees to liquidity pool
- Triggers story completion and NFT reveal/auto-mint

**Key Functions:**
- `createStory()` - Create new story (requires $0.10 + 1 credit)
- `contributeWord()` - Submit word (pays $0.05, awards 1 credit)
- `getStory()` - Get story details
- `getUserStats()` - Get user statistics

#### 3. **LiquidityPool.sol** (Fee Management)
- Collects all fees from StoryManager
- Owner-controlled withdrawals
- Transparent fee tracking

### Security Features

✅ **OpenZeppelin Contracts**: ReentrancyGuard, Ownable  
✅ **Access Control**: Only StoryManager can mint/reveal  
✅ **Input Validation**: Word length, position, duplicate checks  
✅ **One Mint Per Position**: Enforced at contract level  
✅ **Gas Optimized**: Efficient storage patterns

---

## 🛠️ Deployment

### Step 1: Compile Contracts

```bash
npm run compile
```

### Step 2: Run Tests

```bash
# Run all tests
npm test

# Run with gas reporting
npm run test:gas
```

### Step 3: Deploy to Testnet

```bash
# Deploy to Base Sepolia
npm run deploy:baseSepolia

# Save the contract addresses from output!
```

### Step 4: Update Environment

Add the deployed addresses to your `.env`:

```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=84532
```

### Step 5: Verify Contracts

```bash
# Add API keys to .env first
BASESCAN_API_KEY=your_key_here

# Then verify
npm run verify
```

### Production Deployment

```bash
# Deploy to Base Mainnet
npm run deploy:base
```

See [Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md) for frontend deployment.

---

## 💰 Economics

### Fee Structure

| Action          | Cost     | Result                    |
|-----------------|----------|---------------------------|
| Contribute Word | $0.05    | Mints NFT + 1 credit      |
| Create Story    | $0.10    | Consumes 1 credit         |

**All fees (100%) → Liquidity Pool**

### Creation Credits

- **Earn**: 1 contribution = 1 creation credit
- **Spend**: 1 credit required to create a story
- **Purpose**: Prevents spam and ensures quality stories

---

## 🎨 NFT System

### Contributor NFTs

**Hidden State** (Before Story Completion):
- Shows story title, position, and word type
- Word is stored but not revealed
- Creates anticipation

**Revealed State** (After Story Completion):
- Shows complete story with user's word highlighted
- Full context and contribution details
- Achievement badge

### Creator NFTs

**Auto-Minted** when story completes with minimal metadata:
- Creator name/FID (from Farcaster)
- Story title
- Category (Normal/Epic)
- Date created

**Note**: Creator NFTs do NOT include story content or template - only the essential metadata listed above.

### Image Generation

NFT images are dynamically generated as SVG:
- **Endpoint**: `/api/nft/[tokenId]/image`
- **Format**: SVG (1024x1024px)
- **Customization**: See [Image Backgrounds Guide](./docs/IMAGE_BACKGROUNDS.md)

See [NFT System Documentation](./docs/NFT_README.md) for complete details.

---

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) directory:

- **[AI Integration](./docs/AI_INTEGRATION.md)** - AI features setup and configuration
- **[AI Story Generation Flow](./docs/AI_STORY_GENERATION_FLOW.md)** - How AI story generation works
- **[NFT System](./docs/NFT_README.md)** - NFT metadata, images, and IPFS setup
- **[Image Backgrounds](./docs/IMAGE_BACKGROUNDS.md)** - How to configure and upload backgrounds
- **[Vercel Deployment](./docs/VERCEL_DEPLOYMENT.md)** - Production deployment guide
- **[Wagmi Experimental Shim](./docs/WAGMI_EXPERIMENTAL_SHIM.md)** - Compatibility layer documentation

---

## 🧪 Testing

### Test Suite

```bash
# Run complete test suite
npm test

# Test coverage includes:
# - Contract deployment
# - Story creation & contribution
# - NFT minting & reveal
# - Creator NFT auto-minting
# - Access control
# - Fee collection
# - Edge cases
```

### Manual Testing

1. Deploy to local Hardhat network:
   ```bash
   # Terminal 1
   npm run node

   # Terminal 2
   npm run deploy:localhost
   ```

2. Update `.env` with localhost addresses

3. Test in browser at `http://localhost:3000`

---

## 📁 Project Structure

```
ghost-writer/
├── contracts/               # Solidity smart contracts
│   ├── GhostWriterNFT.sol
│   ├── StoryManager.sol
│   └── LiquidityPool.sol
├── scripts/                 # Deployment scripts
│   ├── deploy-and-verify.ts
│   └── postinstall.js
├── test/                    # Contract tests
│   ├── GhostWriter.test.ts
│   └── ...
├── src/
│   ├── app/                 # Next.js app
│   │   ├── api/            # API routes
│   │   │   ├── generate-story/    # AI story generation
│   │   │   ├── moderate-word/     # AI word moderation
│   │   │   ├── farcaster-user/    # Farcaster user lookup
│   │   │   └── nft/               # NFT metadata & images
│   │   ├── page.tsx        # Main application page
│   │   ├── admin/          # Admin dashboard
│   │   └── leaderboard/    # Leaderboard page
│   ├── components/          # React components
│   │   ├── story-card.tsx
│   │   ├── contribution-modal.tsx
│   │   ├── story-creation-modal.tsx
│   │   └── ...
│   ├── hooks/               # Custom hooks
│   │   ├── useContract.ts  # Contract interaction hooks
│   │   └── ...
│   ├── lib/                 # Utilities
│   │   ├── contracts.ts    # Contract ABIs & addresses
│   │   └── aiStoryTemplates.ts  # Fallback templates
│   └── types/               # TypeScript types
│       └── ghostwriter.ts
├── docs/                    # Documentation
│   ├── AI_INTEGRATION.md
│   ├── AI_STORY_GENERATION_FLOW.md
│   ├── NFT_README.md
│   └── ...
├── hardhat.config.ts        # Hardhat configuration
├── next.config.js           # Next.js configuration
├── vercel.json              # Vercel deployment config
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

```env
# AI Configuration (optional - fallback available)
OPENAI_API_KEY=sk-your_key_here

# Deployment (DO NOT commit real private key!)
PRIVATE_KEY=your_private_key_here

# RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Block Explorer API Keys
BASESCAN_API_KEY=your_api_key

# Frontend (public - safe to commit)
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Supported Networks

| Network        | Chain ID | RPC URL                          |
|----------------|----------|----------------------------------|
| Base Mainnet   | 8453     | https://mainnet.base.org         |
| Base Sepolia   | 84532    | https://sepolia.base.org         |

---

## 📖 Usage Examples

### For Players

1. **Connect Wallet**: Use Coinbase Wallet or MetaMask
2. **Browse Stories**: See active stories in gallery
3. **Contribute**: Pay $0.05, submit a word (AI-moderated), earn 1 credit
4. **Create Story**: Use 1 credit, pay $0.10, AI generates your story template
5. **Collect NFTs**: View your hidden/revealed NFT collection
6. **Earn Creator NFT**: When your story completes, receive auto-minted creator NFT

### For Developers

```typescript
// Read story data
import { useStory, useUserStats } from '@/hooks/useContract';

const { story } = useStory("story_001");
const { stats } = useUserStats(address);

// Contribute word (AI moderation happens automatically)
import { useStoryManager } from '@/hooks/useContract';

const { contributeWord } = useStoryManager();
const result = await contributeWord("story_001", 1, "sparkly");

// Create story (AI generation happens automatically)
const { createStory } = useStoryManager();
const result = await createStory(
  "story_002",
  "Title",           // AI-generated
  "Template",        // AI-generated
  "normal",
  "Adventure",       // Category
  ["adjective", "noun", "verb"]  // AI-extracted word types
);
```

---

## 👑 Admin Portal

The admin portal is accessible only to the contract owner at `/admin`:

**Features:**
- Story management and creation
- User credit airdrops
- Analytics dashboard
- Emergency controls (pause, withdrawals)

**Access**: Connect with the wallet that deployed the contracts.

---

## 🛣️ Roadmap

### Phase 1: MVP ✅ (Completed)
- [x] Smart contracts (NFT, StoryManager, LiquidityPool)
- [x] Frontend with Base integration
- [x] AI-powered story generation
- [x] AI word moderation
- [x] Creator NFT auto-minting
- [x] Farcaster Mini App support
- [x] Comprehensive test suite
- [x] Achievement badges system
- [x] Leaderboards (Top 1000 contributors)

### Phase 2: Launch 🚧 (Current)
- [x] AI integration complete
- [x] NFT image generation
- [ ] Deploy to Base Sepolia testnet
- [ ] Beta testing with community
- [ ] Deploy to Base mainnet

### Phase 3: Enhancement 📅 (Next)
- [ ] Farcaster user lookup integration
- [ ] IPFS metadata storage
- [ ] Advanced analytics
- [ ] Mobile app optimization

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the Fair Source License (5 users) - see the [LICENSE](LICENSE) file for details.

**Free for up to 5 users.** Need more? Contact for commercial licensing.

---

## 👥 Team

Built with ❤️ by the Ghost Writer team.

For questions or support:
- GitHub: https://github.com/drdeeks
- Email: drdeeks@outlook.com

---

## 🙏 Acknowledgments

- [Base](https://base.org) - L2 blockchain platform
- [Farcaster](https://farcaster.xyz) - Decentralized social protocol
- [OnchainKit](https://onchainkit.com) - Base blockchain toolkit
- [OpenZeppelin](https://openzeppelin.com) - Smart contract libraries
- [OpenAI](https://openai.com) - AI story generation and moderation
- [Hardhat](https://hardhat.org) - Ethereum development environment

---

**Built with 💜 by DrDeeks | Powered by Base 🟪 | Secured by OpenZeppelin 🛡️ | Enhanced by AI 🤖**
