# Deployment Procedures

## Pre-Deployment Checklist

### 1. Planning & Coordination
- [ ] Deployment window approved by stakeholders
- [ ] Communication plan finalized (internal + external)
- [ ] Rollback plan documented and tested
- [ ] Incident response team identified and available
- [ ] Status page updated with scheduled maintenance window

### 2. Code & Testing
- [ ] Code freeze in effect (no new PRs merged)
- [ ] All feature PRs merged and code reviewed
- [ ] No open critical or high-priority bugs
- [ ] Unit tests passing (`npm run test`)
- [ ] Integration tests passing (`npm run test:integration`)
- [ ] End-to-end tests passing (`npm run test:e2e`)
- [ ] Frontend tests passing (`npm run test:frontend`)
- [ ] Gas reports generated and reviewed (`npm run test:gas`)
- [ ] Security scan completed (Slither, MythX)
- [ ] Testnet deployment verified

### 3. Monitoring & Observability
- [ ] Tenderly alerts configured and tested
- [ ] Sentry project created with appropriate alert thresholds
- [ ] Datadog dashboards ready and verified
- [ ] UptimeRobot monitors set up and tested
- [ ] Status page updated with monitoring links
- [ ] On-call schedule confirmed for post-deployment

### 4. Environment & Infrastructure
- [ ] `.env` file configured with all required variables
- [ ] All secrets available and verified (private keys, API keys)
- [ ] Network access verified (RPC endpoints, IP whitelisting)
- [ ] Backup completed (database, contract state, frontend assets)
- [ ] Rollback artifacts prepared (previous contract ABIs, frontend builds)
- [ ] Infrastructure scaled for expected load
- [ ] Third-party services verified (oracles, APIs, wallets)

### 5. Compliance & Security
- [ ] Security review completed for all changes
- [ ] Smart contract audit report reviewed (if applicable)
- [ ] GDPR/legal compliance verified
- [ ] Emergency pause mechanism tested
- [ ] Admin key holders identified and available
- [ ] Multi-sig process verified for contract upgrades

## Deployment Procedures

### 1. Smart Contract Deployment
**Testnet Deployment (Base Sepolia):**
```bash
# 1. Deploy contracts
echo "Deploying to Base Sepolia testnet..."
npm run deploy:baseSepolia

# 2. Verify deployment
echo "Verifying testnet deployment..."
npx hardhat verify --network baseSepolia DEPLOYED_CONTRACT_ADDRESS

# 3. Register story template signer
echo "Registering story template signer..."
npx hardhat run scripts/set-signer.js --network baseSepolia

# 4. Run post-deployment tests
echo "Running post-deployment tests..."
npx hardhat test --network baseSepolia
```

**Mainnet Deployment (Base):**
```bash
# 1. Multi-sig approval for deployment
#    - Create deployment proposal in Gnosis Safe
#    - Get required approvals (2/3 or 3/5 depending on config)

# 2. Execute deployment
echo "Deploying to Base mainnet..."
npm run deploy:base

# 3. Verify deployment
echo "Verifying mainnet deployment..."
npx hardhat verify --network base DEPLOYED_CONTRACT_ADDRESS

# 4. Register story template signer
echo "Registering story template signer..."
npx hardhat run scripts/set-signer.js --network base

# 5. Update environment files
echo "Updating .env files with new contract addresses..."
#    - Update .env in frontend
#    - Update .env in backend services

# 6. Verify contract functionality
echo "Running mainnet verification tests..."
npx hardhat test --network base
```

### 2. Frontend Deployment
**Vercel Deployment (Production):**
```bash
# 1. Build for production
echo "Building frontend for production..."
npm run build

# 2. Deploy to Vercel
echo "Deploying to Vercel production..."
vercel --prod --confirm

# 3. Verify deployment
echo "Verifying frontend deployment..."
#    - Check status.ghostwriter.xyz
#    - Test critical user flows
#    - Verify wallet integration
```

**Emergency Hotfix Deployment:**
```bash
# 1. Create hotfix branch
git checkout -b hotfix/[issue-id]

# 2. Implement and test fix
npm run test:frontend

# 3. Deploy to staging
vercel --target staging

# 4. Verify staging
#    - Test hotfix functionality
#    - Verify no regressions

# 5. Deploy to production
vercel --prod --confirm
```

