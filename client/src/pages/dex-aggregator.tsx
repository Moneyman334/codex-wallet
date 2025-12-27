import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowDownUp,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";

const POPULAR_TOKENS = [
  { symbol: "ETH", name: "Ethereum", icon: "⟠" },
  { symbol: "USDC", name: "USD Coin", icon: "💵" },
  { symbol: "USDT", name: "Tether", icon: "₮" },
  { symbol: "DAI", name: "Dai Stablecoin", icon: "◈" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "₿" },
  { symbol: "UNI", name: "Uniswap", icon: "🦄" },
];

const DEX_SOURCES = [
  { name: "Uniswap V3", fee: "0.05%", logo: "🦄" },
  { name: "SushiSwap", fee: "0.30%", logo: "🍣" },
  { name: "PancakeSwap", fee: "0.25%", logo: "🥞" },
  { name: "Curve", fee: "0.04%", logo: "🌊" },
  { name: "Aggregator", fee: "Dynamic", logo: "🔷" },
  { name: "Protocol", fee: "Dynamic", logo: "⚡" },
];

export default function DexAggregatorPage() {
  const { toast } = useToast();
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [fromAmount, setFromAmount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [bestRoute, setBestRoute] = useState<any>(null);

  const findBestPrice = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setBestRoute(null);

    setTimeout(() => {
      const mockEstimatedOutput = (parseFloat(fromAmount) * 2450.32).toFixed(2);
      const mockSavings = (parseFloat(mockEstimatedOutput) * 0.012).toFixed(2);

      setBestRoute({
        dex: "Uniswap V3",
        output: mockEstimatedOutput,
        priceImpact: "0.15%",
        gasCost: "$2.34",
        route: ["Uniswap V3 (60%)", "Curve (40%)"],
        savings: mockSavings,
        executionTime: "~12 seconds",
      });
      setIsSearching(false);

      toast({
        title: "Best Route Found!",
        description: `Save $${mockSavings} vs direct swap`,
      });
    }, 2000);
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DEX Aggregator
                </h1>
                <p className="text-sm text-muted-foreground">
                  Best prices across Uniswap, SushiSwap, Curve, PancakeSwap & more
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <span className="w-2 h-2 rounded-full bg-green-600 mr-2 animate-pulse" />
            6 DEXes Connected
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Smart Swap</CardTitle>
                <CardDescription>
                  Automatically routes your trade across multiple DEXes for best execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-card space-y-3">
                    <Label>From</Label>
                    <div className="flex gap-3">
                      <Select value={fromToken} onValueChange={setFromToken}>
                        <SelectTrigger className="w-[180px]" data-testid="select-from-token">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POPULAR_TOKENS.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              <div className="flex items-center gap-2">
                                <span>{token.icon}</span>
                                <span>{token.symbol}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="text-2xl font-bold"
                        data-testid="input-from-amount"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Balance: 5.432 {fromToken}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={swapTokens}
                      className="rounded-full"
                      data-testid="button-swap-tokens"
                    >
                      <ArrowDownUp className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border bg-card space-y-3">
                    <Label>To</Label>
                    <div className="flex gap-3">
                      <Select value={toToken} onValueChange={setToToken}>
                        <SelectTrigger className="w-[180px]" data-testid="select-to-token">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POPULAR_TOKENS.filter(t => t.symbol !== fromToken).map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              <div className="flex items-center gap-2">
                                <span>{token.icon}</span>
                                <span>{token.symbol}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={bestRoute?.output || ""}
                        readOnly
                        className="text-2xl font-bold"
                        data-testid="input-to-amount"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Balance: 12,845.23 {toToken}
                    </div>
                  </div>
                </div>

                {bestRoute && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Best Route Found</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Optimized
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Output</div>
                        <div className="font-bold">{bestRoute.output} {toToken}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">You Save</div>
                        <div className="font-bold text-green-600">${bestRoute.savings}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Price Impact</div>
                        <div className="font-medium">{bestRoute.priceImpact}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Est. Gas</div>
                        <div className="font-medium">{bestRoute.gasCost}</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-green-200 dark:border-green-900">
                      <div className="text-sm text-muted-foreground mb-1">Route</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {bestRoute.route.map((step: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Badge variant="secondary">{step}</Badge>
                            {idx < bestRoute.route.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={findBestPrice}
                    disabled={isSearching || !fromAmount}
                    data-testid="button-find-best-price"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Find Best Price
                      </>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    disabled={!bestRoute}
                    data-testid="button-execute-swap"
                  >
                    Execute Swap
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Use DEX Aggregator?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900 w-fit">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="font-medium">Best Prices</div>
                    <div className="text-sm text-muted-foreground">
                      Save 1-5% vs single DEX trades
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 w-fit">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="font-medium">Low Slippage</div>
                    <div className="text-sm text-muted-foreground">
                      Split trades across pools
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 w-fit">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="font-medium">Fast Execution</div>
                    <div className="text-sm text-muted-foreground">
                      Optimized gas usage
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected DEXes</CardTitle>
                <CardDescription>
                  We scan 6+ decentralized exchanges for best rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DEX_SOURCES.map((dex) => (
                  <div
                    key={dex.name}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{dex.logo}</span>
                      <div>
                        <div className="font-medium">{dex.name}</div>
                        <div className="text-xs text-muted-foreground">Fee: {dex.fee}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Savings</CardTitle>
                <CardDescription>
                  How much users saved today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">$12,847</div>
                    <div className="text-sm text-muted-foreground">Total saved today</div>
                  </div>
                  <div className="text-center pt-4 border-t">
                    <div className="text-2xl font-bold">3,421</div>
                    <div className="text-sm text-muted-foreground">Swaps optimized</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
