import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery } from "@tanstack/react-query";
import { Search, Grid3x3, List, ExternalLink, Share2, Heart, Image as ImageIcon, TrendingUp } from "lucide-react";

interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  imageUrl: string;
  collectionName: string;
  chain: string;
  owner: string;
  attributes: { trait_type: string; value: string }[];
  rarity?: string;
  lastSale?: {
    price: string;
    currency: string;
    date: string;
  };
}

export default function NFTGalleryPage() {
  const { account } = useWeb3();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const { data: nfts } = useQuery<NFT[]>({
    queryKey: ['/api/nfts/wallet', account],
    enabled: !!account,
  });

  const filteredNFTs = nfts?.filter(nft => {
    const matchesSearch = !searchQuery || 
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.collectionName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChain = chainFilter === "all" || nft.chain === chainFilter;
    
    return matchesSearch && matchesChain;
  });

  const chains = ["all", "ethereum", "polygon", "base", "arbitrum", "optimism"];
  
  const totalValue = nfts?.reduce((sum, nft) => {
    return sum + (nft.lastSale ? parseFloat(nft.lastSale.price) : 0);
  }, 0) || 0;

  const collections = Array.from(new Set(nfts?.map(nft => nft.collectionName) || []));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">NFT Gallery</h1>
        <p className="text-muted-foreground">Your digital collectibles across all chains</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total NFTs</p>
                <p className="text-3xl font-bold" data-testid="text-total-nfts">
                  {nfts?.length || 0}
                </p>
              </div>
              <ImageIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collections</p>
                <p className="text-3xl font-bold">{collections.length}</p>
              </div>
              <Grid3x3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Est. Value</p>
                <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chains</p>
                <p className="text-3xl font-bold">
                  {Array.from(new Set(nfts?.map(n => n.chain) || [])).length}
                </p>
              </div>
              <Share2 className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!account ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">NFT Gallery</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your NFT collection
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters and Controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search NFTs or collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-nfts"
                  />
                </div>

                <Select value={chainFilter} onValueChange={setChainFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-chain-filter">
                    <SelectValue placeholder="All Chains" />
                  </SelectTrigger>
                  <SelectContent>
                    {chains.map(chain => (
                      <SelectItem key={chain} value={chain}>
                        {chain.charAt(0).toUpperCase() + chain.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="value">Highest Value</SelectItem>
                    <SelectItem value="rarity">Rarity</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    data-testid="button-grid-view"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    data-testid="button-list-view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFT Grid/List */}
          {!filteredNFTs || filteredNFTs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery || chainFilter !== "all" ? "No NFTs Found" : "No NFTs Yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || chainFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Your NFT collection will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredNFTs.map(nft => (
                <Card
                  key={nft.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedNFT(nft)}
                  data-testid={`nft-card-${nft.id}`}
                >
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={nft.imageUrl || "/placeholder-nft.png"}
                      alt={nft.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-nft.png";
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-black/60 backdrop-blur">
                        {nft.chain}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate" data-testid={`nft-name-${nft.id}`}>
                      {nft.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {nft.collectionName}
                    </p>
                    {nft.lastSale && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">
                          {nft.lastSale.price} {nft.lastSale.currency}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNFTs.map(nft => (
                <Card
                  key={nft.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedNFT(nft)}
                  data-testid={`nft-list-${nft.id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={nft.imageUrl || "/placeholder-nft.png"}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-nft.png";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{nft.name}</h3>
                            <p className="text-sm text-muted-foreground">{nft.collectionName}</p>
                          </div>
                          <Badge>{nft.chain}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {nft.description || "No description"}
                        </p>
                        {nft.lastSale && (
                          <div className="mt-2">
                            <Badge variant="secondary">
                              Last Sale: {nft.lastSale.price} {nft.lastSale.currency}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedNFT.name}</DialogTitle>
              <DialogDescription>{selectedNFT.collectionName}</DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedNFT.imageUrl || "/placeholder-nft.png"}
                    alt={selectedNFT.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-nft.png";
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" data-testid="button-view-opensea">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on OpenSea
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedNFT.description || "No description available"}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contract Address</span>
                      <span className="font-mono text-xs">
                        {selectedNFT.contractAddress.slice(0, 6)}...{selectedNFT.contractAddress.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Token ID</span>
                      <span className="font-mono">{selectedNFT.tokenId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Chain</span>
                      <Badge>{selectedNFT.chain}</Badge>
                    </div>
                    {selectedNFT.rarity && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rarity</span>
                        <Badge variant="secondary">{selectedNFT.rarity}</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Attributes</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedNFT.attributes.map((attr, index) => (
                        <div
                          key={index}
                          className="p-3 bg-muted rounded-lg"
                        >
                          <p className="text-xs text-muted-foreground uppercase">
                            {attr.trait_type}
                          </p>
                          <p className="font-semibold text-sm">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNFT.lastSale && (
                  <div>
                    <h3 className="font-semibold mb-2">Last Sale</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="text-xl font-bold">
                          {selectedNFT.lastSale.price} {selectedNFT.lastSale.currency}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {new Date(selectedNFT.lastSale.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