### 3. Monitoring Activation
```bash
# 1. Verify all monitoring services
echo "Verifying monitoring services..."

# Tenderly alerts
curl -X GET "https://api.tenderly.co/api/v1/account/{account}/project/{project}/alerts" \
  -H "X-Access-Key: $TENDERLY_ACCESS_KEY"

# Sentry error tracking
curl -X GET "https://sentry.io/api/0/projects/{org}/{project}/stats/" \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN"

# Datadog dashboards
curl -X GET "https://api.datadoghq.com/api/v1/dashboard" \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY"

# UptimeRobot monitors
curl -X POST "https://api.uptimerobot.com/v2/getMonitors" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=$UPTIMEROBOT_API_KEY&format=json"

# 2. Enable alerts
echo "Enabling monitoring alerts..."
#    - Enable Tenderly alerts
#    - Set Sentry alert thresholds
#    - Activate Datadog monitors
#    - Enable UptimeRobot notifications
```

## Post-Deployment Verification

### Smart Contracts
- [ ] Verify contract addresses
- [ ] Check contract bytecode
- [ ] Test critical functions
- [ ] Verify events are emitted
- [ ] Check contract balances

### Frontend
- [ ] Verify all pages load
- [ ] Test user flows
- [ ] Check API connectivity
- [ ] Verify wallet integration
- [ ] Test responsive design

### Monitoring
- [ ] Verify Tenderly is receiving data
- [ ] Check Sentry for errors
- [ ] Confirm Datadog metrics
- [ ] Verify UptimeRobot status

## Rollback & Recovery Procedures

### 1. Smart Contract Rollback
**Emergency Pause Procedure:**
```bash
# 1. Pause contracts (if pause mechanism exists)
npx hardhat run scripts/emergency-pause.js --network base

# 2. Verify pause status
npx hardhat run scripts/verify-pause.js --network base

# 3. Communicate pause to users
#    - Update status page
#    - Post in Discord/Telegram
#    - Display frontend banner
```

**Contract Rollback Procedure:**
```bash
# 1. Prepare rollback artifacts
#    - Previous contract ABIs
#    - Previous contract addresses
#    - Rollback scripts

# 2. Multi-sig rollback approval
#    - Create rollback proposal in Gnosis Safe
#    - Get required approvals (2/3 or 3/5)

# 3. Execute rollback
echo "Rolling back to previous contract version..."
npm run rollback:contracts -- --network base --version v1.2.0

# 4. Verify rollback
npx hardhat verify --network base ROLLED_BACK_CONTRACT_ADDRESS

# 5. Update frontend configuration
echo "Updating frontend with rolled back contract addresses..."
#    - Update .env files
#    - Update contract ABIs
#    - Clear cached data
```

### 2. Frontend Rollback
**Vercel Rollback:**
```bash
# 1. Identify previous stable deployment
vercel list

# 2. Execute rollback
vercel rollback <deployment-id> --confirm

# 3. Verify rollback
#    - Test critical user flows
#    - Verify wallet integration
#    - Check error rates
```

**Emergency Frontend Hotfix:**
```bash
# 1. Identify issue in current deployment
#    - Check Sentry errors
#    - Review user reports

# 2. Implement hotfix
#    - Create hotfix branch
#    - Implement minimal fix
#    - Test thoroughly

# 3. Deploy hotfix
vercel --prod --confirm
```

### 3. Database Rollback
```bash
# 1. Identify backup to restore from
aws s3 ls s3://ghostwriter-backups/database/

# 2. Restore database from backup
aws s3 cp s3://ghostwriter-backups/database/prod-backup-2026-05-31.sql ./ 
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f prod-backup-2026-05-31.sql

# 3. Verify data integrity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM stories;"
```

### 4. Monitoring During Rollback
```bash
# 1. Mute non-critical alerts
echo "Muting non-critical alerts during rollback..."
#    - Use Tenderly API to mute alerts
#    - Set Sentry to maintenance mode
#    - Pause Datadog monitors

# 2. Monitor rollback progress
#    - Watch error rates in Sentry
#    - Monitor contract events in Tenderly
#    - Check system metrics in Datadog

# 3. Re-enable alerts post-rollback
echo "Re-enabling alerts after rollback..."
#    - Reactivate Tenderly alerts
#    - Restore Sentry alert thresholds
#    - Enable Datadog monitors
```