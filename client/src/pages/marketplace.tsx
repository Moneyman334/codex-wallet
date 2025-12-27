import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ShoppingBag, TrendingUp, Clock, Filter, Search, Plus, ExternalLink, Zap, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerWallet: string;
  itemType: 'nft' | 'token' | 'product';
  itemId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  imageUrl?: string;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
}

export default function MarketplacePage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterType, setFilterType] = useState("all");

  const { data: listings } = useQuery<MarketplaceListing[]>({
    queryKey: ['/api/marketplace/listings'],
  });

  const { data: myListings } = useQuery<MarketplaceListing[]>({
    queryKey: ['/api/marketplace/my-listings', account],
    enabled: !!account,
  });

  const purchaseListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      if (!account) throw new Error("Connect wallet to purchase");
      return apiRequest('POST', '/api/marketplace/purchase', {
        listingId,
        buyerWallet: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful!",
        description: "Item has been transferred to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return apiRequest('POST', '/api/marketplace/cancel', {
        listingId,
        sellerWallet: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Listing Cancelled",
        description: "Your listing has been removed from the marketplace",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/my-listings', account] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort listings
  let filteredListings = listings?.filter(l => l.status === 'active') || [];

  if (searchQuery) {
    filteredListings = filteredListings.filter(l =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filterType !== 'all') {
    filteredListings = filteredListings.filter(l => l.itemType === filterType);
  }

  // Sort
  filteredListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const stats = {
    totalListings: listings?.filter(l => l.status === 'active').length || 0,
    myListings: myListings?.filter(l => l.status === 'active').length || 0,
    mySales: myListings?.filter(l => l.status === 'sold').length || 0,
    totalValue: filteredListings.reduce((sum, l) => sum + parseFloat(l.price || "0"), 0),
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'nft': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200';
      case 'token': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'product': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
        <p className="text-muted-foreground">Buy and sell blockchain assets securely</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-3xl font-bold">{stats.totalListings}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Listings</p>
                <p className="text-3xl font-bold">{stats.myListings}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-3xl font-bold">{stats.mySales}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold">${stats.totalValue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Marketplace</TabsTrigger>
          <TabsTrigger value="my-listings">My Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search listings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="nft">NFTs</SelectItem>
                    <SelectItem value="token">Tokens</SelectItem>
                    <SelectItem value="product">Products</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-sort">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No Listings Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterType !== 'all' ? 'Try adjusting your filters' : 'Be the first to list an item!'}
                </p>
                {account && (
                  <Button onClick={() => window.location.href = '/marketplace/create'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Listing
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map(listing => (
                <Card key={listing.id} className="overflow-hidden" data-testid={`listing-${listing.id}`}>
                  <div className="aspect-square bg-muted relative">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className={`absolute top-2 right-2 ${getItemTypeColor(listing.itemType)}`}>
                      {listing.itemType.toUpperCase()}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{listing.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{listing.price}</span>
                        <span className="text-muted-foreground">{listing.currency}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {account && account.toLowerCase() !== listing.sellerWallet.toLowerCase() ? (
                      <Button
                        className="w-full"
                        onClick={() => purchaseListingMutation.mutate(listing.id)}
                        disabled={purchaseListingMutation.isPending}
                        data-testid={`button-buy-${listing.id}`}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        {purchaseListingMutation.isPending ? 'Processing...' : 'Buy Now'}
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Your Listing
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-listings" className="space-y-6">
          {!account ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">
                  Connect your wallet to view your listings
                </p>
              </CardContent>
            </Card>
          ) : !myListings || myListings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
                <p className="text-muted-foreground mb-6">Create your first marketplace listing</p>
                <Button onClick={() => window.location.href = '/marketplace/create'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myListings.map(listing => (
                <Card key={listing.id} data-testid={`my-listing-${listing.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                        {listing.imageUrl ? (
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-bold">{listing.price} {listing.currency}</p>
                            <Badge className={getItemTypeColor(listing.itemType)}>
                              {listing.itemType}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                            </span>
                            <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                              {listing.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {listing.status === 'active' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelListingMutation.mutate(listing.id)}
                                disabled={cancelListingMutation.isPending}
                                data-testid={`button-cancel-${listing.id}`}
                              >
                                Cancel Listing
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
