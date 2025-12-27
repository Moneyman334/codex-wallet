import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, TrendingUp, Users, Wallet, Activity, 
  Lock, CheckCircle2, AlertTriangle, ExternalLink,
  DollarSign, BarChart3, Zap
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface ProofOfReservesSnapshot {
  id: number;
  totalEthReserves: string;
  totalUserBalances: string;
  reserveRatio: string;
  merkleRoot: string;
  blockNumber: number;
  chainId: string;
  createdAt: Date;
  metadata: any;
}

interface PlatformStats {
  totalUsers: number;
  totalWallets: number;
  totalTransactions: number;
  total24hVolume: string;
  activeSecurityFeatures: {
    whitelists: number;
    timeLockedWithdrawals: number;
    fraudAlerts: number;
    emergencyLockdown: boolean;
  };
  platformHealth: {
    uptime: string;
    responseTime: string;
    lastIncident: string | null;
  };
}

export default function TransparencyHub() {
  // Fetch latest Proof of Reserves
  const { data: latestProof, isLoading: loadingProof } = useQuery<ProofOfReservesSnapshot>({
    queryKey: ['/api/proof-of-reserves/latest'],
  });

  // Fetch platform statistics
  const { data: stats, isLoading: loadingStats } = useQuery<PlatformStats>({
    queryKey: ['/api/transparency/stats'],
  });

  const reserveRatio = latestProof ? parseFloat(latestProof.reserveRatio) : 0;
  const reserveRatioPercent = (reserveRatio * 100).toFixed(2);
  const isFullyBacked = reserveRatio >= 1.0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-blue-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Shield className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Transparency Hub
            </h1>
          </div>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Real-time platform transparency - Proof of Reserves, security metrics, and platform statistics
          </p>
        </div>

        {/* Proof of Reserves Overview */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm" data-testid="card-proof-reserves">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-purple-400" />
                <div>
                  <CardTitle className="text-white text-2xl">Proof of Reserves</CardTitle>
                  <CardDescription className="text-purple-200">
                    Cryptographic proof of platform solvency
                  </CardDescription>
                </div>
              </div>
              <Link href="/proof-of-reserves">
                <Button variant="outline" className="gap-2" data-testid="button-view-full-proof">
                  View Full Report
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProof ? (
              <div className="text-purple-200">Loading reserve data...</div>
            ) : latestProof ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-purple-200">Reserve Ratio</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-4xl font-bold text-white" data-testid="text-reserve-ratio">
                      {reserveRatioPercent}%
                    </p>
                    {isFullyBacked ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    )}
                  </div>
                  <Badge 
                    variant={isFullyBacked ? "default" : "destructive"}
                    className={isFullyBacked ? "bg-green-500/20 text-green-300" : ""}
                    data-testid="badge-backing-status"
                  >
                    {isFullyBacked ? "Fully Backed" : "Undercollateralized"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-purple-200">Platform Reserves</p>
                  </div>
                  <p className="text-3xl font-bold text-white" data-testid="text-platform-reserves">
                    {(parseFloat(latestProof.totalEthReserves) / 1e18).toFixed(4)} ETH
                  </p>
                  {latestProof.metadata?.tokens && (
                    <div className="space-y-1 text-sm text-purple-300">
                      {latestProof.metadata.tokens.USDC && (
                        <p>USDC: {(parseFloat(latestProof.metadata.tokens.USDC) / 1e6).toFixed(2)}</p>
                      )}
                      {latestProof.metadata.tokens.USDT && (
                        <p>USDT: {(parseFloat(latestProof.metadata.tokens.USDT) / 1e6).toFixed(2)}</p>
                      )}
                      {latestProof.metadata.tokens.DAI && (
                        <p>DAI: {(parseFloat(latestProof.metadata.tokens.DAI) / 1e18).toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <p className="text-sm text-purple-200">User Deposits</p>
                  </div>
                  <p className="text-3xl font-bold text-white" data-testid="text-user-deposits">
                    {(parseFloat(latestProof.totalUserBalances) / 1e18).toFixed(4)} ETH
                  </p>
                  <p className="text-xs text-purple-300">
                    Last updated: {format(new Date(latestProof.createdAt), 'MMM dd, HH:mm')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-purple-200">No reserve data available</div>
            )}
          </CardContent>
        </Card>

        {/* Security & Platform Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Metrics */}
          <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm" data-testid="card-security-metrics">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-400" />
                <div>
                  <CardTitle className="text-white text-xl">Security Metrics</CardTitle>
                  <CardDescription className="text-purple-200">
                    Active protection systems
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-purple-200">Loading security data...</div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-purple-200">Whitelisted Addresses</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-whitelists-count">
                        {stats.activeSecurityFeatures.whitelists}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-purple-200">Time-Locked</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-timelocked-count">
                        {stats.activeSecurityFeatures.timeLockedWithdrawals}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-purple-200">Fraud Alerts (24h)</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-fraud-alerts">
                        {stats.activeSecurityFeatures.fraudAlerts}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-purple-200">Emergency Lockdown</p>
                      <Badge 
                        variant={stats.activeSecurityFeatures.emergencyLockdown ? "destructive" : "default"}
                        className={!stats.activeSecurityFeatures.emergencyLockdown ? "bg-green-500/20 text-green-300" : ""}
                        data-testid="badge-lockdown-status"
                      >
                        {stats.activeSecurityFeatures.emergencyLockdown ? "ACTIVE" : "Normal"}
                      </Badge>
                    </div>
                  </div>

                  <Link href="/security-center">
                    <Button variant="outline" className="w-full gap-2" data-testid="button-view-security">
                      View Security Center
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-purple-200">No security data available</div>
              )}
            </CardContent>
          </Card>

          {/* Platform Statistics */}
          <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm" data-testid="card-platform-stats">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <div>
                  <CardTitle className="text-white text-xl">Platform Statistics</CardTitle>
                  <CardDescription className="text-purple-200">
                    Real-time platform activity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-purple-200">Loading platform data...</div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-purple-200">Total Users</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-total-users">
                        {stats.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-purple-200">Connected Wallets</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-total-wallets">
                        {stats.totalWallets.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-purple-200">Transactions</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-total-transactions">
                        {stats.totalTransactions.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-purple-200">24h Volume</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-24h-volume">
                        ${parseFloat(stats.total24hVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-purple-500/20 pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-400" />
                        <p className="text-sm text-purple-200">Platform Uptime</p>
                      </div>
                      <p className="text-sm font-bold text-white" data-testid="text-uptime">
                        {stats.platformHealth.uptime}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <p className="text-sm text-purple-200">Avg Response Time</p>
                      </div>
                      <p className="text-sm font-bold text-white" data-testid="text-response-time">
                        {stats.platformHealth.responseTime}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-purple-200">No platform data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm" data-testid="card-quick-links">
          <CardHeader>
            <CardTitle className="text-white">Transparency Resources</CardTitle>
            <CardDescription className="text-purple-200">
              Explore detailed reports and dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/proof-of-reserves">
                <Button variant="outline" className="w-full gap-2" data-testid="link-proof-reserves">
                  <Lock className="w-4 h-4" />
                  Proof of Reserves
                </Button>
              </Link>
              <Link href="/security-center">
                <Button variant="outline" className="w-full gap-2" data-testid="link-security-center">
                  <Shield className="w-4 h-4" />
                  Security Center
                </Button>
              </Link>
              <Link href="/rate-limits-monitor">
                <Button variant="outline" className="w-full gap-2" data-testid="link-rate-limits">
                  <Activity className="w-4 h-4" />
                  Rate Limits
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
