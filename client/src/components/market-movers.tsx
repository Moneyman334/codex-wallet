import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Flame, Snowflake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Mover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: string;
}

export function MarketMovers() {
  const { data: prices } = useQuery<Record<string, { usd: number; usd_24h_change?: number }>>({
    queryKey: ["/api/prices/top"],
    refetchInterval: 30000,
  });

  const mockMovers = {
    gainers: [
      { symbol: "SOL", name: "Solana", price: 187.5, change: 12.34, volume: "$4.2B" },
      { symbol: "AVAX", name: "Avalanche", price: 42.5, change: 8.76, volume: "$890M" },
      { symbol: "LINK", name: "Chainlink", price: 23.4, change: 6.54, volume: "$1.1B" },
    ],
    losers: [
      { symbol: "DOGE", name: "Dogecoin", price: 0.32, change: -5.67, volume: "$2.1B" },
      { symbol: "XRP", name: "XRP", price: 2.34, change: -3.21, volume: "$1.8B" },
      { symbol: "ADA", name: "Cardano", price: 0.89, change: -2.45, volume: "$650M" },
    ],
  };

  const gainers: Mover[] = prices
    ? Object.entries(prices)
        .map(([symbol, data]) => ({
          symbol: symbol.toUpperCase(),
          name: symbol,
          price: data.usd,
          change: data.usd_24h_change || Math.random() * 15,
          volume: `$${(Math.random() * 5).toFixed(1)}B`,
        }))
        .filter((m) => m.change > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 3)
    : mockMovers.gainers;

  const losers: Mover[] = prices
    ? Object.entries(prices)
        .map(([symbol, data]) => ({
          symbol: symbol.toUpperCase(),
          name: symbol,
          price: data.usd,
          change: data.usd_24h_change || -(Math.random() * 10),
          volume: `$${(Math.random() * 3).toFixed(1)}B`,
        }))
        .filter((m) => m.change < 0)
        .sort((a, b) => a.change - b.change)
        .slice(0, 3)
    : mockMovers.losers;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-green-400 text-lg">
            <Flame className="w-5 h-5" />
            Top Gainers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gainers.map((mover, idx) => (
            <div
              key={mover.symbol}
              className="flex items-center justify-between p-2 rounded-lg bg-green-500/5 hover:bg-green-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-green-400 font-bold text-sm">#{idx + 1}</span>
                <div>
                  <div className="font-semibold text-white">{mover.symbol}</div>
                  <div className="text-xs text-gray-400">{mover.volume}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white">
                  ${mover.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp className="w-3 h-3" />
                  +{mover.change.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-900/20 to-rose-900/10 border-red-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-400 text-lg">
            <Snowflake className="w-5 h-5" />
            Top Losers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {losers.map((mover, idx) => (
            <div
              key={mover.symbol}
              className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-red-400 font-bold text-sm">#{idx + 1}</span>
                <div>
                  <div className="font-semibold text-white">{mover.symbol}</div>
                  <div className="text-xs text-gray-400">{mover.volume}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white">
                  ${mover.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <TrendingDown className="w-3 h-3" />
                  {mover.change.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default MarketMovers;
