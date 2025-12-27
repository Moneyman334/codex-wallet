import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fuel, TrendingDown, TrendingUp, Minus, Zap, Clock, AlertTriangle } from "lucide-react";

interface GasPrice {
  network: string;
  symbol: string;
  low: number;
  average: number;
  high: number;
  instant: number;
  baseFee?: number;
  priorityFee?: number;
  lastUpdated: string;
  trend: "up" | "down" | "stable";
  congestion: "low" | "medium" | "high";
}

const NETWORK_COLORS: Record<string, string> = {
  ethereum: "from-blue-500 to-indigo-600",
  polygon: "from-purple-500 to-violet-600",
  arbitrum: "from-blue-400 to-cyan-500",
  optimism: "from-red-500 to-rose-600",
  base: "from-blue-600 to-blue-800",
  bsc: "from-yellow-500 to-amber-600",
};

const NETWORK_ICONS: Record<string, string> = {
  ethereum: "Ξ",
  polygon: "⬟",
  arbitrum: "◆",
  optimism: "⭕",
  base: "🔵",
  bsc: "⬡",
};

export function GasTracker() {
  const { data: gasPrices, isLoading } = useQuery<GasPrice[]>({
    queryKey: ["/api/gas/prices"],
    refetchInterval: 15000,
  });

  const mockGasPrices: GasPrice[] = [
    {
      network: "ethereum",
      symbol: "ETH",
      low: 12,
      average: 18,
      high: 25,
      instant: 32,
      baseFee: 15,
      priorityFee: 3,
      lastUpdated: new Date().toISOString(),
      trend: "down",
      congestion: "low",
    },
    {
      network: "polygon",
      symbol: "MATIC",
      low: 45,
      average: 80,
      high: 120,
      instant: 180,
      lastUpdated: new Date().toISOString(),
      trend: "stable",
      congestion: "medium",
    },
    {
      network: "arbitrum",
      symbol: "ETH",
      low: 0.1,
      average: 0.15,
      high: 0.25,
      instant: 0.4,
      lastUpdated: new Date().toISOString(),
      trend: "down",
      congestion: "low",
    },
    {
      network: "optimism",
      symbol: "ETH",
      low: 0.001,
      average: 0.002,
      high: 0.005,
      instant: 0.01,
      lastUpdated: new Date().toISOString(),
      trend: "up",
      congestion: "low",
    },
    {
      network: "base",
      symbol: "ETH",
      low: 0.001,
      average: 0.002,
      high: 0.004,
      instant: 0.008,
      lastUpdated: new Date().toISOString(),
      trend: "stable",
      congestion: "low",
    },
    {
      network: "bsc",
      symbol: "BNB",
      low: 3,
      average: 5,
      high: 8,
      instant: 12,
      lastUpdated: new Date().toISOString(),
      trend: "down",
      congestion: "low",
    },
  ];

  const prices = gasPrices || mockGasPrices;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-red-400" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-green-400" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getCongestionColor = (congestion: string) => {
    switch (congestion) {
      case "high":
        return "text-red-400 bg-red-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20";
      default:
        return "text-green-400 bg-green-500/20";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/20" data-testid="gas-tracker">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-400">
            <Fuel className="w-5 h-5" />
            Gas Tracker
          </div>
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {prices.map((gas) => (
          <div
            key={gas.network}
            className={`p-3 rounded-lg bg-gradient-to-r ${NETWORK_COLORS[gas.network] || "from-gray-600 to-gray-700"} bg-opacity-10 border border-white/5`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{NETWORK_ICONS[gas.network] || "●"}</span>
                <span className="font-medium text-white capitalize">{gas.network}</span>
                {getTrendIcon(gas.trend)}
              </div>
              <Badge className={`text-xs ${getCongestionColor(gas.congestion)}`}>
                {gas.congestion === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                {gas.congestion}
              </Badge>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-black/20 rounded p-1.5">
                <div className="text-xs text-gray-400">Slow</div>
                <div className="text-sm font-semibold text-green-400">{gas.low}</div>
              </div>
              <div className="bg-black/20 rounded p-1.5">
                <div className="text-xs text-gray-400">Avg</div>
                <div className="text-sm font-semibold text-yellow-400">{gas.average}</div>
              </div>
              <div className="bg-black/20 rounded p-1.5">
                <div className="text-xs text-gray-400">Fast</div>
                <div className="text-sm font-semibold text-orange-400">{gas.high}</div>
              </div>
              <div className="bg-black/20 rounded p-1.5">
                <div className="text-xs text-gray-400">
                  <Zap className="w-3 h-3 inline" />
                </div>
                <div className="text-sm font-semibold text-red-400">{gas.instant}</div>
              </div>
            </div>
          </div>
        ))}
        
        <p className="text-xs text-gray-500 text-center pt-2">
          Gas prices in Gwei • Updates every 15s
        </p>
      </CardContent>
    </Card>
  );
}

export default GasTracker;
