# Post-Mortem Template

## Incident Summary

| Field | Details |
|-------|---------|
| Incident ID | [Auto-generated] |
| Title | [Brief descriptive title] |
| Date | [YYYY-MM-DD] |
| Time | [HH:MM - HH:MM UTC] |
| Duration | [X hours Y minutes] |
| Severity | [P0/P1/P2] |
| Lead | [Name] |
| Team | [Names] |

## Impact Assessment

### Affected Systems
- [System 1]
- [System 2]
- [System 3]

### User Impact
- Number of users affected: [Number]
- Percentage of user base: [Percentage]
- Business impact: [Description]

### Financial Impact
- Direct costs: [$XXX]
- Indirect costs: [$XXX]
- Revenue impact: [$XXX]

## Timeline

| Time (UTC) | Event | Impact | Action |
|------------|-------|--------|--------|
| HH:MM | [Detection] | [Impact] | [Action] |
| HH:MM | [Investigation] | [Impact] | [Action] |
| HH:MM | [Mitigation] | [Impact] | [Action] |
| HH:MM | [Resolution] | [Impact] | [Action] |

## Root Cause Analysis Framework

### 1. Five Whys Analysis
```
Why 1: [Initial problem statement]
Why 2: [Because...]
Why 3: [Because...]
Why 4: [Because...]
Why 5: [Root cause]
```

### 2. Fishbone Diagram Components
- **People**: Team knowledge, training, communication
- **Process**: Workflows, approvals, change management
- **Technology**: Infrastructure, code, third-party services
- **Environment**: External factors, market conditions
- **Policy**: Compliance, security, operational guidelines

### 3. Direct Cause
[Detailed technical description of the immediate cause, including:
- Specific code/component that failed
- Exact conditions that triggered the failure
- Data/inputs that led to the failure
- Timeline of the failure propagation]

### 4. Contributing Factors
- **Technical Debt**: Known issues that contributed
- **Process Gaps**: Missing or inadequate procedures
- **Human Factors**: Training, communication, or decision-making issues
- **Environmental**: External dependencies or conditions
- **Organizational**: Team structure, priorities, or resource allocation

### 5. Root Cause
[The fundamental, underlying reason the incident occurred, addressing:
- Why the direct cause existed in the first place
- Why contributing factors weren't addressed earlier
- Systemic issues that allowed the failure to happen
- Organizational patterns that need to change]

### 6. Root Cause Category
Select one:
- [ ] Process Failure
- [ ] Technology Failure
- [ ] Human Error
- [ ] External Dependency
- [ ] Organizational Issue
- [ ] Other: ________

### 7. Prevention Framework
| Category               | Prevention Strategy                          | Owner          | Timeline     |
|------------------------|---------------------------------------------|----------------|--------------|
| Immediate Fix          | [Specific technical fix]                     | [Name]         | [Date]       |
| Short-term Prevention  | [Process/technical improvements]             | [Name]         | [Date]       |
| Long-term Prevention   | [Architectural/process changes]              | [Name]         | [Date]       |
| Monitoring Improvement | [New alerts/metrics to detect earlier]       | [Name]         | [Date]       |

## Lessons Learned

### What Went Well
- [Item 1]
- [Item 2]
- [Item 3]

### What Could Be Improved
- [Item 1]
- [Item 2]
- [Item 3]

## Action Items

| ID | Action Item | Owner | Priority | Due Date | Status |
|----|-------------|-------|----------|----------|--------|
| 1 | [Description] | [Name] | [P0/P1/P2] | [YYYY-MM-DD] | [Open/In Progress/Done] |
| 2 | [Description] | [Name] | [P0/P1/P2] | [YYYY-MM-DD] | [Open/In Progress/Done] |
| 3 | [Description] | [Name] | [P0/P1/P2] | [YYYY-MM-DD] | [Open/In Progress/Done] |

## Supporting Materials
- [Link to logs]
- [Link to dashboards]
- [Link to incident chat]
- [Link to related issues]

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Incident Lead | | | |
| Engineering Manager | | | |
| Product Owner | | | |