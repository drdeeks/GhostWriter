# Monitoring & Alerting Testing Guide

## Comprehensive Testing Strategy

This guide provides procedures for testing the GhostWriter monitoring and alerting infrastructure to ensure all components function correctly and alerts are triggered as expected.

### Prerequisites
- Access to all monitoring systems (Sentry, Tenderly, Datadog, UptimeRobot)
- Test environment with identical configuration to production
- Test accounts with appropriate permissions
- Synthetic transaction generator

## 1. Sentry Frontend Testing

### Error Tracking Tests

#### Test 1: Unhandled JavaScript Errors
```javascript
// In your browser console:
setTimeout(() => {
  throw new Error('Test unhandled error for Sentry monitoring');
}, 1000);
```
**Expected Result**:
- Error appears in Sentry within 30 seconds
- Error includes stack trace and context
- Alert triggered if error rate exceeds threshold

#### Test 2: Handled Errors with Context
```javascript
import { captureError } from '@/lib/sentry';

try {
  // Simulate an error
  throw new Error('Test handled error');
} catch (error) {
  captureError(error, {
    userId: 'test-user-123',
    feature: 'story-creation',
    additionalContext: 'Testing error capture'
  });
}
```
**Expected Result**:
- Error appears in Sentry with custom context
- User information included in error details

#### Test 3: Performance Monitoring
```javascript
import { captureTransaction } from '@/lib/sentry';

async function testPerformance() {
  const transaction = captureTransaction('test_performance', 'task', {
    feature: 'performance-testing'
  });
  
  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  transaction.finish();
}

testPerformance();
```
**Expected Result**:
- Performance transaction recorded in Sentry
- Duration approximately 1500ms
- Custom tags included

### Test 4: User Feedback
```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.showReportDialog({
  eventId: Sentry.captureMessage('Test feedback'),
  title: 'How was your experience?',
  subtitle: 'We value your feedback',
  user: {
    email: 'test@example.com',
    name: 'Test User'
  }
});
```
**Expected Result**:
- Feedback dialog appears
- Feedback recorded in Sentry

## 2. Tenderly Smart Contract Testing

### Contract Event Tests

#### Test 1: Synthetic Transaction Generation
```javascript
// scripts/generate-test-transactions.js
const { ethers } = require('ethers');

async function generateTestTransactions() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Test 1: Normal transaction
  const tx1 = await wallet.sendTransaction({
    to: '0x000000000000000000000000000000000000dEaD',
    value: ethers.parseEther('0.01')
  });
  console.log('Normal tx:', tx1.hash);
  
  // Test 2: High gas transaction (should trigger alert)
  const tx2 = await wallet.sendTransaction({
    to: '0x000000000000000000000000000000000000dEaD',
    value: ethers.parseEther('0.01'),
    gasLimit: 6000000 // High gas
  });
  console.log('High gas tx:', tx2.hash);
  
  // Test 3: Failed transaction (should trigger alert)
  try {
    const tx3 = await wallet.sendTransaction({
      to: '0x000000000000000000000000000000000000dEaD',
      value: ethers.parseEther('1000') // More than balance
    });
    console.log('Failed tx:', tx3.hash);
  } catch (error) {
    console.log('Failed tx simulated:', error.message);
  }
}

generateTestTransactions();
```
**Expected Result**:
- All transactions appear in Tenderly
- High gas transaction triggers alert
- Failed transaction triggers alert

#### Test 2: Contract Event Simulation
```javascript
// Using Hardhat or Foundry to simulate contract events
// Example Hardhat test
describe('Tenderly Alert Testing', function () {
  it('Should trigger StoryCreated alert', async function () {
    const StoryManager = await ethers.getContractFactory('StoryManager');
    const storyManager = await StoryManager.deploy();
    
    // This should trigger StoryCreated alert
    await storyManager.createStory('Test Story', 'Test Content', 'ipfs://hash');
  });
  
  it('Should trigger high value transfer alert', async function () {
    const Token = await ethers.getContractFactory('GhostWriterToken');
    const token = await Token.deploy();
    
    // Mint large amount to trigger high value alert
    await token.mint(await token.getAddress(), ethers.parseEther('10000'));
  });
});
```
**Expected Result**:
- Contract events appear in Tenderly
- Critical events trigger appropriate alerts

