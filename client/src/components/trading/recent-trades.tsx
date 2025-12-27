import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Clock } from "lucide-react";

interface Trade {
  id: string;
  price: number;
  amount: number;
  side: "buy" | "sell";
  time: Date;
}

interface RecentTradesProps {
  symbol?: string;
  basePrice?: number;
}

function generateTrades(basePrice: number, count: number = 20): Trade[] {
  const trades: Trade[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const variance = (Math.random() - 0.5) * 0.002 * basePrice;
    trades.push({
      id: `trade-${now}-${i}`,
      price: basePrice + variance,
      amount: Math.random() * 2 + 0.01,
      side: Math.random() > 0.5 ? "buy" : "sell",
      time: new Date(now - i * (Math.random() * 5000 + 1000)),
    });
  }
  
  return trades;
}

export function RecentTrades({ symbol = "BTC/USDT", basePrice = 98500 }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>(() => generateTrades(basePrice));
  const baseAsset = symbol.split("/")[0];

  useEffect(() => {
    const interval = setInterval(() => {
      const variance = (Math.random() - 0.5) * 0.002 * basePrice;
      const newTrade: Trade = {
        id: `trade-${Date.now()}`,
        price: basePrice + variance,
        amount: Math.random() * 2 + 0.01,
        side: Math.random() > 0.5 ? "buy" : "sell",
        time: new Date(),
      };
      
      setTrades(prev => [newTrade, ...prev.slice(0, 19)]);
    }, Math.random() * 3000 + 1000);
    
    return () => clearInterval(interval);
  }, [basePrice]);

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatAmount = (amount: number) => amount.toFixed(4);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 h-full" data-testid="recent-trades">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300">Recent Trades</CardTitle>
          <Badge variant="outline" className="text-xs border-gray-700">
            <Clock className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2 px-1">
          <span>Price (USDT)</span>
          <span className="text-right">Amount ({baseAsset})</span>
          <span className="text-right">Time</span>
        </div>
        
        <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {trades.map((trade, i) => (
            <div 
              key={trade.id}
              className={`grid grid-cols-3 gap-2 text-xs py-1 px-1 hover:bg-gray-800/50 transition-colors ${
                i === 0 ? "animate-pulse" : ""
              }`}
              data-testid={`trade-row-${i}`}
            >
              <span className={`flex items-center gap-1 font-mono ${
                trade.side === "buy" ? "text-green-400" : "text-red-400"
              }`}>
                {trade.side === "buy" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {formatPrice(trade.price)}
              </span>
              <span className="text-gray-300 text-right font-mono">
                {formatAmount(trade.amount)}
              </span>
              <span className="text-gray-500 text-right font-mono">
                {formatTime(trade.time)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentTrades;
