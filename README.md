# 👻 Ghost Writer

AI-powered collaborative storytelling NFT game on Base Chain. Players contribute words to community-created stories, minting unique NFTs for each contribution.


---

## Quick Start

```bash
# Install
git clone https://github.com/drdeeks/GhostWriter.git && cd GhostWriter
npm install --legacy-peer-deps

# Configure
cp env.example .env
# Edit .env with your PRIVATE_KEY and NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID

# Deploy contracts (testnet)
npm run deploy:baseSepolia

# Run app
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Deployment

### Contract Deployment

```bash
# Standard deployment (without GHOST token)
npm run deploy:baseSepolia

# Deploy WITH GHOST token included
npm run deploy:baseSepolia -- --with-token
# or use shorthand
npm run deploy:baseSepolia -- -t

# Mainnet (after security audit)
npm run deploy:base -- --with-token
```

The deployment script automatically:
- Deploys all contracts (LiquidityPool, PriceOracle, GhostWriterNFT, StoryManager)
- Optionally deploys GhostWriterToken (GHOST) when `--with-token` flag is used
- Sets up contract permissions and configurations
- Updates `.env` with deployed addresses
- Saves deployment info to `deployment.json`

### Post-Deployment (if token deployed separately)

If you deploy the GHOST token separately, configure it on existing contracts:

```bash
# Via Hardhat console or script
storyManager.setGhostToken(tokenAddress)
liquidityPool.setGhostToken(tokenAddress)
```

### Frontend Deployment

```bash
npm run build
vercel --prod
```

### Contract Verification

```bash
npm run verify
```

---

## NFT Assets & Customization

### NFT Image Generation

NFT images are dynamically generated as SVGs via `/api/nft/[tokenId]/image`. Each NFT displays:
- Story title and category
- The contributor's word (highlighted)
- Word position in the story
- Contributor address or Farcaster username

### Background Customization

NFT backgrounds can be customized per story category using local or remote images.

#### Local Backgrounds

1. Add images to `public/nft-backgrounds/`:
   ```
   public/nft-backgrounds/
   ├── adventure.png
   ├── fantasy.jpg
   ├── comedy.png
   └── default.png
   ```

2. Configure in `.env`:
   ```env
   NFT_BACKGROUND_BASE_URL_LOCAL=/nft-backgrounds
   NFT_BACKGROUND_CATEGORY_MAP='{"adventure":"adventure.png","fantasy":"fantasy.jpg","comedy":"comedy.png"}'
   NFT_BACKGROUND_DEFAULT=default.png
   ```

#### Remote Backgrounds (IPFS/CDN)

```env
NFT_BACKGROUND_BASE_URL_REMOTE=https://your-cdn.com/nft-backgrounds
NFT_BACKGROUND_CATEGORY_MAP='{"adventure":"adventure.png","scifi":"scifi.jpg"}'
```

#### Fallback Order

1. Local background (if configured and file exists)
2. Remote background (if configured)
3. Procedurally generated gradient (default)

### App Icons & Branding

Replace these files in `public/` for custom branding:
- `icon.png` - App icon (512x512 recommended)
- `favicon.ico` - Browser favicon
- `hero.png` - Landing page hero image
- `splash.png` - PWA splash screen

---

## Environment Variables

### Required

```env
PRIVATE_KEY=                              # Deployer wallet private key
NEXT_PUBLIC_CHAIN_ID=84532                # 84532 (Sepolia) or 8453 (Mainnet)
NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID=        # WalletConnect Cloud project ID
```

### Contract Addresses (set after deployment)

```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_ADDRESS=0x...           # GHOST token (if deployed)
```

### Optional - AI Features

```env
OPENAI_API_KEY=sk-...                     # Enables AI story generation
OPENAI_MODEL=gpt-4o-mini                  # Model selection
OPENAI_TEMPERATURE=0.9                    # Creativity level (0-1)
OPENAI_MAX_TOKENS=700                     # Max response length
```

### Optional - NFT Customization

```env
NFT_BACKGROUND_BASE_URL_LOCAL=/nft-backgrounds
NFT_BACKGROUND_BASE_URL_REMOTE=https://cdn.example.com/backgrounds
NFT_BACKGROUND_CATEGORY_MAP='{"adventure":"adventure.png"}'
NFT_BACKGROUND_DEFAULT=default.png
```

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for the complete list.

---

## Architecture

```
├── contracts/                 # Solidity smart contracts
│   ├── StoryManager.sol       # Core game logic, stories, contributions
│   ├── GhostWriterNFT.sol     # ERC-721 with hidden/revealed states
│   ├── GhostWriterToken.sol   # GHOST ERC-20 token
│   ├── LiquidityPool.sol      # Fee collection
│   └── PriceOracle.sol        # Chainlink USD/ETH pricing
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── generate-story/  # AI story generation
│   │   │   ├── moderate-word/   # Content moderation
│   │   │   └── nft/[tokenId]/   # NFT metadata & images
│   │   └── page.tsx           # Main app page
│   ├── components/            # React components
│   ├── hooks/                 # Contract interaction hooks
│   └── lib/                   # Utilities, ABIs, config
├── scripts/                   # Deployment scripts
├── test/                      # Contract tests
└── public/                    # Static assets
```

---

## Story Types

| Type | Word Count | Slots | Creation |
|------|-----------|-------|----------|
| Mini | ~50 words | 5-10 | Anyone |
| Normal | ~100 words | 10-15 | Anyone |
| Epic | ~150 words | 15-25 | Owner only |

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
| [docs/SETUP.md](docs/SETUP.md) | Local development setup |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment variables |
| [docs/AI.md](docs/AI.md) | AI configuration & tuning |
| [docs/NFT_MEDIA.md](docs/NFT_MEDIA.md) | NFT metadata & images |
| [docs/SECURITY.md](docs/SECURITY.md) | Security features |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Security

- **ReentrancyGuard** on all state-changing functions
- **Pull-over-push** refund pattern (prevents gas griefing)
- **Batch processing** for large stories (prevents DoS)
- **Price oracle circuit breaker** (20% deviation limit)
- **EIP-712 signatures** for story template approval

---

## License

MIT License - see [LICENSE](LICENSE)

---

**Built with 💜 by DrDeeks | Powered by Base 🔵 | Secured by OpenZeppelin 🛡️**
