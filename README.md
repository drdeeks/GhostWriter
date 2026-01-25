# 👻 Ghost Writer

AI-powered collaborative storytelling NFT game on Base. Players contribute words to community stories, minting unique NFTs for each contribution.

---

## Quick Start

```bash
# Install
git clone https://github.com/drdeeks/GhostWriter.git && cd GhostWriter
npm install --legacy-peer-deps

# Configure
cp env.example .env
# Edit .env with your keys (see Environment Variables below)

# Deploy contracts
npm run deploy:base              # Mainnet
npm run deploy:baseSepolia       # Testnet

# Run app
npm run dev
```

App runs at `http://localhost:3000`

---

## Environment Variables

### Required

```env
PRIVATE_KEY=                              # Deployer wallet private key
NEXT_PUBLIC_CHAIN_ID=8453                 # 8453 (Base) or 84532 (Sepolia)
NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID=        # WalletConnect Cloud project ID
```

### Contract Addresses (auto-set after deployment)

```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_ADDRESS=0x...           # GHOST token (optional)
```

### Optional - AI Features

```env
OPENAI_API_KEY=sk-...                     # Enables AI story generation
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.9
```

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for the complete reference.

---

## Deployment

### Contract Deployment

```bash
# Standard deployment
npm run deploy:base

# With GHOST token
npm run deploy:base -- --with-token

# Verify on Basescan
npm run verify
```

The deployment script automatically:
- Deploys all contracts (LiquidityPool, PriceOracle, GhostWriterNFT, StoryManager)
- Optionally deploys GhostWriterToken when `--with-token` is used
- Updates `.env` with deployed addresses
- Saves deployment info to `deployment.json`

### Frontend Deployment

```bash
npm run build
vercel --prod
```

---

## Story Types

| Type | Slots | Access |
|------|-------|--------|
| Mini | 5-10 | Anyone |
| Normal | 10-15 | Anyone |
| Epic | 15-25 | Owner only |

---

## Admin Dashboard

Contract owners can access `/admin` for:
- Story creation with custom templates
- Airdrop creation credits
- GHOST token airdrops
- Liquidity pool management
- Story finalization controls
- Protocol settings

---

## Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run ts-check               # TypeScript validation

# Smart Contracts
npm run compile                # Compile Solidity
npm test                       # Contract tests
npm run test:gas               # Tests with gas report

# Deployment
npm run deploy:baseSepolia     # Deploy to testnet
npm run deploy:base            # Deploy to mainnet
npm run verify                 # Verify on Basescan
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/SETUP.md](docs/SETUP.md) | Local development & deployment |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment variables reference |
| [docs/AI.md](docs/AI.md) | AI configuration & tuning |
| [docs/NFT_MEDIA.md](docs/NFT_MEDIA.md) | NFT metadata & image customization |
| [docs/SECURITY.md](docs/SECURITY.md) | Security patterns & audit notes |
| [docs/ADMIN.md](docs/ADMIN.md) | Admin dashboard guide |
| [docs/MODERATION.md](docs/MODERATION.md) | Content moderation system |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Architecture

```
├── contracts/                 # Solidity smart contracts
│   ├── StoryManager.sol       # Core game logic
│   ├── GhostWriterNFT.sol     # ERC-721 NFTs
│   ├── GhostWriterToken.sol   # GHOST ERC-20 token
│   ├── LiquidityPool.sol      # Fee collection
│   └── PriceOracle.sol        # Chainlink pricing
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin dashboard
│   │   └── page.tsx           # Main app
│   ├── components/            # React components
│   ├── hooks/                 # Contract hooks
│   └── lib/                   # Utilities
├── scripts/                   # Deployment scripts
└── test/                      # Contract tests
```

---

## Security

- **ReentrancyGuard** on all state-changing functions
- **Pull-over-push** refund pattern
- **Batch processing** for large stories
- **Price oracle circuit breaker**
- **EIP-712 signatures** for story approval

---

## License

MIT License - see [LICENSE](LICENSE)

---

**Built with 💜 on Base 🔵**
