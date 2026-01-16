'use client';

import { useRefunds } from '@/hooks/useRefunds';
import { useEffect, useRef } from 'react';
import { useHaptic } from '@/lib/haptic';

export function RefundBanner() {
  const { pendingRefund, pendingRefundFormatted, withdrawRefund, isPending, error } = useRefunds();
  const haptic = useHaptic();
  const hasNotified = useRef(false);

  useEffect(() => {
    if (pendingRefund > 0n && !hasNotified.current) {
      haptic.trigger('notification');
      hasNotified.current = true;
    } else if (pendingRefund === 0n) {
      hasNotified.current = false;
    }
  }, [pendingRefund, haptic]);

  if (!pendingRefund || pendingRefund === 0n) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-blue-900">
            💰 Refund Available: {pendingRefundFormatted} ETH
          </p>
          <p className="text-sm text-blue-700">
            You have excess payment to claim
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-1">
              Error: {error}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            haptic.trigger('light');
            withdrawRefund();
          }}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
        >
          {isPending ? 'Claiming...' : 'Claim Refund'}
        </button>
      </div>
    </div>
  );
}
