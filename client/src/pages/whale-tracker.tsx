import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Bell, 
  BellOff,
  Eye,
  Search,
  AlertTriangle,
  Zap,
  ArrowRight,
  Wallet,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WhaleMovement {
  id: string;
  walletAddress: string;
  walletLabel?: string;
  transactionType: string;
  tokenSymbol: string;
  tokenAmount: string;
  usdValue: string;
  fromAddress?: string;
  toAddress?: string;
  toLabel?: string;
  impactScore: string;
  isSignificant: string;
  timestamp: string;
  chainId: string;
}

export default function WhaleTrackerPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: movements, isLoading, refetch } = useQuery<WhaleMovement[]>({
    queryKey: ["/api/whales/movements"],
    refetchInterval: 15000,
  });

  const { data: topWhales } = useQuery<any[]>({
    queryKey: ["/api/whales/top"],
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/whales/stats"],
    refetchInterval: 30000,
  });

  const watchMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      return apiRequest('POST', '/api/whales/watch', { walletAddress });
    },
    onSuccess: () => {
      toast({
        title: "Whale Watched!",
        description: "You'll receive alerts when this whale makes moves",
      });
    },
  });

  const getImpactColor = (score: string) => {
    const s = parseInt(score);
    if (s >= 80) return 'text-red-400 bg-red-500/20 border-red-500/50';
    if (s >= 60) return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
    if (s >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
    return 'text-green-400 bg-green-500/20 border-green-500/50';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'sell': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'transfer': return <ArrowRight className="w-4 h-4 text-blue-400" />;
      case 'stake': return <Zap className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const mockMovements: WhaleMovement[] = [
    { id: "1", walletAddress: "0x1234...abcd", walletLabel: "Jump Trading", transactionType: "buy", tokenSymbol: "ETH", tokenAmount: "5,000", usdValue: "17500000", toLabel: "Uniswap", impactScore: "85", isSignificant: "true", timestamp: new Date(Date.now() - 300000).toISOString(), chainId: "1" },
    { id: "2", walletAddress: "0x5678...efgh", walletLabel: "Three Arrows Capital", transactionType: "sell", tokenSymbol: "BTC", tokenAmount: "250", usdValue: "25000000", toLabel: "Binance", impactScore: "92", isSignificant: "true", timestamp: new Date(Date.now() - 600000).toISOString(), chainId: "1" },
    { id: "3", walletAddress: "0x9abc...ijkl", walletLabel: "Unknown Whale", transactionType: "transfer", tokenSymbol: "USDC", tokenAmount: "50,000,000", usdValue: "50000000", toLabel: "Cold Storage", impactScore: "75", isSignificant: "true", timestamp: new Date(Date.now() - 900000).toISOString(), chainId: "1" },
    { id: "4", walletAddress: "0xdef0...mnop", walletLabel: "Alameda Research", transactionType: "stake", tokenSymbol: "ETH", tokenAmount: "10,000", usdValue: "35000000", toLabel: "Lido", impactScore: "68", isSignificant: "true", timestamp: new Date(Date.now() - 1200000).toISOString(), chainId: "1" },
    { id: "5", walletAddress: "0x1357...qrst", transactionType: "buy", tokenSymbol: "SOL", tokenAmount: "500,000", usdValue: "45000000", impactScore: "88", isSignificant: "true", timestamp: new Date(Date.now() - 1500000).toISOString(), chainId: "1" },
    { id: "6", walletAddress: "0x2468...uvwx", walletLabel: "Galaxy Digital", transactionType: "sell", tokenSymbol: "LINK", tokenAmount: "1,000,000", usdValue: "15000000", toLabel: "OKX", impactScore: "55", isSignificant: "false", timestamp: new Date(Date.now() - 1800000).toISOString(), chainId: "1" },
  ];

  const displayMovements = movements?.length ? movements : mockMovements;
  const filteredMovements = displayMovements.filter(m => 
    !searchQuery || 
    m.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.walletLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayStats = stats || {
    totalWhalesTracked: 2547,
    movementsToday: 847,
    totalVolumeToday: "$2.4B",
    significantMoves: 23,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
              <span className="text-4xl">🐋</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Whale Tracker</h1>
              <p className="text-gray-400">Monitor large wallet movements in real-time</p>
            </div>
            <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-black/40 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Whales Tracked</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-whales">{displayStats.totalWhalesTracked.toLocaleString()}</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Moves Today</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-moves">{displayStats.movementsToday}</p>
                </div>
                <Activity className="w-10 h-10 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">24h Volume</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-volume">{displayStats.totalVolumeToday}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">High Impact</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-significant">{displayStats.significantMoves}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Refresh */}
        <Card className="bg-black/40 border-gray-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by wallet, label, or token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                  data-testid="input-search-whale"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                className="border-blue-500 text-blue-400"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Whale Movements Feed */}
        <Card className="bg-black/40 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Live Whale Movements
            </CardTitle>
            <CardDescription className="text-gray-400">
              Real-time feed of significant wallet transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-24 bg-gray-800/50 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4" data-testid="whale-feed">
                {filteredMovements.map((movement, idx) => (
                  <div 
                    key={movement.id}
                    className={`p-4 rounded-lg border ${movement.isSignificant === 'true' ? 'bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30' : 'bg-gray-900/40 border-gray-700/50'} hover:border-blue-500/50 transition-all`}
                    data-testid={`whale-movement-${idx}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Impact Score */}
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${getImpactColor(movement.impactScore)} border`}>
                        <span className="text-lg font-bold">{movement.impactScore}</span>
                        <span className="text-[10px] uppercase">Impact</span>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(movement.transactionType)}
                          <span className="font-semibold text-white capitalize">{movement.transactionType}</span>
                          <span className="text-2xl font-bold text-white">{movement.tokenAmount} {movement.tokenSymbol}</span>
                          <Badge className="bg-gray-700 text-gray-300">{formatValue(movement.usdValue)}</Badge>
                          {movement.isSignificant === 'true' && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                              <Zap className="w-3 h-3 mr-1" />
                              High Impact
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="font-mono">{formatAddress(movement.walletAddress)}</span>
                          {movement.walletLabel && (
                            <Badge variant="outline" className="text-blue-400 border-blue-500/50">
                              {movement.walletLabel}
                            </Badge>
                          )}
                          {movement.toLabel && (
                            <>
                              <ArrowRight className="w-4 h-4" />
                              <span>{movement.toLabel}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(movement.timestamp), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => watchMutation.mutate(movement.walletAddress)}
                          className="text-blue-400 hover:bg-blue-500/20"
                          data-testid={`button-watch-${idx}`}
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-400 hover:bg-gray-500/20"
                          data-testid={`button-view-${idx}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
