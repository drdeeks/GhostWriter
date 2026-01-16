# 👻 Ghost Writer - AI-Powered Community Storytelling NFT Game

A collaborative storytelling game on Base Chain where users contribute words to AI-generated story templates. Each contribution mints a unique NFT, and story creators receive auto-minted creator NFTs when stories complete.

## 🎯 Overview

**Ghost Writer** combines:
- 🤖 **AI-Powered Story Generation** - Dynamic templates using OpenAI GPT-4o-mini
- 🛡️ **AI Word Moderation** - Intelligent content filtering with fallbacks
- 👥 **Community-Driven Storytelling** - Collaborative Mad Libs-style gameplay
- 🔒 **Progressive NFTs** - Hidden contributor NFTs that reveal when stories complete
- 🎨 **Creator NFTs** - Auto-minted NFTs for story creators with minimal metadata
- 🏆 **Rewards & Achievements** - Leaderboards and achievement badges
- 💎 **Base Chain** - Low fees, fast transactions
- 📱 **Farcaster Mini App** - Native integration with haptic feedback

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask or Coinbase Wallet
- Base Sepolia testnet ETH ([Base faucet](https://www.base.org/faucet))
- OpenAI API key (optional - has fallbacks)

### Installation
```bash
git clone <repository>
cd GhostWriter
npm install
cp env.example .env
# Configure .env with your settings
npm run dev
# Open http://localhost:3000
```

**📚 Complete Setup Guide**: See [`docs/COMPLETE_SETUP_GUIDE.md`](./docs/COMPLETE_SETUP_GUIDE.md) for detailed instructions.

---

## ✨ Key Features

### 🤖 AI-Powered Features
- **Story Generation**: OpenAI creates unique Mad Libs templates
- **Word Moderation**: AI filters inappropriate content
- **Intelligent Fallbacks**: Works without API keys using templates
- **Performance Caching**: 1-hour story cache, 30-min moderation cache

### 🎨 Dual NFT System
- **Contributor NFTs**: Hidden until story completion, then revealed with context
- **Creator NFTs**: Auto-minted when stories complete (minimal metadata only)
- **Dynamic Images**: SVG generation with story context and user highlights

### 📱 Mobile & Farcaster Excellence
- **Haptic Feedback**: Premium tactile responses on every interaction
- **Mobile-First Design**: 44px touch targets, responsive breakpoints
- **Farcaster Mini-App**: Native integration with lifecycle management
- **Performance Optimized**: <2.5s LCP, <100ms FID, <0.1 CLS

### 🏢 Enterprise Architecture
- **Performance Monitoring**: Core Web Vitals tracking
- **Error Resilience**: Graceful degradation for all services
- **Scalable Caching**: Intelligent cache management
- **Type Safety**: Complete TypeScript coverage

---

## 🎮 How to Play

1. **Connect Wallet** - Link your Web3 wallet
2. **Earn Credits** - Contribute words to stories (1 word = 1 credit)
3. **Create Stories** - Use credits to generate AI-powered story templates
4. **Collect NFTs** - Each contribution mints a unique NFT
5. **Complete Stories** - Fill all slots to reveal NFTs and earn creator rewards

### Story Types
- **Mini Stories** (10 slots) - Quick, fun gameplay
- **Normal Stories** (20 slots) - Balanced storytelling
- **Epic Stories** (200 slots) - Massive collaborative narratives

### Economics
- **Contribute Word**: $0.00005 ETH → Mint NFT + 1 credit
- **Create Story**: $0.0001 ETH + 1 credit → AI-generated template
- **All fees** → Liquidity pool (100%)

---

## 🛠️ Development

### Build & Test
```bash
npm run compile          # Compile smart contracts
npm test                # Run contract tests
npm run build           # Production build
npm run ts-check        # TypeScript validation
```

### Deployment
```bash
# Deploy contracts
npm run deploy:baseSepolia    # Testnet
npm run deploy:base          # Mainnet

# Verify contracts
npm run verify
```

### Environment Setup
```env
# Required
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional (enables AI features)
OPENAI_API_KEY=sk-your_key_here

# After deployment
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
```

---

## 📊 Smart Contracts

### Architecture
- **GhostWriterNFT.sol** - ERC-721 with hidden/revealed states
- **StoryManager.sol** - Game logic, contributions, and rewards
- **LiquidityPool.sol** - Fee collection and management
- **PriceOracle.sol** - USD to ETH conversion with Chainlink

### Security Features
- ✅ OpenZeppelin contracts (ReentrancyGuard, Ownable)
- ✅ Access control (only StoryManager can mint/reveal)
- ✅ Input validation and duplicate prevention
- ✅ Gas optimized storage patterns
- ✅ Pull-over-push refund pattern (prevents gas griefing)
- ✅ Batch processing for large operations (prevents DoS)
- ✅ Price oracle circuit breaker (prevents manipulation)
- ✅ Off-chain leaderboard sorting (gas optimization)

**📋 Security Audit**: See [SECURITY_FIXES.md](./SECURITY_FIXES.md) for detailed security improvements.

### Deployment Status
- **Base Sepolia**: Ready for testnet deployment
- **Base Mainnet**: Production ready (audit recommended)

---

## 🎨 NFT System

### Contributor NFTs
- **Hidden State**: Shows position, word type, mystery theme
- **Revealed State**: Shows complete story with highlighted contribution
- **Dynamic Images**: SVG generation at `/api/nft/[tokenId]/image`

### Creator NFTs (Auto-minted)
- **Trigger**: Automatically minted when story completes
- **Metadata**: Creator info, story title, category, date created
- **Content**: NO story template or content included (minimal metadata)

---

## 📱 Mobile & Farcaster

### Mobile Optimization
- **Touch Targets**: 44px minimum (iOS standard)
- **Haptic Feedback**: Context-aware vibration patterns
- **Responsive Design**: 320px → 1280px+ breakpoints
- **Performance**: 95+ Lighthouse score

### Farcaster Integration
- **Mini-App Ready**: Complete manifest and lifecycle management
- **User Context**: Seamless integration with Farcaster user data
- **Share Features**: Native story sharing capabilities
- **Notifications**: Framework ready for future implementation

---

## 📚 Documentation

- **[Complete Setup Guide](./docs/COMPLETE_SETUP_GUIDE.md)** - Full deployment instructions
- **[Enterprise Optimization Report](./ENTERPRISE_OPTIMIZATION_REPORT.md)** - Performance & architecture details
- **[Build Optimization Report](./BUILD_OPTIMIZATION_REPORT.md)** - Development workflow

---

## 🧪 Testing

### Contract Tests
```bash
npm test                    # Full test suite
npm run test:gas           # Gas usage analysis
```

### Frontend Tests
```bash
npm run test:frontend      # React component tests
npm run test:frontend:coverage  # Coverage report
```

### Performance
- **Build Time**: 45 seconds (optimized)
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Mobile Score**: 95+ Lighthouse performance

---

## 🚀 Deployment

### Testnet (Base Sepolia)
1. Get testnet ETH from [Base faucet](https://www.base.org/faucet)
2. Configure `.env` with testnet settings
3. Run `npm run deploy:baseSepolia`
4. Update contract addresses in `.env`
5. Deploy frontend to Vercel

### Mainnet (Base)
1. Configure production environment variables
2. Run `npm run deploy:base`
3. Verify contracts with `npm run verify`
4. Deploy to production domain

### Vercel Deployment
1. Connect GitHub repository
2. Add all environment variables
3. Deploy automatically on push

---

## 🏆 Achievements

### Phase 1: MVP ✅ (Completed)
- [x] Smart contracts with dual NFT system
- [x] AI-powered story generation and moderation
- [x] Frontend with Base integration
- [x] Creator NFT auto-minting
- [x] Farcaster Mini App support
- [x] Comprehensive test suite
- [x] Achievement badges and leaderboards
- [x] Enterprise-grade optimization

### Phase 2: Launch 🚧 (Current)
- [x] AI integration with caching and fallbacks
- [x] Mobile-first design with haptic feedback
- [x] Performance monitoring and optimization
- [ ] Deploy to Base Sepolia testnet
- [ ] Beta testing with community
- [ ] Deploy to Base mainnet

### Phase 3: Enhancement 📅 (Next)
- [ ] IPFS metadata storage
- [ ] Advanced analytics dashboard
- [ ] Cross-chain deployment
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the Fair Source License (5 users) - see the [LICENSE](LICENSE) file for details.

**Free for up to 5 users.** Need more? Contact for commercial licensing.

---

## 👥 Team & Support

Built with ❤️ by the Ghost Writer team.

- **GitHub**: https://github.com/drdeeks
- **Email**: drdeeks@outlook.com

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
