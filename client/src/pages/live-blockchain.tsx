import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { 
  Sparkles, 
  Coins, 
  Image as ImageIcon, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Gem,
  ExternalLink,
  Activity,
  Layers,
  Crown,
  Shield,
  Zap
} from "lucide-react";

interface NFTItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  collection?: string;
  rarity?: string;
  price?: string;
  chainId?: string;
  contractAddress?: string;
  tokenId?: string;
  attributes?: any[];
}

interface TokenItem {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  contractAddress: string;
  chainId: string;
  decimals: string;
  totalSupply?: string;
  price?: number;
  priceChange24h?: number;
  isVerified?: string;
}

interface RelicItem {
  id: string;
  name: string;
  type: string;
  description: string;
  rarity: string;
  boost: string;
  imageUrl?: string;
  unlockCriteria?: string;
}

interface CollectionStats {
  totalNfts: number;
  totalTokens: number;
  totalRelics: number;
  totalVolume: string;
}

export default function LiveBlockchainPage() {
  const { account } = useWeb3();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState("all");
  const [selectedRarity, setSelectedRarity] = useState("all");

  // Live NFT marketplace data - auto-refresh every 10 seconds
  const { data: featuredNfts, isLoading: nftsLoading, refetch: refetchNfts } = useQuery<any>({
    queryKey: ["/api/nft-marketplace/featured"],
    refetchInterval: 10000,
  });

  // Live NFT collections - auto-refresh every 15 seconds
  const { data: collections, isLoading: collectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/nft-marketplace/collections"],
    refetchInterval: 15000,
  });

  // Live tokens - auto-refresh every 10 seconds
  const { data: tokens, isLoading: tokensLoading } = useQuery<TokenItem[]>({
    queryKey: ["/api/tokens"],
    refetchInterval: 10000,
  });

  // Relic definitions - static, no auto-refresh needed
  const { data: relicDefs, isLoading: relicsLoading } = useQuery<any>({
    queryKey: ["/api/nft/relic-definitions"],
  });

  // Marketplace stats - auto-refresh every 30 seconds
  const { data: marketStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/nft-marketplace/stats"],
    refetchInterval: 30000,
  });

  // Live prices for context
  const { data: prices } = useQuery<any>({
    queryKey: ["/api/prices"],
    refetchInterval: 5000,
  });

  const getRarityColor = (rarity: string) => {
    const r = rarity?.toLowerCase();
    if (r === 'legendary' || r === 'divine') return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black';
    if (r === 'epic' || r === 'mythic') return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    if (r === 'rare') return 'bg-blue-500 text-white';
    if (r === 'uncommon') return 'bg-green-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getChainName = (chainId: string) => {
    const chains: Record<string, string> = {
      '1': 'Ethereum',
      '137': 'Polygon',
      '56': 'BSC',
      '43114': 'Avalanche',
      '42161': 'Arbitrum',
      '10': 'Optimism',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  // Filter NFTs
  const filteredNfts = (featuredNfts?.nfts || []).filter((nft: any) => {
    if (searchQuery && !nft.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedChain !== 'all' && nft.chainId !== selectedChain) return false;
    if (selectedRarity !== 'all' && nft.rarity?.toLowerCase() !== selectedRarity.toLowerCase()) return false;
    return true;
  });

  // Filter tokens
  const filteredTokens = (tokens || []).filter((token: TokenItem) => {
    if (searchQuery && !token.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !token.symbol?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedChain !== 'all' && token.chainId !== selectedChain) return false;
    return true;
  });

  // Filter relics
  const relicsList = relicDefs?.relics || [];
  const filteredRelics = relicsList.filter((relic: any) => {
    if (searchQuery && !relic.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedRarity !== 'all' && relic.rarity?.toLowerCase() !== selectedRarity.toLowerCase()) return false;
    return true;
  });

  const stats = {
    totalNfts: featuredNfts?.nfts?.length || 0,
    totalCollections: collections?.length || 0,
    totalTokens: tokens?.length || 0,
    totalRelics: relicsList.length || 0,
    floorPrice: marketStats?.floorPrice || '0',
    volume24h: marketStats?.volume24h || '0',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Live Blockchain Assets</h1>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          </div>
          <p className="text-gray-400">Real-time NFTs, Tokens & Relics across multiple chains</p>
        </div>

        {/* Live Stats Bar */}
        <div className="grid gap-4 md:grid-cols-6 mb-8">
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">NFTs</p>
                  <p className="text-xl font-bold text-white" data-testid="stat-nfts">
                    {statsLoading ? '...' : stats.totalNfts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-blue-500/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Collections</p>
                  <p className="text-xl font-bold text-white" data-testid="stat-collections">
                    {collectionsLoading ? '...' : stats.totalCollections}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-green-500/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Tokens</p>
                  <p className="text-xl font-bold text-white" data-testid="stat-tokens">
                    {tokensLoading ? '...' : stats.totalTokens}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-yellow-500/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Gem className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">Relics</p>
                  <p className="text-xl font-bold text-white" data-testid="stat-relics">
                    {relicsLoading ? '...' : stats.totalRelics}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-emerald-500/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-xs text-gray-400">Floor Price</p>
                  <p className="text-xl font-bold text-white" data-testid="stat-floor">
                    {stats.floorPrice} ETH
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-pink-500/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-pink-400" />
                <div>
                  <p className="text-xs text-gray-400">24h Volume</p>
                  <p className="text-xl font-bold text-white" data-testid="stat-volume">
                    {stats.volume24h} ETH
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Price Ticker */}
        {prices && (
          <div className="mb-6 overflow-hidden">
            <div className="flex gap-4 animate-marquee" data-testid="live-price-ticker">
              {Object.entries(prices).slice(0, 6).map(([symbol, data]: [string, any]) => (
                <div key={symbol} className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full border border-gray-700">
                  <span className="font-semibold text-white">{symbol}</span>
                  <span className="text-green-400">${data?.usd?.toLocaleString() || '0'}</span>
                  <span className={`text-xs ${(data?.usd_24h_change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(data?.usd_24h_change || 0) >= 0 ? '+' : ''}{(data?.usd_24h_change || 0).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <Card className="bg-black/40 border-gray-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search NFTs, Tokens, Relics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                  data-testid="input-search-blockchain"
                />
              </div>
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger className="w-full md:w-48 bg-gray-900/50 border-gray-600 text-white" data-testid="select-chain">
                  <SelectValue placeholder="All Chains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  <SelectItem value="1">Ethereum</SelectItem>
                  <SelectItem value="137">Polygon</SelectItem>
                  <SelectItem value="56">BSC</SelectItem>
                  <SelectItem value="42161">Arbitrum</SelectItem>
                  <SelectItem value="10">Optimism</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-full md:w-48 bg-gray-900/50 border-gray-600 text-white" data-testid="select-rarity">
                  <SelectValue placeholder="All Rarities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="uncommon">Uncommon</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
                onClick={() => refetchNfts()}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="nfts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-gray-700">
            <TabsTrigger value="nfts" className="data-[state=active]:bg-purple-500/20" data-testid="tab-nfts">
              <ImageIcon className="w-4 h-4 mr-2" />
              NFTs
            </TabsTrigger>
            <TabsTrigger value="collections" className="data-[state=active]:bg-blue-500/20" data-testid="tab-collections">
              <Sparkles className="w-4 h-4 mr-2" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="tokens" className="data-[state=active]:bg-green-500/20" data-testid="tab-tokens">
              <Coins className="w-4 h-4 mr-2" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="relics" className="data-[state=active]:bg-yellow-500/20" data-testid="tab-relics">
              <Gem className="w-4 h-4 mr-2" />
              Relics
            </TabsTrigger>
          </TabsList>

          {/* NFTs Tab */}
          <TabsContent value="nfts" className="space-y-6">
            {nftsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="bg-black/40 border-gray-700 animate-pulse">
                    <div className="aspect-square bg-gray-800"></div>
                    <CardContent className="pt-4">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNfts.length === 0 ? (
              <Card className="bg-black/40 border-gray-700">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No NFTs Found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="nfts-grid">
                {filteredNfts.map((nft: any, idx: number) => (
                  <Card 
                    key={nft.id || idx} 
                    className="bg-black/40 border-gray-700 overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer group"
                    data-testid={`nft-card-${idx}`}
                  >
                    <div className="aspect-square bg-gray-800 relative overflow-hidden">
                      {nft.imageUrl ? (
                        <img
                          src={nft.imageUrl}
                          alt={nft.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-gray-600" />
                        </div>
                      )}
                      {nft.rarity && (
                        <Badge className={`absolute top-2 right-2 ${getRarityColor(nft.rarity)}`}>
                          {nft.rarity}
                        </Badge>
                      )}
                      {nft.chainId && (
                        <Badge className="absolute top-2 left-2 bg-black/60 text-white">
                          {getChainName(nft.chainId)}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-white mb-1 truncate">{nft.name || 'Unnamed NFT'}</h3>
                      {nft.collection && (
                        <p className="text-sm text-purple-400 mb-2">{nft.collection}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          {nft.price && (
                            <p className="text-lg font-bold text-white">{nft.price} ETH</p>
                          )}
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" data-testid={`button-view-nft-${idx}`}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-6">
            {collectionsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-black/40 border-gray-700 animate-pulse">
                    <div className="h-32 bg-gray-800"></div>
                    <CardContent className="pt-4">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !collections || collections.length === 0 ? (
              <Card className="bg-black/40 border-gray-700">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Collections Found</h3>
                  <p className="text-gray-400">Collections will appear here when available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="collections-grid">
                {collections.map((collection: any, idx: number) => (
                  <Card 
                    key={collection.id || idx} 
                    className="bg-black/40 border-gray-700 overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer"
                    data-testid={`collection-card-${idx}`}
                  >
                    <div className="h-32 bg-gradient-to-r from-blue-900/50 to-purple-900/50 relative">
                      {collection.bannerImageUrl && (
                        <img src={collection.bannerImageUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute -bottom-8 left-4">
                        <div className="w-16 h-16 rounded-xl border-4 border-gray-900 bg-gray-800 overflow-hidden">
                          {collection.imageUrl ? (
                            <img src={collection.imageUrl} alt={collection.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-12">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white truncate">{collection.name}</h3>
                        {collection.isVerified === 'true' && (
                          <Shield className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{collection.description || 'No description'}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-gray-500">Floor</p>
                          <p className="text-white font-semibold">{collection.floorPrice || '0'} ETH</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Items</p>
                          <p className="text-white font-semibold">{collection.totalSupply || '0'}</p>
                        </div>
                        <Badge className="bg-gray-700 text-gray-300">
                          {getChainName(collection.chainId || '1')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-6">
            {tokensLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="bg-black/40 border-gray-700 animate-pulse">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/6"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTokens.length === 0 ? (
              <Card className="bg-black/40 border-gray-700">
                <CardContent className="py-12 text-center">
                  <Coins className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Tokens Found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3" data-testid="tokens-list">
                {filteredTokens.map((token: TokenItem, idx: number) => (
                  <Card 
                    key={token.id || idx} 
                    className="bg-black/40 border-gray-700 hover:border-green-500/50 transition-all"
                    data-testid={`token-row-${idx}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center overflow-hidden">
                          {token.logoUrl ? (
                            <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-cover" />
                          ) : (
                            <Coins className="w-6 h-6 text-green-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{token.name}</h3>
                            <Badge variant="outline" className="text-gray-400 border-gray-600">
                              {token.symbol}
                            </Badge>
                            {token.isVerified === 'true' && (
                              <Shield className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{getChainName(token.chainId)}</p>
                        </div>
                        <div className="text-right">
                          {token.price ? (
                            <>
                              <p className="font-bold text-white">${token.price.toLocaleString()}</p>
                              {token.priceChange24h !== undefined && (
                                <p className={`text-sm flex items-center justify-end gap-1 ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {token.priceChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500">No price data</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="border-green-500 text-green-400" data-testid={`button-trade-token-${idx}`}>
                          Trade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Relics Tab */}
          <TabsContent value="relics" className="space-y-6">
            {relicsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-black/40 border-gray-700 animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-16 w-16 bg-gray-700 rounded-full mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredRelics.length === 0 ? (
              <Card className="bg-black/40 border-gray-700">
                <CardContent className="py-12 text-center">
                  <Gem className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Relics Found</h3>
                  <p className="text-gray-400">Relics are special collectible items with unique powers</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="relics-grid">
                {filteredRelics.map((relic: any, idx: number) => (
                  <Card 
                    key={relic.id || idx} 
                    className="bg-black/40 border-gray-700 hover:border-yellow-500/50 transition-all overflow-hidden"
                    data-testid={`relic-card-${idx}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 pointer-events-none"></div>
                    <CardContent className="pt-6 relative">
                      <div className="text-center mb-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center mb-4 border-2 border-yellow-500/50">
                          {relic.imageUrl ? (
                            <img src={relic.imageUrl} alt={relic.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Crown className="w-10 h-10 text-yellow-400" />
                          )}
                        </div>
                        <Badge className={getRarityColor(relic.rarity || 'common')}>
                          {relic.rarity || 'Common'}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-white text-lg text-center mb-2">{relic.name}</h3>
                      <p className="text-sm text-gray-400 text-center mb-4">{relic.description || 'A mysterious relic'}</p>
                      <div className="space-y-2">
                        {relic.type && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Type</span>
                            <span className="text-white">{relic.type}</span>
                          </div>
                        )}
                        {relic.boost && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Boost</span>
                            <span className="text-green-400">{relic.boost}</span>
                          </div>
                        )}
                        {relic.unlockCriteria && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Unlock</span>
                            <span className="text-purple-400 text-right text-xs">{relic.unlockCriteria}</span>
                          </div>
                        )}
                      </div>
                      <Button className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold" data-testid={`button-claim-relic-${idx}`}>
                        <Gem className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
