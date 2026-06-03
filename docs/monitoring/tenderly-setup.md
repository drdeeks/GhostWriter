# Tenderly Alerts & Monitoring Setup

## Enterprise-Grade Smart Contract Monitoring

### Prerequisites
- Tenderly account with project created
- Node.js 18+
- Contract addresses deployed and verified
- Environment variables configured

### Installation
```bash
npm install axios
```

### Configuration
1. **Environment Variables** (`.env`):
```
TENDERLY_PROJECT=your_project_name
TENDERLY_USERNAME=your_username
TENDERLY_ACCESS_KEY=your_access_key
NEXT_PUBLIC_CHAIN_ID=8453 # or 84532 for testnet

# Contract addresses
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=0x...

# Notification channels
ALERT_EMAIL=alerts@ghostwriter.app
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
PAGERDUTY_INTEGRATION_KEY=your_pagerduty_key
```

2. **Alert Configuration** (`scripts/setup-tenderly.js`):
- Comprehensive event monitoring for all contracts
- Transaction-level alerts for critical conditions
- Severity-based alerting (critical, high, medium)
- Multiple notification channels (email, Slack, PagerDuty)

### Key Features

#### Contract Event Monitoring
- **GhostWriterNFT**: Transfer, Mint, Burn, Approval, ApprovalForAll
- **StoryManager**: StoryCreated, ContributionAdded, StoryCompleted, OwnershipTransferred, Paused, Unpaused
- **LiquidityPool**: Deposited, Withdrawn, EmergencyWithdraw, RewardPaid, Staked, Unstaked
- **GhostWriterToken**: Transfer, Approval, Mint, Burn

#### Transaction-Level Alerts
- Failed transactions (status == false)
- High gas usage (>5M gas)
- High value transfers (>$10,000 USD equivalent)
- Admin function calls
- Reentrancy attempts
- Front-running attempts

#### Severity Levels
| Severity | Events | Response Time |
|----------|--------|---------------|
| Critical | Ownership changes, contract pauses, emergency withdrawals | Immediate (24/7) |
| High | Transfers, mints, deposits, withdrawals | Business hours |
| Medium | Approvals, staking events | Next business day |

### Alert Configuration

#### Critical Alerts (P0)
```javascript
{
  name: 'OwnershipTransferred',
  severity: 'critical',
  description: 'Contract ownership transferred',
  notification_channels: ['email', 'slack', 'pagerduty']
}
```

#### High Severity Alerts (P1)
```javascript
{
  name: 'StoryCreated',
  severity: 'high',
  description: 'New story created',
  notification_channels: ['email', 'slack']
}
```

#### Medium Severity Alerts (P2)
```javascript
{
  name: 'Approval',
  severity: 'medium',
  description: 'Token approval',
  notification_channels: ['email']
}
```

### Setup & Deployment

1. **Run setup script**:
```bash
npm run setup:tenderly
```

2. **Verify alerts**:
```bash
# Check Tenderly API for alert status
curl -H "X-Access-Key: $TENDERLY_ACCESS_KEY" \
  "https://api.tenderly.co/api/v1/account/$TENDERLY_USERNAME/project/$TENDERLY_PROJECT/alerts"
```

3. **Automate in CI/CD**:
```yaml
# .github/workflows/tenderly-alerts.yml
name: Tenderly Alerts Setup

on:
  deployment:
  workflow_dispatch:

env:
  TENDERLY_PROJECT: ${{ secrets.TENDERLY_PROJECT }}
  TENDERLY_USERNAME: ${{ secrets.TENDERLY_USERNAME }}
  TENDERLY_ACCESS_KEY: ${{ secrets.TENDERLY_ACCESS_KEY }}

jobs:
  setup-alerts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install axios
      - run: node scripts/setup-tenderly.js
```

### Best Practices

1. **Alert Tuning**:
   - Start with broad alerts and narrow down based on false positives
   - Adjust thresholds based on historical data
   - Implement seasonal adjustments for traffic patterns

2. **Notification Management**:
   - Use different channels for different severities
   - Implement quiet hours for non-critical alerts
   - Provide clear remediation instructions in notifications

3. **Context Enrichment**:
   - Include transaction hashes in alerts
   - Provide links to Tenderly transaction traces
   - Include affected contract addresses

4. **Testing**:
   - Regularly test alerting pipeline with synthetic transactions
   - Verify notification delivery to all channels
   - Test escalation procedures quarterly

5. **Documentation**:
   - Maintain runbooks for each alert type
   - Document escalation paths
   - Keep alert configuration in version control

### Monitoring Dashboard
Create a Tenderly dashboard with these recommended widgets:

1. **Transaction Volume** (Last 24h)
2. **Failed Transactions**
3. **Gas Usage by Contract**
4. **Critical Events** (P0 alerts)
5. **High Severity Events** (P1 alerts)
6. **Contract Interactions**
7. **Active Users**
8. **Token Flows**

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Alerts not triggering | Verify contract addresses and event names |
| API rate limits | Implement retry logic with exponential backoff |
| Missing notifications | Check notification channel configuration |
| False positives | Adjust alert conditions and thresholds |
| Configuration drift | Store alert config in version control and audit regularly |