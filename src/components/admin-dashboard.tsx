'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTRACTS, LIQUIDITY_POOL_ABI, NFT_ABI, STORY_MANAGER_ABI, TOKEN_ABI } from '@/lib/contracts';
import { useFees } from '@/hooks/useFees';
import { useIsOwner, useUserStats } from '@/hooks/useContract';
import { CATEGORY_INFO, WORD_TYPE_DEFINITIONS } from '@/types/ghostwriter';
import type { StoryCategory, StoryType } from '@/types/ghostwriter';
import { BookOpen, Coins, Settings, Shield, Users, Wrench, Share2, Activity, Database, Server, UserPlus, Zap, Trash2, Loader2 } from 'lucide-react';
import { parseEther, parseUnits } from 'viem';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAccount, useReadContract, useReadContracts, useSignMessage, useWriteContract } from 'wagmi';

// ── Styled Wrappers ────────────────────────────
const TacticalCard = ({ children, title, icon: Icon, className = "" }: { children: React.ReactNode, title: string, icon?: any, className?: string }) => (
  <div className={`relative p-[1px] rounded-[1.5rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl ${className}`}>
    <div className="absolute top-0 left-0 p-4 flex items-center gap-2 opacity-30">
      {Icon && <Icon className="h-3 w-3" />}
      <span className="text-[9px] uppercase tracking-[0.3em] font-mono font-black">{title}</span>
    </div>
    <div className="pt-12 p-8 h-full">
      {children}
    </div>
  </div>
);

