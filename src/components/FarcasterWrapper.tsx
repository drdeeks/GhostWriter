'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

// Use a conditional require to avoid top-level import issues in non-ESM environments (like some Jest configs)
const getSdk = () => {
    if (typeof window === 'undefined') return null;
    try {
        return require('@farcaster/miniapp-sdk').sdk;
    } catch (e) {
        return null;
    }
};

interface FarcasterContextType {
    isMiniApp: boolean;
    farcasterUser?: any;
    isReady: boolean;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function useFarcaster() {
    const context = useContext(FarcasterContext);
    if (!context) {
        throw new Error('useFarcaster must be used within FarcasterWrapper');
    }
    return context;
}

interface FarcasterWrapperProps {
    children: ReactNode;
}

export default function FarcasterWrapper({ children }: FarcasterWrapperProps) {
    const [isMiniApp, setIsMiniApp] = useState(false);
    const [farcasterUser, setFarcasterUser] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Add timeout to prevent infinite loading
        const readyTimeout = setTimeout(() => {
            setIsReady(true);
        }, 2000); // Force ready after 2 seconds max

        const initializeFarcaster = async () => {
            try {
                // Check for Farcaster miniapp environment
                const isInMiniApp = typeof window !== 'undefined' &&
                    (window.location.search.includes('miniapp=true') ||
                        window.parent !== window ||
                        document.referrer.includes('farcaster'));

                setIsMiniApp(isInMiniApp);

                // If in miniapp context, initialize SDK
                if (isInMiniApp) {
                    const sdk = getSdk();
                    if (!sdk) {
                        setIsReady(true);
                        return;
                    }

                    try {
                        // Get user context
                        const context = await sdk.context;
                        if (context?.user) {
                            setFarcasterUser(context.user);
                        }

                        // CRITICAL: Tell Farcaster the app is ready to display
                        // This dismisses the splash screen
                        await sdk.actions.ready();
                        
                        console.log('Farcaster SDK initialized and ready called');
                    } catch (sdkError) {
                        console.warn('Farcaster SDK error:', sdkError);
                        // Still try to call ready even if there's an error
                        try {
                            await sdk.actions.ready();
                        } catch (e) {
                            console.warn('Failed to call sdk.actions.ready:', e);
                        }
                    }
                } else {
                    // Not in miniapp, still try to call ready as a fallback
                    const sdk = getSdk();
                    if (sdk) {
                        try {
                            await sdk.actions.ready();
                        } catch (e) {
                            // Ignore error if not in Farcaster context
                            console.log('Not in Farcaster miniapp context');
                        }
                    }
                }
                
                setIsReady(true);
                clearTimeout(readyTimeout);
            } catch (error) {
                console.warn('Error initializing Farcaster:', error);
                setIsMiniApp(false);
                setIsReady(true);
                clearTimeout(readyTimeout);
            }
        };

        initializeFarcaster();

        return () => clearTimeout(readyTimeout);
    }, []);

    const contextValue: FarcasterContextType = {
        isMiniApp,
        farcasterUser,
        isReady,
    };

    // Don't render children until ready
    if (!isReady) {
        return null;
    }

    return (
        <FarcasterContext.Provider value={contextValue}>
            {children}
        </FarcasterContext.Provider>
    );
}
