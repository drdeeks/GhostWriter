# Dynamic USD Pricing Implementation

## Overview
Implemented dynamic pricing system where fees are always **$0.05 for contributions** and **$0.10 for story creation**, regardless of ETH price fluctuations.

## Changes Made

### 1. New Contract: PriceOracle.sol
- Uses Chainlink ETH/USD price feeds (free to read on-chain)
- Converts USD cents to ETH wei dynamically
- Includes fallback price ($3000) if oracle fails
- Validates price freshness (1 hour max staleness)

**Chainlink Price Feeds (Free)**:
- Base Sepolia: `0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1`
- Base Mainnet: `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70`

### 2. Updated StoryManager.sol
- Removed hardcoded fees
- Added constants: `CONTRIBUTION_FEE_USD_CENTS = 5`, `CREATION_FEE_USD_CENTS = 10`
- Added `getContributionFee()` and `getCreationFee()` view functions
- Updated `createStory()` and `contributeWord()` to use dynamic fees
- Added refund logic for overpayment
- Constructor now requires `_priceOracle` address

### 3. Updated Deployment Script
- Deploys PriceOracle with correct Chainlink feed address
- Passes oracle address to StoryManager constructor
- Saves oracle address to deployment.json

### 4. Frontend Updates
- Created `useFees()` hook to fetch current fees from contract
- Updated `useStoryManager()` to use dynamic fees
- Added fee getter functions to STORY_MANAGER_ABI

## How It Works

```
User wants to contribute word
    ↓
Frontend calls useFees() hook
    ↓
Reads getContributionFee() from StoryManager
    ↓
StoryManager calls priceOracle.usdToEth(5) // 5 cents
    ↓
PriceOracle reads Chainlink ETH/USD price
    ↓
Calculates: (5 cents * 10^16) / ethPrice
    ↓
Returns exact ETH amount = $0.05
    ↓
User pays exact amount (with refund if overpaid)
```

## Pricing Examples

| ETH Price | Contribution Fee | Creation Fee |
|-----------|------------------|--------------|
| $2,000    | 0.000025 ETH     | 0.00005 ETH  |
| $3,000    | 0.0000167 ETH    | 0.0000333 ETH|
| $4,000    | 0.0000125 ETH    | 0.000025 ETH |
| $5,000    | 0.00001 ETH      | 0.00002 ETH  |

## Deployment Steps

1. **Compile contracts**:
   ```bash
   npm run compile
   ```

2. **Deploy to testnet**:
   ```bash
   npm run deploy:baseSepolia
   ```
   
   This will deploy:
   - LiquidityPool
   - PriceOracle (with Chainlink feed)
   - GhostWriterNFT
   - StoryManager (with oracle)

3. **Verify contracts**:
   ```bash
   npm run verify
   ```

4. **Test dynamic pricing**:
   ```bash
   # Check current fees
   cast call $STORY_MANAGER_ADDRESS "getContributionFee()" --rpc-url $BASE_SEPOLIA_RPC_URL
   cast call $STORY_MANAGER_ADDRESS "getCreationFee()" --rpc-url $BASE_SEPOLIA_RPC_URL
   ```

## Benefits

✅ **Always $0.05 and $0.10** - Users pay consistent USD amounts
✅ **No manual updates** - Prices adjust automatically with ETH price
✅ **Free oracle** - Chainlink price feeds are free to read
✅ **Fallback protection** - Uses $3000 fallback if oracle fails
✅ **Overpayment refunds** - Users get refunded if they send too much
✅ **Gas efficient** - Single oracle call per transaction

## Testing

```bash
# 1. Deploy to testnet
npm run deploy:baseSepolia

# 2. Check current ETH price from oracle
cast call $PRICE_ORACLE_ADDRESS "getLatestPrice()" --rpc-url $BASE_SEPOLIA_RPC_URL

# 3. Check contribution fee (should be ~$0.05 in ETH)
cast call $STORY_MANAGER_ADDRESS "getContributionFee()" --rpc-url $BASE_SEPOLIA_RPC_URL

# 4. Check creation fee (should be ~$0.10 in ETH)
cast call $STORY_MANAGER_ADDRESS "getCreationFee()" --rpc-url $BASE_SEPOLIA_RPC_URL

# 5. Test contribution with dynamic fee
# Frontend will automatically fetch and use correct amount
```

## Maintenance

### Update Fallback Price (if needed)
```bash
cast send $PRICE_ORACLE_ADDRESS "updateFallbackPrice(int256)" 350000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

### Update Price Feed Address (if Chainlink changes)
```bash
cast send $PRICE_ORACLE_ADDRESS "updatePriceFeed(address)" $NEW_FEED_ADDRESS \
  --private-key $PRIVATE_KEY \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

### Update Oracle in StoryManager (if needed)
```bash
cast send $STORY_MANAGER_ADDRESS "updatePriceOracle(address)" $NEW_ORACLE_ADDRESS \
  --private-key $PRIVATE_KEY \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

## Security Considerations

1. **Price Staleness**: Oracle rejects prices older than 1 hour
2. **Fallback Price**: Uses $3000 if oracle fails (conservative estimate)
3. **Positive Prices**: Validates all prices are > 0
4. **Refund Logic**: Returns excess ETH to prevent user loss
5. **Owner Controls**: Only owner can update oracle/fallback settings

## Cost Analysis

| Operation | Gas Cost | USD Cost @ $3000 ETH |
|-----------|----------|----------------------|
| Deploy PriceOracle | ~500k gas | ~$3 |
| Read Price | ~30k gas | ~$0.18 |
| Contribute Word | ~150k gas | ~$0.90 + $0.05 fee |
| Create Story | ~200k gas | ~$1.20 + $0.10 fee |

**Total deployment cost**: ~$5-10 (one-time)
**Per-transaction cost**: Negligible (oracle reads are cheap)

## Next Steps

1. ✅ Contracts compiled successfully
2. ⏳ Deploy to Base Sepolia testnet
3. ⏳ Test dynamic pricing with different ETH prices
4. ⏳ Deploy frontend to Vercel
5. ⏳ Monitor oracle performance
6. ⏳ Deploy to Base mainnet when ready
