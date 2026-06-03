# Ghost Writer Deployment Checklist

## 🔹 Pre-Deployment Phase

### 1.1 Enforcement Rules

#### **Rule 1: Deployment Authorization**
- **Rule**: Only authorized deployment keys can execute deployments
- **Enforcement**: Use GitHub Actions environment protection with required reviewers
- **Verification**: Confirm deployment keys are restricted to CI/CD pipeline only

#### **Rule 2: Code Freeze Enforcement**
- **Rule**: No code changes 24 hours before deployment (except critical security fixes)
- **Enforcement**: GitHub branch protection rules on `main` branch
- **Verification**: Check GitHub protection rules are enabled

#### **Rule 3: Environment Validation**
- **Rule**: All environment variables must be validated before deployment
- **Enforcement**: Automated validation script (`scripts/validate-env.js`)
- **Verification**: Run `npm run validate:env` and confirm zero errors

---

### 1.2 Safety Rules

#### **Rule 4: Backup Requirements**
- **Rule**: All production data must be backed up before deployment
- **Enforcement**: Automated backup script (`scripts/backup-production.sh`)
- **Verification**: Confirm backup completion and integrity
- [ ] Database backup created and verified
- [ ] Contract state backup (`deployment.json`) saved
- [ ] Frontend build artifacts archived

#### **Rule 5: Dependency Integrity**
- **Rule**: All dependencies must be pinned and verified
- **Enforcement**: `npm ci` (not `npm install`) in CI/CD pipeline
- **Verification**: Run `npm run check:dependencies`
- [ ] `package-lock.json` matches `node_modules`
- [ ] No vulnerable dependencies (`npm audit --production`)
- [ ] All dependencies pinned to exact versions (no `^` or `~`)

---

### 1.3 Verification Rules

#### **Rule 6: Test Coverage Requirements**
- **Rule**: All tests must pass with 100% coverage of critical paths
- **Enforcement**: CI pipeline fails if tests don't pass
- **Verification**: Run `npm run test:all`
- [ ] Contract tests: 100% pass rate (`npm test`)
- [ ] Frontend tests: 100% pass rate (`npm run test:frontend`)
- [ ] TypeScript: Zero errors (`npm run ts-check`)
- [ ] Linting: Zero errors (`npm run lint`)

#### **Rule 7: Security Validation**
- **Rule**: No security vulnerabilities allowed in production
- **Enforcement**: Automated security scanning in CI pipeline
- **Verification**: Run security checks
- [ ] Static analysis: Zero critical vulnerabilities (Slither/MythX)
- [ ] Gas report: Review and approve gas costs (`REPORT_GAS=true npm test`)
- [ ] Contract size: All contracts under 24KB limit
- [ ] Dependency audit: No high/critical vulnerabilities (`npm audit --production`)

---

### 1.4 Rollback Rules

#### **Rule 8: Rollback Preparedness**
- **Rule**: Rollback must be possible within 15 minutes of any failure
- **Enforcement**: Automated rollback scripts must be tested before deployment
- **Verification**: Test rollback procedures in staging

#### **Smart Contract Rollback**
- **Rule**: Previous contract state must be preserved
- **Enforcement**: `deployment.json` backup required
- **Verification**:
  - [ ] Pre-deployment contract addresses saved
  - [ ] ABI files backed up
  - [ ] Rollback script tested (`scripts/rollback-contracts.js`)

#### **Frontend Rollback**
- **Rule**: Previous frontend version must be immediately restorable
- **Enforcement**: Git tagging required
- **Verification**:
  - [ ] Current production commit tagged (`git tag pre-deploy-<date>`)
  - [ ] Vercel rollback procedure verified

#### **Database Rollback**
- **Rule**: Database must be restorable to pre-deployment state
- **Enforcement**: Backup verification required
- **Verification**:
  - [ ] Backup restoration process confirmed
  - [ ] Data integrity verification script tested

---

### 1.5 Documentation Rules

#### **Rule 9: Documentation Standards**
- **Rule**: All deployment changes must be documented before execution
- **Enforcement**: CI pipeline fails if documentation is missing
- **Verification**:
  - [ ] `deployment.json` updated with new contract addresses
  - [ ] All `.env` variables documented in `env.example`
  - [ ] `README.md` updated with deployment steps
  - [ ] Gas costs and contract sizes recorded in `docs/gas-report.md`
  - [ ] Deployment changes documented in `CHANGELOG.md`

