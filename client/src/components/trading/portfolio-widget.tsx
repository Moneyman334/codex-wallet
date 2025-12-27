import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from "lucide-react";

interface Position {
  symbol: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

const mockPositions: Position[] = [
  { symbol: "BTC", amount: 0.5, avgPrice: 95000, currentPrice: 98500, value: 49250, pnl: 1750, pnlPercent: 3.68, allocation: 55 },
  { symbol: "ETH", amount: 5.2, avgPrice: 3200, currentPrice: 3450, value: 17940, pnl: 1300, pnlPercent: 7.81, allocation: 20 },
  { symbol: "SOL", amount: 50, avgPrice: 180, currentPrice: 195, value: 9750, pnl: 750, pnlPercent: 8.33, allocation: 11 },
  { symbol: "USDT", amount: 8500, avgPrice: 1, currentPrice: 1, value: 8500, pnl: 0, pnlPercent: 0, allocation: 9.5 },
  { symbol: "BNB", amount: 5, avgPrice: 650, currentPrice: 695, value: 3475, pnl: 225, pnlPercent: 6.92, allocation: 4 },
];

export function PortfolioWidget() {
  const [positions, setPositions] = useState(mockPositions);
  const [showBalance, setShowBalance] = useState(true);
  
  const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100;
  const isPositive = totalPnL >= 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(p => {
        if (p.symbol === "USDT") return p;
        const change = (Math.random() - 0.5) * 0.002 * p.currentPrice;
        const newPrice = p.currentPrice + change;
        const newValue = p.amount * newPrice;
        const newPnl = (newPrice - p.avgPrice) * p.amount;
        const newPnlPercent = ((newPrice - p.avgPrice) / p.avgPrice) * 100;
        return {
          ...p,
          currentPrice: newPrice,
          value: newValue,
          pnl: newPnl,
          pnlPercent: newPnlPercent,
        };
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (!showBalance) return "****";
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800" data-testid="portfolio-widget">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-400" />
            <CardTitle className="text-sm font-medium text-gray-300">Portfolio</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="h-7 w-7 p-0 text-gray-400"
            data-testid="toggle-balance"
          >
            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white" data-testid="total-value">
              {formatCurrency(totalValue)}
            </span>
            <Badge 
              className={isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
              data-testid="total-pnl"
            >
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {isPositive ? "+" : ""}{formatCurrency(totalPnL)} ({isPositive ? "+" : ""}{totalPnLPercent.toFixed(2)}%)
            </Badge>
          </div>
          <span className="text-xs text-gray-500">Total Portfolio Value</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Asset Allocation</span>
            <span>{positions.length} Assets</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="bg-orange-500" style={{ width: `${positions[0]?.allocation || 0}%` }} />
            <div className="bg-blue-500" style={{ width: `${positions[1]?.allocation || 0}%` }} />
            <div className="bg-purple-500" style={{ width: `${positions[2]?.allocation || 0}%` }} />
            <div className="bg-green-500" style={{ width: `${positions[3]?.allocation || 0}%` }} />
            <div className="bg-yellow-500" style={{ width: `${positions[4]?.allocation || 0}%` }} />
          </div>
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
          {positions.map((position, i) => (
            <div 
              key={position.symbol}
              className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              data-testid={`position-${position.symbol}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-orange-500/20 text-orange-400" :
                  i === 1 ? "bg-blue-500/20 text-blue-400" :
                  i === 2 ? "bg-purple-500/20 text-purple-400" :
                  i === 3 ? "bg-green-500/20 text-green-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {position.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{position.symbol}</div>
                  <div className="text-xs text-gray-400">
                    {position.amount.toFixed(4)} @ ${position.avgPrice.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {showBalance ? `$${position.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "****"}
                </div>
                <div className={`text-xs flex items-center justify-end gap-1 ${
                  position.pnl >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {position.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {showBalance ? (
                    <span>{position.pnl >= 0 ? "+" : ""}{position.pnlPercent.toFixed(2)}%</span>
                  ) : "**%"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-500">24h Change</div>
              <div className={`text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? "+" : ""}{(totalPnLPercent * 0.3).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">7d Change</div>
              <div className="text-sm font-medium text-green-400">+8.42%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">30d Change</div>
              <div className="text-sm font-medium text-green-400">+24.67%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PortfolioWidget;
