import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Shield, Zap, Crown, Rocket, TrendingUp, Clock, Activity, CheckCircle, ArrowRight, Lock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface RateLimitStatus {
  tier: 'FREE' | 'ASCEND' | 'EMPIRE' | 'WHALE';
  limits: {
    general: { perMinute: number; perHour: number };
    settlements: { perHour: number };
    staking: { perHour: number };
    trading: { perMinute: number };
    games: { perHour: number };
  };
  usage: {
    general: { current: number; limit: number };
    settlements: { current: number; limit: number };
    staking: { current: number; limit: number };
    trading: { current: number; limit: number };
    games: { current: number; limit: number };
  };
}

const tierInfo = {
  FREE: {
    name: 'Free Tier',
    icon: Shield,
    color: 'from-slate-600 to-slate-700',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-700',
    price: '$0/mo',
    multiplier: '1x',
  },
  ASCEND: {
    name: 'Ascend Pass',
    icon: Zap,
    color: 'from-blue-600 to-blue-700',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-700',
    price: '$29.99/mo',
    multiplier: '2x',
  },
  EMPIRE: {
    name: 'Empire Pass',
    icon: Crown,
    color: 'from-purple-600 to-purple-700',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-700',
    price: '$79.99/mo',
    multiplier: '5x',
  },
  WHALE: {
    name: 'Whale Pass',
    icon: Rocket,
    color: 'from-pink-600 to-pink-700',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-700',
    price: '$299/mo',
    multiplier: '10x',
  },
};

