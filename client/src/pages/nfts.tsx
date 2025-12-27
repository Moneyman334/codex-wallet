import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Grid3X3,
  List,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  AlertCircle,
  Palette,
  Trophy,
  Star
} from "lucide-react";
import SEO from "@/components/seo";

interface NFTOwnership {
  id: string;
  walletAddress: string;
  nftId: string;
  balance: string;
  chainId: string;
  contractAddress: string;
  tokenId: string;
  isHidden: string;
  lastUpdated: string;
  nft: NFT;
  collection: NFTCollection | null;
}

interface NFT {
  id: string;
  chainId: string;
  contractAddress: string;
  tokenId: string;
  standard: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  metadata?: any;
  tokenUri?: string;
  collectionId?: string;
  rarity?: string;
  rarityRank?: string;
  lastRefreshed: string;
  createdAt: string;
  updatedAt: string;
}

interface NFTCollection {
  id: string;
  chainId: string;
  contractAddress: string;
  name: string;
  slug?: string;
  symbol?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  description?: string;
  externalUrl?: string;
  isVerified: string;
  totalSupply?: string;
  floorPrice?: string;
  contractStandard: string;
  createdAt: string;
  updatedAt: string;
}

interface NFTStats {
  totalNfts: number;
  totalCollections: number;
  chainCounts: Record<string, number>;
  collectionCounts: Record<string, number>;
}

interface NFTResponse {
  nfts: NFTOwnership[];
  collections: NFTCollection[];
  stats: NFTStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    chains: string[];
    collection?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  };
}

// Network configurations
const NETWORK_CONFIGS = {
  "0x1": { name: "Ethereum", color: "hsl(220, 70%, 55%)", icon: "🔷" },
  "0x89": { name: "Polygon", color: "hsl(272, 70%, 55%)", icon: "🟣" },
  "0x38": { name: "BSC", color: "hsl(45, 85%, 55%)", icon: "🟡" },
  "0xa4b1": { name: "Arbitrum", color: "hsl(207, 90%, 54%)", icon: "🔵" },
  "0xa": { name: "Optimism", color: "hsl(0, 85%, 60%)", icon: "🔴" }
} as const;

// IPFS URL resolver
const resolveIPFSUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  if (url.startsWith("ar://")) {
    return url.replace("ar://", "https://arweave.net/");
  }
  return url;
};

