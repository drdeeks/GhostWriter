# Enterprise-Grade Alerting Rules

## Alert Severity Matrix
| Severity | Response Time | Escalation Path | Notification Channels |
|----------|---------------|------------------|-----------------------|
| **P0 - Critical** | Immediate (24/7) | On-call team → Engineering lead → CTO | Slack #critical-alerts, PagerDuty, SMS, Email |
| **P1 - Warning** | Business hours | Engineering team → Team lead | Slack #alerts, Email |
| **P2 - Informational** | Next business day | Team lead | Email, Weekly digest |

## Critical Alerts (P0) - Immediate Response Required

### Smart Contracts (Tenderly)
- **Failed Transactions**: Any transaction that reverts or fails (exclude known benign reverts)
- **High Gas Usage**: Transactions exceeding 5M gas (adjust threshold per contract)
- **Ownership Changes**: Any change to contract ownership (OWNER role)
- **Large Value Transfers**: Transfers exceeding $10,000 USD equivalent (configurable per contract)
- **Admin Function Calls**: Any call to admin-only functions (DEFAULT_ADMIN_ROLE, PAUSER_ROLE)
- **Contract Paused**: Contract pause() function called
- **Emergency Withdrawals**: Emergency withdrawal functions called
- **Minting Events**: Large minting events (>1% of total supply)
- **Blacklisted Addresses**: Interactions with known malicious addresses

### Frontend (Sentry)
- **JavaScript Errors**: Unhandled exceptions affecting >1% of users (sampled)
- **API Failures**: Repeated failed API calls (>5 in 5 minutes from >0.5% of users)
- **Authentication Failures**: Repeated failed login attempts (>10 in 1 minute from single IP)
- **Performance Degradation**: Page load times >5s for >5% of users
- **Wallet Connection Failures**: >10% of users failing to connect wallet
- **Transaction Failures**: >5% of users experiencing failed transactions
- **Feature Failures**: Critical feature failures (story creation, contributions)
- **Security Violations**: Suspected XSS, CSRF, or other security issues

### Infrastructure (Datadog)
- **High CPU Usage**: >90% for >5 minutes (across >50% of instances)
- **High Memory Usage**: >95% for >5 minutes (across >50% of instances)
- **Disk Space**: <10% free space (on any critical volume)
- **Service Down**: Any critical service not responding (3 consecutive checks)
- **Database Issues**: Query times >5s for >1% of queries
- **Cache Failures**: Cache hit rate <50% for >5 minutes
- **Message Queue Backlog**: >1000 pending messages for >5 minutes

### Availability (UptimeRobot)
- **Endpoint Down**: Any monitored endpoint down for >1 minute (3 consecutive checks)
- **SSL Expiry**: Certificate expiring in <7 days
- **High Latency**: Response times >3s for >5 minutes (affecting >5% of users)
- **DNS Failures**: DNS resolution failures
- **CDN Issues**: CDN edge node failures

## Warning Alerts (P1) - Business Hours Response

### Smart Contracts
- **Unusual Activity**: Spikes in transaction volume (>2x 7-day average)
- **Gas Price Spikes**: Gas prices >200 gwei for >10 minutes
- **Contract Balance Changes**: >10% change in contract balance (24h period)
- **Function Call Spikes**: >5x normal call volume for specific functions
- **Reentrancy Attempts**: Detected reentrancy patterns
- **Front-running Attempts**: Suspected front-running transactions
- **Failed Admin Calls**: Failed calls to admin functions

### Frontend
- **Increased Error Rates**: Error rates >0.5% of users
- **Performance Issues**: Page load times >3s for >2% of users
- **Feature Degradation**: Non-critical feature failures
- **Browser-Specific Issues**: Errors affecting >5% of users on specific browser
- **Mobile Issues**: Errors affecting >5% of mobile users
- **API Latency**: API response times >2s for >5% of calls
- **Wallet Connection Issues**: >5% of users failing to connect wallet

### Infrastructure
- **Moderate CPU Usage**: >80% for >10 minutes
- **Moderate Memory Usage**: >90% for >10 minutes
- **Disk Space**: <20% free space
- **Database Latency**: Query times >2s for >1% of queries
- **Cache Degradation**: Cache hit rate <70% for >10 minutes
- **Message Queue Backlog**: >500 pending messages for >5 minutes
- **Log Errors**: Application errors in logs (>10/minute)
- **Deployment Failures**: Failed deployment attempts

## Informational Alerts (P2) - Daily/Weekly Review

### Smart Contracts
- **Daily Activity Summary**: Daily transaction volume, gas usage, unique users
- **Gas Usage Report**: Weekly gas usage by function
- **Contract Balance**: Daily balance report with USD equivalent
- **User Growth**: Daily/weekly active users
- **Function Usage**: Weekly function call statistics
- **Token Distribution**: Weekly token holder distribution

### Frontend
- **Weekly Error Report**: Summary of frontend errors by type and browser
- **Performance Trends**: Weekly performance metrics (p50, p90, p99)
- **User Feedback**: Aggregated user feedback and NPS
- **Feature Usage**: Weekly feature adoption metrics
- **Conversion Funnel**: User journey drop-off points
- **Browser Stats**: Weekly browser/device statistics

### Infrastructure
- **Weekly Resource Report**: Server resource usage trends
- **Service Health**: Weekly service availability (SLA compliance)
- **Log Anomalies**: Unusual log patterns (ML-based detection)
- **Cost Report**: Weekly cloud spending by service
- **Security Scan**: Weekly vulnerability scan results
- **Backup Status**: Weekly backup verification status

## Alert Configuration Best Practices

1. **Threshold Tuning**: 
   - Start with conservative thresholds and adjust based on historical data
   - Use percentiles (p90, p95) rather than absolute values for performance metrics
   - Implement seasonal adjustments for traffic patterns

2. **Deduplication**:
   - Implement alert deduplication to prevent notification spam
   - Group related alerts (e.g., multiple failed transactions from same user)
   - Use exponential backoff for repeated alerts

3. **Escalation Policies**:
   - Define clear escalation paths for each alert severity
   - Implement time-based escalation (e.g., P0 alerts escalate after 15 minutes)
   - Define maintenance window exceptions

4. **Notification Channels**:
   - Use different channels for different severities (Slack for P1, PagerDuty for P0)
   - Implement quiet hours for non-critical alerts
   - Provide clear remediation instructions in notifications

5. **Alert Context**:
   - Include relevant context in alerts (transaction hashes, user IDs, affected components)
   - Provide links to dashboards and relevant logs
   - Include historical trends and baselines

6. **Testing**:
   - Regularly test alerting pipeline with synthetic events
   - Verify notification delivery to all channels
   - Test escalation procedures quarterly

## Runbook Template

```markdown
# Runbook: [Alert Name]

## Description
[Brief description of what this alert indicates]

## Severity
[P0/P1/P2]

## Impact
[What is the user/business impact?]

## Diagnosis
1. [Step 1 to diagnose]
2. [Step 2 to diagnose]
3. [Step 3 to diagnose]

## Mitigation
1. [Immediate mitigation steps]
2. [Temporary workaround if available]
3. [Long-term fix]

## Escalation
- [Team to escalate to]
- [Escalation criteria]
- [Escalation path]

## Metrics
- [Relevant dashboard links]
- [Key metrics to monitor]

## History
- [Date]: [Brief description of previous occurrences]
```