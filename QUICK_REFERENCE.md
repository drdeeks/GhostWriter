# ⚡ Quick Reference

## Version Info
- **Version**: 2.0.0
- **Status**: Ready for Testnet
- **Security**: 40 bugs fixed
- **Tests**: 9/9 passing (100%)

## Quick Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start dev server
npm run compile         # Compile contracts

# Testing
npm test                # Contract tests (6/6)
npm run test:frontend   # Frontend tests (3/3)
npm run ts-check        # TypeScript check

# Deployment
npm run deploy:baseSepolia  # Deploy to testnet
npm run deploy:base         # Deploy to mainnet
vercel --prod              # Deploy frontend

# Build
npm run build           # Production build
```

## Documentation

| Guide | Purpose |
|-------|---------|
| [User Guide](docs/USER_GUIDE.md) | How to play |
| [Deployment](docs/DEPLOYMENT.md) | Setup & deploy |
| [Security](docs/SECURITY.md) | Security features |
| [Architecture](docs/ARCHITECTURE.md) | Technical details |
| [Changelog](CHANGELOG.md) | Version history |

## Key Features

- ✅ AI story generation & moderation
- ✅ Dual NFT system (contributor + creator)
- ✅ Pull-over-push refunds
- ✅ Batch processing (prevents DoS)
- ✅ Performance monitoring
- ✅ Mobile-first design
- ✅ Farcaster integration

## Economics

- **Contribute**: $0.00005 ETH → 1 NFT + 1 credit
- **Create**: $0.0001 ETH + 1 credit → AI story
- **Fees**: 100% to liquidity pool

## Story Types

- **Mini**: 10 slots
- **Normal**: 20 slots
- **Epic**: 200 slots (admin only)

## Contract Addresses

Update `.env` after deployment:
```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
```

## Support

- **GitHub**: Issues & PRs
- **Email**: drdeeks@outlook.com
- **Docs**: [docs/README.md](docs/README.md)
