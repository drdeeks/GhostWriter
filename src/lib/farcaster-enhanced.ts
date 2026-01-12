import { sdk } from '@farcaster/miniapp-sdk';
import { FARCASTER_CONFIG } from './constants';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
}

export interface FarcasterContext {
  user?: FarcasterUser;
  location?: {
    placeId: string;
    description: string;
  };
}

// Enhanced Farcaster integration with enterprise features
export class FarcasterManager {
  private static instance: FarcasterManager;
  private isInitialized: boolean = false;
  private context: FarcasterContext | null = null;
  private isInMiniApp: boolean = false;

  static getInstance(): FarcasterManager {
    if (!FarcasterManager.instance) {
      FarcasterManager.instance = new FarcasterManager();
    }
    return FarcasterManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Detect Farcaster mini-app environment
      this.isInMiniApp = this.detectMiniAppEnvironment();
      
      if (this.isInMiniApp) {
        await sdk.actions.ready();
        const sdkContext = await sdk.context;
        
        // Transform SDK context to our interface
        this.context = {
          user: sdkContext?.user ? {
            fid: sdkContext.user.fid,
            username: sdkContext.user.username,
            displayName: sdkContext.user.displayName,
            pfpUrl: sdkContext.user.pfpUrl,
          } : undefined,
          // Simplified location handling
          location: undefined,
        };
        
        // Set up event listeners for mini-app lifecycle
        this.setupMiniAppListeners();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Farcaster initialization failed:', error);
      this.isInMiniApp = false;
    }
  }

  private detectMiniAppEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (
      window.location.search.includes('miniapp=true') ||
      window.parent !== window ||
      document.referrer.includes('farcaster') ||
      navigator.userAgent.includes('Farcaster') ||
      window.location.hostname.includes('warpcast')
    );
  }

  private setupMiniAppListeners(): void {
    // Listen for mini-app events
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://warpcast.com') return;
      
      switch (event.data.type) {
        case 'farcaster_miniapp_focus':
          this.handleMiniAppFocus();
          break;
        case 'farcaster_miniapp_blur':
          this.handleMiniAppBlur();
          break;
      }
    });
  }

  private handleMiniAppFocus(): void {
    // Refresh data when mini-app gains focus
    window.dispatchEvent(new CustomEvent('farcaster-focus'));
  }

  private handleMiniAppBlur(): void {
    // Pause expensive operations when mini-app loses focus
    window.dispatchEvent(new CustomEvent('farcaster-blur'));
  }

  getContext(): FarcasterContext | null {
    return this.context;
  }

  isInMiniAppEnvironment(): boolean {
    return this.isInMiniApp;
  }

  async shareStory(storyId: string, title: string): Promise<void> {
    if (!this.isInMiniApp) {
      // Fallback to web share API
      if (navigator.share) {
        await navigator.share({
          title: `Ghost Writer: ${title}`,
          text: 'Check out this collaborative story!',
          url: `${FARCASTER_CONFIG.frameUrl}/story/${storyId}`,
        });
      }
      return;
    }

    try {
      await sdk.actions.openUrl(`${FARCASTER_CONFIG.frameUrl}/story/${storyId}`);
    } catch (error) {
      console.error('Failed to share story:', error);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isInMiniApp) return false;
    
    try {
      // Farcaster SDK doesn't have this method yet, return true for now
      console.log('Notification permission requested (not yet supported by Farcaster SDK)');
      return true;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async sendNotification(title: string, body: string): Promise<void> {
    if (!this.isInMiniApp) return;
    
    try {
      // Farcaster SDK doesn't have this method yet, log for now
      console.log('Notification would be sent:', { title, body });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}

// React hook for Farcaster integration
export function useFarcasterEnhanced() {
  const manager = FarcasterManager.getInstance();
  
  return {
    initialize: () => manager.initialize(),
    getContext: () => manager.getContext(),
    isInMiniApp: () => manager.isInMiniAppEnvironment(),
    shareStory: (storyId: string, title: string) => manager.shareStory(storyId, title),
    requestNotificationPermission: () => manager.requestNotificationPermission(),
    sendNotification: (title: string, body: string) => manager.sendNotification(title, body),
  };
}
