'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserNFTs } from '@/hooks/useContract';
import { ImageIcon, Lock, Sparkles } from 'lucide-react';

interface NFTCollectionProps {
  address: `0x${string}` | undefined;
}

export function NFTCollection({ address }: NFTCollectionProps) {
  const { nftCount } = useUserNFTs(address);

  // For now, show placeholder until we fetch actual NFT data
  // In production, fetch all NFTs for the user
  const nfts: Array<{
    id: string;
    status: 'hidden' | 'revealed';
    type: 'contributor' | 'creator';
    storyTitle?: string;
    wordType?: string;
    position?: number;
    totalWords?: number;
  }> = [];

  const hiddenNFTs = nfts.filter((nft) => nft.status === 'hidden');
  const revealedNFTs = nfts.filter((nft) => nft.status === 'revealed');
  const creatorNFTs = nfts.filter((nft) => nft.type === 'creator');

  if (!address) {
    return (
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Connect your wallet
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            View your Ghost Writer NFT collection
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            🖼️ Your NFT Collection
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {nftCount} NFT{nftCount !== 1 ? 's' : ''} owned
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-800">
          <TabsTrigger value="all">All ({nftCount})</TabsTrigger>
          <TabsTrigger value="hidden">Hidden ({hiddenNFTs.length})</TabsTrigger>
          <TabsTrigger value="revealed">Revealed ({revealedNFTs.length})</TabsTrigger>
          <TabsTrigger value="creator">Creator ({creatorNFTs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {nftCount === 0 ? (
            <Card className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-white/50 dark:bg-gray-800/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ImageIcon className="h-16 w-16 text-indigo-400 mb-4" />
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No NFTs yet
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Contribute to stories to mint your first NFT!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* NFTs will be rendered here when fetched */}
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardHeader className="text-center pb-2">
                  <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-6xl">🔒</div>
                  </div>
                  <Badge className="mx-auto bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Hidden
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-center">
                  <p className="font-semibold text-lg">Story Title</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adjective (#3/20)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Story in progress...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hidden" className="mt-6">
          {hiddenNFTs.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lock className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No hidden NFTs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Hidden NFTs */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="revealed" className="mt-6">
          {revealedNFTs.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No revealed NFTs yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Revealed NFTs */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="creator" className="mt-6">
          {creatorNFTs.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-600 dark:text-gray-400">No creator NFTs yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Create a story to earn your first creator NFT!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Creator NFTs */}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