---

## 🔹 Deployment Phase

### 2.1 Smart Contract Deployment Rules

#### **Rule 10: Network Validation**
- **Rule**: Deployment network must match configuration
- **Enforcement**: Automated network validation in deployment script
- **Verification**:
  - [ ] Confirm `NEXT_PUBLIC_CHAIN_ID` matches target network
  - [ ] Verify RPC URL is correct for the network

#### **Rule 11: Deployment Execution**
- **Rule**: Contracts must be deployed with proper gas settings and retries
- **Enforcement**: Deployment script enforces gas limits and retries
- **Verification**:
  - [ ] Run `npm run deploy:<network>`
  - [ ] Confirm all contracts deployed successfully
  - [ ] Verify transaction receipts

#### **Rule 12: Contract Verification**
- **Rule**: All contracts must be verified on block explorers
- **Enforcement**: Automated verification script
- **Verification**:
  - [ ] Run `npm run verify`
  - [ ] Check Basescan/MonadScan for verified contracts
  - [ ] Confirm source code matches repository

#### **Rule 13: Signer Registration**
- **Rule**: Story template signer must be registered after deployment
- **Enforcement**: Deployment script fails if signer registration fails
- **Verification**:
  - [ ] Run `npx hardhat run scripts/set-signer.js --network <network>`
  - [ ] Confirm signer address is set correctly

#### **Rule 14: Environment Updates**
- **Rule**: `.env` file must be updated with new contract addresses
- **Enforcement**: Automated environment validation
- **Verification**:
  - [ ] Update `.env` with new contract addresses
  - [ ] Run `npm run validate:env`

---

### 2.2 Frontend Deployment Rules

#### **Rule 15: Environment Validation**
- **Rule**: Frontend environment variables must be validated before build
- **Enforcement**: Build fails if environment variables are invalid
- **Verification**:
  - [ ] Confirm `.env` variables are correct for target environment
  - [ ] Run `npm run validate:env`

#### **Rule 16: Build Requirements**
- **Rule**: Production build must complete with zero errors
- **Enforcement**: CI pipeline fails if build has errors
- **Verification**:
  - [ ] Run `npm run build`
  - [ ] Verify zero build errors
  - [ ] Confirm build artifacts are generated

#### **Rule 17: Deployment Execution**
- **Rule**: Frontend must be deployed to production-ready hosting
- **Enforcement**: Deployment script validates hosting configuration
- **Verification**:
  - [ ] Deploy to Vercel/GitHub Pages
  - [ ] Confirm deployment completes successfully

#### **Rule 18: Deployment Verification**
- **Rule**: Frontend functionality must be verified in staging
- **Enforcement**: Automated smoke tests run post-deployment
- **Verification**:
  - [ ] Check Vercel deployment logs for errors
  - [ ] Test frontend functionality in staging environment

---

### 2.3 Rollback Rules

#### **Rule 19: Rollback Execution**
- **Rule**: Rollback must be executed within 15 minutes of any critical failure
- **Enforcement**: Automated rollback triggers for critical failures

| Scenario               | Rollback Rule                                                                   | Verification Steps                                                                 |
|------------------------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| **Contract Deployment Failure** | Revert to previous `deployment.json` and redeploy old contracts               | [ ] Confirm rollback script executed successfully (`scripts/rollback-contracts.js`)
| **Frontend Deployment Failure**  | Rollback to previous Git tag and redeploy                                      | [ ] Verify frontend functionality restored
| **Database Corruption**         | Restore from backup and verify data integrity                                  | [ ] Confirm data integrity checks pass
| **Signer Registration Failure**  | Re-run `set-signer.js` with correct private key                                | [ ] Verify signer address is correctly set

---

### 2.4 Verification Rules

#### **Rule 20: Smart Contract Verification**
- **Rule**: All contracts must be verified on block explorers and tested
- **Enforcement**: Automated verification scripts
- **Verification**:
  - [ ] Verify contract addresses on Basescan/MonadScan
  - [ ] Confirm events are emitted correctly (`Deposited`, `StoryCreated`)
  - [ ] Test `mintHiddenNFT` and `mintCreatorNFT` functions
  - [ ] Verify contract ownership and permissions

