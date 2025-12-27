import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Crown, 
  Medal, 
  TrendingUp, 
  TrendingDown,
  Flame,
  Star,
  Zap,
  Target,
  Activity,
  Users
} from "lucide-react";

interface TraderRanking {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  totalPnl: string;
  totalPnlPercent: string;
  winRate: string;
  totalTrades: string;
  totalVolume: string;
  tradingStreak: string;
  tier: string;
  isOnline?: boolean;
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly" | "allTime">("weekly");

  const { data: leaderboard, isLoading } = useQuery<TraderRanking[]>({
    queryKey: ["/api/leaderboard", timeframe],
    refetchInterval: 10000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/leaderboard/stats"],
    refetchInterval: 30000,
  });

  const getTierColor = (tier: string) => {
    const t = tier?.toLowerCase();
    if (t === 'elite') return 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white';
    if (t === 'diamond') return 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white';
    if (t === 'platinum') return 'bg-gradient-to-r from-gray-300 to-gray-100 text-gray-800';
    if (t === 'gold') return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black';
    if (t === 'silver') return 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-800';
    return 'bg-gradient-to-r from-amber-700 to-amber-600 text-white';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  const mockLeaderboard: TraderRanking[] = [
    { rank: 1, userId: "1", displayName: "CryptoKing", totalPnl: "1,250,000", totalPnlPercent: "847", winRate: "78", totalTrades: "1,245", totalVolume: "45,000,000", tradingStreak: "23", tier: "elite", isOnline: true },
    { rank: 2, userId: "2", displayName: "WhaleHunter", totalPnl: "890,000", totalPnlPercent: "623", winRate: "72", totalTrades: "892", totalVolume: "32,000,000", tradingStreak: "15", tier: "diamond", isOnline: true },
    { rank: 3, userId: "3", displayName: "DiamondHands", totalPnl: "567,000", totalPnlPercent: "445", winRate: "68", totalTrades: "654", totalVolume: "18,000,000", tradingStreak: "12", tier: "diamond" },
    { rank: 4, userId: "4", displayName: "MoonSniper", totalPnl: "423,000", totalPnlPercent: "312", winRate: "65", totalTrades: "543", totalVolume: "12,000,000", tradingStreak: "8", tier: "platinum" },
    { rank: 5, userId: "5", displayName: "AlphaTrader", totalPnl: "312,000", totalPnlPercent: "256", winRate: "62", totalTrades: "432", totalVolume: "9,500,000", tradingStreak: "6", tier: "platinum" },
    { rank: 6, userId: "6", displayName: "DeFiMaster", totalPnl: "245,000", totalPnlPercent: "198", winRate: "59", totalTrades: "387", totalVolume: "7,200,000", tradingStreak: "4", tier: "gold" },
    { rank: 7, userId: "7", displayName: "TokenWizard", totalPnl: "189,000", totalPnlPercent: "167", winRate: "57", totalTrades: "298", totalVolume: "5,400,000", tradingStreak: "3", tier: "gold" },
    { rank: 8, userId: "8", displayName: "ChartNinja", totalPnl: "134,000", totalPnlPercent: "123", winRate: "55", totalTrades: "245", totalVolume: "4,100,000", tradingStreak: "2", tier: "gold" },
    { rank: 9, userId: "9", displayName: "CryptoSage", totalPnl: "98,000", totalPnlPercent: "89", winRate: "53", totalTrades: "198", totalVolume: "3,200,000", tradingStreak: "1", tier: "silver" },
    { rank: 10, userId: "10", displayName: "BlockchainBull", totalPnl: "67,000", totalPnlPercent: "56", winRate: "51", totalTrades: "156", totalVolume: "2,400,000", tradingStreak: "0", tier: "silver" },
  ];

  const displayData = leaderboard?.length ? leaderboard : mockLeaderboard;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              TRADING LEADERBOARD
            </h1>
            <Trophy className="w-12 h-12 text-yellow-400" />
          </div>
          <p className="text-gray-400 text-lg">Compete with the best traders in the CODEX universe</p>
          <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            LIVE RANKINGS
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-black/40 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Traders</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-traders">
                    {stats?.totalTraders || "12,847"}
                  </p>
                </div>
                <Users className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Volume</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-volume">
                    ${stats?.totalVolume || "2.4B"}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Now</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-active">
                    {stats?.activeNow || "847"}
                  </p>
                </div>
                <Zap className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-orange-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Prize Pool</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-prize">
                    ${stats?.prizePool || "50,000"}
                  </p>
                </div>
                <Trophy className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeframe Selector */}
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 bg-black/40 border border-gray-700">
            <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
            <TabsTrigger value="allTime" data-testid="tab-all-time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-4 mb-12">
          {/* Second Place */}
          <div className="text-center">
            <Card className="bg-gradient-to-b from-gray-600/40 to-gray-800/40 border-gray-400/50 w-48">
              <CardContent className="pt-6 pb-4">
                <div className="relative mb-4">
                  <Avatar className="w-20 h-20 mx-auto border-4 border-gray-400">
                    <AvatarImage src={displayData[1]?.avatarUrl} />
                    <AvatarFallback className="bg-gray-700 text-2xl">{displayData[1]?.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 bg-gray-400 rounded-full p-1">
                    <Medal className="w-6 h-6 text-gray-800" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg">{displayData[1]?.displayName}</h3>
                <Badge className={getTierColor(displayData[1]?.tier || 'silver')}>{displayData[1]?.tier}</Badge>
                <p className="text-2xl font-bold text-green-400 mt-2">+{displayData[1]?.totalPnlPercent}%</p>
                <p className="text-sm text-gray-400">${displayData[1]?.totalPnl} PnL</p>
              </CardContent>
            </Card>
            <div className="bg-gray-600 h-20 mt-2 rounded-t-lg flex items-center justify-center">
              <span className="text-4xl font-bold text-white">2</span>
            </div>
          </div>

          {/* First Place */}
          <div className="text-center -mt-8">
            <Card className="bg-gradient-to-b from-yellow-600/40 to-amber-800/40 border-yellow-400/50 w-56">
              <CardContent className="pt-8 pb-4">
                <div className="relative mb-4">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                    <Crown className="w-12 h-12 text-yellow-400 animate-bounce" />
                  </div>
                  <Avatar className="w-24 h-24 mx-auto border-4 border-yellow-400 ring-4 ring-yellow-400/30">
                    <AvatarImage src={displayData[0]?.avatarUrl} />
                    <AvatarFallback className="bg-yellow-900 text-3xl">{displayData[0]?.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  {displayData[0]?.isOnline && (
                    <div className="absolute bottom-0 right-4 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  )}
                </div>
                <h3 className="font-bold text-yellow-400 text-xl">{displayData[0]?.displayName}</h3>
                <Badge className={getTierColor(displayData[0]?.tier || 'elite')}>{displayData[0]?.tier}</Badge>
                <p className="text-3xl font-bold text-green-400 mt-2">+{displayData[0]?.totalPnlPercent}%</p>
                <p className="text-sm text-gray-300">${displayData[0]?.totalPnl} PnL</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-400">{displayData[0]?.tradingStreak} day streak</span>
                </div>
              </CardContent>
            </Card>
            <div className="bg-gradient-to-r from-yellow-600 to-amber-500 h-28 mt-2 rounded-t-lg flex items-center justify-center">
              <span className="text-5xl font-bold text-white">1</span>
            </div>
          </div>

          {/* Third Place */}
          <div className="text-center">
            <Card className="bg-gradient-to-b from-amber-700/40 to-amber-900/40 border-amber-600/50 w-48">
              <CardContent className="pt-6 pb-4">
                <div className="relative mb-4">
                  <Avatar className="w-20 h-20 mx-auto border-4 border-amber-600">
                    <AvatarImage src={displayData[2]?.avatarUrl} />
                    <AvatarFallback className="bg-amber-900 text-2xl">{displayData[2]?.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 bg-amber-600 rounded-full p-1">
                    <Medal className="w-6 h-6 text-amber-900" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg">{displayData[2]?.displayName}</h3>
                <Badge className={getTierColor(displayData[2]?.tier || 'diamond')}>{displayData[2]?.tier}</Badge>
                <p className="text-2xl font-bold text-green-400 mt-2">+{displayData[2]?.totalPnlPercent}%</p>
                <p className="text-sm text-gray-400">${displayData[2]?.totalPnl} PnL</p>
              </CardContent>
            </Card>
            <div className="bg-amber-700 h-16 mt-2 rounded-t-lg flex items-center justify-center">
              <span className="text-4xl font-bold text-white">3</span>
            </div>
          </div>
        </div>

        {/* Full Leaderboard */}
        <Card className="bg-black/40 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Full Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2" data-testid="leaderboard-list">
              {displayData.slice(3).map((trader, idx) => (
                <div 
                  key={trader.userId}
                  className="flex items-center gap-4 p-4 bg-gray-900/40 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all"
                  data-testid={`leaderboard-row-${trader.rank}`}
                >
                  <div className="w-12 text-center">
                    {getRankIcon(trader.rank)}
                  </div>
                  <Avatar className="w-12 h-12 border-2 border-gray-600">
                    <AvatarImage src={trader.avatarUrl} />
                    <AvatarFallback className="bg-gray-700">{trader.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{trader.displayName}</h3>
                      <Badge className={`text-xs ${getTierColor(trader.tier)}`}>{trader.tier}</Badge>
                      {trader.isOnline && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{trader.totalTrades} trades</span>
                      <span>{trader.winRate}% win</span>
                      {parseInt(trader.tradingStreak) > 0 && (
                        <span className="flex items-center gap-1 text-orange-400">
                          <Flame className="w-3 h-3" />
                          {trader.tradingStreak}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${parseFloat(trader.totalPnlPercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {parseFloat(trader.totalPnlPercent) >= 0 ? '+' : ''}{trader.totalPnlPercent}%
                    </p>
                    <p className="text-sm text-gray-400">${trader.totalPnl}</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-purple-500 text-purple-400" data-testid={`button-view-${trader.rank}`}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