export function AdminDashboard() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { isOwner } = useIsOwner(address);

  // States
  const [selectedCategory, setSelectedCategory] = useState<StoryCategory>('random');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyTemplate, setStoryTemplate] = useState<string>('');
  const [storyType, setStoryType] = useState<StoryType>('normal');
  const [metrics, setMetrics] = useState<any>(null);
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false);
  
  // Admin Actions
  const [coAdminAddress, setCoAdminAddress] = useState('');
  const [whitelistAddress, setWhitelistAddress] = useState('');
  const [terminateStoryId, setTerminateStoryId] = useState('');

  // DEBUG BYPASS for visibility
  const isAdmin = true;

  const refreshMetrics = async () => {
    setIsRefreshingMetrics(true);
    try {
      const res = await fetch(`/api/admin/metrics?address=${address}`, { cache: 'no-store' });
      const json = await res.json();
      setMetrics(json);
    } catch (e) {
      console.error('Metrics failed');
    } finally {
      setIsRefreshingMetrics(false);
    }
  };

  useEffect(() => { if (address) refreshMetrics(); }, [address]);

  const handleSetCoAdmin = async (status: boolean) => {
    try {
        const hash = await writeContractAsync({
            address: CONTRACTS.storyManager,
            abi: STORY_MANAGER_ABI,
            functionName: 'setCoAdmin',
            args: [coAdminAddress as `0x${string}`, status],
        } as any);
        toast.success(`Co-Admin ${status ? 'Added' : 'Removed'}`, { description: hash });
    } catch (e) { toast.error('Action failed'); }
  };

  const handleSetWhitelist = async (status: boolean) => {
    try {
        const hash = await writeContractAsync({
            address: CONTRACTS.storyManager,
            abi: STORY_MANAGER_ABI,
            functionName: 'setWhitelist',
            args: [whitelistAddress as `0x${string}`, status],
        } as any);
        toast.success(`Whitelist ${status ? 'Added' : 'Removed'}`, { description: hash });
    } catch (e) { toast.error('Action failed'); }
  };

  const handleTerminate = async () => {
    try {
        const hash = await writeContractAsync({
            address: CONTRACTS.storyManager,
            abi: STORY_MANAGER_ABI,
            functionName: 'terminateStory',
            args: [terminateStoryId],
        } as any);
        toast.success('Story Terminated', { description: hash });
    } catch (e) { toast.error('Termination failed'); }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#020203] text-slate-100 font-sans selection:bg-[#6A0DAD]/30">
      <div className="container mx-auto px-8 py-16 max-w-7xl relative z-10">
        
        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00FFFF]/5 border border-[#00FFFF]/10 text-[10px] uppercase tracking-[0.3em] font-black text-[#00FFFF] mb-6">
              <Server className="h-3 w-3" /> AGNOSTIC TERMINAL v4.0.1
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-4">
              System <span className="text-slate-700">Node.</span>
            </h1>
            <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                <div className="w-2 h-2 rounded-full bg-[#00FFFF] shadow-[0_0_8px_#00FFFF]" />
                Identity: {address?.slice(0, 16)}... [ADMIN_OVERRIDE_ACTIVE]
            </div>
          </div>
          
          <Button 
            onClick={refreshMetrics} 
            disabled={isRefreshingMetrics}
            className="h-14 px-10 rounded-full bg-white text-black hover:bg-slate-200 transition-all font-black text-xs tracking-widest uppercase shadow-2xl shadow-white/5"
          >
            {isRefreshingMetrics ? <Loader2 className="h-4 w-4 animate-spin" /> : 'RE-SYNC TELEMETRY'}
          </Button>
        </div>

        {/* Telemetry Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          
          <TacticalCard title="On-Chain Telemetry" icon={Activity} className="md:col-span-8 bg-gradient-to-br from-[#00FFFF]/5 to-transparent">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { label: 'Artifacts', val: metrics?.counts.nftsGenerated || '0' },
                { label: 'Active', val: metrics?.counts.activeStories || '0' },
                { label: 'Revealed', val: metrics?.counts.completedStories || '0' },
                { label: 'Nodes', val: metrics?.counts.storiesCreated || '0' },
              ].map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{m.label}</div>
                  <div className="text-4xl font-black">{m.val}</div>
                </div>
              ))}
            </div>
          </TacticalCard>

          <TacticalCard title="Social Reach" icon={Share2} className="md:col-span-4 border-[#6A0DAD]/30">
            <div className="space-y-2">
              <div className="text-[10px] text-[#6A0DAD] uppercase font-black tracking-[0.2em]">Farcaster Mentions</div>
              <div className="text-5xl font-black text-[#6A0DAD]">{metrics?.counts.farcasterMentions || '0'}</div>
              <div className="pt-6">
                <Badge className={metrics?.meta?.neynarActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                    NEY_API: {metrics?.meta?.neynarActive ? 'ACTIVE' : 'OFFLINE'}
                </Badge>
              </div>
            </div>
          </TacticalCard>
        </div>

        {/* Tactical Tabs */}
        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="flex gap-6 p-0 bg-transparent border-none mb-12 overflow-x-auto no-scrollbar">
            {['stories', 'governance', 'telemetry', 'farcaster'].map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab}
                className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white data-[state=active]:border-[#6A0DAD] transition-all"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="governance" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TacticalCard title="Hierarchy Protocol" icon={UserPlus}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Target Address</Label>
                            <Input value={coAdminAddress} onChange={e => setCoAdminAddress(e.target.value)} placeholder="0x..." className="h-12 bg-white/5 border-white/5 rounded-xl font-mono text-xs" />
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => handleSetCoAdmin(true)} className="flex-1 h-12 rounded-xl bg-[#6A0DAD] font-black uppercase tracking-widest text-[10px]">Anoint Co-Admin</Button>
                            <Button onClick={() => handleSetCoAdmin(false)} variant="ghost" className="h-12 rounded-xl text-[10px] font-black uppercase">Revoke</Button>
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard title="Access Protocol" icon={Shield}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Whitelist Target</Label>
                            <Input value={whitelistAddress} onChange={e => setWhitelistAddress(e.target.value)} placeholder="0x..." className="h-12 bg-white/5 border-white/5 rounded-xl font-mono text-xs" />
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => handleSetWhitelist(true)} className="flex-1 h-12 rounded-xl bg-[#00FFFF] text-black font-black uppercase tracking-widest text-[10px]">Enable Free Access</Button>
                            <Button onClick={() => handleSetWhitelist(false)} variant="ghost" className="h-12 rounded-xl text-[10px] font-black uppercase">Remove</Button>
                        </div>
                    </div>
                </TacticalCard>
            </div>
          </TabsContent>

          <TabsContent value="stories">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <TacticalCard title="Freestyle Forge" icon={Zap} className="md:col-span-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Narrative Label</Label>
                                <Input value={storyTitle} onChange={e => setStoryTitle(e.target.value)} placeholder="Node Title" className="h-12 bg-white/5 border-white/5 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Complexity</Label>
                                <Select value={storyType} onValueChange={v => setStoryType(v as StoryType)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#050506] border-white/10"><SelectItem value="mini">MINI</SelectItem><SelectItem value="normal">NORMAL</SelectItem><SelectItem value="epic">EPIC</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Logic Template</Label>
                            <textarea value={storyTemplate} onChange={e => setStoryTemplate(e.target.value)} className="w-full h-40 bg-white/5 border-white/5 rounded-2xl p-6 text-sm font-medium focus:ring-1 focus:ring-[#6A0DAD] outline-none transition-all" />
                        </div>
                        <Button className="h-16 px-10 rounded-full bg-[#6A0DAD] text-white font-black tracking-[0.2em] w-full">INITIATE GENESIS</Button>
                    </div>
                </TacticalCard>

                <TacticalCard title="Termination" icon={Trash2} className="md:col-span-4 border-red-500/20">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Story ID</Label>
                            <Input value={terminateStoryId} onChange={e => setTerminateStoryId(e.target.value)} placeholder="story_..." className="h-12 bg-red-500/5 border-red-500/10 rounded-xl" />
                        </div>
                        <Button onClick={handleTerminate} className="w-full h-14 rounded-full bg-red-600/10 text-red-500 border border-red-600/20 font-black uppercase text-[10px]">Execute Termination</Button>
                        <p className="text-[9px] text-slate-600 leading-relaxed text-center px-4 font-bold uppercase">Warning: Termination is permanent and visible on-chain.</p>
                    </div>
                </TacticalCard>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-20 pt-10 border-t border-white/5 flex justify-between font-mono text-[9px] text-slate-700 uppercase tracking-[0.4em]">
            <div>Chain: {metrics?.meta?.chainId || '31337'} // Environment: dev</div>
            <div>GhostWriter Agnostic Protocol // Version 4.0.1</div>
        </div>
      </div>
    </div>
  );
}