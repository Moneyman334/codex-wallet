import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, BarChart3, Target, Zap, ShoppingCart, Bot, CreditCard } from "lucide-react";
import SEO from "@/components/seo";

export default function RevenueDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  const getPeriodDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate.setDate(startDate.getDate() - 90);
    }
    
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/revenue/total", period],
    queryFn: async () => {
      const dates = getPeriodDates();
      const response = await fetch("/api/revenue/total", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dates),
      });
      return response.json();
    },
  });

  const { data: growth } = useQuery({
    queryKey: ["/api/revenue/growth", period],
    queryFn: async () => {
      const dates = getPeriodDates();
      const response = await fetch("/api/revenue/growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dates),
      });
      return response.json();
    },
  });

  const { data: projections } = useQuery({
    queryKey: ["/api/revenue/projections"],
  });

  const { data: topStreams } = useQuery({
    queryKey: ["/api/revenue/top-streams", period],
    queryFn: async () => {
      const dates = getPeriodDates();
      const response = await fetch("/api/revenue/top-streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dates),
      });
      return response.json();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getStreamIcon = (name: string) => {
    switch (name) {
      case 'E-commerce Sales': return <ShoppingCart className="h-4 w-4" />;
      case 'Subscriptions': return <CreditCard className="h-4 w-4" />;
      case 'Trading Bot Fees': return <Bot className="h-4 w-4" />;
      case 'Payment Fees': return <DollarSign className="h-4 w-4" />;
      case 'Marketplace Fees': return <BarChart3 className="h-4 w-4" />;
      case 'NFT Launchpad': return <Zap className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  if (revenueLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading Revenue Dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Revenue Optimization Dashboard | CODEX Wallet"
        description="Comprehensive revenue analytics and optimization dashboard. Track all income streams, growth metrics, and revenue projections."
        canonicalUrl="/revenue-dashboard"
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Revenue Optimization
              </h1>
              <p className="text-muted-foreground">
                Track, analyze, and optimize all platform revenue streams
              </p>
            </div>
            
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
              <TabsList>
                <TabsTrigger value="7d" data-testid="period-7d">7 Days</TabsTrigger>
                <TabsTrigger value="30d" data-testid="period-30d">30 Days</TabsTrigger>
                <TabsTrigger value="90d" data-testid="period-90d">90 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400" data-testid="text-total-revenue">
                {formatCurrency(revenue?.totalRevenue || 0)}
              </div>
              {growth && (
                <p className={`text-sm mt-1 ${growth.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(growth.growthRate)} vs previous period
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                Growth Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400" data-testid="text-growth-rate">
                {growth ? formatPercentage(growth.growthRate) : '0%'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(growth?.growthAmount || 0)} increase
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" />
                Daily Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400" data-testid="text-daily-avg">
                {formatCurrency(projections?.dailyAverage || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on last 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-400" />
                90-Day Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400" data-testid="text-90d-projection">
                {formatCurrency(projections?.projections?.month3 || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Streams */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Distribution of income streams for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStreams?.map((stream: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStreamIcon(stream.name)}
                        <span className="font-medium">{stream.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(stream.value)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${stream.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {stream.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Projections</CardTitle>
              <CardDescription>Estimated revenue for next 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Month 1 (30 days)</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatCurrency(projections?.projections?.month1 || 0)}
                  </div>
                </div>
                
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Month 2 (60 days)</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {formatCurrency(projections?.projections?.month2 || 0)}
                  </div>
                </div>
                
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Month 3 (90 days)</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(projections?.projections?.month3 || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Revenue Analysis</CardTitle>
            <CardDescription>Complete breakdown of all revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Subscriptions</div>
                <div className="text-xl font-bold">{formatCurrency(revenue?.subscriptions || 0)}</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Bot Fees</div>
                <div className="text-xl font-bold">{formatCurrency(revenue?.tradingBotFees || 0)}</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Trading Fees</div>
                <div className="text-xl font-bold">{formatCurrency(revenue?.tradingFees || 0)}</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Payment Fees</div>
                <div className="text-xl font-bold">{formatCurrency(revenue?.paymentFees || 0)}</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Marketplace</div>
                <div className="text-xl font-bold">{formatCurrency(revenue?.marketplaceFees || 0)}</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">NFT Launchpad</div>
                <div className="text-xl font-bold">{formatCurrency(revenue?.nftLaunchpadFees || 0)}</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">E-commerce</div>
                <div className="text-xl font-bold">{formatCurrency(revenue?.ecommerceSales || 0)}</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Affiliates</div>
                <div className="text-xl font-bold">{formatCurrency(revenue?.affiliatePayouts || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
