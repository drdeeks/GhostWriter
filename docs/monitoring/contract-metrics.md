# Smart Contract Monitoring Metrics

## Core Metrics

### 1. Transaction Metrics
| Metric                     | Description                                  | Alert Threshold               | Collection Method          |
|----------------------------|----------------------------------------------|-------------------------------|-----------------------------|
| Daily Transaction Volume   | Total transactions per day                   | >2x or <0.5x 30-day average  | Tenderly API               |
| Failed Transactions        | Percentage of failed transactions            | >5% of total transactions     | Tenderly Alerts            |
| Gas Usage                  | Average gas used per transaction             | >1.5x 7-day average          | Tenderly Analytics         |
| High Value Transactions    | Transactions exceeding $10,000 USD equivalent| Any occurrence               | Tenderly Custom Alert      |
| Admin Function Calls       | Calls to admin/owner functions               | Any occurrence               | Tenderly Event Monitoring  |

### 2. Contract Health Metrics
| Metric                     | Description                                  | Alert Threshold               | Collection Method          |
|----------------------------|----------------------------------------------|-------------------------------|-----------------------------|
| Contract Balance           | Native token balance of contract             | <1 ETH (or equivalent)        | Tenderly + Custom Script   |
| Token Supply               | Total supply of minted tokens                | >1% change in 1 hour          | Tenderly Event Monitoring  |
| Unique Active Wallets      | Number of unique interacting wallets         | >50% drop from 24h average   | Tenderly Analytics         |
| Function Call Frequency    | Calls per function                           | >3x 24h average              | Tenderly Custom Dashboard  |

### 3. Security Metrics
| Metric                     | Description                                  | Alert Threshold               | Collection Method          |
|----------------------------|----------------------------------------------|-------------------------------|-----------------------------|
| Reentrancy Attempts        | Calls attempting reentrancy                  | Any occurrence               | Tenderly Simulation        |
| Front-Running Attempts     | Suspicious transaction ordering              | Any occurrence               | Tenderly Custom Alert      |
| Failed Ownership Transfers | Attempts to transfer ownership that fail     | Any occurrence               | Tenderly Event Monitoring  |
| Unusual Gas Patterns       | Transactions with unusual gas patterns       | Any occurrence               | Tenderly Gas Analytics     |
| Blacklisted Addresses      | Interactions from blacklisted addresses      | Any occurrence               | Tenderly Custom Alert      |

## Critical Event Monitoring

### 1. StoryManager.sol Events
```solidity
// Critical events to monitor
event StoryCreated(uint256 indexed storyId, address indexed creator);
event ContributionAdded(uint256 indexed storyId, address indexed contributor, uint256 contributionId);
event StoryCompleted(uint256 indexed storyId);
event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 storyId);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
event Paused(address account);
event Unpaused(address account);
```

### 2. GhostWriterNFT.sol Events
```solidity
// Critical events to monitor  
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
```

### 3. LiquidityPool.sol Events
```solidity
// Critical events to monitor
event Deposited(address indexed user, uint256 amount, uint256 shares);
event Withdrawn(address indexed user, uint256 amount, uint256 shares);
event EmergencyWithdrawal(address indexed user, uint256 amount);
```

## Dashboard Requirements

### 1. Real-Time Dashboard (Tenderly)
- **Transaction Flow**: Visualization of all contract interactions
- **Gas Usage Heatmap**: Gas consumption patterns by function
- **Event Stream**: Real-time feed of critical contract events
- **Alert Status**: Current active alerts with severity
- **Contract Balances**: Current token and native asset balances

### 2. Historical Dashboard (Datadog)
- **30-Day Transaction Volume**: Trends and anomalies
- **User Growth**: Unique wallets over time
- **Gas Price Correlation**: Impact of gas prices on activity
- **Function Usage**: Popular functions over time
- **Error Rates**: Failed transactions and reverts

### 3. Security Dashboard (Custom)
- **Attack Attempts**: Reentrancy, front-running, and other attack patterns
- **Admin Activity**: All admin/owner function calls
- **Blacklist Interactions**: Interactions from known malicious addresses
- **Anomaly Detection**: Machine learning-based anomaly detection

## Alerting Rules

### 1. Critical Alerts (P0)
- **Failed Transactions**: >10% of transactions failing in 5-minute window
- **High Value Transfer**: Any transfer >$50,000 USD equivalent
- **Ownership Change**: Any ownership transfer event
- **Contract Paused**: Any pause event detected
- **Reentrancy Attempt**: Any detected reentrancy pattern

### 2. Warning Alerts (P1)
- **Gas Price Spike**: Gas prices >300 gwei for >10 minutes
- **Transaction Volume Spike**: >3x normal volume in 1 hour
- **Failed Transactions**: >5% of transactions failing in 15-minute window
- **Contract Balance Drop**: >20% drop in contract balance in 1 hour
- **Admin Function Call**: Any admin function call detected

### 3. Informational Alerts (P2)
- **Daily Volume Report**: Daily transaction volume summary
- **Weekly Active Users**: Weekly active wallet report
- **Gas Usage Report**: Weekly gas usage summary
- **Contract Balance**: Daily balance report
- **New Story Activity**: Daily new story creation report