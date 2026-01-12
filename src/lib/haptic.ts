import { HAPTIC_PATTERNS } from './constants';

// Enterprise-grade haptic feedback system
export class HapticManager {
  private static instance: HapticManager;
  private isSupported: boolean = false;
  private isEnabled: boolean = true;

  constructor() {
    this.checkSupport();
  }

  static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }

  private checkSupport(): void {
    this.isSupported = 
      typeof window !== 'undefined' && 
      'navigator' in window && 
      'vibrate' in navigator;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('haptic-enabled', enabled.toString());
    }
  }

  isHapticEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('haptic-enabled');
    return stored ? stored === 'true' : this.isEnabled;
  }

  trigger(pattern: keyof typeof HAPTIC_PATTERNS): void {
    if (!this.isSupported || !this.isHapticEnabled()) return;

    const { duration, intensity } = HAPTIC_PATTERNS[pattern];
    
    try {
      // Modern Vibration API
      if (navigator.vibrate) {
        navigator.vibrate(duration);
      }
      
      // iOS Safari haptic feedback (if available)
      if ('DeviceMotionEvent' in window && typeof (window as any).DeviceMotionEvent.requestPermission === 'function') {
        // iOS haptic feedback through audio context (fallback)
        this.triggerAudioHaptic(intensity);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  private triggerAudioHaptic(intensity: number): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(intensity * 0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silent fail for audio haptic
    }
  }
}

// React hook for haptic feedback
export function useHaptic() {
  const haptic = HapticManager.getInstance();
  
  return {
    trigger: (pattern: keyof typeof HAPTIC_PATTERNS) => haptic.trigger(pattern),
    setEnabled: (enabled: boolean) => haptic.setEnabled(enabled),
    isEnabled: () => haptic.isHapticEnabled(),
  };
}
