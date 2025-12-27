import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Wallet, DollarSign, Activity, PieChart
} from "lucide-react";

interface WalletAnalytics {
  totalValue: number;
  change24h: number;
  change7d: number;
  change30d: number;
  totalTransactions: number;
  gasSpent: number;
  topTokens: { symbol: string; value: number; percentage: number }[];
  activityByType: { type: string; count: number; percentage: number }[];
  monthlyVolume: { month: string; volume: number }[];
}

export function WalletAnalytics() {
  const { data: analytics, isLoading } = useQuery<WalletAnalytics>({
    queryKey: ["/api/wallet/analytics"],
    refetchInterval: 60000,
  });

  const mockAnalytics: WalletAnalytics = {
    totalValue: 125432.89,
    change24h: 3.45,
    change7d: -2.12,
    change30d: 15.67,
    totalTransactions: 847,
    gasSpent: 1.234,
    topTokens: [
      { symbol: "ETH", value: 45000, percentage: 35.9 },
      { symbol: "BTC", value: 38000, percentage: 30.3 },
      { symbol: "USDC", value: 25000, percentage: 19.9 },
      { symbol: "SOL", value: 12000, percentage: 9.6 },
      { symbol: "Other", value: 5432.89, percentage: 4.3 },
    ],
    activityByType: [
      { type: "Swaps", count: 423, percentage: 50 },
      { type: "Transfers", count: 212, percentage: 25 },
      { type: "Staking", count: 127, percentage: 15 },
      { type: "NFT", count: 85, percentage: 10 },
    ],
    monthlyVolume: [
      { month: "Oct", volume: 45000 },
      { month: "Nov", volume: 62000 },
      { month: "Dec", volume: 89000 },
    ],
  };

  const data = analytics || mockAnalytics;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-400" : "text-red-400";
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-700 rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20" data-testid="wallet-analytics">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-400">
            <BarChart3 className="w-5 h-5" />
            Wallet Analytics
          </div>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
            <Activity className="w-3 h-3 mr-1" />
            {data.totalTransactions} txns
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Portfolio Value</span>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {formatCurrency(data.totalValue)}
          </div>
          <div className="flex gap-4 text-sm">
            <div className={`flex items-center gap-1 ${getChangeColor(data.change24h)}`}>
              {getChangeIcon(data.change24h)}
              <span>{Math.abs(data.change24h)}% (24h)</span>
            </div>
            <div className={`flex items-center gap-1 ${getChangeColor(data.change7d)}`}>
              {getChangeIcon(data.change7d)}
              <span>{Math.abs(data.change7d)}% (7d)</span>
            </div>
            <div className={`flex items-center gap-1 ${getChangeColor(data.change30d)}`}>
              {getChangeIcon(data.change30d)}
              <span>{Math.abs(data.change30d)}% (30d)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-black/20 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Activity className="w-3 h-3" />
              Total Transactions
            </div>
            <div className="text-xl font-bold text-white">{data.totalTransactions}</div>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <DollarSign className="w-3 h-3" />
              Gas Spent (ETH)
            </div>
            <div className="text-xl font-bold text-white">{data.gasSpent}</div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <PieChart className="w-4 h-4" />
            Portfolio Allocation
          </div>
          <div className="space-y-2">
            {data.topTokens.slice(0, 4).map((token) => (
              <div key={token.symbol} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {token.symbol.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{token.symbol}</span>
                    <span className="text-gray-400 text-xs">{token.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      style={{ width: `${token.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-gray-300 text-sm">{formatCurrency(token.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Activity className="w-4 h-4" />
            Activity Breakdown
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.activityByType.map((activity) => (
              <div
                key={activity.type}
                className="p-2 rounded-lg bg-black/20 border border-gray-700/50 text-center"
              >
                <div className="text-lg font-bold text-white">{activity.count}</div>
                <div className="text-xs text-gray-400">{activity.type}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WalletAnalytics;
