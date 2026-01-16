# 🚀 Quick Deploy Guide

## 5-Step Deploy

### 1. Install
```bash
npm install
```

### 2. Configure
```bash
cp env.example .env
# Edit .env with your keys
```

### 3. Deploy Contracts
```bash
npm run deploy:baseSepolia
```

### 4. Update .env
```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
```

### 5. Deploy Frontend
```bash
npm run build
vercel --prod
```

## Verify

```bash
npm test                # 6/6 passing
npm run test:frontend   # 3/3 passing
npm run ts-check        # 0 errors
```

## Full Guide

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.
