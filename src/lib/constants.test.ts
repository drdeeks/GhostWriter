import {
  MOBILE_BREAKPOINTS,
  HAPTIC_PATTERNS,
  FARCASTER_CONFIG,
  PERFORMANCE_THRESHOLDS,
} from './constants';

describe('Constants', () => {
  describe('MOBILE_BREAKPOINTS', () => {
    it('should define all breakpoints', () => {
      expect(MOBILE_BREAKPOINTS).toHaveProperty('xs');
      expect(MOBILE_BREAKPOINTS).toHaveProperty('sm');
      expect(MOBILE_BREAKPOINTS).toHaveProperty('md');
      expect(MOBILE_BREAKPOINTS).toHaveProperty('lg');
      expect(MOBILE_BREAKPOINTS).toHaveProperty('xl');
    });

    it('should have correct breakpoint values', () => {
      expect(MOBILE_BREAKPOINTS.xs).toBe('320px');
      expect(MOBILE_BREAKPOINTS.sm).toBe('375px');
      expect(MOBILE_BREAKPOINTS.md).toBe('768px');
      expect(MOBILE_BREAKPOINTS.lg).toBe('1024px');
      expect(MOBILE_BREAKPOINTS.xl).toBe('1280px');
    });
  });

  describe('HAPTIC_PATTERNS', () => {
    it('should define all haptic patterns', () => {
      expect(HAPTIC_PATTERNS).toHaveProperty('light');
      expect(HAPTIC_PATTERNS).toHaveProperty('medium');
      expect(HAPTIC_PATTERNS).toHaveProperty('heavy');
      expect(HAPTIC_PATTERNS).toHaveProperty('success');
      expect(HAPTIC_PATTERNS).toHaveProperty('error');
      expect(HAPTIC_PATTERNS).toHaveProperty('notification');
    });

    it('should have duration and intensity for each pattern', () => {
      Object.values(HAPTIC_PATTERNS).forEach((pattern) => {
        expect(pattern).toHaveProperty('duration');
        expect(pattern).toHaveProperty('intensity');
        expect(typeof pattern.duration).toBe('number');
        expect(typeof pattern.intensity).toBe('number');
      });
    });

    it('should have increasing durations for severity', () => {
      expect(HAPTIC_PATTERNS.light.duration).toBe(50);
      expect(HAPTIC_PATTERNS.medium.duration).toBe(100);
      expect(HAPTIC_PATTERNS.heavy.duration).toBe(150);
      expect(HAPTIC_PATTERNS.error.duration).toBe(300);
    });
  });

  describe('FARCASTER_CONFIG', () => {
    it('should have miniAppId with fallback', () => {
      expect(FARCASTER_CONFIG.miniAppId).toBeDefined();
      expect(typeof FARCASTER_CONFIG.miniAppId).toBe('string');
    });

    it('should have frameUrl with fallback', () => {
      expect(FARCASTER_CONFIG.frameUrl).toBeDefined();
      expect(typeof FARCASTER_CONFIG.frameUrl).toBe('string');
    });

    it('should have manifestUrl', () => {
      expect(FARCASTER_CONFIG.manifestUrl).toBe('/manifest.json');
    });
  });

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('should define all thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS).toHaveProperty('loadTime');
      expect(PERFORMANCE_THRESHOLDS).toHaveProperty('interactionDelay');
      expect(PERFORMANCE_THRESHOLDS).toHaveProperty('animationFrame');
    });

    it('should have correct threshold values', () => {
      expect(PERFORMANCE_THRESHOLDS.loadTime).toBe(2000);
      expect(PERFORMANCE_THRESHOLDS.interactionDelay).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.animationFrame).toBe(16.67);
    });
  });
});
