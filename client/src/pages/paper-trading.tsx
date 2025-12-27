import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  PlayCircle, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Activity,
  BarChart3,
  RefreshCw,
  DollarSign,
  Target,
  Zap,
  Award,
  History
} from "lucide-react";

interface PaperAccount {
  id: string;
  name: string;
  initialBalance: string;
  currentBalance: string;
  totalPnl: string;
  totalPnlPercent: string;
  totalTrades: string;
  winningTrades: string;
  holdings: Record<string, string>;
}

interface PaperTrade {
  id: string;
  type: string;
  symbol: string;
  amount: string;
  price: string;
  totalValue: string;
  pnl?: string;
  executedAt: string;
}

export default function PaperTradingPage() {
  const { toast } = useToast();
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [amount, setAmount] = useState("");

  const { data: account, isLoading } = useQuery<PaperAccount>({
    queryKey: ["/api/paper/account"],
  });

  const { data: trades } = useQuery<PaperTrade[]>({
    queryKey: ["/api/paper/trades"],
  });

  const { data: prices } = useQuery<any>({
    queryKey: ["/api/prices"],
    refetchInterval: 5000,
  });

  const executeTradeMutation = useMutation({
    mutationFn: async (data: { type: string; symbol: string; amount: string }) => {
      return apiRequest('POST', '/api/paper/trade', data);
    },
    onSuccess: () => {
      toast({
        title: "Trade Executed!",
        description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${amount} ${selectedSymbol}`,
      });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/paper/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/paper/trades"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/paper/reset');
    },
    onSuccess: () => {
      toast({
        title: "Account Reset",
        description: "Your paper trading account has been reset to $100,000",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/paper/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/paper/trades"] });
    },
  });

  const mockAccount: PaperAccount = {
    id: "1",
    name: "Practice Account",
    initialBalance: "100000",
    currentBalance: "112450",
    totalPnl: "12450",
    totalPnlPercent: "12.45",
    totalTrades: "47",
    winningTrades: "32",
    holdings: { BTC: "0.5", ETH: "5.2", SOL: "100" }
  };

  const mockTrades: PaperTrade[] = [
    { id: "1", type: "buy", symbol: "BTC", amount: "0.1", price: "96500", totalValue: "9650", executedAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "2", type: "sell", symbol: "ETH", amount: "2.0", price: "3450", totalValue: "6900", pnl: "+450", executedAt: new Date(Date.now() - 7200000).toISOString() },
    { id: "3", type: "buy", symbol: "SOL", amount: "50", price: "180", totalValue: "9000", executedAt: new Date(Date.now() - 10800000).toISOString() },
  ];

  const displayAccount = account || mockAccount;
  const displayTrades = trades || mockTrades;
  const currentPrice = prices?.[selectedSymbol]?.usd || 0;
  const estimatedValue = currentPrice * parseFloat(amount || "0");
  const winRate = parseInt(displayAccount.totalTrades) > 0 
    ? ((parseInt(displayAccount.winningTrades) / parseInt(displayAccount.totalTrades)) * 100).toFixed(1)
    : "0";

  const assets = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "AVAX", "LINK"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Paper Trading</h1>
              <p className="text-gray-400">Practice trading with $100,000 virtual money</p>
            </div>
            <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/50">
              <Zap className="w-3 h-3 mr-1" />
              SIMULATION
            </Badge>
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card className="bg-black/40 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white" data-testid="stat-balance">
                    ${parseInt(displayAccount.currentBalance).toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-emerald-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total P&L</p>
                  <p className={`text-2xl font-bold ${parseFloat(displayAccount.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="stat-pnl">
                    {parseFloat(displayAccount.totalPnl) >= 0 ? '+' : ''}${parseInt(displayAccount.totalPnl).toLocaleString()}
                  </p>
                </div>
                {parseFloat(displayAccount.totalPnl) >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">P&L %</p>
                  <p className={`text-2xl font-bold ${parseFloat(displayAccount.totalPnlPercent) >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="stat-pnl-percent">
                    {parseFloat(displayAccount.totalPnlPercent) >= 0 ? '+' : ''}{displayAccount.totalPnlPercent}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Trades</p>
                  <p className="text-2xl font-bold text-white" data-testid="stat-trades">{displayAccount.totalTrades}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-yellow-400" data-testid="stat-winrate">{winRate}%</p>
                </div>
                <Award className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Trade Panel */}
          <Card className="bg-black/40 border-gray-700 md:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Execute Trade
              </CardTitle>
              <CardDescription className="text-gray-400">
                Place a simulated trade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buy/Sell Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={tradeType === "buy" ? "default" : "outline"}
                  onClick={() => setTradeType("buy")}
                  className={tradeType === "buy" ? "bg-green-600 hover:bg-green-700" : "border-gray-600"}
                  data-testid="button-buy"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Buy
                </Button>
                <Button
                  variant={tradeType === "sell" ? "default" : "outline"}
                  onClick={() => setTradeType("sell")}
                  className={tradeType === "sell" ? "bg-red-600 hover:bg-red-700" : "border-gray-600"}
                  data-testid="button-sell"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Sell
                </Button>
              </div>

              {/* Asset Selection */}
              <div className="space-y-2">
                <Label className="text-gray-400">Asset</Label>
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white" data-testid="select-asset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map(asset => (
                      <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Price */}
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Price</span>
                  <span className="text-white font-semibold">${currentPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-gray-400">Amount ({selectedSymbol})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white text-lg"
                  data-testid="input-amount"
                />
              </div>

              {/* Estimated Value */}
              {amount && (
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Estimated Value</span>
                    <span className="text-white font-semibold">${estimatedValue.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Execute Button */}
              <Button
                className={`w-full ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={() => executeTradeMutation.mutate({ type: tradeType, symbol: selectedSymbol, amount })}
                disabled={!amount || parseFloat(amount) <= 0 || executeTradeMutation.isPending}
                data-testid="button-execute"
              >
                {executeTradeMutation.isPending ? 'Executing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedSymbol}`}
              </Button>

              {/* Reset Account */}
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-400"
                onClick={() => resetAccountMutation.mutate()}
                disabled={resetAccountMutation.isPending}
                data-testid="button-reset"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Account
              </Button>
            </CardContent>
          </Card>

          {/* Holdings & History */}
          <Card className="bg-black/40 border-gray-700 md:col-span-2">
            <Tabs defaultValue="holdings">
              <CardHeader>
                <TabsList className="bg-gray-900/50">
                  <TabsTrigger value="holdings" data-testid="tab-holdings">
                    <Wallet className="w-4 h-4 mr-2" />
                    Holdings
                  </TabsTrigger>
                  <TabsTrigger value="history" data-testid="tab-history">
                    <History className="w-4 h-4 mr-2" />
                    Trade History
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="holdings" className="mt-0">
                  <div className="space-y-3" data-testid="holdings-list">
                    {Object.entries(displayAccount.holdings || {}).length > 0 ? (
                      Object.entries(displayAccount.holdings).map(([symbol, amount]) => (
                        <div 
                          key={symbol}
                          className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50"
                          data-testid={`holding-${symbol.toLowerCase()}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                              <span className="text-lg font-bold text-green-400">{symbol[0]}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{symbol}</p>
                              <p className="text-sm text-gray-400">{amount} units</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">
                              ${((prices?.[symbol]?.usd || 0) * parseFloat(amount)).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-400">
                              @ ${(prices?.[symbol]?.usd || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No holdings yet</p>
                        <p className="text-sm">Start trading to build your portfolio</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="history" className="mt-0">
                  <div className="space-y-3" data-testid="trades-list">
                    {displayTrades.length > 0 ? (
                      displayTrades.map((trade, idx) => (
                        <div 
                          key={trade.id}
                          className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50"
                          data-testid={`trade-${idx}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trade.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                              {trade.type === 'buy' ? (
                                <TrendingUp className="w-5 h-5 text-green-400" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white capitalize">{trade.type} {trade.symbol}</p>
                              <p className="text-sm text-gray-400">
                                {trade.amount} @ ${parseFloat(trade.price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">${parseFloat(trade.totalValue).toLocaleString()}</p>
                            {trade.pnl && (
                              <p className={`text-sm ${trade.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                {trade.pnl}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No trades yet</p>
                        <p className="text-sm">Execute your first trade to get started</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
