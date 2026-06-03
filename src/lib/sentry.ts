// Enterprise-grade Sentry Integration
import * as Sentry from '@sentry/nextjs';

// Initialize Sentry with enterprise-grade configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0, // Capture 100% of transactions for production
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  debug: process.env.NEXT_PUBLIC_ENVIRONMENT === 'development',
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: 'dark',
      showBranding: false,
    }),
  ],
  // Performance monitoring
  tracePropagationTargets: [/^https:\/\/.*\.ghostwriter\.app/, /^https:\/\/api\.ghostwriter\.app/],
  // Error tracking
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.data) {
      delete event.request.data;
    }
    // Filter out known false positives
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop limit exceeded')) {
      return null;
    }
    return event;
  },
  // User tracking
  sendDefaultPii: true,
});

// Set user context for better error tracking
export function setSentryUser(user: {
  id: string;
  username?: string;
  email?: string;
  walletAddress?: string;
}) {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
    walletAddress: user.walletAddress,
  });
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
  console.error('Sentry captured error:', error);
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureMessage(message);
  });
  console.log(`Sentry ${level} message:`, message);
}

/**
 * Captures a performance transaction using modern Sentry API
 * @param name The name of the transaction
 * @param operation The operation name (e.g., 'task', 'navigation')
 * @param tags Optional tags to associate with the transaction
 * @returns The transaction span that should be finished with span.end()
 */
export function captureTransaction(name: string, operation: string, tags?: Record<string, string>) {
  return Sentry.startSpan({ name, op: operation }, (span) => {
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }
    return span;
  });
}

// Performance monitoring
export function startPerformanceMonitoring() {
  // Tracing is automatically configured in @sentry/nextjs
}