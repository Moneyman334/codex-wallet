import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown } from "lucide-react";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  percentage: number;
}

interface OrderBookProps {
  symbol?: string;
  basePrice?: number;
}

function generateOrderBook(basePrice: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  let bidTotal = 0;
  let askTotal = 0;
  
  for (let i = 0; i < 15; i++) {
    const bidSpread = (i + 1) * 0.0001 * basePrice + Math.random() * 0.0001 * basePrice;
    const askSpread = (i + 1) * 0.0001 * basePrice + Math.random() * 0.0001 * basePrice;
    
    const bidPrice = basePrice - bidSpread;
    const askPrice = basePrice + askSpread;
    
    const bidAmount = Math.random() * 10 + 0.1;
    const askAmount = Math.random() * 10 + 0.1;
    
    bidTotal += bidAmount;
    askTotal += askAmount;
    
    bids.push({
      price: bidPrice,
      amount: bidAmount,
      total: bidTotal,
      percentage: 0,
    });
    
    asks.push({
      price: askPrice,
      amount: askAmount,
      total: askTotal,
      percentage: 0,
    });
  }
  
  const maxBidTotal = bids[bids.length - 1].total;
  const maxAskTotal = asks[asks.length - 1].total;
  
  bids.forEach(b => b.percentage = (b.total / maxBidTotal) * 100);
  asks.forEach(a => a.percentage = (a.total / maxAskTotal) * 100);
  
  return { bids, asks: asks.reverse() };
}

export function OrderBook({ symbol = "BTC/USDT", basePrice = 98500 }: OrderBookProps) {
  const [view, setView] = useState<"both" | "bids" | "asks">("both");
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(basePrice));
  const [spread, setSpread] = useState({ value: 0, percentage: 0 });
  
  useEffect(() => {
    setOrderBook(generateOrderBook(basePrice));
    
    const interval = setInterval(() => {
      setOrderBook(prev => {
        const newBook = { ...prev };
        newBook.bids = prev.bids.map(b => ({
          ...b,
          amount: Math.max(0.1, b.amount + (Math.random() - 0.5) * 0.5),
        }));
        newBook.asks = prev.asks.map(a => ({
          ...a,
          amount: Math.max(0.1, a.amount + (Math.random() - 0.5) * 0.5),
        }));
        return newBook;
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, [basePrice]);
  
  useEffect(() => {
    const lowestAsk = Math.min(...orderBook.asks.map(a => a.price));
    const highestBid = Math.max(...orderBook.bids.map(b => b.price));
    const spreadValue = lowestAsk - highestBid;
    const spreadPercentage = (spreadValue / lowestAsk) * 100;
    setSpread({ value: spreadValue, percentage: spreadPercentage });
  }, [orderBook]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatAmount = (amount: number) => amount.toFixed(4);

  return (
    <Card className="bg-gray-900/50 border-gray-800 h-full" data-testid="order-book">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300">Order Book</CardTitle>
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList className="h-7 bg-gray-800">
              <TabsTrigger value="both" className="text-xs px-2 h-6 data-[state=active]:bg-purple-600">
                Both
              </TabsTrigger>
              <TabsTrigger value="bids" className="text-xs px-2 h-6 data-[state=active]:bg-green-600">
                Bids
              </TabsTrigger>
              <TabsTrigger value="asks" className="text-xs px-2 h-6 data-[state=active]:bg-red-600">
                Asks
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2 px-1">
          <span>Price (USDT)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Total</span>
        </div>
        
        <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {(view === "both" || view === "asks") && (
            <div className="space-y-0.5">
              {orderBook.asks.slice(view === "asks" ? 0 : -8).map((ask, i) => (
                <div 
                  key={`ask-${i}`}
                  className="relative grid grid-cols-3 gap-2 text-xs py-0.5 px-1 hover:bg-gray-800/50 cursor-pointer"
                  data-testid={`ask-row-${i}`}
                >
                  <div 
                    className="absolute inset-0 bg-red-500/10"
                    style={{ width: `${ask.percentage}%`, right: 0, left: 'auto' }}
                  />
                  <span className="relative text-red-400 font-mono">{formatPrice(ask.price)}</span>
                  <span className="relative text-gray-300 text-right font-mono">{formatAmount(ask.amount)}</span>
                  <span className="relative text-gray-400 text-right font-mono">{formatAmount(ask.total)}</span>
                </div>
              ))}
            </div>
          )}
          
          {view === "both" && (
            <div className="py-2 px-1 border-y border-gray-800 my-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white" data-testid="spread-price">
                  ${formatPrice(basePrice)}
                </span>
                <Badge variant="outline" className="text-xs border-gray-700">
                  Spread: {spread.percentage.toFixed(3)}%
                </Badge>
              </div>
            </div>
          )}
          
          {(view === "both" || view === "bids") && (
            <div className="space-y-0.5">
              {orderBook.bids.slice(0, view === "bids" ? undefined : 8).map((bid, i) => (
                <div 
                  key={`bid-${i}`}
                  className="relative grid grid-cols-3 gap-2 text-xs py-0.5 px-1 hover:bg-gray-800/50 cursor-pointer"
                  data-testid={`bid-row-${i}`}
                >
                  <div 
                    className="absolute inset-0 bg-green-500/10"
                    style={{ width: `${bid.percentage}%`, right: 0, left: 'auto' }}
                  />
                  <span className="relative text-green-400 font-mono">{formatPrice(bid.price)}</span>
                  <span className="relative text-gray-300 text-right font-mono">{formatAmount(bid.amount)}</span>
                  <span className="relative text-gray-400 text-right font-mono">{formatAmount(bid.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderBook;
