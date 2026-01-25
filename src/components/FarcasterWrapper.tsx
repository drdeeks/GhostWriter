'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

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
        }, 1000); // Force ready after 1 second max

        const checkMiniAppContext = async () => {
            try {
                // Check for Farcaster miniapp environment
                const isInMiniApp = typeof window !== 'undefined' &&
                    (window.location.search.includes('miniapp=true') ||
                        window.parent !== window ||
                        document.referrer.includes('farcaster') ||
                        // Check for Farcaster SDK
                        !!(window as any).farcasterMiniApp);

                setIsMiniApp(isInMiniApp);

                // If in miniapp context, try to initialize Farcaster SDK
                if (isInMiniApp && (window as any).farcasterMiniApp) {
                    try {
                        const sdk = (window as any).farcasterMiniApp;
                        // Don't wait indefinitely for SDK ready
                        const readyPromise = Promise.race([
                            sdk.ready?.() || Promise.resolve(),
                            new Promise(resolve => setTimeout(resolve, 500))
                        ]);
                        
                        await readyPromise;
                        
                        // Try to get user context
                        const context = await sdk.context?.();
                        if (context?.user) {
                            setFarcasterUser(context.user);
                        }
                    } catch (sdkError) {
                        console.warn('Farcaster SDK initialization error:', sdkError);
                        // Continue anyway - don't block the app
                    }
                }
                
                setIsReady(true);
                clearTimeout(readyTimeout);
            } catch (error) {
                console.warn('Error checking miniapp context:', error);
                setIsMiniApp(false);
                setIsReady(true);
                clearTimeout(readyTimeout);
            }
        };

        checkMiniAppContext();

        return () => clearTimeout(readyTimeout);
    }, []);

    const contextValue: FarcasterContextType = {
        isMiniApp,
        farcasterUser,
        isReady,
    };

    // Don't render children until ready to prevent splash hang
    if (!isReady) {
        return null;
    }

    return (
        <FarcasterContext.Provider value={contextValue}>
            {children}
        </FarcasterContext.Provider>
    );
}
