import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity, 
  Cpu,
  Zap,
  BarChart3,
  Target,
  Crown,
  Wallet,
  ShoppingCart,
  Bot,
  AlertCircle,
  Code,
  Trash2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OwnerMetrics {
  financials: {
    totalRevenue: number;
    monthlyRevenue: number;
    weeklyRevenue: number;
    totalProfit: number;
    profitMargin: number;
  };
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    premiumUsers: number;
  };
  transactions: {
    total: number;
    volume: number;
    todayCount: number;
    todayVolume: number;
  };
  algorithms: {
    autoCompound: {
      status: string;
      poolsActive: number;
      totalStaked: number;
      totalRewards: number;
    };
    tradingBot: {
      status: string;
      activeStrategies: number;
      totalTrades: number;
      profitLoss: number;
      winRate: number;
    };
    socialAutomation: {
      status: string;
      postsScheduled: number;
      postsPublished: number;
      engagement: number;
    };
  };
  marketplace: {
    totalListings: number;
    activeSales: number;
    totalVolume: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'transaction' | 'trade' | 'stake' | 'order' | 'post';
  description: string;
  amount?: string;
  status: string;
  timestamp: string;
  metadata?: any;
}

interface AuthStatus {
  authenticated: boolean;
  isOwner: boolean;
  user?: any;
}

