# Frontend Rollback Runbook

## 🚨 REAL Frontend Rollback - Not Documentation Fantasy

### When to Use This Runbook
- Frontend deployment broke critical functionality
- New UI has major bugs
- Performance degradation after update
- Security vulnerability in frontend code

### Pre-Rollback Checklist
- [ ] Identify last known good Git tag
- [ ] Verify Vercel rollback procedure
- [ ] Notify users of potential downtime
- [ ] Confirm backup of current deployment

### Rollback Steps

#### 1. Identify Previous Version
```bash
# Find last good deployment tag
git tag -l | grep -E "^v[0-9]+\.[0-9]+\.[0-9]+" | sort -V | tail -n 1
```

#### 2. Rollback to Previous Version
```bash
# Checkout previous version
LAST_GOOD_TAG=$(git tag -l | grep -E "^v[0-9]+\.[0-9]+\.[0-9]+" | sort -V | tail -n 1)
git checkout $LAST_GOOD_TAG
```

#### 3. Deploy via Vercel
```bash
# Deploy to production
vercel --prod
```

#### 4. Verify Rollback
```bash
# Check deployment status
vercel ls

# Test critical functionality
curl -I https://ghost-writer.vercel.app
```

### Post-Rollback Verification
- [ ] Test wallet connection
- [ ] Test story creation flow
- [ ] Test NFT minting
- [ ] Verify all UI components work
- [ ] Check mobile responsiveness

### Communication
```bash
# Notify team via Slack
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"🚨 Frontend rollback completed. Version '$LAST_GOOD_TAG' restored."}' \
$SLACK_WEBHOOK_URL
```

### Rollback Validation
| Check | Command | Expected Result |
|-------|---------|-----------------|
| Deployment status | `vercel ls` | Shows rolled back version |
| Homepage | `curl -I https://ghost-writer.vercel.app` | 200 OK |
| Wallet connection | Test in UI | Works correctly |
| Story creation | Test in UI | Works correctly |
| NFT minting | Test in UI | Works correctly |

## 📝 Rollback Documentation
- Document rollback in `CHANGELOG.md`
- Update `README.md` with current version
- Create post-mortem if rollback was due to incident