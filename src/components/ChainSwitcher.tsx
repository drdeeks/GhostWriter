'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { SUPPORTED_CHAIN_IDS } from '@/lib/contracts';

const CHAIN_LABELS: Record<number, string> = {
  8453: 'Base',
  143: 'Monad',
};

export function ChainSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  return (
    <Select
      value={String(chainId)}
      onValueChange={(value) => switchChain({ chainId: Number(value) })}
    >
      <SelectTrigger className={`w-32 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        <span>{CHAIN_LABELS[chainId] ?? `Chain ${chainId}`}</span>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CHAIN_IDS.map((id) => (
          <SelectItem key={id} value={String(id)}>
            {CHAIN_LABELS[id] ?? id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
