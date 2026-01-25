'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  isLoading: boolean;
  minDisplayTime?: number;
  message?: string; // New prop for custom messages
}

export function LoadingScreen({ isLoading, minDisplayTime = 800, message }: LoadingScreenProps) {
  const [shouldShow, setShouldShow] = useState(isLoading);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Mark the time loading started (only when loading is true)
    if (isLoading) {
      startTimeRef.current = Date.now();
      setShouldShow(true);
      return;
    }

    // Ensure the spinner is shown for at least `minDisplayTime` ms.
    const startedAt = startTimeRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    const timer = setTimeout(() => {
      setShouldShow(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [isLoading, minDisplayTime]);

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
      {/* Ambient effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 text-center px-4">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent animate-pulse">
            👻 Ghost Writer
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium">
            Collaborative Storytelling • NFT Rewards
          </p>
        </div>

        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
        </div>

        {/* Loading text */}
        <p className="text-gray-400 text-sm md:text-base animate-pulse">
          {message || 'Initializing your storytelling experience...'}
        </p>
      </div>
    </div>
  );
}
