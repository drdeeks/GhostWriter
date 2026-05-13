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

# Set story template signer (required for user story creation)
npx hardhat run scripts/set-signer.js --network base

# Run app
npm run dev
```

App runs at `http://localhost:3000`

---

## Environment Variables

### Required for Deployment

| Variable | Description | Example |
|----------|-------------|---------|
| `PRIVATE_KEY` | Deployer wallet private key | `0x...` |
| `NEXT_PUBLIC_CHAIN_ID` | Network: `8453` (Base) or `84532` (Sepolia) | `8453` |
| `NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID` | WalletConnect Cloud project ID | Get from [CDP Portal](https://portal.cdp.coinbase.com/) |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | OnchainKit API key | Get from [CDP Portal](https://portal.cdp.coinbase.com/) |

### Required for User Story Creation

| Variable | Description | Example |
|----------|-------------|---------|
| `STORY_TEMPLATE_SIGNER_PRIVATE_KEY` | Private key for EIP-712 signing | `0x...` |

**Setup:**
1. Generate a new private key (don't reuse your deployer key)
2. Add to `.env` as `STORY_TEMPLATE_SIGNER_PRIVATE_KEY`
3. Run `npx hardhat run scripts/set-signer.js --network base` to register the address on-chain

### Contract Addresses (Auto-set after deployment)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` | GhostWriterNFT contract |
| `NEXT_PUBLIC_STORY_MANAGER_ADDRESS` | StoryManager contract |
| `NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS` | LiquidityPool contract |
| `NEXT_PUBLIC_PRICE_ORACLE_ADDRESS` | PriceOracle contract |
| `NEXT_PUBLIC_TOKEN_ADDRESS` | GHOST token (optional) |

### Optional - AI Features

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | Enables AI story generation |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model to use |
| `OPENAI_TEMPERATURE` | `0.9` | Creativity (0.0-2.0) |
| `OPENAI_MAX_TOKENS` | `700` | Max response tokens |
| `OPENAI_TIMEOUT_MS` | `10000` | API timeout |
| `AI_STORY_SYSTEM_PROMPT_APPEND` | - | Custom prompt addition |

### Optional - Other

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | App URL for NFT metadata |
| `BASE_RPC_URL` | Public RPC | Custom Base mainnet RPC |
| `BASE_SEPOLIA_RPC_URL` | Public RPC | Custom Base Sepolia RPC |
| `NEXT_PUBLIC_FARCASTER_MINIAPP_ID` | `ghost-writer` | Farcaster integration |
| `BASESCAN_API_KEY` | - | For contract verification |

See [env.example](env.example) for the complete reference with detailed comments.

---

## Scripts

### Deployment Scripts

```bash
# Deploy all contracts
npm run deploy:base              # Base mainnet
npm run deploy:baseSepolia       # Base Sepolia testnet

# Deploy with GHOST token
npm run deploy:base -- --with-token

# Verify contracts on Basescan
npm run verify
```

### Admin Scripts

```bash
# Set story template signer (run after deployment)
# Uses PRIVATE_KEY or KEYSTORE env vars
npx hardhat run scripts/set-signer.js --network base

# Update signer address in script before running:
# Edit scripts/set-signer.js to change the target address
```

The deployment script automatically:
- Deploys all contracts (LiquidityPool, PriceOracle, GhostWriterNFT, StoryManager)
- Optionally deploys GhostWriterToken when `--with-token` is used
- Updates `.env` with deployed addresses
- Saves deployment info to `deployment.json`

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
- **Story Creation**: AI-generated or manual templates
- **Credit Airdrops**: Grant creation credits to users
- **Token Airdrops**: Distribute GHOST tokens
- **Pool Management**: Withdraw from liquidity pool
- **Story Finalization**: Process completed stories
- **Debug Info**: Chain ID verification, on-chain stats

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
├── scripts/                   # Deployment & admin scripts
│   ├── deploy.js              # Main deployment script
│   ├── set-signer.js          # Set story template signer
│   └── verify.js              # Contract verification
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
