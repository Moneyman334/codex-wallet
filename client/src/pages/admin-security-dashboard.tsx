import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Lock, 
  Unlock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface FraudLog {
  id: number;
  walletAddress: string;
  eventType: string;
  riskScore: number;
  riskLevel: string;
  details: string;
  action: string;
  metadata: any;
  createdAt: Date;
}

interface TimeLockedWithdrawal {
  id: number;
  walletAddress: string;
  destination: string;
  amount: string;
  currency: string;
  lockDuration: number;
  status: string;
  confirmationCode: string | null;
  expiresAt: Date;
  createdAt: Date;
}

interface LockdownStatus {
  enabled: boolean;
  timestamp: string;
}

export default function AdminSecurityDashboard() {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all fraud logs
  const { data: fraudLogs = [], isLoading: loadingFraud, refetch: refetchFraud } = useQuery<FraudLog[]>({
    queryKey: ['/api/admin/security/fraud-logs'],
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
  });

  // Fetch all time-locked withdrawals
  const { data: timeLockedWithdrawals = [], isLoading: loadingTimeLocked, refetch: refetchTimeLocked } = useQuery<TimeLockedWithdrawal[]>({
    queryKey: ['/api/admin/security/time-locked-withdrawals'],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch lockdown status
  const { data: lockdownStatus, isLoading: loadingLockdown, refetch: refetchLockdown } = useQuery<LockdownStatus>({
    queryKey: ['/api/admin/security/emergency-lockdown'],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Toggle emergency lockdown mutation
  const toggleLockdownMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('/api/admin/security/emergency-lockdown', 'POST', { enabled });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/emergency-lockdown'] });
      toast({
        title: data.lockdownEnabled ? "🚨 Emergency Lockdown Activated" : "✅ Lockdown Deactivated",
        description: data.message,
        variant: data.lockdownEnabled ? "destructive" : "default",
      });
    },
  });

  const handleToggleLockdown = () => {
    const enabled = !lockdownStatus?.enabled;
    
    if (enabled) {
      // Confirm before activating
      if (confirm("⚠️ ACTIVATE EMERGENCY LOCKDOWN?\n\nThis will BLOCK ALL WITHDRAWALS platform-wide.\n\nOnly activate during security incidents.")) {
        toggleLockdownMutation.mutate(enabled);
      }
    } else {
      toggleLockdownMutation.mutate(enabled);
    }
  };

  const handleRefreshAll = () => {
    refetchFraud();
    refetchTimeLocked();
    refetchLockdown();
    toast({ title: "Refreshed", description: "Security data updated" });
  };

  // Calculate stats
  const criticalAlerts = fraudLogs.filter(log => log.riskLevel === 'critical').length;
  const highAlerts = fraudLogs.filter(log => log.riskLevel === 'high').length;
  const pendingWithdrawals = timeLockedWithdrawals.filter(w => w.status === 'pending').length;
  const recentAlerts = fraudLogs.slice(0, 10);

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'secondary';
      case 'expired': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl backdrop-blur-sm border border-red-500/30">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                Admin Security Dashboard
              </h1>
              <p className="text-gray-400">Real-time threat monitoring and incident response</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefreshAll}
              variant="outline"
              size="sm"
              className="border-purple-500/30"
              data-testid="button-refresh-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-purple-500/30"}
              data-testid="button-auto-refresh"
            >
              <Activity className="w-4 h-4 mr-2" />
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
          </div>
        </div>

        {/* Emergency Lockdown Controls */}
        <Card className={`${lockdownStatus?.enabled ? 'bg-red-950/40 border-red-500/50' : 'bg-black/40 border-purple-500/30'} backdrop-blur-sm`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={lockdownStatus?.enabled ? "text-red-300" : "text-purple-300"}>
                  Emergency Lockdown System
                </CardTitle>
                <CardDescription>
                  {lockdownStatus?.enabled 
                    ? "⚠️ ALL WITHDRAWALS ARE CURRENTLY BLOCKED" 
                    : "One-click freeze all withdrawals during security incidents"}
                </CardDescription>
              </div>
              <Button
                onClick={handleToggleLockdown}
                disabled={toggleLockdownMutation.isPending || loadingLockdown}
                className={lockdownStatus?.enabled 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"}
                size="lg"
                data-testid="button-toggle-lockdown"
              >
                {lockdownStatus?.enabled ? (
                  <>
                    <Unlock className="w-5 h-5 mr-2" />
                    Deactivate Lockdown
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Activate Emergency Lockdown
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {lockdownStatus?.enabled && (
            <CardContent>
              <Alert className="bg-red-950/30 border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <AlertTitle className="text-red-300">Platform Lockdown Active</AlertTitle>
                <AlertDescription className="text-red-200">
                  All withdrawal requests are being blocked. Users will receive security notifications.
                  Activated at: {format(new Date(lockdownStatus.timestamp), 'PPp')}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {/* Security Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/40 border-red-500/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{criticalAlerts}</div>
              <p className="text-xs text-gray-500 mt-1">Require immediate action</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                High Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">{highAlerts}</div>
              <p className="text-xs text-gray-500 mt-1">Flagged for review</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-yellow-500/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                Time-Locked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{pendingWithdrawals}</div>
              <p className="text-xs text-gray-500 mt-1">Pending large withdrawals</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-green-500/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{fraudLogs.length}</div>
              <p className="text-xs text-gray-500 mt-1">Last 100 security events</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Fraud Alerts */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-300">Recent Fraud Detection Alerts</CardTitle>
            <CardDescription>Real-time AI-powered threat detection (auto-refreshing)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loadingFraud ? (
                <p className="text-gray-400 text-center py-8">Loading fraud alerts...</p>
              ) : recentAlerts.length === 0 ? (
                <Alert className="bg-green-950/30 border-green-500/30">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    No security incidents detected. Platform is secure.
                  </AlertDescription>
                </Alert>
              ) : (
                recentAlerts.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      log.riskLevel === 'critical' 
                        ? 'bg-red-950/20 border-red-500/30' 
                        : log.riskLevel === 'high'
                        ? 'bg-orange-950/20 border-orange-500/30'
                        : 'bg-purple-950/20 border-purple-500/20'
                    } space-y-2`}
                    data-testid={`fraud-alert-${log.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {log.riskLevel === 'critical' || log.riskLevel === 'high' ? (
                          <XCircle className={`w-5 h-5 ${log.riskLevel === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-purple-300">{log.eventType}</span>
                            <Badge variant={getRiskBadgeColor(log.riskLevel)}>
                              {log.riskLevel} ({log.riskScore}/100)
                            </Badge>
                            <Badge variant="outline" className="text-purple-300 border-purple-500/30">
                              {log.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{log.details}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Wallet: <code className="text-purple-300">{log.walletAddress.slice(0, 10)}...</code></span>
                            <span>{format(new Date(log.createdAt), 'PPp')}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-400 hover:text-purple-300"
                        data-testid={`button-view-details-${log.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    {log.riskScore > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>Risk Score</span>
                          <span>{log.riskScore}/100</span>
                        </div>
                        <Progress 
                          value={log.riskScore} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time-Locked Withdrawals */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-300">Pending Time-Locked Withdrawals</CardTitle>
            <CardDescription>Large withdrawals requiring 24-48 hour confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loadingTimeLocked ? (
                <p className="text-gray-400 text-center py-8">Loading time-locked withdrawals...</p>
              ) : timeLockedWithdrawals.length === 0 ? (
                <Alert className="bg-purple-950/30 border-purple-500/30">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <AlertDescription className="text-purple-200">
                    No pending time-locked withdrawals.
                  </AlertDescription>
                </Alert>
              ) : (
                timeLockedWithdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="p-4 bg-purple-950/20 rounded-lg border border-purple-500/20 space-y-2"
                    data-testid={`timelocked-withdrawal-${withdrawal.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span className="font-semibold text-purple-300">
                            {withdrawal.amount} {withdrawal.currency}
                          </span>
                          <Badge variant={getStatusBadgeColor(withdrawal.status)}>
                            {withdrawal.status}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-gray-400">
                          <p>From: <code className="text-purple-300">{withdrawal.walletAddress}</code></p>
                          <p>To: <code className="text-purple-300">{withdrawal.destination}</code></p>
                          <p>Lock Duration: {withdrawal.lockDuration / 3600} hours</p>
                          <p>Expires: {format(new Date(withdrawal.expiresAt), 'PPp')}</p>
                          <p>Created: {format(new Date(withdrawal.createdAt), 'PPp')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30"
                          data-testid={`button-approve-${withdrawal.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:text-red-300"
                          data-testid={`button-reject-${withdrawal.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