export default function EmpireOwnerDashboard() {
  const { toast } = useToast();
  
  // Check authentication first
  const { data: authStatus, isLoading: authLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/me"],
  });

  // Only fetch metrics if user is authenticated as owner
  const { data: metrics, isLoading: metricsLoading } = useQuery<OwnerMetrics>({
    queryKey: ["/api/owner/metrics"],
    enabled: authStatus?.isOwner === true,
    refetchInterval: 30000,
  });

  const { data: activity, isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ["/api/command-center/activity"],
    enabled: authStatus?.isOwner === true,
    refetchInterval: 10000,
  });

  // Clear pending transactions mutation
  const clearPendingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/command-center/activity/clear-pending", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/command-center/activity"] });
      toast({
        title: "✅ Pending Activities Cleared",
        description: `${data.cleared} pending transaction(s) removed from feed`,
      });
    },
    onError: () => {
      toast({
        title: "❌ Clear Failed",
        description: "Failed to clear pending activities",
        variant: "destructive",
      });
    },
  });

  const pendingCount = activity?.filter(item => item.status === 'pending').length || 0;

  // Approve pending activity mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const response = await apiRequest("POST", `/api/command-center/activity/${id}/approve`, { type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/command-center/activity"] });
      toast({
        title: "✅ Activity Approved",
        description: "Transaction confirmed successfully",
      });
    },
  });

  // Dismiss pending activity mutation
  const dismissMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const response = await apiRequest("POST", `/api/command-center/activity/${id}/dismiss`, { type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/command-center/activity"] });
      toast({
        title: "🗑️ Activity Dismissed",
        description: "Transaction removed from feed",
      });
    },
  });

  // Show loading only while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
              <p className="text-gray-400">Checking access...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated as owner
  if (!authStatus?.isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-black/60 backdrop-blur-xl border-orange-500/30 max-w-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Owner Access Required</CardTitle>
                    <CardDescription className="text-base">
                      This dashboard is only accessible to platform owners
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg border border-orange-500/20">
                    <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Developer Quick Login
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Go to Settings and use the "Login as Owner" button to access this dashboard.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm">
                      After logging in as owner, you'll have access to:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-400" />
                        Empire Owner Dashboard - Complete metrics overview
                      </li>
                      <li className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        Platform Analytics - Revenue and user statistics
                      </li>
                      <li className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-400" />
                        Command Center - Real-time monitoring
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Marketing & Social Automation tools
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href="/settings">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white" data-testid="button-go-to-settings">
                      <Code className="w-4 h-4 mr-2" />
                      Go to Settings
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="border-purple-500/30" data-testid="button-go-home">
                      Return Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while metrics are loading (after auth check passed)
  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
              <p className="text-gray-400">Loading empire metrics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black">
      <div className="relative">
        {/* Cosmic background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Empire Owner Dashboard
              </h1>
              <p className="text-gray-400">Your personal command center for profits & algorithms</p>
            </div>
          </div>

          {/* Live Activity Feed */}
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20" data-testid="card-live-feed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
                    Live Activity Feed
                  </CardTitle>
                  <CardDescription>Real-time platform events</CardDescription>
                </div>
                {pendingCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearPendingMutation.mutate()}
                    disabled={clearPendingMutation.isPending}
                    className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                    data-testid="button-clear-pending"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear {pendingCount} Pending
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activityLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                  </div>
                ) : activity && activity.length > 0 ? (
                  activity.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-all"
                      data-testid={`activity-${item.type}-${item.id}`}
                    >
                      <div className="mt-1">
                        {item.type === 'transaction' && <Wallet className="w-4 h-4 text-blue-400" />}
                        {item.type === 'trade' && <TrendingUp className="w-4 h-4 text-green-400" />}
                        {item.type === 'stake' && <Zap className="w-4 h-4 text-purple-400" />}
                        {item.type === 'order' && <ShoppingCart className="w-4 h-4 text-pink-400" />}
                        {item.type === 'post' && <Activity className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              item.status === 'completed' || item.status === 'active' || item.status === 'confirmed'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : item.status === 'pending'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}
                          >
                            {item.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {item.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveMutation.mutate({ id: item.id, type: item.type })}
                              disabled={approveMutation.isPending || dismissMutation.isPending}
                              className="h-7 text-xs bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400"
                              data-testid={`button-approve-${item.id}`}
                            >
                              ✓ Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => dismissMutation.mutate({ id: item.id, type: item.type })}
                              disabled={approveMutation.isPending || dismissMutation.isPending}
                              className="h-7 text-xs bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
                              data-testid={`button-dismiss-${item.id}`}
                            >
                              ✕ Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40 transition-all" data-testid="card-total-revenue">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400" data-testid="text-total-revenue">
                  ${metrics?.financials.totalRevenue.toLocaleString() || 0}
                </div>
                <p className="text-xs text-gray-500 mt-2">All-time earnings</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-blue-500/20 hover:border-blue-500/40 transition-all" data-testid="card-monthly-revenue">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400" data-testid="text-monthly-revenue">
                  ${metrics?.financials.monthlyRevenue.toLocaleString() || 0}
                </div>
                <p className="text-xs text-gray-500 mt-2">This month's earnings</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40 transition-all" data-testid="card-total-profit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-400" data-testid="text-total-profit">
                  ${metrics?.financials.totalProfit.toLocaleString() || 0}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {metrics?.financials.profitMargin.toFixed(1) || 0}% margin
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-green-500/20 hover:border-green-500/40 transition-all" data-testid="card-active-users">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400" data-testid="text-active-users">
                  {metrics?.users.active.toLocaleString() || 0}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  of {metrics?.users.total.toLocaleString() || 0} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed metrics */}
          <Tabs defaultValue="algorithms" className="space-y-6">
            <TabsList className="bg-black/40 backdrop-blur-xl border border-purple-500/20">
              <TabsTrigger value="algorithms" data-testid="tab-algorithms">
                <Cpu className="w-4 h-4 mr-2" />
                Algorithms
              </TabsTrigger>
              <TabsTrigger value="financials" data-testid="tab-financials">
                <BarChart3 className="w-4 h-4 mr-2" />
                Financials
              </TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="marketplace" data-testid="tab-marketplace">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Marketplace
              </TabsTrigger>
            </TabsList>

            {/* Algorithms Tab */}
            <TabsContent value="algorithms" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Auto-Compound Algorithm */}
                <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20" data-testid="card-auto-compound">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-400" />
                      Auto-Compound
                    </CardTitle>
                    <CardDescription>Staking pool automation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20" data-testid="badge-compound-status">
                        {metrics?.algorithms.autoCompound.status || "Active"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Active Pools</span>
                        <span className="text-white font-medium" data-testid="text-pools-active">
                          {metrics?.algorithms.autoCompound.poolsActive || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Staked</span>
                        <span className="text-white font-medium" data-testid="text-total-staked">
                          {metrics?.algorithms.autoCompound.totalStaked.toFixed(2) || 0} ETH
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Rewards Generated</span>
                        <span className="text-green-400 font-medium" data-testid="text-total-rewards">
                          {metrics?.algorithms.autoCompound.totalRewards.toFixed(4) || 0} ETH
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Bot Algorithm */}
                <Card className="bg-black/40 backdrop-blur-xl border-blue-500/20" data-testid="card-trading-bot">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-400" />
                      Trading Bot
                    </CardTitle>
                    <CardDescription>AI-powered trading strategies</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20" data-testid="badge-bot-status">
                        {metrics?.algorithms.tradingBot.status || "Active"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Strategies</span>
                        <span className="text-white font-medium" data-testid="text-strategies-active">
                          {metrics?.algorithms.tradingBot.activeStrategies || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Trades</span>
                        <span className="text-white font-medium" data-testid="text-total-trades">
                          {metrics?.algorithms.tradingBot.totalTrades.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">P/L</span>
                        <span className={`font-medium ${(metrics?.algorithms.tradingBot.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="text-bot-pnl">
                          ${Math.abs(metrics?.algorithms.tradingBot.profitLoss || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Win Rate</span>
                        <span className="text-white font-medium" data-testid="text-win-rate">
                          {metrics?.algorithms.tradingBot.winRate.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={metrics?.algorithms.tradingBot.winRate || 0} 
                      className="h-2"
                    />
                  </CardContent>
                </Card>

                {/* Social Automation Algorithm */}
                <Card className="bg-black/40 backdrop-blur-xl border-pink-500/20" data-testid="card-social-automation">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-pink-400" />
                      Social Automation
                    </CardTitle>
                    <CardDescription>Marketing content scheduler</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20" data-testid="badge-social-status">
                        {metrics?.algorithms.socialAutomation.status || "Active"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Scheduled</span>
                        <span className="text-white font-medium" data-testid="text-posts-scheduled">
                          {metrics?.algorithms.socialAutomation.postsScheduled || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Published</span>
                        <span className="text-white font-medium" data-testid="text-posts-published">
                          {metrics?.algorithms.socialAutomation.postsPublished || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Engagement</span>
                        <span className="text-pink-400 font-medium" data-testid="text-engagement">
                          {metrics?.algorithms.socialAutomation.engagement.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Detailed financial performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Weekly Revenue</p>
                      <p className="text-2xl font-bold text-blue-400" data-testid="text-weekly-revenue">
                        ${metrics?.financials.weeklyRevenue.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Transaction Volume</p>
                      <p className="text-2xl font-bold text-purple-400" data-testid="text-tx-volume">
                        ${metrics?.transactions.volume.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Today's Volume</p>
                      <p className="text-2xl font-bold text-green-400" data-testid="text-today-volume">
                        ${metrics?.transactions.todayVolume.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20">
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                  <CardDescription>Platform user analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-blue-400" data-testid="text-total-users">
                        {metrics?.users.total.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">New This Month</p>
                      <p className="text-2xl font-bold text-green-400" data-testid="text-new-users">
                        {metrics?.users.newThisMonth.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Premium Users</p>
                      <p className="text-2xl font-bold text-purple-400" data-testid="text-premium-users">
                        {metrics?.users.premiumUsers.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-xl border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Marketplace Performance
                  </CardTitle>
                  <CardDescription>NFT & product trading metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Total Listings</p>
                      <p className="text-2xl font-bold text-blue-400" data-testid="text-total-listings">
                        {metrics?.marketplace.totalListings.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Active Sales</p>
                      <p className="text-2xl font-bold text-green-400" data-testid="text-active-sales">
                        {metrics?.marketplace.activeSales.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Total Volume</p>
                      <p className="text-2xl font-bold text-purple-400" data-testid="text-marketplace-volume">
                        ${metrics?.marketplace.totalVolume.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