// NFT Card Component
const NFTCard = ({ 
  ownership, 
  onSelect, 
  onToggleVisibility 
}: { 
  ownership: NFTOwnership;
  onSelect: (ownership: NFTOwnership) => void;
  onToggleVisibility: (ownership: NFTOwnership) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const network = NETWORK_CONFIGS[ownership.chainId as keyof typeof NETWORK_CONFIGS];

  const imageUrl = resolveIPFSUrl(ownership.nft.imageThumbnailUrl || ownership.nft.imageUrl || "");
  const isHidden = ownership.isHidden === "true";

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer bg-card dark:bg-card border border-border dark:border-border ${
        isHidden ? "opacity-50" : ""
      }`}
      onClick={() => onSelect(ownership)}
      data-testid={`nft-card-${ownership.chainId}-${ownership.contractAddress}-${ownership.tokenId}`}
    >
      <CardContent className="p-0">
        {/* Image Container */}
        <AspectRatio ratio={1} className="bg-muted dark:bg-muted relative overflow-hidden">
          {!imageLoaded && !imageError && (
            <Skeleton className="w-full h-full absolute inset-0" data-testid="nft-image-skeleton" />
          )}
          
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-muted dark:bg-muted text-muted-foreground">
              <div className="text-center">
                <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <span className="text-sm">No Image</span>
              </div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={ownership.nft.name || `${ownership.collection?.name} #${ownership.tokenId}`}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              data-testid="nft-image"
            />
          )}

          {/* Network Badge */}
          <Badge 
            className="absolute top-2 left-2 text-xs"
            style={{ backgroundColor: network?.color }}
            data-testid={`nft-network-badge-${ownership.chainId}`}
          >
            {network?.icon} {network?.name}
          </Badge>

          {/* Visibility Toggle */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(ownership);
            }}
            data-testid={`nft-visibility-toggle-${ownership.nft.id}`}
          >
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>

          {/* Balance for ERC1155 */}
          {ownership.nft.standard === "ERC1155" && parseInt(ownership.balance) > 1 && (
            <Badge 
              className="absolute bottom-2 right-2 text-xs bg-primary text-primary-foreground"
              data-testid={`nft-balance-badge-${ownership.nft.id}`}
            >
              x{ownership.balance}
            </Badge>
          )}

          {/* Rarity Badge */}
          {ownership.nft.rarity && (
            <Badge 
              variant="outline"
              className="absolute bottom-2 left-2 text-xs bg-background/80 backdrop-blur-sm"
              data-testid={`nft-rarity-badge-${ownership.nft.id}`}
            >
              <Star className="w-3 h-3 mr-1" />
              {ownership.nft.rarity}
            </Badge>
          )}
        </AspectRatio>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="space-y-1">
            <h3 
              className="font-medium text-sm truncate text-foreground"
              data-testid={`nft-name-${ownership.nft.id}`}
            >
              {ownership.nft.name || `#${ownership.tokenId}`}
            </h3>
            
            {ownership.collection && (
              <p 
                className="text-xs text-muted-foreground truncate flex items-center"
                data-testid={`nft-collection-name-${ownership.nft.id}`}
              >
                {ownership.collection.isVerified === "true" && (
                  <Trophy className="w-3 h-3 mr-1 text-primary" />
                )}
                {ownership.collection.name}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// NFT Detail Modal Component
const NFTDetailModal = ({ 
  ownership, 
  isOpen, 
  onClose 
}: {
  ownership: NFTOwnership | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!ownership) return null;

  const network = NETWORK_CONFIGS[ownership.chainId as keyof typeof NETWORK_CONFIGS];
  const imageUrl = resolveIPFSUrl(ownership.nft.imageUrl || ownership.nft.imageThumbnailUrl || "");
  
  const blockExplorerUrl = (() => {
    const explorers = {
      "0x1": "https://etherscan.io",
      "0x89": "https://polygonscan.com", 
      "0x38": "https://bscscan.com",
      "0xa4b1": "https://arbiscan.io",
      "0xa": "https://optimistic.etherscan.io"
    };
    const explorer = explorers[ownership.chainId as keyof typeof explorers];
    return explorer ? `${explorer}/token/${ownership.contractAddress}?a=${ownership.tokenId}` : "";
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] p-0 bg-background dark:bg-background border border-border dark:border-border"
        data-testid={`nft-detail-modal-${ownership.nft.id}`}
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle 
            className="text-xl font-semibold text-foreground"
            data-testid={`nft-detail-title-${ownership.nft.id}`}
          >
            {ownership.nft.name || `#${ownership.tokenId}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 pt-0">
          {/* Image Section */}
          <div className="space-y-4">
            <AspectRatio ratio={1} className="bg-muted dark:bg-muted rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={ownership.nft.name || `#${ownership.tokenId}`}
                  className="w-full h-full object-cover"
                  data-testid={`nft-detail-image-${ownership.nft.id}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted dark:bg-muted text-muted-foreground">
                  <div className="text-center">
                    <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <span>No Image Available</span>
                  </div>
                </div>
              )}
            </AspectRatio>

            {/* Quick Info */}
            <div className="flex items-center justify-between">
              <Badge 
                className="text-xs"
                style={{ backgroundColor: network?.color }}
                data-testid={`nft-detail-network-${ownership.nft.id}`}
              >
                {network?.icon} {network?.name}
              </Badge>
              
              <div className="flex gap-2">
                {blockExplorerUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(blockExplorerUrl, "_blank")}
                    data-testid={`nft-detail-explorer-link-${ownership.nft.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Explorer
                  </Button>
                )}
                
                {ownership.nft.externalUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(ownership.nft.externalUrl, "_blank")}
                    data-testid={`nft-detail-external-link-${ownership.nft.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-6">
              {/* Collection Info */}
              {ownership.collection && (
                <div>
                  <h4 className="font-medium mb-3 text-foreground">Collection</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-medium text-foreground"
                        data-testid={`nft-detail-collection-name-${ownership.nft.id}`}
                      >
                        {ownership.collection.name}
                      </span>
                      {ownership.collection.isVerified === "true" && (
                        <Trophy className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    
                    {ownership.collection.description && (
                      <p 
                        className="text-sm text-muted-foreground"
                        data-testid={`nft-detail-collection-description-${ownership.nft.id}`}
                      >
                        {ownership.collection.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* NFT Details */}
              <div>
                <h4 className="font-medium mb-3 text-foreground">Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token ID:</span>
                    <span 
                      className="font-mono text-foreground"
                      data-testid={`nft-detail-token-id-${ownership.nft.id}`}
                    >
                      #{ownership.tokenId}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard:</span>
                    <Badge 
                      variant="outline"
                      data-testid={`nft-detail-standard-${ownership.nft.id}`}
                    >
                      {ownership.nft.standard}
                    </Badge>
                  </div>
                  
                  {ownership.nft.standard === "ERC1155" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance:</span>
                      <span 
                        className="text-foreground"
                        data-testid={`nft-detail-balance-${ownership.nft.id}`}
                      >
                        {ownership.balance}
                      </span>
                    </div>
                  )}
                  
                  {ownership.nft.rarity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rarity:</span>
                      <Badge 
                        variant="outline"
                        data-testid={`nft-detail-rarity-${ownership.nft.id}`}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {ownership.nft.rarity}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract:</span>
                    <span 
                      className="font-mono text-xs text-foreground"
                      data-testid={`nft-detail-contract-${ownership.nft.id}`}
                    >
                      {ownership.contractAddress.slice(0, 6)}...{ownership.contractAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {ownership.nft.description && (
                <div>
                  <h4 className="font-medium mb-3 text-foreground">Description</h4>
                  <p 
                    className="text-sm text-muted-foreground leading-relaxed"
                    data-testid={`nft-detail-description-${ownership.nft.id}`}
                  >
                    {ownership.nft.description}
                  </p>
                </div>
              )}

              {/* Attributes */}
              {ownership.nft.attributes && ownership.nft.attributes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-foreground">Attributes</h4>
                  <div 
                    className="grid grid-cols-2 gap-3"
                    data-testid={`nft-detail-attributes-${ownership.nft.id}`}
                  >
                    {ownership.nft.attributes.map((attr, index) => (
                      <div 
                        key={index}
                        className="bg-muted dark:bg-muted rounded-lg p-3 text-center"
                        data-testid={`nft-attribute-${ownership.nft.id}-${index}`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {attr.trait_type}
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {attr.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main NFT Gallery Component
export default function NFTsPage() {
  const { account, isConnected, network } = useWeb3();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedNFT, setSelectedNFT] = useState<NFTOwnership | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChains, setSelectedChains] = useState<string[]>(["0x1", "0x89", "0x38", "0xa4b1", "0xa"]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [sortBy, setSortBy] = useState("acquired");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 24;

  // Fetch NFTs
  const { 
    data: nftData, 
    isLoading, 
    error,
    refetch 
  } = useQuery<NFTResponse>({
    queryKey: ["/api/nfts", account, {
      chains: selectedChains,
      search: searchQuery,
      collection: selectedCollection,
      sortBy,
      sortOrder,
      page,
      limit
    }],
    queryFn: async () => {
      if (!account) throw new Error("No wallet connected");
      
      const params = new URLSearchParams({
        chains: selectedChains.join(","),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCollection && { collection: selectedCollection }),
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString()
      });
      
      const res = await fetch(`/api/nfts/${account}?${params}`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch NFTs");
      }
      
      return res.json();
    },
    enabled: !!account && isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("No wallet connected");
      
      return apiRequest(`/api/nfts/${account}/refresh`, {
        method: "POST",
        body: JSON.stringify({ chains: selectedChains })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nfts", account] });
      toast({
        title: "NFTs refreshed",
        description: "Your NFT collection has been updated with the latest data",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to refresh NFT data",
        variant: "destructive",
      });
    }
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ ownership, hidden }: { ownership: NFTOwnership; hidden: boolean }) => {
      if (!account) throw new Error("No wallet connected");
      
      return apiRequest(`/api/nfts/${account}/${ownership.nftId}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ hidden })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nfts", account] });
      toast({
        title: "Visibility updated",
        description: "NFT visibility has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update NFT visibility",
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleToggleVisibility = (ownership: NFTOwnership) => {
    const isCurrentlyHidden = ownership.isHidden === "true";
    toggleVisibilityMutation.mutate({ 
      ownership, 
      hidden: !isCurrentlyHidden 
    });
  };

  const handleChainToggle = (chainId: string) => {
    setSelectedChains(prev => 
      prev.includes(chainId) 
        ? prev.filter(id => id !== chainId)
        : [...prev, chainId]
    );
    setPage(1);
  };

  const handleLoadMore = () => {
    if (nftData?.pagination.hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Derived data
  const nfts = nftData?.nfts || [];
  const collections = nftData?.collections || [];
  const stats = nftData?.stats;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCollection, sortBy, sortOrder, selectedChains]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO 
          title="NFT Gallery - Connect Wallet"
          description="Connect your wallet to view your NFT collection across multiple blockchains"
        />
        <div className="text-center py-12">
          <Palette className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">NFT Gallery</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your NFT collection across multiple blockchains
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <SEO 
        title="NFT Gallery - Your Digital Collection"
        description="View and manage your NFT collection across Ethereum, Polygon, BSC, Arbitrum, and Optimism networks"
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="nft-gallery-title">
            NFT Gallery
          </h1>
          {stats && (
            <p className="text-muted-foreground" data-testid="nft-gallery-stats">
              {stats.totalNfts} NFTs across {stats.totalCollections} collections
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
            variant="outline"
            data-testid="nft-refresh-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            data-testid="nft-filter-toggle"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 bg-card dark:bg-card border border-border dark:border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search NFTs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="nft-search-input"
                />
              </div>
            </div>

            {/* Collection Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Collection</label>
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger data-testid="nft-collection-filter">
                  <SelectValue placeholder="All Collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Collections</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem 
                      key={collection.id} 
                      value={collection.id}
                      data-testid={`collection-option-${collection.id}`}
                    >
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="nft-sort-by-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acquired">Recently Acquired</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="collection">Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Order</label>
              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger data-testid="nft-sort-order-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chain Filters */}
          <Separator className="my-4" />
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Networks</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(NETWORK_CONFIGS).map(([chainId, config]) => (
                <Button
                  key={chainId}
                  variant={selectedChains.includes(chainId) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChainToggle(chainId)}
                  data-testid={`chain-filter-${chainId}`}
                >
                  {config.icon} {config.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${nfts.length} NFTs`}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            data-testid="nft-grid-view-button"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            data-testid="nft-list-view-button"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {error && (
        <Card className="p-6 text-center bg-destructive/10 border-destructive/20">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
          <p className="text-destructive">Failed to load NFTs. Please try again.</p>
        </Card>
      )}

      {isLoading && (
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
          data-testid="nft-loading-grid"
        >
          {Array.from({ length: limit }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && nfts.length === 0 && (
        <Card className="p-12 text-center bg-card dark:bg-card">
          <Palette className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2 text-foreground">No NFTs Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCollection ? 
              "Try adjusting your filters or search terms" : 
              "Your wallet doesn't contain any NFTs on the selected networks"
            }
          </p>
          {(searchQuery || selectedCollection) && (
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCollection("");
              }}
              variant="outline"
              data-testid="nft-clear-filters-button"
            >
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* NFT Grid */}
      {!isLoading && nfts.length > 0 && (
        <div 
          className={`grid gap-4 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
              : "grid-cols-1"
          }`}
          data-testid="nft-gallery-grid"
        >
          {nfts.map((ownership) => (
            <NFTCard
              key={`${ownership.chainId}-${ownership.contractAddress}-${ownership.tokenId}`}
              ownership={ownership}
              onSelect={setSelectedNFT}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {nftData?.pagination.hasMore && (
        <div className="text-center">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            size="lg"
            data-testid="nft-load-more-button"
          >
            Load More NFTs
          </Button>
        </div>
      )}

      {/* NFT Detail Modal */}
      <NFTDetailModal
        ownership={selectedNFT}
        isOpen={!!selectedNFT}
        onClose={() => setSelectedNFT(null)}
      />
    </div>
  );
}