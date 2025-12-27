import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Rocket, 
  TrendingUp, 
  TrendingDown,
  Zap, 
  DollarSign, 
  Target, 
  Crown,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Activity,
  Bot,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DisclaimerBanner from "@/components/disclaimer-banner";

export default function BillionaireMode() {
  const { toast } = useToast();
  const [setupStep, setSetupStep] = useState(0);
  const [formData, setFormData] = useState({
    walletAddress: "",
    currentAge: "",
    targetAge: "50",
    startingBalance: "",
    currentBalance: ""
  });

  // Fetch billionaire profile
  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/billionaire/profile"],
  });

  // Fetch projections
  const { data: projections } = useQuery({
    queryKey: ["/api/billionaire/projections"],
    enabled: !!profile,
  });

  // Fetch milestones
  const { data: milestones } = useQuery({
    queryKey: ["/api/billionaire/milestones"],
    enabled: !!profile,
  });

  // Fetch real layer status
  const { data: layerStatus } = useQuery<any>({
    queryKey: ["/api/billionaire/layer-status", profile?.walletAddress],
    queryFn: async () => {
      const response = await fetch(`/api/billionaire/layer-status?walletAddress=${profile?.walletAddress}`);
      if (!response.ok) throw new Error('Failed to fetch layer status');
      return response.json();
    },
    enabled: !!profile?.walletAddress,
  });

  // Live crypto prices - auto-refresh every 5 seconds
  const { data: livePrices, isLoading: pricesLoading } = useQuery<any>({
    queryKey: ["/api/prices"],
    refetchInterval: 5000,
  });

  // Trading bot activity feed - auto-refresh every 10 seconds
  const { data: botActivity, isLoading: activityLoading } = useQuery<any>({
    queryKey: ["/api/bot/activity"],
    refetchInterval: 10000,
  });

  // Trading bot recent trades
  const { data: botTrades, isLoading: tradesLoading } = useQuery<any[]>({
    queryKey: ["/api/bot/trades"],
    refetchInterval: 15000,
  });

  // Trading bot stats
  const { data: botStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/bot/stats"],
    refetchInterval: 30000,
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/billionaire/profile", {
        walletAddress: data.walletAddress,
        currentAge: parseInt(data.currentAge),
        targetAge: parseInt(data.targetAge),
        startingBalance: parseFloat(data.startingBalance),
        currentBalance: parseFloat(data.currentBalance)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/profile"] });
      toast({
        title: "🚀 Billionaire Mode Activated!",
        description: "Your journey to $1 billion has begun!",
      });
      setSetupStep(0);
    },
  });

  // Activate layer mutation
  const activateLayerMutation = useMutation({
    mutationFn: async ({ layerNumber, allocation }: { layerNumber: number; allocation?: string }) => {
      const response = await apiRequest("POST", "/api/billionaire/activate-layer", {
        layerNumber, 
        allocation
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/layer-status"] });
      toast({
        title: "✅ Layer Activated!",
        description: "Your autopilot wealth system is growing stronger!",
      });
    },
  });

  // Activate all layers at once
  const activateAllLayersMutation = useMutation({
    mutationFn: async () => {
      const promises = [];
      for (let i = 1; i <= 5; i++) {
        promises.push(
          apiRequest("POST", "/api/billionaire/activate-layer", {
            layerNumber: i
          })
        );
      }
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/layer-status"] });
      toast({
        title: "🚀 All Layers Activated!",
        description: "Maximum autopilot mode engaged! All 5 wealth systems are now active!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Activation Failed",
        description: "Failed to activate all layers. Please try individually.",
        variant: "destructive",
      });
    },
  });

  // INSTANT ACTIVATION - Create profile + activate all layers in one click
  const instantActivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billionaire/instant-activate", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/layer-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/projections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billionaire/milestones"] });
      toast({
        title: "🚀 BILLIONAIRE MODE ACTIVATED!",
        description: `All 5 wealth layers engaged! Effective APY: ${data.effectiveApy}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Activation Failed",
        description: error.message || "Failed to activate billionaire mode",
        variant: "destructive",
      });
    },
  });

  const calculateProjections = () => {
    if (!profile) return [];
    
    const currentAge = parseInt(profile.currentAge);
    const targetAge = parseInt(profile.targetAge);
    const startingBalanceUSD = parseFloat(profile.startingBalance);
    
    // Use real layer status data if available, otherwise calculate from profile flags
    let effectiveApy = layerStatus?.totalApy;
    
    if (effectiveApy === undefined || effectiveApy === 0) {
      // Fallback: calculate from profile flags
      effectiveApy = 0;
      if (profile.layer1Active === "true") effectiveApy += 0.20;
      if (profile.layer2Active === "true") effectiveApy += 0.25;
      if (profile.layer3Active === "true") effectiveApy += 0.10;
      if (profile.layer4Active === "true") effectiveApy += 0.12;
      if (profile.layer5Active === "true") effectiveApy *= 1.32;
    }
    
    const years: any[] = [];
    
    for (let age = currentAge; age <= targetAge; age++) {
      const yearsElapsed = age - currentAge;
      const usdValue = startingBalanceUSD * Math.pow(1 + effectiveApy, yearsElapsed);
      const monthlyIncome = (usdValue * effectiveApy) / 12;
      
      let milestone = "";
      if (usdValue >= 1000000000) milestone = "Billionaire 👑";
      else if (usdValue >= 100000000) milestone = "Centi-Millionaire 💎";
      else if (usdValue >= 10000000) milestone = "Multi-Millionaire ⚡";
      else if (usdValue >= 1000000) milestone = "Millionaire ✨";
      
      years.push({
        age,
        year: 2025 + yearsElapsed,
        usdValue,
        monthlyIncome,
        effectiveApy: (effectiveApy * 100).toFixed(1) + "%",
        milestone
      });
    }
    
    return years;
  };

  const projectionData = calculateProjections();

  const layers = [
    {
      number: 1,
      name: "Premium Vault",
      description: `${layerStatus?.layer1?.apy ? (layerStatus.layer1.apy * 100).toFixed(0) : '20'}% APY Auto-Compound`,
      icon: <Zap className="w-5 h-5" />,
      active: layerStatus?.layer1?.active || false,
      allocation: layerStatus?.layer1?.value ? `$${layerStatus.layer1.value.toLocaleString()} in ${layerStatus.layer1.poolCount} pools` : 'Not allocated',
    },
    {
      number: 2,
      name: "Leveraged Trading",
      description: `${layerStatus?.layer2?.avgLeverage ? layerStatus.layer2.avgLeverage.toFixed(1) : '10'}x Avg Leverage`,
      icon: <TrendingUp className="w-5 h-5" />,
      active: layerStatus?.layer2?.active || false,
      allocation: layerStatus?.layer2?.value ? `$${layerStatus.layer2.value.toLocaleString()} in ${layerStatus.layer2.positionCount} positions` : 'No positions',
    },
    {
      number: 3,
      name: "Empire Vault",
      description: `${layerStatus?.layer3?.apy ? (layerStatus.layer3.apy * 100).toFixed(0) : '10'}% Profit Share`,
      icon: <Crown className="w-5 h-5" />,
      active: layerStatus?.layer3?.active || false,
      allocation: layerStatus?.layer3?.value ? `$${layerStatus.layer3.value.toLocaleString()} rewards` : 'Not staking',
    },
    {
      number: 4,
      name: "Copy Trading",
      description: `${layerStatus?.layer4?.apy ? (layerStatus.layer4.apy * 100).toFixed(0) : '12'}% Avg Returns`,
      icon: <DollarSign className="w-5 h-5" />,
      active: layerStatus?.layer4?.active || false,
      allocation: layerStatus?.layer4?.traderCount ? `Following ${layerStatus.layer4.traderCount} traders` : 'Not following',
    },
    {
      number: 5,
      name: "NFT/Relic Boosts",
      description: `${layerStatus?.layer5?.multiplier ? layerStatus.layer5.multiplier.toFixed(2) : '1.00'}x Multiplier`,
      icon: <Sparkles className="w-5 h-5" />,
      active: layerStatus?.layer5?.active || false,
      allocation: layerStatus?.layer5?.nftCount ? `${layerStatus.layer5.nftCount} NFTs owned` : 'No NFTs',
    },
  ];

  const activeLayers = layerStatus?.activeLayers || 0;
  const progressToTarget = profile ? (parseFloat(profile.currentBalance) / parseFloat(profile.startingBalance) - 1) * 100 : 0;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-6 flex items-center justify-center">
        <div className="text-2xl">Loading Billionaire Mode...</div>
      </div>
    );
  }

  // Setup Wizard
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Crown className="w-20 h-20 mx-auto mb-4 text-yellow-400" />
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Billionaire Autopilot Mode
            </h1>
            <p className="text-xl text-gray-300">
              Your Path from {formData.startingBalance || "$295k"} to $1 BILLION on Full Autopilot
            </p>
          </div>

          <Card className="bg-black/40 border-purple-500/30 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">🚀 Activate Billionaire Mode</CardTitle>
              <CardDescription className="text-gray-300">
                Set up your 5-layer autopilot wealth system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* INSTANT ACTIVATION BUTTON */}
              <div className="p-6 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-purple-500/20 border-2 border-yellow-400/50 rounded-xl">
                <div className="text-center mb-4">
                  <Rocket className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
                  <h3 className="text-2xl font-bold text-white mb-2">One-Click Activation</h3>
                  <p className="text-gray-300 text-sm">
                    Activate all 5 wealth layers instantly with smart defaults
                  </p>
                </div>
                <Button
                  onClick={() => instantActivateMutation.mutate()}
                  disabled={instantActivateMutation.isPending}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold text-lg py-6"
                  data-testid="button-instant-activate"
                >
                  {instantActivateMutation.isPending ? (
                    <>
                      <Zap className="w-5 h-5 mr-2 animate-pulse" />
                      Activating All Layers...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      ACTIVATE BILLIONAIRE MODE NOW
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Creates profile with $10k starting balance • Activates all 5 layers • 64% effective APY
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-black/40 text-gray-400">Or customize your setup</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="walletAddress" className="text-white">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    data-testid="input-wallet-address"
                    placeholder="0x..."
                    value={formData.walletAddress}
                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                    className="bg-black/50 border-purple-500/50 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentAge" className="text-white">Current Age</Label>
                    <Input
                      id="currentAge"
                      data-testid="input-current-age"
                      type="number"
                      placeholder="43"
                      value={formData.currentAge}
                      onChange={(e) => setFormData({ ...formData, currentAge: e.target.value })}
                      className="bg-black/50 border-purple-500/50 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetAge" className="text-white">Target Age</Label>
                    <Input
                      id="targetAge"
                      data-testid="input-target-age"
                      type="number"
                      placeholder="50"
                      value={formData.targetAge}
                      onChange={(e) => setFormData({ ...formData, targetAge: e.target.value })}
                      className="bg-black/50 border-purple-500/50 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startingBalance" className="text-white">Starting Balance (USD)</Label>
                    <Input
                      id="startingBalance"
                      data-testid="input-starting-balance"
                      type="number"
                      step="1000"
                      placeholder="295000"
                      value={formData.startingBalance}
                      onChange={(e) => setFormData({ ...formData, startingBalance: e.target.value })}
                      className="bg-black/50 border-purple-500/50 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Enter your total crypto value in USD</p>
                  </div>
                  <div>
                    <Label htmlFor="currentBalance" className="text-white">Current Balance (USD)</Label>
                    <Input
                      id="currentBalance"
                      data-testid="input-current-balance"
                      type="number"
                      step="1000"
                      placeholder="295000"
                      value={formData.currentBalance}
                      onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                      className="bg-black/50 border-purple-500/50 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Your current total wealth in USD</p>
                  </div>
                </div>
              </div>

              <Button
                data-testid="button-activate-billionaire-mode"
                onClick={() => createProfileMutation.mutate(formData)}
                disabled={createProfileMutation.isPending || !formData.walletAddress || !formData.currentAge || !formData.startingBalance || !formData.currentBalance}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6"
              >
                {createProfileMutation.isPending ? (
                  "Activating..."
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    ACTIVATE BILLIONAIRE MODE
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-pulse" />
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Billionaire Autopilot Dashboard
          </h1>
          <p className="text-gray-300">Age {profile.currentAge} → $1 Billion by Age {profile.targetAge}</p>
        </div>

        {/* Risk Disclaimers */}
        <DisclaimerBanner type="trading" />
        <DisclaimerBanner type="crypto" />

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/40 border-green-500/30 backdrop-blur" data-testid="card-current-wealth">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-300">Current Wealth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400" data-testid="text-current-wealth">
                ${parseFloat(profile.currentBalance).toLocaleString()}
              </div>
              <p className="text-sm text-gray-400">Total USD Value</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-yellow-500/30 backdrop-blur" data-testid="card-target-wealth">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-300">Target Wealth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400" data-testid="text-target-wealth">$1,000,000,000</div>
              <p className="text-sm text-gray-400">$1 Billion Goal</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-500/30 backdrop-blur" data-testid="card-active-layers">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-300">Active Layers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400" data-testid="text-active-layers">{activeLayers}/5</div>
              <p className="text-sm text-gray-400">Autopilot Systems</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-blue-500/30 backdrop-blur" data-testid="card-years-to-goal">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-300">Years to Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400" data-testid="text-years-to-goal">
                {parseInt(profile.targetAge) - parseInt(profile.currentAge)}
              </div>
              <p className="text-sm text-gray-400">Years Remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Market & Trading Bot Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Crypto Exchange Ticker */}
          <Card className="bg-black/40 border-cyan-500/30 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Live Market Prices
                </CardTitle>
                <Badge variant="outline" className="text-cyan-400 border-cyan-500/50 animate-pulse">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" data-testid="live-prices-container">
                {pricesLoading ? (
                  <div className="text-gray-400 text-center py-4">Loading prices...</div>
                ) : livePrices ? (
                  Object.entries(livePrices).slice(0, 6).map(([symbol, data]: [string, any]) => (
                    <div 
                      key={symbol}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-900/60 to-gray-800/40 rounded-lg border border-gray-700/50"
                      data-testid={`price-ticker-${symbol}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{symbol.slice(0, 3)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{symbol}</p>
                          <p className="text-xs text-gray-400">Cryptocurrency</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          ${data?.usd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </p>
                        <div className={`flex items-center gap-1 text-sm ${(data?.usd_24h_change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(data?.usd_24h_change || 0) >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs(data?.usd_24h_change || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-4">No price data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Trading Bot Feed */}
          <Card className="bg-black/40 border-emerald-500/30 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  Trading Bot Activity
                </CardTitle>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/50">
                  {botStats?.status === 'active' ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      ACTIVE
                    </span>
                  ) : (
                    'IDLE'
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bot Performance Stats */}
              {statsLoading ? (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-gray-900/20 rounded-lg border border-gray-500/30 text-center animate-pulse">
                      <div className="h-3 bg-gray-700 rounded w-16 mx-auto mb-2"></div>
                      <div className="h-6 bg-gray-700 rounded w-12 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : botStats ? (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/30 text-center">
                    <p className="text-xs text-gray-400">Total Trades</p>
                    <p className="text-lg font-bold text-emerald-400" data-testid="bot-total-trades">
                      {botStats.totalTrades || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30 text-center">
                    <p className="text-xs text-gray-400">Win Rate</p>
                    <p className="text-lg font-bold text-green-400" data-testid="bot-win-rate">
                      {botStats.winRate || 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30 text-center">
                    <p className="text-xs text-gray-400">Profit</p>
                    <p className="text-lg font-bold text-yellow-400" data-testid="bot-profit">
                      ${botStats.totalProfit?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Live Activity Feed */}
              <div className="mb-4" data-testid="bot-activity-container">
                <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Live Activity Feed
                </p>
                {activityLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-8 bg-gray-800/50 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : botActivity?.events && botActivity.events.length > 0 ? (
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {botActivity.events.slice(0, 4).map((event: any, idx: number) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 text-xs p-2 bg-gray-900/40 rounded border border-gray-700/30"
                        data-testid={`bot-activity-${idx}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          event.type === 'buy' ? 'bg-green-400' : 
                          event.type === 'sell' ? 'bg-red-400' : 
                          'bg-blue-400'
                        }`}></span>
                        <span className="text-gray-300 flex-1">{event.message || `${event.type} ${event.pair}`}</span>
                        <span className="text-gray-500">{event.time || 'now'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2 bg-gray-900/20 rounded border border-gray-700/30">
                    Waiting for bot activity...
                  </div>
                )}
              </div>

              {/* Recent Bot Trades */}
              <div className="space-y-2" data-testid="bot-trades-container">
                <p className="text-xs text-gray-400 font-medium">Recent Bot Trades</p>
                {tradesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-gray-800/50 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : botTrades && botTrades.length > 0 ? (
                  botTrades.slice(0, 5).map((trade: any, idx: number) => (
                    <div 
                      key={trade.id || idx}
                      className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-900/60 to-gray-800/40 rounded-lg border border-gray-700/50"
                      data-testid={`bot-trade-${idx}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${trade.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {trade.type === 'buy' ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {trade.type?.toUpperCase()} {trade.pair || trade.symbol || 'BTC/USD'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {trade.amount || trade.quantity || '0.00'} @ ${trade.price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.profit >= 0 ? '+' : ''}{trade.profit?.toFixed(2) || '0.00'}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent trades</p>
                    <p className="text-xs">Activate trading bot to see activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5 Layer System */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">🚀 5-Layer Autopilot System</CardTitle>
            <CardDescription className="text-gray-300">
              Activate all layers for maximum wealth acceleration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Activate All Button */}
            {activeLayers < 5 && (
              <div className="mb-6 p-6 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-lg border border-yellow-500/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-1">⚡ Maximum Power Mode</h3>
                    <p className="text-sm text-gray-300">
                      Activate all 5 layers at once for 64% effective APY and maximum wealth acceleration
                    </p>
                  </div>
                  <Button
                    data-testid="button-activate-all-layers"
                    onClick={() => activateAllLayersMutation.mutate()}
                    disabled={activateAllLayersMutation.isPending}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg px-8 py-6"
                  >
                    {activateAllLayersMutation.isPending ? (
                      "Activating..."
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        ACTIVATE ALL 5 LAYERS
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {layers.map((layer) => (
                <div
                  key={layer.number}
                  className={`p-4 rounded-lg border-2 ${
                    layer.active 
                      ? "bg-green-900/20 border-green-500/50" 
                      : "bg-gray-900/20 border-gray-500/30"
                  }`}
                  data-testid={`layer-${layer.number}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        layer.active ? "bg-green-500/20" : "bg-gray-500/20"
                      }`}>
                        {layer.active ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{layer.name}</h3>
                        <p className="text-sm text-gray-400">{layer.description}</p>
                        {layer.active && layer.allocation && (
                          <p className="text-xs text-green-400 mt-1">
                            Allocated: {layer.allocation}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      data-testid={`button-activate-layer-${layer.number}`}
                      onClick={() => activateLayerMutation.mutate({ layerNumber: layer.number })}
                      disabled={layer.active || activateLayerMutation.isPending}
                      variant={layer.active ? "outline" : "default"}
                      className={layer.active 
                        ? "border-green-500/50 text-green-400"
                        : "bg-gradient-to-r from-purple-600 to-blue-600"
                      }
                    >
                      {layer.active ? "Active ✓" : "Activate →"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wealth Timeline */}
        <Card className="bg-black/40 border-yellow-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">💰 Wealth Timeline - Path to $1 Billion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectionData.slice(0, 8).map((year, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30"
                  data-testid={`projection-year-${year.year}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-white border-purple-500">
                          Age {year.age} ({year.year})
                        </Badge>
                        {year.milestone && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                            {year.milestone}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white" data-testid={`text-wealth-${year.year}`}>
                        ${(year.usdValue / 1000000).toFixed(1)}M
                      </div>
                      <p className="text-sm text-gray-400">
                        {year.effectiveApy} APY • ${(year.monthlyIncome / 1000).toFixed(0)}k/month
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="text-center p-6 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-lg border border-yellow-500/30">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">🎯 YOUR BILLIONAIRE STATUS</h3>
          <p className="text-3xl font-bold text-white mb-2" data-testid="text-final-projection">
            ${(projectionData[projectionData.length - 1]?.usdValue || 0).toLocaleString()}
          </p>
          <p className="text-gray-300">
            By age {profile.targetAge}, with all layers active and 64% effective APY
          </p>
          <p className="text-sm text-green-400 mt-2">
            💎 Monthly Income at Goal: ${((projectionData[projectionData.length - 1]?.monthlyIncome || 0) / 1000000).toFixed(1)}M/month
          </p>
        </div>
      </div>
    </div>
  );
}