#### **Rule 21: Frontend Verification**
- **Rule**: Frontend must pass all critical functionality tests
- **Enforcement**: Automated smoke tests
- **Verification**:
  - [ ] Verify wallet connection (wagmi/viem)
  - [ ] Test Farcaster mini-app integration
  - [ ] Confirm dark mode works (`<html className="dark">`)
  - [ ] Validate NFT metadata generation (`/api/nft/[tokenId]/route.ts`)
  - [ ] Test responsive design on mobile/desktop

#### **Rule 22: Integration Verification**
- **Rule**: All system components must work together seamlessly
- **Enforcement**: End-to-end integration tests
- **Verification**:
  - [ ] Test end-to-end story creation flow
  - [ ] Verify liquidity pool deposits and withdrawals
  - [ ] Confirm NFT minting and metadata generation
  - [ ] Test cross-network functionality

---

## 🔹 Post-Deployment Phase

### 3.1 Monitoring Rules

#### **Rule 23: Smart Contract Monitoring**
- **Rule**: All critical contract functions must have real-time monitoring
- **Enforcement**: Automated Tenderly alert setup
- **Verification**:
  - [ ] Set up Tenderly alerts for critical functions (e.g., `mintHiddenNFT`, `createStory`)
  - [ ] Monitor gas usage and failed transactions
  - [ ] Configure alerts for unusual activity (e.g., large deposits, rapid NFT minting)

#### **Rule 24: Frontend Monitoring**
- **Rule**: All frontend errors must be tracked and alerted
- **Enforcement**: Sentry integration with error tracking
- **Verification**:
  - [ ] Set up Sentry for error tracking
  - [ ] Monitor Vercel logs for 5xx errors
  - [ ] Configure alerts for critical frontend failures

#### **Rule 25: Infrastructure Monitoring**
- **Rule**: System availability must be monitored 24/7
- **Enforcement**: UptimeRobot and Datadog integration
- **Verification**:
  - [ ] Set up UptimeRobot for frontend availability
  - [ ] Monitor database and API response times
  - [ ] Configure alerts for infrastructure issues

---

### 3.2 Root-Cause Solution Rules

#### **Rule 26: Root-Cause Analysis Requirements**
- **Rule**: Every issue must undergo root-cause analysis before any fix is applied
- **Enforcement**: Issue templates require root-cause documentation

| Issue Type            | Root-Cause Analysis Rule                                                               | Long-Term Solution Rule                                                           |
|-----------------------|----------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| **High Gas Costs**    | Must analyze gas reports and identify specific inefficient operations                 | Must optimize contract code with measurable gas reduction (target: < 5% of current)
| **Failed Transactions** | Must check transaction receipts, verify signer permissions, and validate input data   | Must add input validation and improve error messages with specific guidance        |
| **Frontend Errors**   | Must review Sentry logs, verify API responses, and test wallet connections            | Must add error boundaries and improve type safety with TypeScript validation       |
| **NFT Metadata Issues** | Must verify endpoint, check IPFS pinning, and validate metadata schema                | Must implement dedicated metadata service with schema validation and testing      |

#### **Rule 27: Solution Documentation**
- **Rule**: All solutions must be documented with root-cause analysis
- **Enforcement**: PR templates require solution documentation
- **Verification**:
  - [ ] Root cause documented in issue
  - [ ] Long-term solution described
  - [ ] Test cases added for regression prevention

---

### 3.3 Post-Deployment Verification Rules

#### **Rule 28: Functional Testing**
- **Rule**: All critical user flows must pass functional testing
- **Enforcement**: Automated test suite runs post-deployment
- **Verification**:
  - [ ] Test all critical user flows (story creation, NFT minting, liquidity deposits)
  - [ ] Verify wallet and Farcaster integrations
  - [ ] Test cross-network functionality

#### **Rule 29: Performance Testing**
- **Rule**: System must meet performance benchmarks
- **Enforcement**: Load testing required before production approval
- **Verification**:
  - [ ] Load test with 100+ concurrent users
  - [ ] Monitor gas costs and transaction speeds
  - [ ] Verify response times meet SLA (target: < 2s for frontend, < 10s for transactions)

