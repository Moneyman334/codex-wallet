import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";

interface RecentTrade {
  id: string;
  user: string;
  type: "buy" | "sell";
  symbol: string;
  amount: string;
  value: string;
  time: string;
}

const ANONYMOUS_NAMES = [
  "CryptoWhale", "DiamondHands", "MoonShot", "AlphaTrader", "TokenKing",
  "DeFiMaster", "SwingTrader", "HODLer", "BlockchainPro", "CryptoNinja",
  "BitKing", "EthMaxi", "SolanaFan", "AltcoinHunter", "TradingBot",
];

function generateMockTrade(): RecentTrade {
  const symbols = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "AVAX", "LINK"];
  const type = Math.random() > 0.5 ? "buy" : "sell";
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const amount = (Math.random() * 10 + 0.1).toFixed(4);
  const prices: Record<string, number> = {
    BTC: 98234, ETH: 3456, SOL: 187, XRP: 2.34, ADA: 0.89, DOGE: 0.32, AVAX: 42, LINK: 23,
  };
  const value = (parseFloat(amount) * (prices[symbol] || 100)).toFixed(0);
  const user = ANONYMOUS_NAMES[Math.floor(Math.random() * ANONYMOUS_NAMES.length)];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    user: `${user}_${Math.floor(Math.random() * 999)}`,
    type,
    symbol,
    amount,
    value: `$${parseInt(value).toLocaleString()}`,
    time: "just now",
  };
}

export function RecentTradesTicker() {
  const [trades, setTrades] = useState<RecentTrade[]>(() => 
    Array(5).fill(null).map(() => generateMockTrade())
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: activityData } = useQuery<any[]>({
    queryKey: ["/api/activity/live"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setTrades((prev) => {
          const newTrade = generateMockTrade();
          return [newTrade, ...prev.slice(0, 4)];
        });
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-purple-900/10 via-blue-900/10 to-purple-900/10 border border-purple-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
        <h3 className="font-semibold text-white">Live Trades</h3>
        <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      <div className="space-y-2 overflow-hidden">
        {trades.map((trade, idx) => (
          <div
            key={trade.id}
            className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
              idx === 0 && isAnimating
                ? "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            } ${
              trade.type === "buy"
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-1 rounded ${
                  trade.type === "buy" ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                {trade.type === "buy" ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {trade.user.slice(0, 12)}...
                </div>
                <div className="text-xs text-gray-400">
                  {trade.type === "buy" ? "Bought" : "Sold"} {trade.amount} {trade.symbol}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-semibold ${
                  trade.type === "buy" ? "text-green-400" : "text-red-400"
                }`}
              >
                {trade.value}
              </div>
              <div className="text-xs text-gray-500">{trade.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentTradesTicker;
