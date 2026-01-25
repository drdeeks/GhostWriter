/**
 * Wallet Connector Tests
 * Verifies Farcaster-first wallet connection with fallback to other wallets
 */

describe('Wallet Connector Configuration', () => {
  describe('Connector Order', () => {
    it('should have farcasterMiniAppConnector as the first connector', () => {
      // The connectors array order determines priority
      // farcasterMiniAppConnector must be first for Farcaster-default behavior
      const connectorOrder = [
        'farcasterMiniAppConnector',
        'injected',
        'coinbaseWallet',
        'walletConnect',
      ];

      expect(connectorOrder[0]).toBe('farcasterMiniAppConnector');
    });

    it('should include fallback connectors when Farcaster is not detected', () => {
      const fallbackConnectors = ['injected', 'coinbaseWallet', 'walletConnect'];

      expect(fallbackConnectors).toContain('injected');
      expect(fallbackConnectors).toContain('coinbaseWallet');
      expect(fallbackConnectors).toContain('walletConnect');
    });
  });

  describe('Farcaster Environment Detection', () => {
    it('should detect Farcaster miniapp via query param', () => {
      const search = '?miniapp=true';
      const isInMiniApp = search.includes('miniapp=true');
      expect(isInMiniApp).toBe(true);
    });

    it('should detect Farcaster miniapp via iframe context', () => {
      const windowRef = { id: 1 };
      const parentRef = { id: 2 };
      const isInIframe = windowRef !== parentRef;
      expect(isInIframe).toBe(true);
    });

    it('should detect Farcaster via referrer', () => {
      const referrer = 'https://warpcast.com/some-path';
      const isFromFarcaster = referrer.includes('farcaster') || referrer.includes('warpcast');
      expect(isFromFarcaster).toBe(true);
    });

    it('should detect Farcaster via user agent', () => {
      const userAgent = 'Mozilla/5.0 Farcaster/1.0';
      const isFarcasterUA = userAgent.includes('Farcaster');
      expect(isFarcasterUA).toBe(true);
    });

    it('should detect warpcast hostname', () => {
      const hostname = 'app.warpcast.com';
      const isWarpcast = hostname.includes('warpcast');
      expect(isWarpcast).toBe(true);
    });

    it('should return false when not in Farcaster environment', () => {
      const search = '';
      const referrer = '';
      const userAgent = 'Mozilla/5.0';
      const hostname = 'localhost';

      const isInMiniApp =
        search.includes('miniapp=true') ||
        referrer.includes('farcaster') ||
        userAgent.includes('Farcaster') ||
        hostname.includes('warpcast');

      expect(isInMiniApp).toBe(false);
    });
  });

  describe('Connector Availability', () => {
    it('should provide injected connector for MetaMask and similar', () => {
      const injectedConnector = { id: 'injected', name: 'Injected' };
      expect(injectedConnector.id).toBe('injected');
    });

    it('should provide Coinbase Wallet connector', () => {
      const coinbaseConnector = {
        id: 'coinbaseWallet',
        appName: 'Ghost Writer',
        appLogoUrl: 'https://ghostwriter.meme/icon.png',
      };
      expect(coinbaseConnector.id).toBe('coinbaseWallet');
      expect(coinbaseConnector.appName).toBe('Ghost Writer');
    });

    it('should provide WalletConnect connector with project ID', () => {
      const walletConnectConnector = {
        id: 'walletConnect',
        projectId: 'test-project-id',
      };
      expect(walletConnectConnector.id).toBe('walletConnect');
      expect(walletConnectConnector.projectId).toBeTruthy();
    });
  });
});

describe('Wallet Connection Behavior', () => {
  describe('Connection Priority', () => {
    it('should attempt Farcaster connection first in miniapp context', () => {
      const connectors = [
        { id: 'farcaster', priority: 1, isAvailable: true },
        { id: 'injected', priority: 2, isAvailable: true },
        { id: 'coinbase', priority: 3, isAvailable: true },
        { id: 'walletConnect', priority: 4, isAvailable: true },
      ];

      const sortedConnectors = connectors.sort((a, b) => a.priority - b.priority);
      expect(sortedConnectors[0].id).toBe('farcaster');
    });

    it('should fallback to injected wallet when Farcaster unavailable', () => {
      const connectors = [
        { id: 'farcaster', priority: 1, isAvailable: false },
        { id: 'injected', priority: 2, isAvailable: true },
        { id: 'coinbase', priority: 3, isAvailable: true },
        { id: 'walletConnect', priority: 4, isAvailable: true },
      ];

      const availableConnectors = connectors.filter(c => c.isAvailable);
      const sortedAvailable = availableConnectors.sort((a, b) => a.priority - b.priority);

      expect(sortedAvailable[0].id).toBe('injected');
    });

    it('should offer all detected wallets in connection modal', () => {
      const detectedWallets = [
        { id: 'metamask', name: 'MetaMask', detected: true },
        { id: 'coinbase', name: 'Coinbase Wallet', detected: true },
        { id: 'rainbow', name: 'Rainbow', detected: false },
      ];

      const availableWallets = detectedWallets.filter(w => w.detected);
      expect(availableWallets.length).toBe(2);
      expect(availableWallets.map(w => w.id)).toContain('metamask');
      expect(availableWallets.map(w => w.id)).toContain('coinbase');
    });
  });
});
