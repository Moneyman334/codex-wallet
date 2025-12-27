import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePageTracking } from "@/hooks/use-analytics";
import { Link } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle2,
  Zap,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Crown,
  Star,
  Wallet,
  Bell,
  Settings,
  Maximize2,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

import AdvancedChart from "@/components/trading/advanced-chart";
import OrderBook from "@/components/trading/order-book";
import TradeExecution from "@/components/trading/trade-execution";
import RecentTrades from "@/components/trading/recent-trades";
import TechnicalIndicators from "@/components/trading/technical-indicators";
import PortfolioWidget from "@/components/trading/portfolio-widget";

const basePrices: Record<string, number> = {
  "BTC/USDT": 98500,
  "ETH/USDT": 3450,
  "SOL/USDT": 195,
  "BNB/USDT": 695,
  "XRP/USDT": 2.35,
  "ADA/USDT": 0.98,
  "DOGE/USDT": 0.32,
  "AVAX/USDT": 42,
};

const marketStats = [
  { label: "24h Volume", value: "$48.2B", change: "+12.4%" },
  { label: "Open Interest", value: "$23.1B", change: "+5.2%" },
  { label: "Funding Rate", value: "0.0100%", change: "-0.002%" },
  { label: "Long/Short", value: "1.24", change: "+0.08" },
];

export default function LiveTradingPage() {
  usePageTracking('Live Trading Pro');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  const [layout, setLayout] = useState<"default" | "chart-focus" | "trading-focus">("default");
  
  const currentPrice = basePrices[selectedSymbol] || 98500;

  const { data: priceData } = useQuery<any>({
    queryKey: ['/api/prices'],
    refetchInterval: 10000,
  });

  const { data: openOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/trading/orders/open'],
    refetchInterval: 10000,
  });

  const { data: orderHistory = [] } = useQuery<any[]>({
    queryKey: ['/api/trading/orders/history'],
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest('POST', `/api/trading/orders/${orderId}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/orders/open'] });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950">
      <div className="bg-gray-900/80 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" data-testid="back-button">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              
              <div className="h-6 w-px bg-gray-700" />
              
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  CODEX Pro Trading
                </span>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">LIVE</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {marketStats.map((stat, i) => (
                <div key={i} className="hidden lg:flex flex-col items-end">
                  <span className="text-xs text-gray-500">{stat.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-white">{stat.value}</span>
                    <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : stat.change.startsWith('-') ? 'text-red-400' : 'text-gray-400'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/prices'] });
                    toast({ title: "Prices refreshed" });
                  }}
                  data-testid="refresh-button"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400" data-testid="alerts-button">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400" data-testid="settings-button">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400" data-testid="fullscreen-button">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto p-4">
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Tabs value={layout} onValueChange={(v) => setLayout(v as typeof layout)}>
              <TabsList className="bg-gray-800">
                <TabsTrigger value="default" className="data-[state=active]:bg-purple-600" data-testid="layout-default">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Default
                </TabsTrigger>
                <TabsTrigger value="chart-focus" className="data-[state=active]:bg-purple-600" data-testid="layout-chart">
                  <LineChart className="w-4 h-4 mr-2" />
                  Chart Focus
                </TabsTrigger>
                <TabsTrigger value="trading-focus" className="data-[state=active]:bg-purple-600" data-testid="layout-trading">
                  <Activity className="w-4 h-4 mr-2" />
                  Trading Focus
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Connected
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Zap className="w-3 h-3 mr-1" />
              Ultra-Low Latency
            </Badge>
          </div>
        </div>

        {layout === "default" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-8 space-y-4">
              <AdvancedChart 
                symbol={selectedSymbol} 
                onSymbolChange={setSelectedSymbol}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TechnicalIndicators symbol={selectedSymbol} />
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Market Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Fear & Greed Index</span>
                        <Badge className="bg-green-500/20 text-green-400">75 - Greed</Badge>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: '75%' }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Bullish</span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-medium">68%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Bearish</span>
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-medium">32%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="xl:col-span-4 space-y-4">
              <TradeExecution 
                symbol={selectedSymbol} 
                currentPrice={currentPrice}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
                <OrderBook 
                  symbol={selectedSymbol}
                  basePrice={currentPrice}
                />
                <RecentTrades 
                  symbol={selectedSymbol}
                  basePrice={currentPrice}
                />
              </div>
            </div>
          </div>
        )}

        {layout === "chart-focus" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-10">
              <AdvancedChart 
                symbol={selectedSymbol} 
                onSymbolChange={setSelectedSymbol}
              />
            </div>
            <div className="xl:col-span-2 space-y-4">
              <TradeExecution 
                symbol={selectedSymbol} 
                currentPrice={currentPrice}
              />
            </div>
          </div>
        )}

        {layout === "trading-focus" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-3 space-y-4">
              <PortfolioWidget />
              <TechnicalIndicators symbol={selectedSymbol} />
            </div>
            
            <div className="xl:col-span-5">
              <AdvancedChart 
                symbol={selectedSymbol} 
                onSymbolChange={setSelectedSymbol}
              />
            </div>
            
            <div className="xl:col-span-4 space-y-4">
              <TradeExecution 
                symbol={selectedSymbol} 
                currentPrice={currentPrice}
              />
              <div className="grid grid-cols-2 gap-4">
                <OrderBook 
                  symbol={selectedSymbol}
                  basePrice={currentPrice}
                />
                <RecentTrades 
                  symbol={selectedSymbol}
                  basePrice={currentPrice}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Trades</div>
                  <div className="text-xl font-bold text-white">2,847</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                  <div className="text-xl font-bold text-green-400">67.4%</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total P&L</div>
                  <div className="text-xl font-bold text-blue-400">+$24,892</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Rank</div>
                  <div className="text-xl font-bold text-yellow-400">#142</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Your Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="open" className="w-full">
              <TabsList className="bg-gray-800">
                <TabsTrigger value="open" data-testid="tab-open-orders">
                  Open Orders ({openOrders.length})
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-order-history">
                  Order History ({orderHistory.slice(0, 10).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="open">
                <ScrollArea className="h-[200px]">
                  {openOrders.length > 0 ? (
                    <div className="space-y-2" data-testid="list-open-orders">
                      {openOrders.map((order: any) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                          data-testid={`order-${order.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge className={order.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                {order.side?.toUpperCase()}
                              </Badge>
                              <span className="text-white font-medium">{order.pair}</span>
                              <Badge variant="outline" className="border-gray-700 text-gray-400">
                                {order.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              Amount: {order.amount} @ ${order.executedPrice || order.limitPrice || 'Market'}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelOrderMutation.mutate(order.id)}
                            disabled={cancelOrderMutation.isPending}
                            data-testid={`button-cancel-${order.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No open orders</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history">
                <ScrollArea className="h-[200px]">
                  {orderHistory.length > 0 ? (
                    <div className="space-y-2" data-testid="list-order-history">
                      {orderHistory.slice(0, 10).map((order: any) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                          data-testid={`history-${order.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge className={order.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                {order.side?.toUpperCase()}
                              </Badge>
                              <span className="text-white font-medium">{order.pair}</span>
                              {order.status === 'filled' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {order.amount} @ ${order.executedPrice} · {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No order history</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Trading involves risk. Past performance is not indicative of future results.</p>
          <p className="mt-1">CODEX Pro Trading • Ultra-Low Latency • Real-Time Data</p>
        </div>
      </div>
    </div>
  );
}
