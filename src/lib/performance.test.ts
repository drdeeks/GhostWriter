import { PerformanceMonitor, usePerformanceMonitor } from './performance';

jest.useFakeTimers();

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    (PerformanceMonitor as any).instance = undefined;
    monitor = PerformanceMonitor.getInstance();
  });

  afterEach(() => {
    monitor.cleanup();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordMetric', () => {
    it('should record a metric value', () => {
      monitor.recordMetric('test-metric', 100);
      const metrics = monitor.getMetrics();
      expect(metrics['test-metric']).toBeDefined();
      expect(metrics['test-metric'].count).toBe(1);
      expect(metrics['test-metric'].min).toBe(100);
      expect(metrics['test-metric'].max).toBe(100);
      expect(metrics['test-metric'].avg).toBe(100);
    });

    it('should accumulate multiple values for same metric', () => {
      monitor.recordMetric('test-metric', 100);
      monitor.recordMetric('test-metric', 200);
      monitor.recordMetric('test-metric', 300);
      const metrics = monitor.getMetrics();
      expect(metrics['test-metric'].count).toBe(3);
      expect(metrics['test-metric'].min).toBe(100);
      expect(metrics['test-metric'].max).toBe(300);
      expect(metrics['test-metric'].avg).toBe(200);
    });

    it('should keep only last 100 measurements', () => {
      for (let i = 0; i < 150; i++) {
        monitor.recordMetric('test-metric', i);
      }
      const metrics = monitor.getMetrics();
      expect(metrics['test-metric'].count).toBe(100);
      expect(metrics['test-metric'].min).toBe(50);
      expect(metrics['test-metric'].max).toBe(149);
    });

    it('should warn when LCP threshold exceeded', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      monitor.recordMetric('LCP', 3000);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should warn when FID threshold exceeded', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      monitor.recordMetric('FID', 150);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should warn when CLS threshold exceeded', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      monitor.recordMetric('CLS', 0.2);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not warn when within threshold', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      monitor.recordMetric('LCP', 1000);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not warn for unknown metrics', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      monitor.recordMetric('unknown-metric', 999999);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getMetrics', () => {
    it('should return empty object when no metrics recorded', () => {
      const metrics = monitor.getMetrics();
      expect(metrics).toEqual({});
    });

    it('should return metrics with correct structure', () => {
      monitor.recordMetric('test', 50);
      const metrics = monitor.getMetrics();
      expect(metrics['test']).toHaveProperty('avg');
      expect(metrics['test']).toHaveProperty('min');
      expect(metrics['test']).toHaveProperty('max');
      expect(metrics['test']).toHaveProperty('count');
    });
  });

  describe('measureSync', () => {
    it('should measure synchronous function execution time', () => {
      const result = monitor.measureSync('sync-test', () => 42);
      expect(result).toBe(42);
      const metrics = monitor.getMetrics();
      expect(metrics['sync-test']).toBeDefined();
      expect(metrics['sync-test'].count).toBe(1);
    });

    it('should record metric even when function throws', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(() =>
        monitor.measureSync('error-test', () => {
          throw new Error('test error');
        })
      ).toThrow('test error');
      const metrics = monitor.getMetrics();
      expect(metrics['error-test']).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('measureAsync', () => {
    it('should measure async function execution time', async () => {
      const result = await monitor.measureAsync('async-test', async () => 42);
      expect(result).toBe(42);
      const metrics = monitor.getMetrics();
      expect(metrics['async-test']).toBeDefined();
      expect(metrics['async-test'].count).toBe(1);
    });

    it('should record metric even when async function rejects', async () => {
      await expect(
        monitor.measureAsync('async-error', async () => {
          throw new Error('async error');
        })
      ).rejects.toThrow('async error');
      const metrics = monitor.getMetrics();
      expect(metrics['async-error']).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should clear all metrics', () => {
      monitor.recordMetric('test', 100);
      monitor.cleanup();
      const metrics = monitor.getMetrics();
      expect(metrics).toEqual({});
    });
  });
});

describe('usePerformanceMonitor hook', () => {
  it('should return recordMetric, measureAsync, measureSync, and getMetrics functions', () => {
    const hook = usePerformanceMonitor();
    expect(typeof hook.recordMetric).toBe('function');
    expect(typeof hook.measureAsync).toBe('function');
    expect(typeof hook.measureSync).toBe('function');
    expect(typeof hook.getMetrics).toBe('function');
  });
});
