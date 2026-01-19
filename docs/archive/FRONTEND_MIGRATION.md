# 🔄 Frontend Migration Guide - Security Updates

## Overview

The smart contracts have been updated with enterprise-grade security fixes. This guide covers the frontend changes needed to support the new patterns.

---

## 🆕 New Features to Implement

### 1. Refund Withdrawal System

**What Changed**: Refunds are no longer sent immediately. Users must claim them manually.

**Implementation**:

```typescript
// src/hooks/useRefunds.ts
import { useReadContract, useWriteContract } from 'wagmi';
import { STORY_MANAGER_ABI } from '@/contracts/abis';

export function useRefunds(userAddress: `0x${string}`) {
  // Check pending refund
  const { data: pendingRefund } = useReadContract({
    address: process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS as `0x${string}`,
    abi: STORY_MANAGER_ABI,
    functionName: 'pendingRefunds',
    args: [userAddress],
  });

  // Withdraw refund
  const { writeContract: withdrawRefund, isPending } = useWriteContract();

  const handleWithdraw = async () => {
    if (!pendingRefund || pendingRefund === 0n) return;
    
    await withdrawRefund({
      address: process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS as `0x${string}`,
      abi: STORY_MANAGER_ABI,
      functionName: 'withdrawRefund',
    });
  };

  return {
    pendingRefund,
    withdrawRefund: handleWithdraw,
    isPending,
  };
}
```

**UI Component**:

```tsx
// src/components/RefundBanner.tsx
'use client';

import { useAccount } from 'wagmi';
import { useRefunds } from '@/hooks/useRefunds';
import { formatEther } from 'viem';

export function RefundBanner() {
  const { address } = useAccount();
  const { pendingRefund, withdrawRefund, isPending } = useRefunds(address!);

  if (!pendingRefund || pendingRefund === 0n) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-blue-900">
            Refund Available: {formatEther(pendingRefund)} ETH
          </p>
          <p className="text-sm text-blue-700">
            You have excess payment to claim
          </p>
        </div>
        <button
          onClick={withdrawRefund}
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? 'Claiming...' : 'Claim Refund'}
        </button>
      </div>
    </div>
  );
}
```

**Add to Layout**:

```tsx
// src/app/layout.tsx or main page
import { RefundBanner } from '@/components/RefundBanner';

export default function Layout() {
  return (
    <div>
      <RefundBanner />
      {/* rest of layout */}
    </div>
  );
}
```

---

### 2. Story Completion - Three Phase Process

**What Changed**: Story completion now requires three phases to handle large stories.

**Implementation**:

```typescript
// src/hooks/useStoryCompletion.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { STORY_MANAGER_ABI } from '@/contracts/abis';

export function useStoryCompletion() {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const processCompletionBatch = async (
    storyId: string,
    startPosition: number,
    endPosition: number
  ) => {
    await writeContract({
      address: process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS as `0x${string}`,
      abi: STORY_MANAGER_ABI,
      functionName: 'processCompletionBatch',
      args: [storyId, BigInt(startPosition), BigInt(endPosition)],
    });
  };

  const finalizeStory = async (storyId: string) => {
    await writeContract({
      address: process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS as `0x${string}`,
      abi: STORY_MANAGER_ABI,
      functionName: 'finalizeStory',
      args: [storyId],
    });
  };

  const completeStoryFull = async (storyId: string, totalSlots: number) => {
    // Process in batches of 50
    const batchSize = 50;
    
    for (let i = 1; i <= totalSlots; i += batchSize) {
      const end = Math.min(i + batchSize - 1, totalSlots);
      await processCompletionBatch(storyId, i, end);
      
      // Wait for confirmation before next batch
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Finalize
    await finalizeStory(storyId);
  };

  return {
    processCompletionBatch,
    finalizeStory,
    completeStoryFull,
    isProcessing: isConfirming,
  };
}
```

**UI Component**:

```tsx
// src/components/StoryCompletionModal.tsx
'use client';

import { useState } from 'react';
import { useStoryCompletion } from '@/hooks/useStoryCompletion';

interface Props {
  storyId: string;
  totalSlots: number;
  onComplete: () => void;
}

export function StoryCompletionModal({ storyId, totalSlots, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const { completeStoryFull, isProcessing } = useStoryCompletion();

  const handleComplete = async () => {
    try {
      await completeStoryFull(storyId, totalSlots);
      onComplete();
    } catch (error) {
      console.error('Completion failed:', error);
    }
  };

  return (
    <div className="modal">
      <h2>Story Complete! 🎉</h2>
      <p>Processing {totalSlots} contributions...</p>
      
      {isProcessing && (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={isProcessing}
        className="btn-primary"
      >
        {isProcessing ? 'Processing...' : 'Reveal NFTs'}
      </button>
    </div>
  );
}
```

