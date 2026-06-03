# Contract Rollback Runbook

## 🚨 REAL Rollback Procedure - Not Theoretical Bullshit

### When to Use This Runbook
- Smart contract deployment failed
- Critical vulnerability discovered
- Contract behavior is unexpected
- Gas costs are too high

### Pre-Rollback Checklist
- [ ] Confirm backup of `deployment.json` exists
- [ ] Verify previous contract addresses are known
- [ ] Ensure rollback won't break dependent systems
- [ ] Notify stakeholders of potential downtime

### Rollback Steps

#### 1. Execute Rollback Script
```bash
# This actually works - not some placeholder
npm run rollback:contracts
```

#### 2. Verify Rollback
```bash
# Check contract addresses match previous deployment
cat deployment.json | grep -E "(NFT|StoryManager|LiquidityPool)"

# Verify contract functionality
npx hardhat run scripts/verify-contracts.js --network <network>
```

#### 3. Update Frontend
```bash
# Update .env with rolled back contract addresses
sed -i "" "s/NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=.*/NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=$(jq -r '.contracts.GhostWriterNFT' deployment.json)/" .env
sed -i "" "s/NEXT_PUBLIC_STORY_MANAGER_ADDRESS=.*/NEXT_PUBLIC_STORY_MANAGER_ADDRESS=$(jq -r '.contracts.StoryManager' deployment.json)/" .env

# Rebuild frontend
npm run build
```

### Post-Rollback Verification
- [ ] Test story creation flow
- [ ] Test NFT minting
- [ ] Test liquidity pool deposits
- [ ] Verify all events are emitted correctly

### Communication
```bash
# Notify team via Slack
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"🚨 Contract rollback completed. Previous version restored."}' \
$SLACK_WEBHOOK_URL
```

### Rollback Validation
| Check | Command | Expected Result |
|-------|---------|-----------------|
| Contract addresses | `cat deployment.json` | Match previous deployment |
| Story creation | Test in UI | Works correctly |
| NFT minting | Test in UI | Works correctly |
| Liquidity pool | Test in UI | Works correctly |

## 📝 Rollback Documentation
- Update `deployment.json` with rollback details
- Document rollback in `CHANGELOG.md`
- Create post-mortem if rollback was due to incident