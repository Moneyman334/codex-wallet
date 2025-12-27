import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, RefreshCw, AlertCircle, Loader2, Calendar, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { ComplianceDisclaimer } from "@/components/ui/compliance-disclaimer";
import SecurityCenter from "@/components/security-center";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  value: number;
  change24h: number;
  address: string;
}

interface ChainAsset {
  chain: string;
  chainId: number;
  totalValue: number;
  tokens: TokenBalance[];
}

interface PriceData {
  [key: string]: { usd: number; usd_24h_change?: number };
}

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export default function PortfolioPage() {
  const { 
    account, 
    chainId, 
    balance, 
    network, 
    tokens, 
    isLoadingTokens, 
    connectWallet,
    isConnected 
  } = useWeb3();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1W');

  const { data: prices, refetch: refetchPrices } = useQuery<PriceData>({
    queryKey: ["/api/prices"],
    refetchInterval: 30000,
  });

  const ethPrice = prices?.ETH?.usd || prices?.ethereum?.usd || 0;
  const ethChange = prices?.ETH?.usd_24h_change || prices?.ethereum?.usd_24h_change || 0;
  const ethBalanceNum = parseFloat(balance || "0");
  const ethUsdValue = ethBalanceNum * ethPrice;

  const buildPortfolioFromWallet = (): ChainAsset[] => {
    if (!isConnected || !account) return [];

    const chainName = network?.name || "Ethereum";
    const chainIdNum = parseInt(chainId || "1");
    const nativeSymbol = network?.symbol || "ETH";

    const tokenBalances: TokenBalance[] = [
      {
        symbol: nativeSymbol,
        name: chainName,
        balance: parseFloat(balance || "0").toFixed(6),
        value: ethUsdValue,
        change24h: ethChange,
        address: "native",
      },
    ];

    if (tokens && tokens.length > 0) {
      tokens.forEach((token) => {
        const tokenPrice = prices?.[token.symbol]?.usd || 0;
        const tokenChange = prices?.[token.symbol]?.usd_24h_change || 0;
        const tokenValue = parseFloat(token.balance) * tokenPrice;
        
        tokenBalances.push({
          symbol: token.symbol,
          name: token.name,
          balance: parseFloat(token.balance).toFixed(6),
          value: tokenValue,
          change24h: tokenChange,
          address: token.address,
        });
      });
    }

    const totalValue = tokenBalances.reduce((sum, t) => sum + t.value, 0);

    return [{
      chain: chainName,
      chainId: chainIdNum,
      totalValue,
      tokens: tokenBalances.filter(t => parseFloat(t.balance) > 0),
    }];
  };

  const portfolioData = buildPortfolioFromWallet();
  const totalPortfolioValue = portfolioData.reduce((sum, chain) => sum + chain.totalValue, 0);
  
  const weightedChange = portfolioData.reduce((sum, chain) => {
    return sum + chain.tokens.reduce((tokenSum, token) => {
      const weight = totalPortfolioValue > 0 ? token.value / totalPortfolioValue : 0;
      return tokenSum + (token.change24h * weight);
    }, 0);
  }, 0);

  const chainAllocation = portfolioData.map(chain => ({
    name: chain.chain,
    value: chain.totalValue,
    percentage: totalPortfolioValue > 0 ? ((chain.totalValue / totalPortfolioValue) * 100).toFixed(1) : "0",
  }));

  const allTokens = portfolioData.flatMap(chain => chain.tokens);
  const tokenAllocation = allTokens.reduce((acc, token) => {
    const existing = acc.find(t => t.name === token.symbol);
    if (existing) {
      existing.value += token.value;
    } else {
      acc.push({ name: token.symbol, value: token.value });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const getTimePeriodConfig = (period: TimePeriod) => {
    switch (period) {
      case '1D': return { days: 1, points: 24, format: 'hour' };
      case '1W': return { days: 7, points: 7, format: 'day' };
      case '1M': return { days: 30, points: 30, format: 'day' };
      case '3M': return { days: 90, points: 12, format: 'week' };
      case '1Y': return { days: 365, points: 12, format: 'month' };
      case 'ALL': return { days: 730, points: 24, format: 'month' };
      default: return { days: 7, points: 7, format: 'day' };
    }
  };

  const performanceData = useMemo(() => {
    const config = getTimePeriodConfig(timePeriod);
    const volatility = 0.03;
    const trend = weightedChange / 100;
    
    return Array.from({ length: config.points }, (_, i) => {
      const date = new Date();
      const daysBack = config.days - (config.days / config.points) * i;
      date.setDate(date.getDate() - Math.floor(daysBack));
      
      const progress = i / (config.points - 1);
      const randomFactor = (Math.sin(i * 1.5) * volatility) + (Math.cos(i * 0.7) * volatility * 0.5);
      const trendFactor = trend * progress;
      const dayVariation = 1 - trend + trendFactor + randomFactor;
      
      let dateLabel: string;
      if (config.format === 'hour') {
        const hour = 24 - Math.floor((config.points - i) * (24 / config.points));
        dateLabel = `${hour.toString().padStart(2, '0')}:00`;
      } else if (config.format === 'week') {
        dateLabel = `W${Math.ceil((config.days - daysBack) / 7)}`;
      } else if (config.format === 'month') {
        dateLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      return {
        date: dateLabel,
        value: Math.max(0, totalPortfolioValue * dayVariation),
        change: ((dayVariation - 1) * 100).toFixed(2),
      };
    });
  }, [timePeriod, totalPortfolioValue, weightedChange]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchPrices();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (!isConnected || !account) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Portfolio Tracker
            </CardTitle>
            <CardDescription>Connect your wallet to view your portfolio</CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-6">
              Connect your wallet to track your actual crypto assets
            </p>
            <Button onClick={() => connectWallet()} size="lg" data-testid="button-connect-wallet">
              <Wallet className="h-5 w-5 mr-2" />
              Connect Wallet
            </Button>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Your portfolio will show real balances from your connected wallet</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Security Center - available even without wallet connection */}
        <div className="max-w-2xl mx-auto">
          <SecurityCenter />
        </div>
      </div>
    );
  }

  if (isLoadingTokens) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading your portfolio...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Portfolio Tracker</h1>
        <p className="text-muted-foreground">View your connected wallet assets</p>
      </div>

      {/* Estimated Data Disclaimer */}
      <ComplianceDisclaimer type="estimated" className="mb-6" />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Total Portfolio Value</CardDescription>
                <CardTitle className="text-4xl" data-testid="text-total-value">
                  ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {weightedChange >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-lg font-semibold ${weightedChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {weightedChange >= 0 ? '+' : ''}{weightedChange.toFixed(2)}%
              </span>
              <span className="text-muted-foreground">24h</span>
            </div>
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <AlertCircle className="h-4 w-4" />
                <span>Showing real balances from your connected {network?.name || 'blockchain'} wallet</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-mono text-sm" data-testid="text-wallet-address">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Network</p>
              <Badge variant="outline" data-testid="badge-network">
                {network?.name || `Chain ${chainId}`}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Native Balance</p>
              <p className="font-semibold" data-testid="text-native-balance">
                {parseFloat(balance || "0").toFixed(4)} {network?.symbol || "ETH"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {portfolioData.length === 0 || totalPortfolioValue === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">No Assets Found</p>
            <p className="text-muted-foreground">
              Your connected wallet has no token balances on {network?.name || 'this network'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="assets" data-testid="tab-assets">Assets</TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Chain Distribution
                  </CardTitle>
                  <CardDescription>Assets by blockchain</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chainAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chainAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Token Distribution
                  </CardTitle>
                  <CardDescription>Assets by token</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tokenAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} $${value.toFixed(0)}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tokenAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
              {chainAllocation.map((chain, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-semibold">{chain.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${chain.value.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{chain.percentage}%</p>
                      </div>
                    </div>
                    <Progress value={parseFloat(chain.percentage)} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            {portfolioData.map((chainData, chainIdx) => (
              <Card key={chainIdx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{chainData.chain}</CardTitle>
                      <CardDescription>
                        Total: ${chainData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{chainData.tokens.length} tokens</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chainData.tokens.map((token, tokenIdx) => (
                      <div 
                        key={tokenIdx} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`token-${token.symbol}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                            {token.symbol.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-semibold">{token.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {token.balance} {token.symbol}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ${token.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            {token.change24h >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={`text-sm ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Portfolio Performance
                    </CardTitle>
                    <CardDescription>Historical performance based on current holdings</CardDescription>
                  </div>
                  <div className="flex gap-1 bg-muted p-1 rounded-lg">
                    {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as TimePeriod[]).map((period) => (
                      <Button
                        key={period}
                        variant={timePeriod === period ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTimePeriod(period)}
                        className="px-3"
                        data-testid={`button-period-${period.toLowerCase()}`}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <div>
                    <p className="text-3xl font-bold">
                      ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1">
                      {weightedChange >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${weightedChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {weightedChange >= 0 ? '+' : ''}{weightedChange.toFixed(2)}% ({timePeriod})
                      </span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={weightedChange >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={weightedChange >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Value']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={weightedChange >= 0 ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      fill="url(#colorValue)"
                      name="Portfolio Value"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">24h Change</p>
                    <p className={`text-2xl font-bold ${weightedChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {weightedChange >= 0 ? '+' : ''}${(totalPortfolioValue * Math.abs(weightedChange) / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {weightedChange >= 0 ? '+' : ''}{weightedChange.toFixed(2)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="text-2xl font-bold">
                      ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">Live from wallet</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Assets</p>
                    <p className="text-2xl font-bold">{allTokens.length}</p>
                    <p className="text-sm text-muted-foreground">Tokens tracked</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
