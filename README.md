# 👻 Ghost Writer - Community Storytelling NFT Game

A collaborative storytelling game on Base Chain where users contribute words to community-created story templates. Each contribution mints a unique NFT and earns rewards for active participants.

## 🎯 Overview

**Ghost Writer** is a unique Web3 game that combines:
- 👥 Community-driven collaborative storytelling
- 🔒 Hidden progressive NFTs (reveal on completion)
- 🏆 Rewards for active contributors and community builders
- 💎 Base Chain deployment (low fees, fast transactions)
- 📱 Farcaster Mini App integration

### Key Features

- **Community Storytelling**: Players collaborate to fill story templates with creative words
- **Hidden NFTs**: Each word contribution mints an NFT showing only position/type until story completes
- **Creation Credits**: 1 contribution = 1 creation credit = ability to create your own story
- **Three Story Types**: Mini (10 slots), Normal (20 slots), Epic (200 slots)
- **Leaderboards**: Top 1000 contributors ranked by activity and achievements
- **Admin Portal**: Owner-only dashboard for platform management and initial story setup
- **Economic Model**: 100% of fees → liquidity pool
- **Multi-Chain Support**: Base + Mode + Monad testnets/mainnets

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MetaMask or Coinbase Wallet
- Base Sepolia testnet ETH (get from [Base faucet](https://www.base.org/faucet))
- (Optional) Private key for contract deployment

### Installation

```bash
# Clone and install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Add your private key (for deployment only)
# - Add OnchainKit API key
# - Configure RPC URLs
```

### Running Locally

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

---

## 📦 Smart Contracts

### Architecture

The system consists of 3 main contracts:

#### 1. **GhostWriterNFT.sol** (ERC-721)
- Mints hidden NFTs for each word contribution
- Enforces one mint per user per position per story
- Reveals NFTs when story completes
- Stores word data securely until reveal

**Key Functions:**
- `mintHiddenNFT()` - Mint NFT with hidden word (only StoryManager)
- `revealStoryNFTs()` - Reveal all NFTs for completed story
- `getNFTData()` - Get metadata for a token
- `tokenURI()` - Returns hidden or revealed URI based on status

#### 2. **StoryManager.sol** (Game Logic)
- Manages story creation and word contributions
- Tracks user stats and creation credits
- Forwards fees to liquidity pool
- Triggers story completion and NFT reveal

**Key Functions:**
- `createStory()` - Create new story (requires $0.10 + 1 credit)
- `contributeWord()` - Submit word (pays $0.05, awards 1 credit)
- `getStory()` - Get story details
- `getUserStats()` - Get user statistics

#### 3. **LiquidityPool.sol** (Fee Management)
- Collects all fees from StoryManager
- Owner-controlled withdrawals
- Transparent fee tracking

**Key Functions:**
- `deposit()` - Receive fees (only StoryManager)
- `withdraw()` - Owner withdraws funds
- `getBalance()` - Check pool balance

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
pnpm compile
```

### Step 2: Run Tests

```bash
# Run all tests
pnpm test

# Run with gas reporting
pnpm test:gas
```

### Step 3: Deploy to Testnet

```bash
# Deploy to Base Sepolia
pnpm run deploy:baseSepolia

# Deploy to Mode Sepolia
pnpm run deploy:modeSepolia

# Deploy to Monad Testnet
pnpm run deploy:monadTestnet

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
pnpm verify
```

### Production Deployment

```bash
# Deploy to Base Mainnet
pnpm run deploy:base

# Deploy to Mode Mainnet
pnpm run deploy:mode

# Deploy to Monad Mainnet
pnpm run deploy:monad
```

---

## 💰 Economics

### Fee Structure

| Action          | Cost     | Result                    |
|-----------------|----------|---------------------------|
| Contribute Word | $0.05    | Mints NFT + 1 credit      |
| Create Story    | $0.10    | Consumes 1 credit         |

**All fees (100%) → Liquidity Pool**

### Bootstrap Problem Solution

**Issue**: Users need credits to create stories, but earn credits by contributing.

**Solutions**:
1. ✅ Owner airdrops initial credits to early users
2. ✅ Deploy with pre-created stories for initial contributions
3. ✅ Partner giveaways/promotions for early adopters

---

## 🧪 Testing

### Test Suite

```bash
# Run complete test suite
pnpm test

# Test coverage includes:
# - Contract deployment
# - Story creation & contribution
# - NFT minting & reveal
# - Access control
# - Fee collection
# - Edge cases
```

### Test Files

- `test/GhostWriter.test.ts` - Main contract tests
- `test/Bootstrap.test.ts` - Bootstrap scenario tests

### Manual Testing

1. Deploy to local Hardhat network:
   ```bash
   # Terminal 1
   pnpm node

   # Terminal 2
   pnpm deploy:localhost
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
│   ├── deploy.ts
│   └── verify.ts
├── test/                    # Contract tests
│   ├── GhostWriter.test.ts
│   └── Bootstrap.test.ts
├── src/
│   ├── app/                 # Next.js app
│   │   ├── page.tsx        # Main application page
│   │   ├── layout.tsx      # Root layout with providers
│   │   ├── providers.tsx   # OnchainKit provider
│   │   └── config/         # Configuration
│   ├── components/          # React components
│   │   ├── story-card.tsx
│   │   ├── contribution-modal.tsx
│   │   ├── story-creation-modal.tsx
│   │   ├── nft-collection.tsx
│   │   └── user-stats.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useContract.ts  # Contract interaction hooks
│   │   └── useAddMiniApp.ts
│   ├── lib/                 # Utilities
│   │   ├── contracts.ts    # Contract ABIs & addresses
│   │   └── utils.ts
│   └── types/               # TypeScript types
│       └── ghostwriter.ts
├── hardhat.config.ts        # Hardhat configuration
├── package.json
└── README.md
```

---

## 🎨 Word Types

Ghost Writer supports 16 word types:

| Type              | Description           | Examples                  | Length  |
|-------------------|-----------------------|---------------------------|---------|
| Adjective         | Describes a noun      | sparkly, enormous         | 3-20    |
| Noun              | Person, place, thing  | teapot, wizard            | 3-25    |
| Verb              | Action word           | dance, explode            | 3-20    |
| Plural Noun       | Multiple things       | dragons, cupcakes         | 3-25    |
| Past Tense Verb   | Action that happened  | jumped, vanished          | 3-20    |
| Verb (-ing)       | Present participle    | running, singing          | 3-20    |
| Person's Name     | First name            | Alice, Satoshi            | 3-30    |
| Place             | Location              | Tokyo, moon               | 3-30    |
| Number            | Any number            | 42, 1000                  | 1-10    |
| Color             | Color description     | purple, invisible         | 3-20    |
| Body Part         | Part of body          | elbow, eyebrow            | 3-20    |
| Food              | Edible item           | pizza, ramen              | 3-20    |
| Animal            | Creature              | penguin, dragon           | 3-20    |
| Exclamation       | Interjection          | Wow, Eureka               | 2-15    |
| Emotion           | Feeling               | joy, excitement           | 3-20    |
| Adverb            | Describes a verb      | quickly, mysteriously     | 3-20    |

---

## 🔧 Configuration

### Environment Variables

```env
# Deployment (DO NOT commit real private key!)
PRIVATE_KEY=your_private_key_here

# RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_RPC_URL=https://rpc.monad.xyz
MODE_RPC_URL=https://mainnet.mode.network
MODE_SEPOLIA_RPC_URL=https://sepolia.mode.network

# Block Explorer API Keys
BASESCAN_API_KEY=your_api_key
MONAD_EXPLORER_API_KEY=your_monad_api_key
MODESCAN_API_KEY=your_api_key

# Frontend (public - safe to commit)
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_HIDDEN_BASE_URI=ipfs://QmHidden/
NEXT_PUBLIC_REVEALED_BASE_URI=ipfs://QmRevealed/
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_key
```

### Supported Networks

| Network        | Chain ID | RPC URL                          |
|----------------|----------|----------------------------------|
| Base Mainnet   | 8453     | https://mainnet.base.org         |
| Base Sepolia   | 84532    | https://sepolia.base.org         |
| Monad Testnet  | 10143    | https://testnet-rpc.monad.xyz    |
| Monad Mainnet  | 143      | https://rpc.monad.xyz            |
| Mode Mainnet   | 34443    | https://mainnet.mode.network     |
| Mode Sepolia   | 919      | https://sepolia.mode.network     |

---

## 📚 Usage Examples

### For Players

1. **Connect Wallet**: Use Coinbase Wallet or MetaMask
2. **Browse Stories**: See active stories in gallery
3. **Contribute**: Pay $0.05, submit a word, earn 1 credit
4. **Create Story**: Use 1 credit, pay $0.10, create your story
5. **Collect NFTs**: View your hidden/revealed NFT collection

### For Developers

```typescript
// Read story data
import { useStory, useUserStats } from '@/hooks/useContract';

const { story } = useStory("story_001");
const { stats } = useUserStats(address);

// Contribute word
import { useStoryManager } from '@/hooks/useContract';

const { contributeWord } = useStoryManager();
const result = await contributeWord("story_001", 1, "sparkly");

// Create story
const { createStory } = useStoryManager();
const result = await createStory(
  "story_002",
  "Title",
  "Template",
  "normal",
  ["adjective", "noun", "verb"]
);
```

---

## 🚨 Known Issues & Limitations

### Bootstrap Problem
**Issue**: Initial users can't create stories without credits.

**Workaround**:
- Owner manually airdrops creation credits
- Deploy with pre-created stories
- Community giveaways for early adopters

### AI Integration
**Status**: Template generation placeholder.

**TODO**: Integrate Neynar AI API for:
- Story title generation
- Mad Lib template creation
- Word slot assignment

### IPFS Metadata
**Status**: Base URIs are placeholders.

**TODO**: Implement proper IPFS storage for:
- Hidden NFT metadata
- Revealed NFT metadata with story snippets
- Generated story images

---

## 👑 Admin Portal & Initial Setup

### Admin Dashboard Access

The admin portal is accessible only to the contract owner at `/admin`. It provides full platform management capabilities:

**Access Requirements:**
- Must be connected with the wallet that deployed the contracts
- Automatically verified against contract ownership
- Access denied for non-owner wallets

**Key Features:**
- **Story Management**: Create initial story templates manually
- **User Management**: Airdrop creation credits to bootstrap users
- **Analytics Dashboard**: Monitor platform statistics and activity
- **Emergency Controls**: Contract pause and emergency withdrawal functions

### Setting Up the Initial Story

To bootstrap the platform, the contract owner must create the first "genesis" story that allows initial users to earn creation credits:

**Step-by-Step Setup:**

1. **Deploy Contracts** (see deployment section above)

2. **Access Admin Portal**:
   ```bash
   # Start the application
   pnpm dev

   # Navigate to http://localhost:3000/admin
   # Connect with the owner wallet
   ```

3. **Create Genesis Story**:
   - Go to "Stories" tab in admin dashboard
   - Create an "Epic" story (200 slots) with engaging template
   - Use a popular theme (fantasy, adventure, crypto, etc.)
   - Example template: "In the mystical land of [PLACE], a brave [PROFESSION] named [PERSON_NAME] discovered a [ADJECTIVE] [NOUN] that could [VERB] the entire [PLURAL_NOUN]..."

4. **Bootstrap Users**:
   - Use "Airdrop Credits" in admin dashboard
   - Distribute 5-10 credits to early community members
   - This allows them to create additional stories

5. **Monitor & Moderate**:
   - Track story completion in analytics dashboard
   - Ensure content quality and community guidelines
   - Add more stories as the community grows

**Genesis Story Best Practices:**
- Choose an epic-length story (200 words) for maximum engagement
- Select a popular category that appeals to your target audience
- Create an intriguing title that sparks curiosity
- Ensure the template allows for creative, humorous contributions
- Monitor completion progress and celebrate milestones

---

## 🎨 NFT System & Visual Assets

### NFT Card Specifications

**Dimensions & Format:**
- **Resolution**: 1024x1024px minimum (square aspect ratio)
- **Format**: PNG with transparency support
- **File Size**: < 1MB per image (optimized)
- **Color Space**: RGB with proper gamma correction

**Design Philosophy:**
- **Theme**: Mystery and storytelling with professional aesthetic
- **Color Palette**: Deep purple/midnight blue (#2D1B69, #1A1A2A) with gold accents (#D4AF37)
- **Typography**: Serif headers (Playfair Display), sans-serif body (Inter)
- **Icons**: Ghost silhouette, antique quill, ancient book motifs

### NFT States & Reveal Process

#### 🔒 Hidden State (Pre-Reveal)
**What Users See:**
- Story title prominently displayed
- Position indicator (e.g., "Position: 3/10")
- Word type required (e.g., "Word Type: Adjective")
- Mysterious placeholder text: "Your word awaits reveal..."
- Ghost/quill iconography maintaining suspense

**Purpose:** Creates anticipation and prevents copying of contributions before story completion.

#### ✨ Revealed State (Post-Reveal)
**What Users See:**
- Complete story title
- Story snippet showing word usage (2-3 sentences)
- **Highlighted contribution**: User's specific word in context
- Position and word type metadata
- Contribution timestamp
- "Story Complete" achievement badge

**Reveal Trigger:** Automatic when the final word is contributed and story reaches 100% completion.

### NFT Generation Process

**Dynamic Image Generation:**
1. **Event Listening**: Monitors `WordContributed` and `StoryCompleted` events
2. **Template Selection**: Hidden vs Revealed state templates
3. **Content Injection**: Inserts story data, position, word type, and (revealed) actual word
4. **SVG/HTML Rendering**: Converts to high-quality PNG
5. **IPFS Upload**: Generated images stored on decentralized storage
6. **Metadata Update**: Contract updates base URI for revealed state

**Technical Implementation:**
- Node.js service using Canvas API for image generation
- IPFS pinning services (Pinata, NFT.Storage, or self-hosted)
- Automated workflow triggered by blockchain events
- Fallback systems for generation failures

### Individual User Experience

**Hidden NFT Display:**
```
┌─────────────────────────────────────┐
│           GHOST WRITER              │
├─────────────────────────────────────┤
│                                     │
│        "The Haunted Library"        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Position: 3/10                 │
│      Word Type: Adjective           │
│                                     │
│         [Ghost Icon]                │
│                                     │
│    "Your word awaits reveal..."     │
└─────────────────────────────────────┘
```

**Revealed NFT Display:**
```
┌─────────────────────────────────────┐
│           GHOST WRITER              │
├─────────────────────────────────────┤
│        "The Haunted Library"        │
├─────────────────────────────────────┤
│   "In a mysterious library, the     │
│    ancient books whispered secrets  │
│    and created wonder..."           │
│                                     │
├─────────────────────────────────────┤
│   Your Contribution:                │
│   Position 3: "mysterious"          │
│                                     │
│   Word Type: Adjective              │
│   Contributed: Jan 1, 2024         │
└─────────────────────────────────────┘
```

### IPFS Setup & Configuration

**Required Services:**
- IPFS pinning service (Pinata, NFT.Storage, or Infura)
- Image generation API endpoint
- Environment variables for API keys

**Environment Setup:**
```env
# IPFS Configuration
IPFS_API_ENDPOINT=https://api.pinata.cloud
IPFS_API_KEY=your_pinata_api_key
IPFS_SECRET_KEY=your_pinata_secret

# NFT Base URIs (update after IPFS upload)
NEXT_PUBLIC_HIDDEN_BASE_URI=ipfs://QmYourHiddenBaseURI/
NEXT_PUBLIC_REVEALED_BASE_URI=ipfs://QmYourRevealedBaseURI/
```

**Directory Structure:**
```
ipfs/
├── hidden/           # Hidden state images
├── revealed/         # Revealed state images
└── metadata/         # JSON metadata files
```

---

## ⚙️ Complete Setup Instructions

### Phase 1: Infrastructure Setup

1. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your keys and RPC URLs
   ```

2. **Contract Deployment**:
   ```bash
   pnpm compile
   pnpm test
   pnpm deploy:baseSepolia  # or your target network
   pnpm verify
   ```

3. **IPFS Service Setup**:
   - Choose pinning service (Pinata recommended)
   - Generate API keys
   - Test upload functionality
   - Update base URIs in deployed contracts

4. **Image Generation Service**:
   - Deploy Node.js service for dynamic NFT generation
   - Configure webhook endpoints for blockchain events
   - Test hidden/revealed image generation

### Phase 2: Content & Bootstrap

1. **Create Genesis Story**:
   - Access admin portal at `/admin`
   - Create epic-length story with engaging template
   - Choose popular category for initial traction

2. **Bootstrap Community**:
   - Airdrop creation credits via admin dashboard
   - Invite beta testers and early community members
   - Monitor initial contributions and story completion

3. **Content Moderation**:
   - Review completed stories for quality
   - Remove inappropriate content if needed
   - Encourage positive community engagement

### Phase 3: Launch Preparation

1. **Testing Checklist**:
   - ✅ Contract tests passing (`pnpm test`)
   - ✅ End-to-end contribution flow working
   - ✅ NFT minting and reveal process functional
   - ✅ Wallet connections working (MetaMask, Coinbase)
   - ✅ Mobile responsive design verified
   - ✅ IPFS images loading correctly

2. **Pre-Launch Tasks**:
   - Set up community channels (Discord, Farcaster)
   - Prepare marketing materials
   - Test gas costs and optimize if needed
   - Configure monitoring and error tracking

3. **Go-Live Sequence**:
   - Deploy to mainnet
   - Update production environment variables
   - Announce launch on social channels
   - Monitor initial user activity and support

### Phase 4: Post-Launch Operations

1. **Community Management**:
   - Monitor story quality and user engagement
   - Moderate content and handle reports
   - Add new story templates regularly
   - Airdrop credits to maintain growth

2. **Technical Maintenance**:
   - Monitor contract gas usage and optimize
   - Update IPFS pins as needed
   - Handle any revealed NFT generation failures
   - Scale image generation service as user base grows

3. **Feature Expansion**:
   - Add new story categories based on user feedback
   - Implement advanced achievements
   - Consider governance features for community templates

---

## 🛣️ Roadmap

### Phase 1: MVP ✅ (Completed)
- [x] Smart contracts (NFT, StoryManager, LiquidityPool)
- [x] Frontend with Base integration
- [x] Farcaster Mini App support
- [x] Comprehensive test suite
- [x] Multi-chain deployment support
- [x] Achievement badges system (6 types)
- [x] Leaderboards (Top 1000 contributors)
- [x] Social sharing (Twitter, Farcaster)
- [x] Story categories (9 themes)
- [x] Admin dashboard with full controls

### Phase 2: Launch 🚧 (Current - Ready for Testnet)
- [x] Farcaster.json updated and compliant
- [ ] Deploy to Base Sepolia testnet
- [ ] End-to-end NFT creation testing
- [ ] IPFS metadata implementation
- [ ] Visual asset generation (NFT images)
- [ ] Beta testing with community
- [ ] Deploy to Base mainnet

### Phase 3: AI & Content Enhancement 📅 (Next)
- [ ] Integrate Neynar AI for story templates
- [ ] Automated story title generation
- [ ] Community voting on stories
- [ ] Story remixing features
- [ ] Advanced moderation tools

### Phase 4: Ecosystem Expansion 🔮 (Future)
- [ ] Mobile app (iOS/Android)
- [ ] Multi-chain expansion (Mode, Optimism)
- [ ] $GHOST governance token
- [ ] Liquidity mining incentives
- [ ] DAO for template curation
- [ ] Token rewards for quality contributions

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Links

- **Website**: [Coming Soon]
- **Documentation**: [Coming Soon]
- **Farcaster Channel**: /ghostwriter
- **Twitter**: @ghostwriter_app
- **Discord**: [Coming Soon]

---

## 👥 Team

Built with ❤️ by the Ghost Writer team.

For questions or support, reach out:
- Email: support@ghostwriter.app
- Discord: [Join our server]

---

## 🙏 Acknowledgments

- [Base](https://base.org) - L2 blockchain platform
- [Mode Network](https://mode.network) - Additional L2 support
- [Farcaster](https://farcaster.xyz) - Decentralized social protocol
- [OnchainKit](https://onchainkit.com) - Base blockchain toolkit
- [OpenZeppelin](https://openzeppelin.com) - Smart contract libraries
- [Hardhat](https://hardhat.org) - Ethereum development environment

---

**Built on Base 🔵 | Powered by Farcaster 💜 | Secured by OpenZeppelin 🛡️**
