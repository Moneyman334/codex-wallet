import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import CosmicVisualizer from "@/components/cosmic-visualizer";
import { 
  Rocket, TrendingUp, DollarSign, Activity, Zap, Crown,
  ShoppingCart, Wallet, Trophy, Users, Target, Sprout,
  PiggyBank, BarChart3, Bell, Star, Package, Gift,
  Coins, Image, Vote, HandshakeIcon, ArrowLeftRight,
  ChevronRight, Sparkles, Gauge, Eye
} from "lucide-react";

interface EmpireStats {
  totalPortfolioValue: string;
  totalInvested: string;
  totalEarned: string;
  activePositions: number;
  totalPnL: string;
  pnlPercent: string;
}

interface QuickStat {
  label: string;
  value: string;
  change?: string;
  icon: any;
  color: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  amount?: string;
  timestamp: string;
  category: string;
}

export default function SupremeCommandPage() {
  const { account, balance } = useWeb3();
  const [showVisualizer, setShowVisualizer] = useState(false);

  const { data: empireStats, isLoading: statsLoading } = useQuery<EmpireStats>({
    queryKey: [`/api/supreme/stats?account=${account}`],
    enabled: !!account,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: [`/api/supreme/activity?account=${account}`],
    enabled: !!account,
  });

  const navigationCategories = [
    {
      title: "DeFi Hub",
      icon: Coins,
      color: "text-purple-500",
      items: [
        { name: "Staking Rewards", path: "/staking", icon: Zap, desc: "Earn passive income" },
        { name: "Yield Farming", path: "/yield-farming", icon: Sprout, desc: "High APY pools" },
        { name: "P2P Lending", path: "/lending", icon: PiggyBank, desc: "Lend & borrow" },
        { name: "Token Swap", path: "/swap", icon: ArrowLeftRight, desc: "DEX trading" },
      ]
    },
    {
      title: "Trading Zone",
      icon: TrendingUp,
      color: "text-green-500",
      items: [
        { name: "Prediction Markets", path: "/prediction-markets", icon: Target, desc: "Bet on future events" },
        { name: "Social Trading", path: "/social-trading", icon: Users, desc: "Copy top traders" },
        { name: "Portfolio Tracker", path: "/portfolio", icon: BarChart3, desc: "Track all assets" },
        { name: "Sentinel Bot", path: "/sentinel-bot", icon: Activity, desc: "Auto trading" },
      ]
    },
    {
      title: "Blockchain Tools",
      icon: Rocket,
      color: "text-blue-500",
      items: [
        { name: "Token Creator", path: "/token-creator", icon: Coins, desc: "Launch ERC-20" },
        { name: "NFT Creator", path: "/nft-creator", icon: Image, desc: "Mint NFTs" },
        { name: "Token Launchpad", path: "/token-launchpad", icon: Rocket, desc: "ICO/IDO platform" },
        { name: "DAO Governance", path: "/dao", icon: Vote, desc: "Vote on proposals" },
      ]
    },
    {
      title: "E-Commerce",
      icon: ShoppingCart,
      color: "text-orange-500",
      items: [
        { name: "Products", path: "/products", icon: Package, desc: "Browse catalog" },
        { name: "Orders", path: "/orders", icon: ShoppingCart, desc: "Track orders" },
        { name: "Checkout", path: "/checkout", icon: DollarSign, desc: "Complete purchase" },
        { name: "Invoices", path: "/invoices", icon: Gift, desc: "Payment links" },
      ]
    },
    {
      title: "Community",
      icon: Star,
      color: "text-yellow-500",
      items: [
        { name: "NFT Gallery", path: "/nft-gallery", icon: Image, desc: "View collection" },
        { name: "Marketplace", path: "/marketplace", icon: ShoppingCart, desc: "P2P trading" },
        { name: "Achievements", path: "/achievements", icon: Trophy, desc: "Earn badges" },
        { name: "Referrals", path: "/referrals", icon: HandshakeIcon, desc: "Earn commissions" },
      ]
    },
    {
      title: "Management",
      icon: Gauge,
      color: "text-red-500",
      items: [
        { name: "Empire Dashboard", path: "/empire", icon: Crown, desc: "Overview" },
        { name: "Analytics", path: "/analytics", icon: BarChart3, desc: "Business insights" },
        { name: "Notifications", path: "/notifications", icon: Bell, desc: "Stay updated" },
        { name: "Wallet", path: "/wallet", icon: Wallet, desc: "Manage funds" },
      ]
    }
  ];

  const quickStats: QuickStat[] = [
    {
      label: "Total Portfolio",
      value: empireStats?.totalPortfolioValue || "$0.00",
      change: empireStats?.pnlPercent || "0%",
      icon: Crown,
      color: "text-purple-500"
    },
    {
      label: "Total Invested",
      value: empireStats?.totalInvested || "$0.00",
      icon: DollarSign,
      color: "text-blue-500"
    },
    {
      label: "Total Earned",
      value: empireStats?.totalEarned || "$0.00",
      change: "+12.5%",
      icon: TrendingUp,
      color: "text-green-500"
    },
    {
      label: "Active Positions",
      value: empireStats?.activePositions?.toString() || "0",
      icon: Activity,
      color: "text-orange-500"
    },
  ];

  const totalPnL = parseFloat(empireStats?.totalPnL || "0");

  return (
    <>
      {showVisualizer && empireStats && (
        <CosmicVisualizer 
          empireStats={empireStats}
          onClose={() => setShowVisualizer(false)}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-b from-purple-950/20 via-background to-blue-950/20">
        <div className="container mx-auto px-4 py-8">
          {/* Supreme Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Crown className="h-12 w-12 text-yellow-500 animate-pulse" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Supreme Command Center
              </h1>
              <Crown className="h-12 w-12 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-xl text-muted-foreground mb-4">
              Master Control Hub for Your Blockchain Empire
            </p>
            
            {account && (
              <Button
                onClick={() => setShowVisualizer(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-purple-500/50 transition-all"
                data-testid="button-open-visualizer"
              >
                <Eye className="mr-2 h-5 w-5" />
                Launch 3D Cosmic Visualizer
                <Sparkles className="ml-2 h-5 w-5 animate-pulse" />
              </Button>
            )}
          </div>

        {!account ? (
          <Card className="border-2 border-purple-500/50">
            <CardContent className="py-16 text-center">
              <Crown className="h-20 w-20 mx-auto mb-6 text-yellow-500 animate-pulse" />
              <h2 className="text-3xl font-bold mb-3">Welcome to the Supreme Command Center</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Connect your wallet to unlock the full power of your empire
              </p>
              <Badge variant="secondary" className="text-lg px-6 py-2">
                23 Pages • Infinite Possibilities • Unstoppable Power
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Supreme Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {quickStats.map((stat, idx) => (
                <Card key={idx} className="border-2 border-purple-500/30 hover:border-purple-500 transition-all hover:scale-105">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      {stat.change && (
                        <Badge variant="secondary" className={parseFloat(stat.change) >= 0 ? "bg-green-500/20" : "bg-red-500/20"}>
                          {stat.change}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    {statsLoading ? (
                      <div className="h-9 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-3xl font-bold">{stat.value}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* P&L Display */}
            {totalPnL !== 0 && (
              <Card className={`mb-8 border-2 ${totalPnL >= 0 ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TrendingUp className={`h-12 w-12 ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Profit & Loss</p>
                        <p className={`text-4xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-2xl px-6 py-3 ${totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                      {empireStats?.pnlPercent || '0%'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="navigation" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="navigation">Empire Navigation</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="navigation" className="space-y-6">
                {navigationCategories.map((category, idx) => (
                  <Card key={idx} className="border-2 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <category.icon className={`h-8 w-8 ${category.color}`} />
                        {category.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {category.items.map((item, itemIdx) => (
                          <Link key={itemIdx} href={item.path}>
                            <Card className="hover:border-purple-500 transition-all hover:scale-105 cursor-pointer border">
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <item.icon className="h-6 w-6 text-purple-500" />
                                    <div>
                                      <p className="font-semibold">{item.name}</p>
                                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Quick Actions */}
                <Card className="border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <Sparkles className="h-8 w-8 text-yellow-500" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Jump to frequently used features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                      <Link href="/staking">
                        <Button className="w-full" variant="outline" data-testid="quick-staking">
                          <Zap className="h-4 w-4 mr-2" />
                          Stake Now
                        </Button>
                      </Link>
                      <Link href="/swap">
                        <Button className="w-full" variant="outline" data-testid="quick-swap">
                          <ArrowLeftRight className="h-4 w-4 mr-2" />
                          Swap Tokens
                        </Button>
                      </Link>
                      <Link href="/products">
                        <Button className="w-full" variant="outline" data-testid="quick-shop">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Shop Now
                        </Button>
                      </Link>
                      <Link href="/portfolio">
                        <Button className="w-full" variant="outline" data-testid="quick-portfolio">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Portfolio
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                {activityLoading ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
                      <h3 className="text-xl font-semibold mb-2">Loading Activity...</h3>
                      <p className="text-muted-foreground">Fetching your recent actions</p>
                    </CardContent>
                  </Card>
                ) : !recentActivity || recentActivity.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <h3 className="text-xl font-semibold mb-2">No Recent Activity</h3>
                      <p className="text-muted-foreground mb-6">Start using features to see your activity here</p>
                    </CardContent>
                  </Card>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <Card key={idx} className="hover:border-purple-500/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">{activity.category}</Badge>
                              <Badge variant="outline">{activity.type}</Badge>
                            </div>
                            <p className="font-semibold">{activity.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {activity.amount && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{activity.amount}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Empire Power Banner */}
            <Card className="mt-8 border-2 border-purple-500 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10">
              <CardContent className="py-8 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Crown className="h-10 w-10 text-yellow-500 animate-pulse" />
                  <h2 className="text-3xl font-bold">Your Empire Stats</h2>
                  <Crown className="h-10 w-10 text-yellow-500 animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div>
                    <p className="text-4xl font-bold text-purple-500">23</p>
                    <p className="text-sm text-muted-foreground">Total Pages</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-pink-500">∞</p>
                    <p className="text-sm text-muted-foreground">Possibilities</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-blue-500">100%</p>
                    <p className="text-sm text-muted-foreground">Unstoppable</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
    </>
  );
}
