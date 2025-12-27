import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Plus, Trash2, Key, AlertTriangle, Clock, Activity, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

interface WhitelistAddress {
  id: number;
  walletAddress: string;
  approvedAddress: string;
  label: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface AntiPhishingCode {
  id: number;
  walletAddress: string;
  phishingCode: string;
  isActive: boolean;
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

interface FraudLog {
  id: number;
  walletAddress: string;
  eventType: string;
  riskScore: number;
  riskLevel: string;
  details: string;
  metadata: any;
  createdAt: Date;
}

export default function SecurityCenter() {
  const { toast } = useToast();
  const [newWhitelistAddress, setNewWhitelistAddress] = useState("");
  const [newWhitelistLabel, setNewWhitelistLabel] = useState("");
  const [newPhishingCode, setNewPhishingCode] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4"); // Demo wallet

  // Fetch whitelisted addresses
  const { data: whitelists = [], isLoading: loadingWhitelists } = useQuery<WhitelistAddress[]>({
    queryKey: ['/api/security/whitelists', selectedWallet],
  });

  // Fetch anti-phishing codes
  const { data: phishingCodes = [], isLoading: loadingPhishing } = useQuery<AntiPhishingCode[]>({
    queryKey: ['/api/security/anti-phishing', selectedWallet],
  });

  // Fetch time-locked withdrawals
  const { data: timeLockedWithdrawals = [], isLoading: loadingTimeLocked } = useQuery<TimeLockedWithdrawal[]>({
    queryKey: ['/api/security/time-locked-withdrawals', selectedWallet],
  });

  // Fetch fraud detection logs
  const { data: fraudLogs = [], isLoading: loadingFraud } = useQuery<FraudLog[]>({
    queryKey: ['/api/security/fraud-logs', selectedWallet],
  });

  // Add whitelist mutation
  const addWhitelistMutation = useMutation({
    mutationFn: async (data: { address: string; label: string }) => {
      return apiRequest('/api/security/whitelists', 'POST', {
        walletAddress: selectedWallet,
        approvedAddress: data.address,
        label: data.label || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/whitelists', selectedWallet] });
      toast({ title: "Success", description: "Address added to whitelist" });
      setNewWhitelistAddress("");
      setNewWhitelistLabel("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add whitelist address", variant: "destructive" });
    },
  });

  // Remove whitelist mutation
  const removeWhitelistMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/security/whitelists/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/whitelists', selectedWallet] });
      toast({ title: "Success", description: "Address removed from whitelist" });
    },
  });

