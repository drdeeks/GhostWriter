# 🚀 Deployment Checklist - Security Updates

## Pre-Deployment Testing

### Local Testing
- [x] All contracts compile successfully
- [x] All existing tests pass (6/6)
- [ ] Add tests for new functions:
  - [ ] `withdrawRefund()` functionality
  - [ ] `processCompletionBatch()` with various batch sizes
  - [ ] `finalizeStory()` after batching
  - [ ] Price oracle circuit breaker
  - [ ] Refund accumulation scenarios

### Gas Profiling
- [ ] Profile gas costs for new functions
- [ ] Test epic story completion (200 slots)
- [ ] Verify batch size limits (50 slots max)
- [ ] Test leaderboard updates

---

## Testnet Deployment (Base Sepolia)

### 1. Environment Setup
- [ ] Update `.env` with testnet settings
```env
PRIVATE_KEY=your_testnet_private_key
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_BASE_URL=https://testnet.yourapp.com
OPENAI_API_KEY=sk-your_key_here
```

### 2. Get Testnet ETH
- [ ] Get Base Sepolia ETH from [faucet](https://www.base.org/faucet)
- [ ] Verify balance: `cast balance $YOUR_ADDRESS --rpc-url base-sepolia`

### 3. Deploy Contracts
```bash
# Deploy all contracts
npm run deploy:baseSepolia

# Expected output:
# ✓ PriceOracle deployed to: 0x...
# ✓ LiquidityPool deployed to: 0x...
# ✓ GhostWriterNFT deployed to: 0x...
# ✓ StoryManager deployed to: 0x...
```

- [ ] PriceOracle deployed: `0x________________`
- [ ] LiquidityPool deployed: `0x________________`
- [ ] GhostWriterNFT deployed: `0x________________`
- [ ] StoryManager deployed: `0x________________`

### 4. Verify Contracts
```bash
npm run verify
```

- [ ] All contracts verified on BaseScan
- [ ] Contract source code visible
- [ ] Read/Write functions accessible

### 5. Initialize Contracts
```bash
# Set StoryManager in NFT contract
cast send $NFT_ADDRESS "setStoryManager(address)" $STORY_MANAGER_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url base-sepolia

# Set StoryManager in LiquidityPool
cast send $POOL_ADDRESS "setStoryManager(address)" $STORY_MANAGER_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url base-sepolia

# Airdrop initial credits (optional)
cast send $STORY_MANAGER_ADDRESS "airdropCredits(address[],uint256[])" \
  "[$YOUR_ADDRESS]" "[10]" \
  --private-key $PRIVATE_KEY --rpc-url base-sepolia
```

- [ ] StoryManager set in NFT contract
- [ ] StoryManager set in LiquidityPool
- [ ] Initial credits airdropped (if needed)

---

## Frontend Integration

### 1. Update Environment Variables
```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
```

- [ ] All contract addresses updated
- [ ] Chain ID correct (84532 for testnet)
- [ ] RPC URL configured

### 2. Update Contract ABIs
```bash
# Copy ABIs from artifacts
cp artifacts/contracts/StoryManager.sol/StoryManager.json src/contracts/abis/
cp artifacts/contracts/GhostWriterNFT.sol/GhostWriterNFT.json src/contracts/abis/
cp artifacts/contracts/LiquidityPool.sol/LiquidityPool.json src/contracts/abis/
cp artifacts/contracts/PriceOracle.sol/PriceOracle.json src/contracts/abis/
```

- [ ] ABIs updated in frontend
- [ ] New functions added to ABI exports

### 3. Implement New Features
- [ ] Refund withdrawal UI component
- [ ] Story completion batch processing
- [ ] Leaderboard off-chain sorting
- [ ] Error handling for new functions

### 4. Build & Deploy Frontend
```bash
npm run build
npm run deploy # or vercel deploy
```

- [ ] Frontend builds successfully
- [ ] No TypeScript errors
- [ ] Deployed to testnet URL

---

## Testing on Testnet

### Basic Functionality
- [ ] Connect wallet to testnet
- [ ] Check initial credits
- [ ] Create a mini story (10 slots)
- [ ] Contribute words to story
- [ ] Complete story and verify NFT minting

### New Features Testing
- [ ] Overpay on contribution and verify refund appears
- [ ] Withdraw refund successfully
- [ ] Complete normal story (20 slots) with batching
- [ ] Complete epic story (200 slots) with batching
- [ ] Verify leaderboard updates correctly
- [ ] Test price oracle with different ETH prices

### Edge Cases
- [ ] Multiple refunds accumulating
- [ ] Batch processing with different sizes
- [ ] Story completion with single batch
- [ ] Story completion with multiple batches
- [ ] Leaderboard with 1000+ users
- [ ] Price oracle fallback activation

### Security Testing
- [ ] Try to mint NFT directly (should fail)
- [ ] Try to withdraw from pool as non-owner (should fail)
- [ ] Try to process completion for non-complete story (should fail)
- [ ] Try to finalize story before processing (should work)
- [ ] Verify gas limits on large operations

---

## Monitoring & Alerts

### Set Up Monitoring
- [ ] Block explorer alerts for contract interactions
- [ ] Gas price monitoring
- [ ] Oracle price deviation alerts
- [ ] Failed transaction monitoring

### Analytics
- [ ] Track refund withdrawal rate
- [ ] Monitor batch processing success rate
- [ ] Track average gas costs
- [ ] Monitor story completion times

---

## Documentation Updates

- [x] SECURITY_FIXES.md created
- [x] FRONTEND_MIGRATION.md created
- [x] SECURITY_QUICK_REF.md created
- [x] README.md updated
- [ ] API documentation updated
- [ ] User guide updated
- [ ] FAQ updated with new features

---

## Community Testing

### Beta Testing
- [ ] Invite 10-20 beta testers
- [ ] Provide testnet ETH
- [ ] Collect feedback on new features
- [ ] Monitor for bugs/issues
- [ ] Iterate based on feedback

### Bug Bounty (Optional)
- [ ] Set up bug bounty program
- [ ] Define reward tiers
- [ ] Announce to community
- [ ] Review submissions

---

## Mainnet Preparation

### Security Audit
- [ ] Get professional audit (OpenZeppelin, Trail of Bits, etc.)
- [ ] Address all audit findings
- [ ] Get final audit approval

### Final Checks
- [ ] All testnet tests passed
- [ ] No critical bugs found
- [ ] Community feedback incorporated
- [ ] Documentation complete
- [ ] Team trained on new features

### Mainnet Deployment
- [ ] Update `.env` for mainnet
```env
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_BASE_URL=https://yourapp.com
```

- [ ] Deploy contracts to Base mainnet
- [ ] Verify contracts on BaseScan
- [ ] Initialize contracts
- [ ] Deploy frontend to production
- [ ] Announce launch

---

## Post-Deployment

### Monitoring (First 24 Hours)
- [ ] Monitor all transactions
- [ ] Check gas costs
- [ ] Verify refund withdrawals
- [ ] Monitor story completions
- [ ] Check oracle price updates

### Week 1
- [ ] Daily monitoring
- [ ] User feedback collection
- [ ] Performance metrics
- [ ] Gas optimization opportunities

### Ongoing
- [ ] Weekly analytics review
- [ ] Monthly security review
- [ ] Quarterly audit consideration
- [ ] Feature enhancement planning

---

## Emergency Procedures

### If Critical Bug Found
1. [ ] Pause contract (if pause mechanism exists)
2. [ ] Notify users immediately
3. [ ] Assess impact and severity
4. [ ] Develop fix
5. [ ] Test fix thoroughly
6. [ ] Deploy fix or migrate to new contract
7. [ ] Post-mortem analysis

### Contact Information
- **Lead Developer**: drdeeks@outlook.com
- **Security Team**: [Add contact]
- **Community Manager**: [Add contact]

---

## Sign-Off

### Testnet Deployment
- [ ] Developer: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Security: _________________ Date: _______

### Mainnet Deployment
- [ ] Developer: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Security: _________________ Date: _______
- [ ] Project Lead: _________________ Date: _______

---

**Status**: 🟡 Ready for Testnet Deployment  
**Next Milestone**: Complete testnet testing  
**Target Mainnet**: After successful testnet + audit

---

**Questions?** See [SECURITY_FIXES.md](./SECURITY_FIXES.md) or contact drdeeks@outlook.com
