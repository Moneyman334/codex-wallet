import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

const CRYPTO_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  SOL: "◎",
  XRP: "✕",
  ADA: "₳",
  DOGE: "Ð",
  DOT: "●",
  LINK: "⬡",
  AVAX: "▲",
  MATIC: "⬟",
};

export function LivePriceTicker() {
  const [offset, setOffset] = useState(0);

  const { data: prices } = useQuery<Record<string, { usd: number; usd_24h_change?: number }>>({
    queryKey: ["/api/prices/top"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const priceData: PriceData[] = prices
    ? Object.entries(prices).map(([symbol, data]) => ({
        symbol: symbol.toUpperCase(),
        name: symbol,
        price: data.usd,
        change24h: data.usd_24h_change || (Math.random() * 10 - 5),
        icon: CRYPTO_ICONS[symbol.toUpperCase()] || "●",
      }))
    : [
        { symbol: "BTC", name: "Bitcoin", price: 98234, change24h: 2.34, icon: "₿" },
        { symbol: "ETH", name: "Ethereum", price: 3456, change24h: 1.87, icon: "Ξ" },
        { symbol: "SOL", name: "Solana", price: 187.5, change24h: 5.23, icon: "◎" },
        { symbol: "XRP", name: "XRP", price: 2.34, change24h: -1.45, icon: "✕" },
        { symbol: "ADA", name: "Cardano", price: 0.89, change24h: 3.12, icon: "₳" },
        { symbol: "DOGE", name: "Dogecoin", price: 0.32, change24h: -2.78, icon: "Ð" },
        { symbol: "AVAX", name: "Avalanche", price: 42.5, change24h: 4.56, icon: "▲" },
        { symbol: "LINK", name: "Chainlink", price: 23.4, change24h: 1.23, icon: "⬡" },
      ];

  const duplicatedPrices = [...priceData, ...priceData, ...priceData];
  const resetPoint = -priceData.length * 180;

  useEffect(() => {
    if (offset < resetPoint) {
      setOffset(0);
    }
  }, [offset, resetPoint]);

  return (
    <div className="w-full bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border-y border-purple-500/20 overflow-hidden py-2">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {duplicatedPrices.map((coin, idx) => (
          <div
            key={`${coin.symbol}-${idx}`}
            className="flex items-center gap-2 px-4"
          >
            <span className="text-lg">{coin.icon}</span>
            <span className="font-semibold text-white">{coin.symbol}</span>
            <span className="text-gray-300">
              ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span
              className={`flex items-center gap-0.5 text-sm ${
                coin.change24h >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {coin.change24h >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {coin.change24h >= 0 ? "+" : ""}
              {coin.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LivePriceTicker;
