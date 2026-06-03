# Incident Response Runbook

## 1. Incident Identification

### Detection Sources
- Monitoring alerts (Tenderly, Sentry, Datadog, UptimeRobot)
- User reports
- Internal team observations

### Severity Levels
| Level | Description                                                                 | Impact Criteria                                                                                     | Response Time       | Escalation                     | Notification Channels                     |
|-------|---------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|---------------------|--------------------------------|--------------------------------------------|
| P0    | Complete system outage or critical functionality failure            | - Entire platform unavailable
- Core smart contract functions failing
- Security breach or funds at risk
- >50% of users affected | Immediate (24/7)    | Full team + executives        | Slack #war-room, PagerDuty, SMS, Email     |
| P1    | Major degradation of core services                                   | - Critical features unavailable
- Performance degradation >30%
- Security vulnerability (no funds at risk)
- 10-50% of users affected         | <15 minutes (24/7)  | On-call + engineering lead     | Slack #incidents, PagerDuty, SMS           |
| P2    | Partial degradation or non-critical feature issues                  | - Non-critical features unavailable
- Performance degradation <30%
- Minor security issues
- <10% of users affected          | <1 hour (business)  | On-call                         | Slack #incidents, Email                    |
| P3    | Minor issues or informational alerts                                | - No user impact
- Cosmetic issues
- Monitoring/observability gaps
- Informational security notices | Next business day   | None                            | Slack #alerts, Email                       |

## 2. Initial Response

### Escalation Procedures
1. **Alert Triage**: On-call engineer acknowledges alert within response time SLA
2. **War Room Creation**: For P0/P1 incidents, create dedicated Slack channel (#war-room-[incident-id])
3. **Stakeholder Notification**: Notify relevant stakeholders based on severity level
4. **Initial Triage**: Quick assessment to confirm severity and impact

### P0/P1 Incidents
1. **Acknowledge**: Confirm receipt of alert and create incident ticket
2. **Assemble**: Gather on-call team + engineering lead + product owner in war room
3. **Triage**: Identify affected systems and confirm severity
4. **Communicate**: Post initial update in #status and #war-room channels
5. **Assign Roles**: Incident Commander, Tech Lead, Communications Lead

### Communication Protocols
**Internal Communication Template (Slack #war-room):
```
🚨 Incident Alert: [Brief Description]
- Incident ID: [Auto-generated]
- Severity: [P0/P1]
- Detected: [Time UTC]
- Affected Systems: [List]
- Current Status: [Investigating/Mitigating/Resolved]
- Incident Commander: [Name]
- Next Update: [Time UTC or "As new info available"]
```

**External Communication Template (Status Page):
```
[Status: Investigating/Identified/Monitoring/Resolved]
We are currently investigating an issue affecting [service/functionality].
We will provide updates as more information becomes available.

Last updated: [Time UTC]
```

**Customer-Facing Communication Template (Email/Social Media):
```
Subject: Service Update - [Brief Description]

Dear [Community/Users],

We are currently experiencing issues with [specific functionality]. Our team is actively investigating and working on a resolution.

Current status: [Investigating/Working on fix/Resolved]
We apologize for any inconvenience and appreciate your patience.

For real-time updates, please check our status page: [URL]

Best regards,
The GhostWriter Team
```

## 3. Investigation

### Smart Contract Issues
1. Check Tenderly dashboard for:
   - Failed transactions
   - Unusual contract calls
   - Gas abnormalities
2. Review contract events
3. Check wallet activity
4. Verify oracle data

### Frontend Issues
1. Check Sentry for:
   - Error patterns
   - Affected users
   - Browser/device breakdown
2. Review recent deployments
3. Check API response times
4. Verify third-party service status

### Infrastructure Issues
1. Check Datadog for:
   - Resource utilization
   - Service health
   - Log anomalies
2. Review recent deployments
3. Check network connectivity
4. Verify database health

## 4. Mitigation

### Smart Contract Mitigations
- Pause contract if possible
- Blacklist malicious addresses
- Adjust contract parameters
- Deploy emergency fixes

### Frontend Mitigations
- Rollback to last known good version
- Disable problematic features
- Implement client-side fixes
- Update error boundaries

### Infrastructure Mitigations
- Scale up resources
- Restart failing services
- Failover to backup systems
- Update firewall rules

## 5. Resolution

### Verification Steps
1. Confirm monitoring shows green
2. Verify user impact resolved
3. Test affected functionality
4. Check dependent systems

### Post-Resolution
1. Update #status channel
2. Schedule post-mortem
3. Identify follow-up actions
4. Update runbooks if needed

## 6. Post-Mortem

See [post-mortem-template.md](./post-mortem-template.md) for the complete template.

### Post-Mortem Process
1. **Scheduling**: Conduct within 48 hours of incident resolution for P0/P1, 5 business days for P2
2. **Participants**: Incident response team + stakeholders + optional external experts
3. **Preparation**:
   - Gather all incident artifacts (logs, chat transcripts, metrics)
   - Complete timeline with all significant events
   - Identify root cause and contributing factors
4. **Review Meeting**:
   - Walk through incident timeline
   - Discuss what went well/what could be improved
   - Assign action items with owners and deadlines
5. **Approval**: Requires sign-off from engineering lead and product owner
6. **Follow-up**: Track action items to completion

### Communication Protocols
- **Internal**: Share post-mortem with entire engineering team
- **External**: For P0/P1 incidents, publish public version (redacted) on blog/status page
- **Regulatory**: For security incidents, follow disclosure requirements per SEC/GDPR

### Follow-up Items Tracking
- All action items must have:
  - Clear owner
  - Priority level (P0-P2)
  - Due date
  - Status tracking (Open/In Progress/Done)
- Weekly review of open action items until completion
- Quarterly review of all incident data for patterns/trends