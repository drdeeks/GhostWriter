'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface FarcasterContextType {
    isMiniApp: boolean;
    farcasterUser?: any;
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

    useEffect(() => {
        // Check if we're running in a Farcaster miniapp context
        const checkMiniAppContext = () => {
            try {
                // Check for Farcaster miniapp environment
                const isInMiniApp = typeof window !== 'undefined' &&
                    (window.location.search.includes('miniapp=true') ||
                        window.parent !== window ||
                        document.referrer.includes('farcaster'));

                setIsMiniApp(isInMiniApp);

                // If in miniapp context, try to initialize Farcaster SDK
                if (isInMiniApp) {
                    // Note: Farcaster SDK initialization would go here
                    // For now, we'll just set the context
                    console.log('Farcaster miniapp context detected');
                }
            } catch (error) {
                console.warn('Error checking miniapp context:', error);
                setIsMiniApp(false);
            }
        };

        checkMiniAppContext();
    }, []);

    const contextValue: FarcasterContextType = {
        isMiniApp,
        farcasterUser,
    };

    return (
        <FarcasterContext.Provider value={contextValue}>
            {children}
        </FarcasterContext.Provider>
    );
}