#### **Rule 30: Security Validation**
- **Rule**: No new vulnerabilities allowed in production
- **Enforcement**: Automated security scanning post-deployment
- **Verification**:
  - [ ] Run Slither/MythX post-deployment
  - [ ] Verify no new vulnerabilities introduced
  - [ ] Confirm all dependencies are up-to-date

---

### 3.4 Documentation Rules

#### **Rule 31: Documentation Standards**
- **Rule**: All deployment changes must be documented before completion
- **Enforcement**: CI pipeline fails if documentation is missing
- **Verification**:
  - [ ] Update `CHANGELOG.md` with deployment details
  - [ ] Document known issues and workarounds in `docs/known-issues.md`
  - [ ] Update `README.md` with post-deployment steps and verification commands
  - [ ] Record deployment metrics (gas costs, contract sizes, build times)
  - [ ] Update `docs/gas-report.md` with latest gas costs

---

## 🔹 Emergency Procedures

### 4.1 Rollback Rules

#### **Rule 32: Rollback Execution**
- **Rule**: Rollback must be executed within 15 minutes of critical failure detection
- **Enforcement**: Automated rollback triggers for critical failures

#### **Smart Contract Rollback**
- **Rule**: Previous contract state must be restored exactly
- **Enforcement**: Automated rollback script with verification
- **Verification**:
  - [ ] Revert to previous `deployment.json`
  - [ ] Redeploy old contracts using `npm run deploy:<network>`
  - [ ] Verify contract addresses on Basescan
  - [ ] Confirm all contract functions work correctly

#### **Frontend Rollback**
- **Rule**: Frontend must be restored to previous working version
- **Enforcement**: Git tagging and automated deployment
- **Verification**:
  - [ ] Rollback to previous Git tag
  - [ ] Redeploy via Vercel
  - [ ] Verify frontend functionality
  - [ ] Confirm all critical user flows work

#### **Database Rollback**
- **Rule**: Database must be restored to pre-deployment state
- **Enforcement**: Automated backup restoration
- **Verification**:
  - [ ] Restore from backup
  - [ ] Verify data integrity
  - [ ] Confirm all data is consistent

---

### 4.2 Incident Response Rules

#### **Rule 33: Incident Severity Classification**
- **Rule**: All incidents must be classified by severity within 15 minutes
- **Enforcement**: Automated severity detection and alerting

| Severity Level | Response Time Rule | Response Actions Rule                                                              | Verification Requirements                          |
|----------------|--------------------|--------------------------------------------------------------------------------------|----------------------------------------------------|
| **Critical**   | < 1 hour           | Rollback immediately, notify team, and investigate root cause                        | [ ] Rollback executed
[ ] Root cause documented
[ ] Post-mortem scheduled
| **High**       | < 4 hours          | Patch or rollback, document issue, and schedule post-mortem                          | [ ] Issue documented
[ ] Fix deployed
[ ] Post-mortem scheduled
| **Medium**     | < 24 hours         | Investigate root cause, deploy fix, and monitor                                      | [ ] Root cause identified
[ ] Fix deployed
[ ] Monitoring confirmed
| **Low**        | < 72 hours         | Document issue, schedule fix in next sprint                                          | [ ] Issue documented
[ ] Fix scheduled

---

### 4.3 Post-Mortem Rules

#### **Rule 34: Post-Mortem Standards**
- **Rule**: All critical and high severity incidents require post-mortem
- **Enforcement**: Post-mortem template completion required

#### **Post-Mortem Requirements**
- **Rule 35: Root Cause Documentation**
  - [ ] Document the underlying issue (not just symptoms)
  - [ ] Include technical details and reproduction steps
  - [ ] Identify why existing safeguards failed

- **Rule 36: Impact Analysis**
  - [ ] Quantify user impact (e.g., failed transactions, downtime)
  - [ ] Estimate financial impact if applicable
  - [ ] Document affected systems and users

- **Rule 37: Solution Documentation**
  - [ ] Describe the immediate remediation (short-term fix)
  - [ ] Outline long-term solution to prevent recurrence
  - [ ] Include estimated implementation time

- **Rule 38: Action Items**
  - [ ] Assign tasks with owners and deadlines
  - [ ] Include verification steps for each action item
  - [ ] Schedule follow-up review
