import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Image as ImageIcon,
  Trophy,
  Coins,
  ArrowRight,
  RefreshCw,
  Users,
  Flame,
  Star,
  ExternalLink
} from "lucide-react";

interface ActivityEvent {
  id: string;
  activityType: string;
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
  title: string;
  description?: string;
  amount?: string;
  tokenSymbol?: string;
  usdValue?: string;
  transactionHash?: string;
  isHighlight?: string;
  createdAt: string;
}

export default function LiveActivityPage() {
  const [filter, setFilter] = useState<string>("all");

  const { data: activities, isLoading, refetch } = useQuery<ActivityEvent[]>({
    queryKey: ["/api/activity/live", filter],
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/activity/stats"],
    refetchInterval: 30000,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trade': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'swap': return <ArrowRight className="w-5 h-5 text-blue-400" />;
      case 'stake': return <Coins className="w-5 h-5 text-purple-400" />;
      case 'nft_mint': return <ImageIcon className="w-5 h-5 text-pink-400" />;
      case 'nft_buy': return <ImageIcon className="w-5 h-5 text-orange-400" />;
      case 'achievement': return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'competition_join': return <Flame className="w-5 h-5 text-red-400" />;
      case 'whale_alert': return <span className="text-xl">🐋</span>;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'trade': return 'border-green-500/30 bg-green-500/5';
      case 'swap': return 'border-blue-500/30 bg-blue-500/5';
      case 'stake': return 'border-purple-500/30 bg-purple-500/5';
      case 'nft_mint': return 'border-pink-500/30 bg-pink-500/5';
      case 'nft_buy': return 'border-orange-500/30 bg-orange-500/5';
      case 'achievement': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'competition_join': return 'border-red-500/30 bg-red-500/5';
      case 'whale_alert': return 'border-cyan-500/30 bg-cyan-500/5';
      default: return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const mockActivities: ActivityEvent[] = [
    { id: "1", activityType: "trade", displayName: "CryptoKing", title: "Bought 2.5 ETH", amount: "2.5", tokenSymbol: "ETH", usdValue: "8750", isHighlight: "true", createdAt: new Date(Date.now() - 15000).toISOString() },
    { id: "2", activityType: "nft_buy", displayName: "NFTCollector", title: "Purchased Bored Ape #4521", usdValue: "45000", isHighlight: "true", createdAt: new Date(Date.now() - 30000).toISOString() },
    { id: "3", activityType: "swap", displayName: "DeFiMaster", title: "Swapped 10,000 USDC → ETH", usdValue: "10000", createdAt: new Date(Date.now() - 45000).toISOString() },
    { id: "4", activityType: "stake", displayName: "HODLer", title: "Staked 50 ETH in DeFi protocol", amount: "50", tokenSymbol: "ETH", usdValue: "175000", createdAt: new Date(Date.now() - 60000).toISOString() },
    { id: "5", activityType: "achievement", displayName: "NewTrader", title: "Unlocked 'First Trade' Achievement", createdAt: new Date(Date.now() - 90000).toISOString() },
    { id: "6", activityType: "whale_alert", title: "Whale moved 5,000 BTC to exchange", description: "Potential sell pressure incoming", usdValue: "485000000", isHighlight: "true", createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: "7", activityType: "competition_join", displayName: "TradeMaster", title: "Joined Weekly Trading Battle", createdAt: new Date(Date.now() - 150000).toISOString() },
    { id: "8", activityType: "trade", displayName: "MoonShot", title: "Sold 1,000 SOL", amount: "1000", tokenSymbol: "SOL", usdValue: "180000", createdAt: new Date(Date.now() - 180000).toISOString() },
    { id: "9", activityType: "nft_mint", displayName: "Creator", title: "Minted new NFT collection", createdAt: new Date(Date.now() - 210000).toISOString() },
    { id: "10", activityType: "swap", displayName: "Arbitrageur", title: "Swapped BTC → WBTC", usdValue: "250000", createdAt: new Date(Date.now() - 240000).toISOString() },
  ];

  const displayActivities = activities?.length ? activities : mockActivities;
  const filteredActivities = filter === 'all' 
    ? displayActivities 
    : displayActivities.filter(a => a.activityType === filter);

  const displayStats = stats || {
    totalToday: 12847,
    tradesToday: 8432,
    volumeToday: "$2.4B",
    activeUsers: 1247,
  };

  const filters = [
    { value: 'all', label: 'All Activity', icon: Activity },
    { value: 'trade', label: 'Trades', icon: TrendingUp },
    { value: 'swap', label: 'Swaps', icon: ArrowRight },
    { value: 'stake', label: 'Staking', icon: Coins },
    { value: 'nft_buy', label: 'NFTs', icon: ImageIcon },
    { value: 'achievement', label: 'Achievements', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-cyan-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Live Activity Feed</h1>
              <p className="text-gray-400">Real-time platform activity across CODEX</p>
            </div>
            <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Events Today</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-events">{displayStats.totalToday.toLocaleString()}</p>
                </div>
                <Activity className="w-10 h-10 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Trades Today</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-trades">{displayStats.tradesToday.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">24h Volume</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-volume">{displayStats.volumeToday}</p>
                </div>
                <Coins className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Users</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-users">{displayStats.activeUsers.toLocaleString()}</p>
                </div>
                <Users className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
              className={filter === f.value ? "bg-cyan-600" : "border-gray-600 text-gray-300"}
              data-testid={`filter-${f.value}`}
            >
              <f.icon className="w-4 h-4 mr-2" />
              {f.label}
            </Button>
          ))}
          <Button 
            variant="ghost" 
            onClick={() => refetch()}
            className="ml-auto text-cyan-400"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Activity Feed */}
        <Card className="bg-black/40 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Live Feed
            </CardTitle>
            <CardDescription className="text-gray-400">
              Streaming platform activity in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-20 bg-gray-800/50 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3" data-testid="activity-feed">
                {filteredActivities.map((activity, idx) => (
                  <div 
                    key={activity.id}
                    className={`p-4 rounded-lg border ${getActivityColor(activity.activityType)} ${activity.isHighlight === 'true' ? 'ring-1 ring-yellow-500/30' : ''} transition-all hover:scale-[1.01]`}
                    data-testid={`activity-${idx}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-gray-800/50 flex items-center justify-center">
                        {getActivityIcon(activity.activityType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {activity.displayName && (
                            <>
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={activity.avatarUrl} />
                                <AvatarFallback className="text-xs">{activity.displayName[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-cyan-400">{activity.displayName}</span>
                            </>
                          )}
                          {activity.isHighlight === 'true' && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-white">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-gray-400">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Value */}
                      {activity.usdValue && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">
                            ${parseInt(activity.usdValue).toLocaleString()}
                          </p>
                          {activity.amount && activity.tokenSymbol && (
                            <p className="text-sm text-gray-400">
                              {activity.amount} {activity.tokenSymbol}
                            </p>
                          )}
                        </div>
                      )}

                      {/* TX Link */}
                      {activity.transactionHash && (
                        <Button variant="ghost" size="sm" className="text-gray-400">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
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
