import { HapticManager, useHaptic } from './haptic';
import { HAPTIC_PATTERNS } from './constants';

describe('HapticManager', () => {
  let haptic: HapticManager;

  beforeEach(() => {
    (HapticManager as any).instance = undefined;
    haptic = HapticManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = HapticManager.getInstance();
      const instance2 = HapticManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('setEnabled / isHapticEnabled', () => {
    it('should enable haptic feedback', () => {
      haptic.setEnabled(true);
      expect(haptic.isHapticEnabled()).toBe(true);
    });

    it('should disable haptic feedback', () => {
      haptic.setEnabled(false);
      expect(haptic.isHapticEnabled()).toBe(false);
    });

    it('should persist enabled state in localStorage', () => {
      haptic.setEnabled(true);
      expect(localStorage.getItem('haptic-enabled')).toBe('true');
      haptic.setEnabled(false);
      expect(localStorage.getItem('haptic-enabled')).toBe('false');
    });

    it('should read enabled state from localStorage', () => {
      localStorage.setItem('haptic-enabled', 'true');
      (HapticManager as any).instance = undefined;
      haptic = HapticManager.getInstance();
      expect(haptic.isHapticEnabled()).toBe(true);
    });
  });

  describe('trigger', () => {
    it('should not throw when calling trigger', () => {
      expect(() => haptic.trigger('light')).not.toThrow();
      expect(() => haptic.trigger('heavy')).not.toThrow();
      expect(() => haptic.trigger('success')).not.toThrow();
      expect(() => haptic.trigger('error')).not.toThrow();
      expect(() => haptic.trigger('medium')).not.toThrow();
      expect(() => haptic.trigger('notification')).not.toThrow();
    });

    it('should not throw when disabled', () => {
      haptic.setEnabled(false);
      expect(() => haptic.trigger('light')).not.toThrow();
    });
  });

  describe('HAPTIC_PATTERNS', () => {
    it('should have all pattern types', () => {
      expect(HAPTIC_PATTERNS.light).toBeDefined();
      expect(HAPTIC_PATTERNS.medium).toBeDefined();
      expect(HAPTIC_PATTERNS.heavy).toBeDefined();
      expect(HAPTIC_PATTERNS.success).toBeDefined();
      expect(HAPTIC_PATTERNS.error).toBeDefined();
      expect(HAPTIC_PATTERNS.notification).toBeDefined();
    });

    it('should have valid duration and intensity', () => {
      Object.values(HAPTIC_PATTERNS).forEach((pattern) => {
        expect(pattern.duration).toBeGreaterThan(0);
        expect(pattern.intensity).toBeGreaterThanOrEqual(0);
        expect(pattern.intensity).toBeLessThanOrEqual(1);
      });
    });
  });
});

describe('useHaptic hook', () => {
  it('should return trigger, setEnabled, and isEnabled functions', () => {
    const hook = useHaptic();
    expect(typeof hook.trigger).toBe('function');
    expect(typeof hook.setEnabled).toBe('function');
    expect(typeof hook.isEnabled).toBe('function');
  });
});
