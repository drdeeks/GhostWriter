import { FarcasterManager, useFarcasterEnhanced } from './farcaster-enhanced';

jest.mock('@farcaster/miniapp-sdk', () => ({
  sdk: {
    actions: {
      ready: jest.fn().mockResolvedValue(undefined),
      openUrl: jest.fn().mockResolvedValue(undefined),
    },
    context: {
      user: {
        fid: 12345,
        username: 'testuser',
        displayName: 'Test User',
        pfpUrl: 'https://example.com/pfp.png',
      },
    },
  },
}));

describe('FarcasterManager', () => {
  let manager: FarcasterManager;

  beforeEach(() => {
    (FarcasterManager as any).instance = undefined;
    manager = FarcasterManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FarcasterManager.getInstance();
      const instance2 = FarcasterManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('detectMiniAppEnvironment', () => {
    it('should return false in SSR', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      (FarcasterManager as any).instance = undefined;
      manager = FarcasterManager.getInstance();
      expect(manager.isInMiniAppEnvironment()).toBe(false);
      (global as any).window = originalWindow;
    });
  });

  describe('getContext', () => {
    it('should return null before initialization', () => {
      expect(manager.getContext()).toBeNull();
    });
  });

  describe('shareStory', () => {
    it('should use web share API when not in mini app', async () => {
      const mockShare = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });
      await manager.shareStory('story-123', 'Test Story');
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ghost Writer: Test Story',
        })
      );
    });

    it('should not throw when share API is unavailable', async () => {
      delete (navigator as any).share;
      await expect(
        manager.shareStory('story-123', 'Test Story')
      ).resolves.not.toThrow();
    });
  });

  describe('requestNotificationPermission', () => {
    it('should return false when not in mini app', async () => {
      const result = await manager.requestNotificationPermission();
      expect(result).toBe(false);
    });
  });

  describe('sendNotification', () => {
    it('should not send when not in mini app', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await manager.sendNotification('Test', 'Body');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

describe('useFarcasterEnhanced hook', () => {
  it('should return all expected methods', () => {
    const hook = useFarcasterEnhanced();
    expect(typeof hook.initialize).toBe('function');
    expect(typeof hook.getContext).toBe('function');
    expect(typeof hook.isInMiniApp).toBe('function');
    expect(typeof hook.shareStory).toBe('function');
    expect(typeof hook.requestNotificationPermission).toBe('function');
    expect(typeof hook.sendNotification).toBe('function');
  });
});
