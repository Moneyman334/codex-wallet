import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWeb3 } from "@/hooks/use-web3";
import { ethers } from "ethers";
import { 
  Image as ImageIcon, 
  ShoppingCart, 
  Tag, 
  TrendingUp, 
  Eye, 
  Heart,
  ExternalLink,
  Sparkles,
  Shield,
  Zap,
  DollarSign,
  Activity
} from "lucide-react";

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  currency: string;
  collection: string;
  owner: string;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  rarity?: string;
  attributes?: { trait_type: string; value: string }[];
  forSale: boolean;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  floorPrice: string;
  volume24h: string;
  items: number;
  owners: number;
}

export default function NFTMarketplacePage() {
  const { toast } = useToast();
  const { account: address, isConnected } = useWeb3();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Fetch featured NFTs
  const { data: featuredNFTs = [], isLoading: nftsLoading } = useQuery<NFT[]>({
    queryKey: ["/api/nft-marketplace/featured"],
  });

  // Fetch collections
  const { data: collections = [], isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/nft-marketplace/collections"],
  });

  // Fetch user's NFTs
  const { data: myNFTs = [] } = useQuery<NFT[]>({
    queryKey: ["/api/nft-marketplace/my-nfts"],
    enabled: isConnected,
  });

  // Fetch marketplace stats
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/nft-marketplace/stats"],
  });

  // Buy NFT mutation
  const buyNFTMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/nft-marketplace/buy", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nft-marketplace/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nft-marketplace/my-nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nft-marketplace/stats"] });
      toast({
        title: "NFT Purchased!",
        description: "Your NFT has been added to your wallet.",
      });
    },
    onError: () => {
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase NFT. Please try again.",
        variant: "destructive",
      });
    },
  });

  // List NFT for sale mutation
  const listNFTMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/nft-marketplace/list", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nft-marketplace/my-nfts"] });
      toast({
        title: "NFT Listed!",
        description: "Your NFT is now available for sale.",
      });
    },
  });

  const handleBuyNFT = async (nft: NFT) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Web3 wallet to purchase NFTs.",
        variant: "destructive",
      });
      return;
    }

    // Check if currency is supported for on-chain payments
    if (nft.currency !== "ETH") {
      toast({
        title: "Payment Method Not Supported",
        description: `Web3 wallet direct payments currently only support ETH. This NFT is priced in ${nft.currency}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate contract address exists (prevent sending ETH to zero address)
    if (!nft.contractAddress || nft.contractAddress === "0x0000000000000000000000000000000000000000") {
      toast({
        title: "Invalid NFT Listing",
        description: "This NFT listing is missing required contract information. Please try another NFT.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Request MetaMask transaction for payment (ETH only)
      if (typeof window.ethereum !== 'undefined') {
        const ethereum = window.ethereum as any;
        
        // Convert price to wei safely using ethers.js (prevents floating point precision loss)
        const priceInWei = ethers.parseEther(nft.price);
        const priceHex = '0x' + priceInWei.toString(16);
        
        // Request transaction from MetaMask (let MetaMask estimate gas)
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: nft.contractAddress, // Contract or seller address (validated above)
            value: priceHex,
          }],
        });

        toast({
          title: "Transaction Submitted",
          description: "Wallet transaction confirmed. Processing purchase...",
        });

        // Step 2: Record purchase on backend
        buyNFTMutation.mutate({
          nftId: nft.id,
          tokenId: nft.tokenId,
          contractAddress: nft.contractAddress,
          price: nft.price,
          currency: nft.currency,
          txHash, // Include transaction hash
        });
      } else {
        throw new Error("Web3 wallet not found");
      }
    } catch (error: any) {
      if (error.code === 4001) {
        // User rejected transaction
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the wallet transaction.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: error.message || "Failed to process wallet transaction.",
          variant: "destructive",
        });
      }
    }
  };

  const getRarityBadge = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case "legendary":
        return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">Legendary</Badge>;
      case "epic":
        return <Badge className="bg-gradient-to-r from-purple-400 to-pink-500">Epic</Badge>;
      case "rare":
        return <Badge className="bg-gradient-to-r from-blue-400 to-cyan-500">Rare</Badge>;
      case "common":
        return <Badge className="bg-slate-500">Common</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              NFT Marketplace
            </h1>
            <p className="text-slate-400 mt-2">Discover, collect, and trade unique digital assets</p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
            <Shield className="h-4 w-4 mr-2" />
            On-Chain Verified
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white mt-1">${stats?.totalVolume || "0"}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total NFTs</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.totalNFTs || 0}</p>
                </div>
                <ImageIcon className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Listings</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.activeListings || 0}</p>
                </div>
                <Tag className="h-8 w-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Avg Floor Price</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.avgFloorPrice || "0"} ETH</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search NFTs, collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border-slate-700"
                data-testid="input-search"
              />
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="collectibles">Collectibles</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="select-sort">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Listed</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="explore" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="explore" data-testid="tab-explore">
              <Sparkles className="h-4 w-4 mr-2" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="collections" data-testid="tab-collections">
              <ImageIcon className="h-4 w-4 mr-2" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="my-nfts" data-testid="tab-my-nfts" disabled={!isConnected}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              My NFTs
            </TabsTrigger>
          </TabsList>

          {/* Explore Tab */}
          <TabsContent value="explore" className="space-y-4 mt-6">
            {nftsLoading ? (
              <div className="text-center py-12 text-slate-400">Loading NFTs...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredNFTs.map((nft) => (
                  <Card 
                    key={nft.id} 
                    className="bg-slate-900/80 border-slate-800 backdrop-blur-sm hover:border-purple-500/50 transition-all group overflow-hidden"
                    data-testid={`nft-card-${nft.id}`}
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-800">
                      <img 
                        src={nft.image} 
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {nft.rarity && (
                        <div className="absolute top-2 right-2">
                          {getRarityBadge(nft.rarity)}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleBuyNFT(nft)}
                          disabled={buyNFTMutation.isPending || !nft.forSale}
                          data-testid={`button-buy-${nft.id}`}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {nft.forSale ? "Buy Now" : "Not for Sale"}
                        </Button>
                      </div>
                    </div>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-white line-clamp-1">{nft.name}</h3>
                          <p className="text-sm text-slate-400 line-clamp-1">{nft.collection}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                        <div>
                          <p className="text-xs text-slate-500">Price</p>
                          <p className="text-sm font-bold text-white">{nft.price} {nft.currency}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" data-testid={`button-like-${nft.id}`}>
                            <Heart className="h-4 w-4 text-slate-400 hover:text-pink-400" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" data-testid={`button-view-${nft.id}`}>
                            <ExternalLink className="h-4 w-4 text-slate-400 hover:text-blue-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-4 mt-6">
            {collectionsLoading ? (
              <div className="text-center py-12 text-slate-400">Loading collections...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {collections.map((collection) => (
                  <Card 
                    key={collection.id} 
                    className="bg-slate-900/80 border-slate-800 backdrop-blur-sm hover:border-purple-500/50 transition-all"
                    data-testid={`collection-card-${collection.id}`}
                  >
                    <div className="flex items-center gap-4 p-6">
                      <div className="h-24 w-24 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                        <img 
                          src={collection.image} 
                          alt={collection.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white mb-1">{collection.name}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">{collection.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500">Floor Price</p>
                            <p className="text-sm font-bold text-purple-400">{collection.floorPrice} ETH</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">24h Volume</p>
                            <p className="text-sm font-bold text-green-400">${collection.volume24h}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Items</p>
                            <p className="text-sm font-bold text-white">{collection.items}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Owners</p>
                            <p className="text-sm font-bold text-white">{collection.owners}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My NFTs Tab */}
          <TabsContent value="my-nfts" className="space-y-4 mt-6">
            {!isConnected ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Connect your wallet to view your NFTs</p>
              </div>
            ) : myNFTs.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">You don't own any NFTs yet</p>
                <Button className="mt-4 bg-purple-600 hover:bg-purple-700" data-testid="button-browse-marketplace">
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {myNFTs.map((nft) => (
                  <Card 
                    key={nft.id} 
                    className="bg-slate-900/80 border-slate-800 backdrop-blur-sm"
                    data-testid={`my-nft-${nft.id}`}
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-800">
                      <img 
                        src={nft.image} 
                        alt={nft.name}
                        className="w-full h-full object-cover"
                      />
                      {nft.forSale && (
                        <Badge className="absolute top-2 right-2 bg-green-500">Listed</Badge>
                      )}
                    </div>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-white">{nft.name}</h3>
                        <p className="text-sm text-slate-400">{nft.collection}</p>
                      </div>
                      {nft.forSale ? (
                        <div className="text-sm">
                          <p className="text-slate-500">Listed for</p>
                          <p className="font-bold text-white">{nft.price} {nft.currency}</p>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          size="sm"
                          onClick={() => listNFTMutation.mutate({ nftId: nft.id, price: "0.1", currency: "ETH" })}
                          disabled={listNFTMutation.isPending}
                          data-testid={`button-list-${nft.id}`}
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          List for Sale
                        </Button>
                      )}
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
