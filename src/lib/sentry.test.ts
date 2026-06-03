import { initSentry, captureError, captureEvent } from './sentry';

// Mock @sentry/nextjs
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureEvent: jest.fn(),
}));

describe('Sentry utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initSentry', () => {
    it('should initialize Sentry with correct configuration', () => {
      const mockInit = require('@sentry/nextjs').init;
      
      initSentry();
      
      expect(mockInit).toHaveBeenCalledWith({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 0.1,
        debug: false,
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        integrations: expect.any(Array),
      });
    });

    it('should handle missing DSN gracefully', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SENTRY_DSN;
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      
      const mockInit = require('@sentry/nextjs').init;
      
      initSentry();
      
      expect(mockInit).toHaveBeenCalled();
      
      // Restore original env
      process.env.NEXT_PUBLIC_SENTRY_DSN = originalEnv;
    });
  });

  describe('captureError', () => {
    it('should capture exceptions', () => {
      const mockCaptureException = require('@sentry/nextjs').captureException;
      const testError = new Error('Test error');
      
      captureError(testError);
      
      expect(mockCaptureException).toHaveBeenCalledWith(testError);
    });
  });

  describe('captureEvent', () => {
    it('should capture custom events', () => {
      const mockCaptureEvent = require('@sentry/nextjs').captureEvent;
      const testEvent = {
        message: 'Test event',
        level: 'info',
        extra: { data: 'test' },
      };
      
      captureEvent(testEvent);
      
      expect(mockCaptureEvent).toHaveBeenCalledWith(testEvent);
    });
  });
});