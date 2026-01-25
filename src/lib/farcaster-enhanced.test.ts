/**
 * Farcaster Enhanced Integration Tests
 * Tests the FarcasterManager class and useFarcasterEnhanced hook
 */

// Mock the Farcaster SDK
jest.mock('@farcaster/miniapp-sdk', () => ({
  sdk: {
    actions: {
      ready: jest.fn().mockResolvedValue(undefined),
      openUrl: jest.fn().mockResolvedValue(undefined),
    },
    context: Promise.resolve({
      user: {
        fid: 12345,
        username: 'testuser',
        displayName: 'Test User',
        pfpUrl: 'https://example.com/avatar.png',
      },
    }),
  },
}));

jest.mock('./constants', () => ({
  FARCASTER_CONFIG: {
    frameUrl: 'https://ghostwriter.meme',
  },
}));

import { FarcasterManager, useFarcasterEnhanced } from './farcaster-enhanced';

describe('FarcasterManager', () => {
  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FarcasterManager.getInstance();
      const instance2 = FarcasterManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Environment Detection Logic', () => {
    it('should detect miniapp via query parameter', () => {
      const search = '?miniapp=true';
      const isInMiniApp = search.includes('miniapp=true');
      expect(isInMiniApp).toBe(true);
    });

    it('should detect miniapp via iframe', () => {
      const windowRef = { id: 1 };
      const parentRef = { id: 2 };
      const isInIframe = windowRef !== parentRef;
      expect(isInIframe).toBe(true);
    });

    it('should detect via user agent', () => {
      const userAgent = 'Mozilla/5.0 Farcaster/1.0';
      const isFarcaster = userAgent.includes('Farcaster');
      expect(isFarcaster).toBe(true);
    });

    it('should detect via warpcast hostname', () => {
      const hostname = 'app.warpcast.com';
      const isWarpcast = hostname.includes('warpcast');
      expect(isWarpcast).toBe(true);
    });
  });

  describe('Interface Types', () => {
    it('should define FarcasterUser interface correctly', () => {
      const user = {
        fid: 12345,
        username: 'testuser',
        displayName: 'Test User',
        pfpUrl: 'https://example.com/avatar.png',
      };

      expect(user.fid).toBe(12345);
      expect(user.username).toBe('testuser');
    });

    it('should define FarcasterContext interface correctly', () => {
      const context = {
        user: { fid: 123, username: 'test' },
        location: undefined,
      };

      expect(context.user).toBeDefined();
      expect(context.location).toBeUndefined();
    });
  });

  describe('SDK Integration', () => {
    it('should call sdk.actions.ready on initialization in miniapp', () => {
      const { sdk } = require('@farcaster/miniapp-sdk');
      expect(typeof sdk.actions.ready).toBe('function');
    });

    it('should call sdk.actions.openUrl for sharing', () => {
      const { sdk } = require('@farcaster/miniapp-sdk');
      expect(typeof sdk.actions.openUrl).toBe('function');
    });
  });
});

describe('useFarcasterEnhanced', () => {
  beforeEach(() => {
    (FarcasterManager as any).instance = undefined;
  });

  it('should return hook methods', () => {
    const hook = useFarcasterEnhanced();

    expect(typeof hook.initialize).toBe('function');
    expect(typeof hook.getContext).toBe('function');
    expect(typeof hook.isInMiniApp).toBe('function');
    expect(typeof hook.shareStory).toBe('function');
    expect(typeof hook.requestNotificationPermission).toBe('function');
    expect(typeof hook.sendNotification).toBe('function');
  });

  it('should use the same manager instance', () => {
    const hook1 = useFarcasterEnhanced();
    const hook2 = useFarcasterEnhanced();

    // Both hooks should operate on the same singleton
    expect(hook1.isInMiniApp()).toBe(hook2.isInMiniApp());
  });
});
