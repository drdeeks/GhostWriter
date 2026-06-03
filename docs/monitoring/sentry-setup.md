# Sentry Setup & Configuration

## Enterprise-Grade Sentry Implementation

### Prerequisites
- Node.js 18+
- Next.js 14+
- Sentry account with project created
- Environment variables configured

### Installation
```bash
npm install @sentry/nextjs
```

### Configuration
1. **Environment Variables** (`.env`):
```
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
NEXT_PUBLIC_ENVIRONMENT=production # or staging, development
SENTRY_AUTH_TOKEN=your_auth_token_for_releases
```

2. **Sentry Client Configuration** (`src/lib/sentry.ts`):
- Implements enterprise-grade error tracking
- Includes performance monitoring
- Supports user context and custom transactions
- Provides replay functionality for debugging

### Key Features

#### Error Tracking
- Automatic error capture for unhandled exceptions
- Custom error capture with context:
```typescript
captureError(error: Error, context?: Record<string, unknown>)
```

#### Performance Monitoring
- Automatic tracing for Next.js routes
- Custom transaction support:
```typescript
const transaction = captureTransaction('story_creation', 'task');
// ... perform operation
transaction.finish();
```

#### User Feedback
- Integrated feedback widget for error reporting
- Customizable UI to match brand

#### Replays
- Session replay for debugging user issues
- Privacy controls for sensitive data

### Alert Configuration
Configure alerts in Sentry UI with these recommended settings:

1. **Critical Errors (P0)**:
   - Unhandled exceptions affecting >1% of users
   - Condition: `event.type:error AND event.unhandled:true AND event.count() > 10 in 5m`
   - Notification: Slack #critical-alerts, PagerDuty

2. **Performance Degradation (P1)**:
   - Page load times >5s for >5% of users
   - Condition: `event.type:transaction AND transaction.duration:>5000 AND event.count() > 5 in 5m`
   - Notification: Slack #alerts

3. **Warning Alerts (P1)**:
   - Error rates >0.5% of users
   - Condition: `event.type:error AND event.count() > 5 in 5m`
   - Notification: Slack #alerts

### Release Tracking
```bash
# In your CI/CD pipeline
npx @sentry/cli releases new $VERSION
npx @sentry/cli releases set-commits $VERSION --auto
npx @sentry/cli releases finalize $VERSION
```

### Source Maps
```bash
# Generate source maps
npm run build

# Upload source maps to Sentry
npx @sentry/cli sourcemaps upload .next/static --release $VERSION
```

### Best Practices
1. **Error Context**: Always include relevant context with errors
2. **Sampling**: Adjust sampling rates based on traffic volume
3. **Privacy**: Configure data scrubbers for sensitive information
4. **Performance Budgets**: Set performance budgets for critical user flows
5. **Release Tracking**: Always associate errors with releases
6. **Alert Tuning**: Regularly review and tune alert thresholds

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Source maps not working | Verify release names match between upload and runtime |
| High error volume | Implement client-side error sampling |
| Missing context | Ensure setUser() is called early in session |
| Performance data missing | Verify tracesSampleRate is set appropriately |

## Monitoring Dashboard
Create a Sentry dashboard with these recommended widgets:
1. Error Rate (Last 24h)
2. Error Distribution by Type
3. Performance by Page
4. Slowest Transactions
5. Affected Users
6. Release Health
7. Browser/Device Breakdown