export default function RateLimitsMonitor() {
  const { data: status, isLoading } = useQuery<RateLimitStatus>({
    queryKey: ['/api/rate-limits/status'],
    queryFn: () => fetch('/api/rate-limits/status', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const currentTier = status?.tier || 'FREE';
  const tierConfig = tierInfo[currentTier];
  const TierIcon = tierConfig.icon;

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageStatus = (percentage: number): { icon: any; text: string; color: string } => {
    if (percentage >= 90) return { icon: AlertTriangle, text: 'Critical', color: 'text-red-400' };
    if (percentage >= 75) return { icon: Activity, text: 'High', color: 'text-orange-400' };
    if (percentage >= 50) return { icon: Activity, text: 'Moderate', color: 'text-yellow-400' };
    return { icon: CheckCircle, text: 'Healthy', color: 'text-green-400' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Activity className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Rate Limit Monitor
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Track your API usage and tier benefits in real-time
            </p>
          </div>

          <Link href="/empire-pass">
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-upgrade-tier"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade Tier
            </Button>
          </Link>
        </div>

        {/* Current Tier Card */}
        <Card className={`bg-gradient-to-br ${tierConfig.color} border-2 ${tierConfig.borderColor}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <TierIcon className={`w-8 h-8 ${tierConfig.textColor}`} />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">{tierConfig.name}</CardTitle>
                  <CardDescription className="text-white/70 text-lg">
                    {tierConfig.price} • {tierConfig.multiplier} Request Multiplier
                  </CardDescription>
                </div>
              </div>
              
              <Badge variant="outline" className="border-white/30 text-white text-lg px-4 py-2">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-800 rounded w-full"></div>
                    <div className="h-8 bg-slate-800 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : status ? (
          <>
            {/* Usage Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General API */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="w-5 h-5 text-blue-400" />
                      General API
                    </CardTitle>
                    {(() => {
                      const percentage = getUsagePercentage(
                        status.usage.general.current,
                        status.usage.general.limit
                      );
                      const statusInfo = getUsageStatus(percentage);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Badge variant="outline" className={`border-slate-700 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.text}
                        </Badge>
                      );
                    })()}
                  </div>
                  <CardDescription className="text-slate-400">
                    All standard platform endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Per Minute</span>
                      <span className="text-sm font-mono text-white">
                        {status.usage.general.current} / {status.limits.general.perMinute}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(status.usage.general.current, status.limits.general.perMinute)}
                      className={`h-2 ${getUsageColor(getUsagePercentage(status.usage.general.current, status.limits.general.perMinute))}`}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Per Hour</span>
                      <span className="text-sm font-mono text-white">
                        {status.usage.general.current} / {status.limits.general.perHour}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(status.usage.general.current, status.limits.general.perHour)}
                      className={`h-2 ${getUsageColor(getUsagePercentage(status.usage.general.current, status.limits.general.perHour))}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Settlements */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Instant Settlements
                    </CardTitle>
                    {(() => {
                      const percentage = getUsagePercentage(
                        status.usage.settlements.current,
                        status.usage.settlements.limit
                      );
                      const statusInfo = getUsageStatus(percentage);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Badge variant="outline" className={`border-slate-700 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.text}
                        </Badge>
                      );
                    })()}
                  </div>
                  <CardDescription className="text-slate-400">
                    Crypto withdrawals & settlements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Per Hour</span>
                      <span className="text-sm font-mono text-white">
                        {status.usage.settlements.current} / {status.limits.settlements.perHour}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(status.usage.settlements.current, status.limits.settlements.perHour)}
                      className={`h-2 ${getUsageColor(getUsagePercentage(status.usage.settlements.current, status.limits.settlements.perHour))}`}
                    />
                  </div>
                  
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-yellow-400 mt-0.5" />
                      <div className="text-xs text-yellow-200">
                        Protected with dual rate limiting and security checks
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staking */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Staking Operations
                    </CardTitle>
                    {(() => {
                      const percentage = getUsagePercentage(
                        status.usage.staking.current,
                        status.usage.staking.limit
                      );
                      const statusInfo = getUsageStatus(percentage);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Badge variant="outline" className={`border-slate-700 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.text}
                        </Badge>
                      );
                    })()}
                  </div>
                  <CardDescription className="text-slate-400">
                    Stake, unstake, and compound
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Per Hour</span>
                      <span className="text-sm font-mono text-white">
                        {status.usage.staking.current} / {status.limits.staking.perHour}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(status.usage.staking.current, status.limits.staking.perHour)}
                      className={`h-2 ${getUsageColor(getUsagePercentage(status.usage.staking.current, status.limits.staking.perHour))}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Trading */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="w-5 h-5 text-purple-400" />
                      Margin Trading
                    </CardTitle>
                    {(() => {
                      const percentage = getUsagePercentage(
                        status.usage.trading.current,
                        status.usage.trading.limit
                      );
                      const statusInfo = getUsageStatus(percentage);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Badge variant="outline" className={`border-slate-700 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.text}
                        </Badge>
                      );
                    })()}
                  </div>
                  <CardDescription className="text-slate-400">
                    Open/close positions, liquidations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Per Minute</span>
                      <span className="text-sm font-mono text-white">
                        {status.usage.trading.current} / {status.limits.trading.perMinute}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(status.usage.trading.current, status.limits.trading.perMinute)}
                      className={`h-2 ${getUsageColor(getUsagePercentage(status.usage.trading.current, status.limits.trading.perMinute))}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tier Comparison */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Tier Comparison</CardTitle>
                <CardDescription className="text-slate-400">
                  See what you get with each subscription tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(tierInfo).map(([tier, info]) => {
                    const Icon = info.icon;
                    const isCurrentTier = tier === currentTier;
                    
                    return (
                      <div
                        key={tier}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isCurrentTier
                            ? `bg-gradient-to-br ${info.color} ${info.borderColor} shadow-lg scale-105`
                            : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                        }`}
                        data-testid={`tier-card-${tier.toLowerCase()}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`w-5 h-5 ${isCurrentTier ? 'text-white' : info.textColor}`} />
                          <span className={`font-semibold ${isCurrentTier ? 'text-white' : 'text-slate-300'}`}>
                            {info.name}
                          </span>
                        </div>
                        
                        <div className={`text-2xl font-bold mb-2 ${isCurrentTier ? 'text-white' : info.textColor}`}>
                          {info.price}
                        </div>
                        
                        <Badge variant="outline" className={`mb-4 ${isCurrentTier ? 'border-white/30 text-white' : 'border-slate-600 text-slate-400'}`}>
                          {info.multiplier} Multiplier
                        </Badge>
                        
                        {isCurrentTier && (
                          <Badge className="w-full bg-white/20 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current Tier
                          </Badge>
                        )}
                        
                        {!isCurrentTier && tier !== 'FREE' && (
                          <Link href="/empire-pass">
                            <Button
                              variant="outline"
                              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                              size="sm"
                              data-testid={`button-upgrade-${tier.toLowerCase()}`}
                            >
                              Upgrade
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Benefits Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">No Delays</h3>
                      <p className="text-sm text-slate-300">
                        Higher tiers get faster API responses and priority queue access
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Enhanced Security</h3>
                      <p className="text-sm text-slate-300">
                        Premium tiers unlock advanced security features and protections
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Scale Your Operations</h3>
                      <p className="text-sm text-slate-300">
                        Execute more trades, stakes, and settlements without limits
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">Unable to load rate limit status</p>
              <p className="text-sm text-slate-500 mt-2">Please try refreshing the page</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
