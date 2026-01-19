// Enhanced mobile-first responsive utilities
export const MOBILE_BREAKPOINTS = {
  xs: '320px',
  sm: '375px', 
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

export const HAPTIC_PATTERNS = {
  light: { duration: 50, intensity: 0.3 },
  medium: { duration: 100, intensity: 0.6 },
  heavy: { duration: 150, intensity: 1.0 },
  success: { duration: 200, intensity: 0.8 },
  error: { duration: 300, intensity: 1.0 },
  notification: { duration: 100, intensity: 0.4 },
} as const;

export const FARCASTER_CONFIG = {
  miniAppId: process.env.NEXT_PUBLIC_FARCASTER_MINIAPP_ID || 'ghost-writer',
  frameUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://ghostwriter.app',
  manifestUrl: '/manifest.json',
} as const;

// Performance monitoring
export const PERFORMANCE_THRESHOLDS = {
  loadTime: 2000, // 2s max load time
  interactionDelay: 100, // 100ms max interaction delay
  animationFrame: 16.67, // 60fps target
} as const;
