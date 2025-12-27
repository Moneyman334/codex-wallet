import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Code, 
  Key, 
  Webhook, 
  BarChart3, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Trash2, 
  Plus,
  Activity,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  Crown,
  Rocket
} from "lucide-react";

interface DeveloperAccount {
  id: string;
  email: string;
  companyName: string | null;
  website: string | null;
  description: string | null;
  status: string;
  tier: string;
  monthlyRequestQuota: number;
  requestsThisMonth: number;
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string | null;
  keyPrefix: string;
  keyType: string;
  environment: string;
  permissions: string[];
  requestsPerMinute: number;
  requestsToday: number;
  isActive: string;
  lastUsed: string | null;
  createdAt: string;
}

interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByHour: { hour: number; count: number }[];
  requestsByEndpoint: { endpoint: string; count: number }[];
  requestsByStatus: { status: number; count: number }[];
}

export default function EmpireAPIPortal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

  // Fetch developer account
  const { data: account, isLoading: accountLoading } = useQuery<DeveloperAccount>({
    queryKey: ["/api/empire/developer/account"],
  });

  // Fetch API keys
  const { data: apiKeys, isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/empire/developer/api-keys"],
  });

  // Fetch usage analytics
  const { data: usageStats } = useQuery<UsageStats>({
    queryKey: ["/api/empire/developer/analytics"],
  });

  // Generate API key mutation
  const generateKeyMutation = useMutation({
    mutationFn: async (data: { name: string; permissions: string[] }) => {
      const result = await apiRequest<{ apiKey: ApiKey; rawKey: string }>({
        method: "POST",
        url: "/api/empire/developer/api-keys",
        data: {
          name: data.name,
          keyType: "secret",
          environment: "live",
          permissions: data.permissions,
        },
      });
      return result;
    },
    onSuccess: (data) => {
      setGeneratedKey(data.rawKey);
      setShowKey(true);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["/api/empire/developer/api-keys"] });
      toast({
        title: "API Key Generated",
        description: "Your new API key has been created. Copy it now - it won't be shown again!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiRequest({
        method: "DELETE",
        url: `/api/empire/developer/api-keys/${keyId}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empire/developer/api-keys"] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been revoked",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "free":
        return { name: "FREE", color: "bg-slate-500", rpm: 60, quota: "10K" };
      case "pro":
        return { name: "PRO", color: "bg-blue-500", rpm: 300, quota: "100K" };
      case "enterprise":
        return { name: "ENTERPRISE", color: "bg-purple-500", rpm: 1000, quota: "1M" };
      default:
        return { name: tier.toUpperCase(), color: "bg-gray-500", rpm: 60, quota: "10K" };
    }
  };

  if (accountLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-white">No Developer Account</CardTitle>
            <CardDescription>You need to create a developer account first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/empire-api-signup")}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Create Developer Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierInfo = getTierInfo(account.tier);
  const quotaUsagePercent = (account.requestsThisMonth / account.monthlyRequestQuota) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:text-purple-400">
                  ← Back to Platform
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Empire API Portal
                </h1>
                <p className="text-sm text-slate-400">{account.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={`${tierInfo.color} text-white`}>
                <Crown className="w-3 h-3 mr-1" />
                {tierInfo.name} Tier
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Monthly Quota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {account.requestsThisMonth.toLocaleString()} / {tierInfo.quota}
              </div>
              <Progress value={quotaUsagePercent} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Rate Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {tierInfo.rpm} <span className="text-sm text-slate-400">RPM</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Requests per minute</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {apiKeys?.filter(k => k.isActive === "true").length || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Active keys</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {usageStats ? Math.round((usageStats.successfulRequests / usageStats.totalRequests) * 100) : 0}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Successful requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-purple-500/20">
            <TabsTrigger value="keys" data-testid="tab-keys">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="docs" data-testid="tab-docs">
              <Code className="w-4 h-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="webhooks" data-testid="tab-webhooks">
              <Webhook className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-4">
            {generatedKey && showKey && (
              <Card className="border-green-500/50 bg-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    API Key Generated Successfully
                  </CardTitle>
                  <CardDescription className="text-yellow-400">
                    ⚠️ Copy this key now! It won't be shown again.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 bg-slate-950 p-4 rounded-lg font-mono text-sm">
                    <code className="flex-1 text-green-400">{generatedKey}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedKey)}
                      data-testid="button-copy-key"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Generate New API Key</CardTitle>
                <CardDescription>Create a new API key to integrate with Empire API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="keyName" className="text-white">Key Name (optional)</Label>
                  <Input
                    id="keyName"
                    placeholder="My Production App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-slate-950 border-purple-500/20 text-white"
                    data-testid="input-key-name"
                  />
                </div>
                <Button
                  onClick={() => generateKeyMutation.mutate({ 
                    name: newKeyName || "Unnamed Key", 
                    permissions: ["read", "write"] 
                  })}
                  disabled={generateKeyMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  data-testid="button-generate-key"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate API Key
                </Button>
              </CardContent>
            </Card>

            {/* Existing API Keys */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Your API Keys</h3>
              {keysLoading ? (
                <Card className="border-purple-500/20 bg-slate-900/50">
                  <CardContent className="p-8 text-center text-slate-400">
                    Loading keys...
                  </CardContent>
                </Card>
              ) : apiKeys && apiKeys.length > 0 ? (
                apiKeys.map((key) => (
                  <Card key={key.id} className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-white">{key.name || "Unnamed Key"}</h4>
                            <Badge variant={key.isActive === "true" ? "default" : "secondary"}>
                              {key.isActive === "true" ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{key.environment}</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-400">
                              <span className="font-mono text-purple-400">{key.keyPrefix}••••••••••••••••</span>
                            </p>
                            <p className="text-slate-500">
                              Created: {new Date(key.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-slate-500">
                              Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : "Never"}
                            </p>
                            <p className="text-slate-500">
                              Requests today: {key.requestsToday} / {key.requestsPerMinute * 60 * 24}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                          data-testid={`button-delete-${key.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-purple-500/20 bg-slate-900/50">
                  <CardContent className="p-8 text-center">
                    <Key className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">No API keys yet. Generate one to get started!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Quick Start Guide</CardTitle>
                <CardDescription>Get started with Empire API in minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">1. Generate an API Key</h4>
                  <p className="text-slate-400">Create a new API key from the "API Keys" tab.</p>
                </div>

                <Separator className="bg-purple-500/20" />

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">2. Make Your First Request</h4>
                  <p className="text-slate-400 mb-4">Use the X-API-Key header to authenticate:</p>
                  
                  <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre className="text-green-400">{`curl https://getcodexpay.com/api/v1/wallets \\
  -H "X-API-Key: emp_sk_live_your_key_here"`}</pre>
                  </div>
                </div>

                <Separator className="bg-purple-500/20" />

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">3. Available Endpoints</h4>
                  <div className="space-y-2">
                    <div className="bg-slate-950 p-3 rounded-lg">
                      <code className="text-purple-400">GET /api/v1/wallets</code>
                      <p className="text-slate-400 text-sm mt-1">Access wallet data</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg">
                      <code className="text-purple-400">GET /api/v1/transactions</code>
                      <p className="text-slate-400 text-sm mt-1">Query transaction history</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg">
                      <code className="text-purple-400">GET /api/v1/trading</code>
                      <p className="text-slate-400 text-sm mt-1">Access trading features</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg">
                      <code className="text-purple-400">GET /api/v1/nfts</code>
                      <p className="text-slate-400 text-sm mt-1">Browse NFT marketplace</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg">
                      <code className="text-purple-400">POST /api/v1/payment-intents</code>
                      <p className="text-slate-400 text-sm mt-1">Create CODEX Pay payments</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-purple-500/20" />

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Rate Limits</h4>
                  <p className="text-slate-400 mb-4">Your current tier: <strong className="text-white">{tierInfo.name}</strong></p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Requests per minute:</span>
                      <span className="text-white font-semibold">{tierInfo.rpm} RPM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Monthly quota:</span>
                      <span className="text-white font-semibold">{tierInfo.quota} requests</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Usage Analytics</CardTitle>
                <CardDescription>Monitor your API usage and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {usageStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-950 p-4 rounded-lg">
                        <p className="text-sm text-slate-400 mb-1">Total Requests</p>
                        <p className="text-2xl font-bold text-white">{usageStats.totalRequests.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg">
                        <p className="text-sm text-slate-400 mb-1">Success Rate</p>
                        <p className="text-2xl font-bold text-green-400">
                          {Math.round((usageStats.successfulRequests / usageStats.totalRequests) * 100)}%
                        </p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg">
                        <p className="text-sm text-slate-400 mb-1">Avg Response Time</p>
                        <p className="text-2xl font-bold text-blue-400">{usageStats.averageResponseTime}ms</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">No analytics data available yet</p>
                    <p className="text-slate-500 text-sm">Start making API requests to see analytics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Webhook Configuration</CardTitle>
                <CardDescription>Configure webhooks to receive real-time event notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Webhook className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 mb-4">Webhook configuration coming soon</p>
                  <p className="text-slate-500 text-sm">You'll be able to configure HTTPS endpoints to receive events like:</p>
                  <div className="mt-4 space-y-1 text-sm text-slate-500">
                    <p>• payment.succeeded</p>
                    <p>• wallet.created</p>
                    <p>• transaction.completed</p>
                    <p>• trade.executed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Account Settings</CardTitle>
                <CardDescription>Manage your developer account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Email</Label>
                  <Input value={account.email} disabled className="bg-slate-950 border-purple-500/20" />
                </div>
                <div>
                  <Label className="text-white">Company Name</Label>
                  <Input value={account.companyName || ""} disabled className="bg-slate-950 border-purple-500/20" />
                </div>
                <div>
                  <Label className="text-white">Website</Label>
                  <Input value={account.website || ""} disabled className="bg-slate-950 border-purple-500/20" />
                </div>
                <div>
                  <Label className="text-white">Current Tier</Label>
                  <div className="mt-2">
                    <Badge className={`${tierInfo.color} text-white text-lg py-2 px-4`}>
                      {tierInfo.name}
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-purple-500/20 my-6" />

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Upgrade Your Tier</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-slate-500/50 bg-slate-950">
                      <CardHeader>
                        <CardTitle className="text-white">FREE</CardTitle>
                        <CardDescription>$0/month</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-slate-400">• 60 RPM</p>
                        <p className="text-slate-400">• 10K requests/month</p>
                        <p className="text-slate-400">• Basic support</p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-500/50 bg-blue-950/20">
                      <CardHeader>
                        <CardTitle className="text-white">PRO</CardTitle>
                        <CardDescription>$99/month</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-slate-300">• 300 RPM</p>
                        <p className="text-slate-300">• 100K requests/month</p>
                        <p className="text-slate-300">• Priority support</p>
                        <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700" disabled>
                          Coming Soon
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-500/50 bg-purple-950/20">
                      <CardHeader>
                        <CardTitle className="text-white">ENTERPRISE</CardTitle>
                        <CardDescription>$499/month</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-slate-300">• 1000 RPM</p>
                        <p className="text-slate-300">• 1M requests/month</p>
                        <p className="text-slate-300">• Dedicated support</p>
                        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" disabled>
                          Coming Soon
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
