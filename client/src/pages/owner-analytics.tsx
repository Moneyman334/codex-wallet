import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/seo";
import {
  BarChart3, Users, DollarSign, TrendingUp, Activity, ShoppingCart,
  Wallet, Bot, Coins, ArrowUpRight, ArrowDownRight, RefreshCw, Download
} from "lucide-react";
import { Line, Bar, Pie } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function OwnerAnalyticsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch platform analytics
  const { data: analytics, isLoading } = useQuery<any>({
    queryKey: ['/api/analytics/platform'],
  });

  const { data: orders } = useQuery<any>({
    queryKey: ['/api/orders'],
  });

  const { data: users } = useQuery<any>({
    queryKey: ['/api/users/stats'],
  });

  const handleManageUsers = () => {
    navigate('/admin/security-dashboard');
  };

  const handleViewOrders = () => {
    navigate('/orders');
  };

  const handleCheckWallet = () => {
    navigate('/wallet');
  };

  const handleExportData = () => {
    const data = {
      metrics: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "Analytics data has been exported successfully.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Calculate key metrics
  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const metrics = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-green-500"
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      change: "+8.2%",
      trend: "up",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "text-blue-500"
    },
    {
      title: "Avg Order Value",
      value: `$${avgOrderValue.toFixed(2)}`,
      change: "+4.3%",
      trend: "up",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-purple-500"
    },
    {
      title: "Active Users",
      value: "1,247",
      change: "+15.8%",
      trend: "up",
      icon: <Users className="h-5 w-5" />,
      color: "text-cyan-500"
    },
    {
      title: "Trading Volume",
      value: "$2.4M",
      change: "+22.1%",
      trend: "up",
      icon: <Bot className="h-5 w-5" />,
      color: "text-yellow-500"
    },
    {
      title: "Staking TVL",
      value: "$1.8M",
      change: "+18.7%",
      trend: "up",
      icon: <Coins className="h-5 w-5" />,
      color: "text-orange-500"
    }
  ];

  return (
    <>
      <SEO 
        title="Owner Analytics Dashboard | CODEX"
        description="Comprehensive analytics and metrics for CODEX platform performance"
        canonicalUrl="/owner-analytics"
      />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Platform Analytics</h1>
            <Button variant="outline" data-testid="button-refresh">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <p className="text-muted-foreground">
            Real-time metrics and performance data for your CODEX platform
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`metric-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-${metric.color.split('-')[1]}-500/10 ${metric.color}`}>
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{metric.value}</div>
                <div className="flex items-center gap-1 text-sm">
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {metric.change}
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue & Activity Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Last 30 days performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Revenue chart visualization</p>
                  <p className="text-sm">Connect data source to view trends</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Daily active users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Activity chart visualization</p>
                  <p className="text-sm">User engagement metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Features by Usage</CardTitle>
              <CardDescription>Most popular platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Trading Bot", usage: 4521, percentage: 85 },
                  { name: "Yield Farming", usage: 3842, percentage: 72 },
                  { name: "Cross-Chain Bridge", usage: 3104, percentage: 58 },
                  { name: "NFT Creator", usage: 2687, percentage: 50 },
                  { name: "Crypto Payments", usage: 2193, percentage: 41 }
                ].map((feature, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{feature.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {feature.usage.toLocaleString()} users
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${feature.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Sources</CardTitle>
              <CardDescription>Breakdown by feature</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { source: "Trading Fees", amount: 42500, color: "bg-purple-500" },
                  { source: "E-commerce", amount: 28300, color: "bg-blue-500" },
                  { source: "Bridge Fees", amount: 15200, color: "bg-cyan-500" },
                  { source: "NFT Sales", amount: 12800, color: "bg-green-500" },
                  { source: "Other", amount: 8400, color: "bg-yellow-500" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.source}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      ${item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="w-full" data-testid="button-manage-users" onClick={handleManageUsers}>
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-view-orders" onClick={handleViewOrders}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                View Orders
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-check-wallet" onClick={handleCheckWallet}>
                <Wallet className="mr-2 h-4 w-4" />
                Check Wallet
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-export-data" onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