## 3. Alert Rule Validation

### Sentry Alert Tests

| Alert Type | Test Procedure | Expected Result |
|------------|----------------|-----------------|
| JavaScript Errors | Generate 11 errors in 5 minutes | P0 alert triggered |
| API Failures | Simulate 6 failed API calls in 5 minutes | P1 alert triggered |
| Performance Degradation | Simulate 6% of users with >5s load times | P0 alert triggered |
| Authentication Failures | Simulate 11 failed logins in 1 minute | P0 alert triggered |

### Tenderly Alert Tests

| Alert Type | Test Procedure | Expected Result |
|------------|----------------|-----------------|
| Failed Transactions | Generate 1 failed transaction | P0 alert triggered |
| High Gas Usage | Generate transaction with >5M gas | P0 alert triggered |
| Large Value Transfers | Generate transfer >$10,000 equivalent | P0 alert triggered |
| Admin Function Calls | Call admin function | P0 alert triggered |
| Contract Paused | Call pause() function | P0 alert triggered |
| Story Created | Create new story | P1 alert triggered |

## 4. End-to-End Testing

### Test 1: Complete User Journey
1. Connect wallet
2. Create story
3. Add contribution
4. Complete story
5. Mint NFT

**Expected Monitoring Results**:
- All contract events captured in Tenderly
- Performance metrics recorded in Sentry
- No errors in Sentry
- All transactions successful in Tenderly

### Test 2: Failure Scenario
1. Connect wallet
2. Attempt to create story with invalid parameters
3. Simulate failed transaction
4. Generate frontend error

**Expected Monitoring Results**:
- Failed transaction captured in Tenderly (P0 alert)
- Frontend error captured in Sentry (P0 alert)
- Performance impact recorded

## 5. Notification Channel Testing

### Email Notifications
1. Generate test alert
2. Verify email received
3. Check email content and formatting
4. Verify links work correctly

### Slack Notifications
1. Generate test alert
2. Verify Slack message appears in #alerts channel
3. Check message formatting and severity indicators
4. Verify links to monitoring systems

### PagerDuty Notifications
1. Generate critical (P0) alert
2. Verify PagerDuty incident created
3. Check incident details and severity
4. Verify on-call team notified

## 6. Performance Testing

### Load Test Procedure
```bash
# Using k6 for load testing
k6 run --vus 100 --duration 5m scripts/load-test.js
```

**Expected Monitoring Results**:
- Performance degradation detected in Sentry
- Increased transaction volume detected in Tenderly
- Infrastructure metrics in Datadog show increased load
- Appropriate alerts triggered based on thresholds

## 7. Maintenance & Regression Testing

### Monthly Tests
1. **Alert Threshold Review**:
   - Verify alert thresholds are still appropriate
   - Adjust based on current traffic patterns

2. **Notification Channel Verification**:
   - Test all notification channels
   - Update contact information as needed

3. **Runbook Validation**:
   - Test runbook procedures for each alert type
   - Update documentation as needed

4. **Escalation Path Testing**:
   - Test escalation procedures for critical alerts
   - Verify on-call rotation is up to date

### Quarterly Tests
1. **Disaster Recovery**:
   - Test monitoring system failover
   - Verify backup monitoring systems

2. **Comprehensive Load Test**:
   - Simulate 2x normal traffic
   - Verify all monitoring systems handle load

3. **False Positive Analysis**:
   - Review alerts from previous quarter
   - Adjust thresholds to reduce false positives

## 8. Test Automation

### CI/CD Pipeline Integration
```yaml
# .github/workflows/monitoring-tests.yml
name: Monitoring Tests

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
  workflow_dispatch:

env:
  SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
  TENDERLY_ACCESS_KEY: ${{ secrets.TENDERLY_ACCESS_KEY }}
  RPC_URL: ${{ secrets.RPC_URL }}
  PRIVATE_KEY: ${{ secrets.TEST_PRIVATE_KEY }}

jobs:
  sentry-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npm run test:sentry

  tenderly-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npm run test:tenderly

  alert-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npm run test:alerts
```