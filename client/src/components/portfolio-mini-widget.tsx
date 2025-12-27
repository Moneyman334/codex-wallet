import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, PieChart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface PortfolioData {
  totalValue: number;
  change24h: number;
  changePercent: number;
  topHoldings: Array<{
    symbol: string;
    value: number;
    percent: number;
    change: number;
  }>;
}

export function PortfolioMiniWidget() {
  const { data: paperAccount } = useQuery<any>({
    queryKey: ["/api/paper/account"],
  });

  const portfolio: PortfolioData = paperAccount
    ? {
        totalValue: parseFloat(paperAccount.currentBalance || "100000"),
        change24h: parseFloat(paperAccount.totalPnl || "0"),
        changePercent: parseFloat(paperAccount.totalPnlPercent || "0"),
        topHoldings: [
          { symbol: "BTC", value: 45000, percent: 45, change: 2.34 },
          { symbol: "ETH", value: 30000, percent: 30, change: 1.87 },
          { symbol: "SOL", value: 15000, percent: 15, change: 5.23 },
        ],
      }
    : {
        totalValue: 112450,
        change24h: 12450,
        changePercent: 12.45,
        topHoldings: [
          { symbol: "BTC", value: 50602, percent: 45, change: 2.34 },
          { symbol: "ETH", value: 33735, percent: 30, change: 1.87 },
          { symbol: "SOL", value: 16867, percent: 15, change: 5.23 },
        ],
      };

  const isPositive = portfolio.change24h >= 0;

  return (
    <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border-indigo-500/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Wallet className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-medium text-white">Portfolio</span>
          </div>
          <Link href="/paper-trading">
            <a className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View All
              <ArrowRight className="w-3 h-3" />
            </a>
          </Link>
        </div>

        <div className="mb-4">
          <div className="text-2xl font-bold text-white">
            ${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div
            className={`flex items-center gap-1 text-sm ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {isPositive ? "+" : ""}${Math.abs(portfolio.change24h).toLocaleString()}
            </span>
            <span className="text-gray-400">
              ({isPositive ? "+" : ""}{portfolio.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <PieChart className="w-3 h-3" />
            <span>Top Holdings</span>
          </div>
          
          {portfolio.topHoldings.map((holding) => (
            <div
              key={holding.symbol}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                  {holding.symbol.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{holding.symbol}</div>
                  <div className="text-xs text-gray-400">{holding.percent}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white">
                  ${holding.value.toLocaleString()}
                </div>
                <div
                  className={`text-xs ${
                    holding.change >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {holding.change >= 0 ? "+" : ""}{holding.change.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex">
            {portfolio.topHoldings.map((holding, idx) => (
              <div
                key={holding.symbol}
                className="h-2 first:rounded-l last:rounded-r"
                style={{
                  width: `${holding.percent}%`,
                  backgroundColor:
                    idx === 0 ? "#8b5cf6" : idx === 1 ? "#3b82f6" : "#10b981",
                }}
              />
            ))}
            <div
              className="h-2 rounded-r bg-gray-700"
              style={{ width: `${100 - portfolio.topHoldings.reduce((s, h) => s + h.percent, 0)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PortfolioMiniWidget;