**Auto-trigger on last word**:

```typescript
// In your contributeWord success handler
if (story.filledSlots + 1 === story.totalSlots) {
  // Story will be marked complete automatically
  // Show completion modal
  setShowCompletionModal(true);
}
```

---

### 3. Leaderboard - Off-Chain Sorting

**What Changed**: Leaderboard is no longer sorted on-chain. Use events for sorting.

**Implementation**:

```typescript
// src/hooks/useLeaderboard.ts
import { usePublicClient, useReadContract } from 'wagmi';
import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  user: string;
  contributions: bigint;
  rank: number;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const publicClient = usePublicClient();

  // Get raw leaderboard data
  const { data: rawLeaderboard } = useReadContract({
    address: process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS as `0x${string}`,
    abi: STORY_MANAGER_ABI,
    functionName: 'getLeaderboard',
    args: [0n, 100n], // Get top 100
  });

  useEffect(() => {
    if (!rawLeaderboard) return;

    // Sort by contributions (descending)
    const sorted = [...rawLeaderboard].sort((a, b) => 
      Number(b.contributions - a.contributions)
    );

    // Add ranks
    const ranked = sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    setLeaderboard(ranked);
  }, [rawLeaderboard]);

  return { leaderboard };
}
```

**Alternative: Use Events**:

```typescript
// Listen to LeaderboardUpdated events for real-time updates
const { data: events } = useWatchContractEvent({
  address: process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS as `0x${string}`,
  abi: STORY_MANAGER_ABI,
  eventName: 'LeaderboardUpdated',
  onLogs: (logs) => {
    // Update leaderboard state
    console.log('Leaderboard updated:', logs);
  },
});
```

---

## 📝 Updated Contract ABIs

Add these new functions to your ABIs:

```typescript
// contracts/abis/StoryManager.ts
export const STORY_MANAGER_ABI = [
  // ... existing functions
  
  // New functions
  {
    name: 'pendingRefunds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'withdrawRefund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'processCompletionBatch',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'storyId', type: 'string' },
      { name: 'startPosition', type: 'uint256' },
      { name: 'endPosition', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'finalizeStory',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'storyId', type: 'string' }],
    outputs: [],
  },
  {
    name: 'finalWordCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  
  // New events
  {
    name: 'RefundWithdrawn',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;
```

---

## 🧪 Testing Checklist

- [ ] Test refund withdrawal flow
- [ ] Test story completion with mini stories (10 slots)
- [ ] Test story completion with normal stories (20 slots)
- [ ] Test story completion with epic stories (200 slots)
- [ ] Test leaderboard sorting
- [ ] Test edge case: multiple refunds accumulating
- [ ] Test edge case: completion batch failures

---

## 🚀 Deployment Steps

1. **Update Contract Addresses**:
```env
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x... # New deployed address
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
```

2. **Update ABIs**:
```bash
# Copy new ABIs from compiled contracts
cp artifacts/contracts/StoryManager.sol/StoryManager.json src/contracts/abis/
```

3. **Deploy Frontend**:
```bash
npm run build
npm run deploy
```

---

## 📊 User Experience Improvements

### Refund Notifications
- Show banner when refund is available
- Add notification badge to wallet icon
- Send email/push notification (optional)

### Story Completion Progress
- Show progress bar during batch processing
- Display estimated time remaining
- Celebrate completion with animation

### Leaderboard Updates
- Real-time updates using events
- Smooth animations for rank changes
- Highlight user's position

---

## 🐛 Common Issues & Solutions

### Issue: Refund not showing
**Solution**: Check if user overpaid. Refunds only exist if `msg.value > requiredFee`.

### Issue: Story completion fails
**Solution**: Process in smaller batches (25 instead of 50) or increase gas limit.

### Issue: Leaderboard not updating
**Solution**: Ensure event listeners are properly configured and sorting logic is correct.

---

## 📚 Additional Resources

- [Security Fixes Documentation](./SECURITY_FIXES.md)
- [Contract Documentation](./docs/COMPLETE_SETUP_GUIDE.md)
- [Wagmi Documentation](https://wagmi.sh)

---

**Questions?** Contact drdeeks@outlook.com