  // Set anti-phishing code mutation
  const setPhishingCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest('/api/security/anti-phishing', 'POST', {
        walletAddress: selectedWallet,
        phishingCode: code,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/anti-phishing', selectedWallet] });
      toast({ title: "Success", description: "Anti-phishing code set successfully" });
      setNewPhishingCode("");
    },
  });

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
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl backdrop-blur-sm border border-purple-500/30">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Security Center
            </h1>
            <p className="text-gray-400">Enterprise-grade protection for your digital assets</p>
          </div>
        </div>

        {/* Wallet Selector */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Label htmlFor="wallet">Active Wallet</Label>
            <Input
              id="wallet"
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="bg-purple-950/50 border-purple-500/30 text-white mt-2"
              data-testid="input-active-wallet"
            />
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="whitelists" className="space-y-6">
          <TabsList className="bg-black/60 border border-purple-500/30">
            <TabsTrigger value="whitelists" className="data-[state=active]:bg-purple-500/20" data-testid="tab-whitelists">
              <Lock className="w-4 h-4 mr-2" />
              Withdrawal Whitelists
            </TabsTrigger>
            <TabsTrigger value="phishing" className="data-[state=active]:bg-purple-500/20" data-testid="tab-phishing">
              <Key className="w-4 h-4 mr-2" />
              Anti-Phishing
            </TabsTrigger>
            <TabsTrigger value="timelocked" className="data-[state=active]:bg-purple-500/20" data-testid="tab-timelocked">
              <Clock className="w-4 h-4 mr-2" />
              Time-Locked Withdrawals
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-purple-500/20" data-testid="tab-logs">
              <Activity className="w-4 h-4 mr-2" />
              Security Logs
            </TabsTrigger>
          </TabsList>

          {/* Whitelists Tab */}
          <TabsContent value="whitelists" className="space-y-4">
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-purple-300">Approved Withdrawal Addresses</CardTitle>
                <CardDescription>
                  Only whitelisted addresses can receive withdrawals. This provides Kraken-level security for your funds.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Whitelist */}
                <div className="p-4 bg-purple-950/30 rounded-lg border border-purple-500/20 space-y-3">
                  <h3 className="font-semibold text-purple-300">Add New Address</h3>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="whitelist-address">Wallet Address</Label>
                      <Input
                        id="whitelist-address"
                        placeholder="0x..."
                        value={newWhitelistAddress}
                        onChange={(e) => setNewWhitelistAddress(e.target.value)}
                        className="bg-black/40 border-purple-500/30 text-white mt-1"
                        data-testid="input-whitelist-address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whitelist-label">Label (Optional)</Label>
                      <Input
                        id="whitelist-label"
                        placeholder="e.g., Hardware Wallet, Exchange"
                        value={newWhitelistLabel}
                        onChange={(e) => setNewWhitelistLabel(e.target.value)}
                        className="bg-black/40 border-purple-500/30 text-white mt-1"
                        data-testid="input-whitelist-label"
                      />
                    </div>
                    <Button
                      onClick={() => addWhitelistMutation.mutate({ 
                        address: newWhitelistAddress, 
                        label: newWhitelistLabel 
                      })}
                      disabled={!newWhitelistAddress || addWhitelistMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      data-testid="button-add-whitelist"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Whitelist
                    </Button>
                  </div>
                </div>

                {/* Whitelist Items */}
                <div className="space-y-2">
                  {loadingWhitelists ? (
                    <p className="text-gray-400 text-center py-8">Loading whitelists...</p>
                  ) : whitelists.length === 0 ? (
                    <Alert className="bg-purple-950/30 border-purple-500/30">
                      <AlertTriangle className="w-4 h-4 text-purple-400" />
                      <AlertDescription className="text-purple-200">
                        No whitelisted addresses yet. Add trusted addresses to enable whitelist protection.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    whitelists.map((whitelist) => (
                      <div
                        key={whitelist.id}
                        className="flex items-center justify-between p-4 bg-purple-950/20 rounded-lg border border-purple-500/20"
                        data-testid={`whitelist-item-${whitelist.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <code className="text-sm text-purple-300">{whitelist.approvedAddress}</code>
                            {whitelist.label && (
                              <Badge variant="outline" className="text-purple-300 border-purple-500/30">
                                {whitelist.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Added {format(new Date(whitelist.createdAt), 'PPp')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWhitelistMutation.mutate(whitelist.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                          data-testid={`button-remove-whitelist-${whitelist.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anti-Phishing Tab */}
          <TabsContent value="phishing" className="space-y-4">
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-purple-300">Anti-Phishing Code</CardTitle>
                <CardDescription>
                  Set a custom code that appears in all legitimate emails from us. This helps you identify phishing attempts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Code */}
                {phishingCodes.length > 0 && (
                  <Alert className="bg-green-950/30 border-green-500/30">
                    <Key className="w-4 h-4 text-green-400" />
                    <AlertDescription className="text-green-200">
                      <strong>Your Anti-Phishing Code:</strong> <code className="ml-2 text-lg font-bold text-green-300">{phishingCodes[0].phishingCode}</code>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Set New Code */}
                <div className="p-4 bg-purple-950/30 rounded-lg border border-purple-500/20 space-y-3">
                  <h3 className="font-semibold text-purple-300">Set New Anti-Phishing Code</h3>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="phishing-code">Custom Code (4-20 characters)</Label>
                      <Input
                        id="phishing-code"
                        placeholder="e.g., MySecretWord2024"
                        value={newPhishingCode}
                        onChange={(e) => setNewPhishingCode(e.target.value)}
                        className="bg-black/40 border-purple-500/30 text-white mt-1"
                        maxLength={20}
                        data-testid="input-phishing-code"
                      />
                    </div>
                    <Button
                      onClick={() => setPhishingCodeMutation.mutate(newPhishingCode)}
                      disabled={!newPhishingCode || newPhishingCode.length < 4 || setPhishingCodeMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      data-testid="button-set-phishing-code"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Set Anti-Phishing Code
                    </Button>
                  </div>
                </div>

                {/* How It Works */}
                <Alert className="bg-blue-950/30 border-blue-500/30">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    <strong>How It Works:</strong> All legitimate emails from CODEX Wallet will include your anti-phishing code.
                    If you receive an email without your code, it's a phishing attempt - delete it immediately.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time-Locked Withdrawals Tab */}
          <TabsContent value="timelocked" className="space-y-4">
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-purple-300">Time-Locked Withdrawals</CardTitle>
                <CardDescription>
                  Large withdrawals (≥1 ETH) are time-locked to protect against account takeover attacks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {loadingTimeLocked ? (
                    <p className="text-gray-400 text-center py-8">Loading time-locked withdrawals...</p>
                  ) : timeLockedWithdrawals.length === 0 ? (
                    <Alert className="bg-purple-950/30 border-purple-500/30">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <AlertDescription className="text-purple-200">
                        No pending time-locked withdrawals. Large withdrawals (≥1 ETH) will appear here.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    timeLockedWithdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="p-4 bg-purple-950/20 rounded-lg border border-purple-500/20 space-y-2"
                        data-testid={`timelocked-item-${withdrawal.id}`}
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
                            <p className="text-sm text-gray-400 mt-1">
                              To: <code className="text-purple-300">{withdrawal.destination}</code>
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <p>Lock Duration: {withdrawal.lockDuration / 3600} hours</p>
                          <p>Expires: {format(new Date(withdrawal.expiresAt), 'PPp')}</p>
                          <p>Created: {format(new Date(withdrawal.createdAt), 'PPp')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-purple-300">Fraud Detection & Security Logs</CardTitle>
                <CardDescription>
                  Real-time AI-powered threat detection and security event monitoring.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {loadingFraud ? (
                    <p className="text-gray-400 text-center py-8">Loading security logs...</p>
                  ) : fraudLogs.length === 0 ? (
                    <Alert className="bg-green-950/30 border-green-500/30">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <AlertDescription className="text-green-200">
                        No security incidents detected. Your account is secure.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    fraudLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 bg-purple-950/20 rounded-lg border border-purple-500/20 space-y-2"
                        data-testid={`fraud-log-${log.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {log.riskLevel === 'critical' || log.riskLevel === 'high' ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            )}
                            <span className="font-semibold text-purple-300">{log.eventType}</span>
                            <Badge variant={getRiskBadgeColor(log.riskLevel)}>
                              {log.riskLevel} ({log.riskScore}/100)
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">
                            {format(new Date(log.createdAt), 'PPp')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{log.details}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
