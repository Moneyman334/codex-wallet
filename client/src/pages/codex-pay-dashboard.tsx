import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Shield,
  ArrowUpRight,
  Wallet,
  Link as LinkIcon,
  BarChart3,
  ArrowRight,
  Rocket,
  Check,
} from "lucide-react";

export default function CodexPayDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showSecretKey, setShowSecretKey] = useState(false);

  const { data: merchant, isLoading: merchantLoading } = useQuery<any>({
    queryKey: ["/api/codex-pay/merchant"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/codex-pay/analytics"],
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ["/api/codex-pay/payments"],
  });

  const { data: apiKeys, isLoading: keysLoading } = useQuery<any[]>({
    queryKey: ["/api/codex-pay/api-keys"],
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (merchantLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading CODEX Pay Dashboard...</p>
        </div>
      </div>
    );
  }

  // No merchant account - show signup prompt
  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-2 border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Become a CODEX Pay Merchant
            </CardTitle>
            <CardDescription className="text-lg">
              Accept crypto payments with competitive fees. Join our beta program.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                <Rocket className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Competitive Fees*</h3>
                  <p className="text-sm text-muted-foreground">Potentially lower than traditional processors</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                <Shield className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Direct Settlement*</h3>
                  <p className="text-sm text-muted-foreground">Crypto-native payments</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                <Globe className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Expanding Access*</h3>
                  <p className="text-sm text-muted-foreground">Growing global coverage</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                <Check className="w-5 h-5 text-pink-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Blockchain Security*</h3>
                  <p className="text-sm text-muted-foreground">On-chain verification</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4 pt-4">
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/codex-pay/signup")}
                data-testid="button-create-merchant-account"
              >
                Create Merchant Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                *Features and fees may vary. Contact us for current terms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  CODEX PAY
                </h1>
                <p className="text-sm text-muted-foreground">
                  Crypto-native payment processing · Direct settlements · Beta program
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <span className="w-2 h-2 rounded-full bg-green-600 mr-2 animate-pulse" />
              Live
            </Badge>
            <Button variant="outline" size="sm" data-testid="button-view-docs">
              <LinkIcon className="w-4 h-4 mr-2" />
              API Docs
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-purple-200 dark:border-purple-900 hover:shadow-lg transition-shadow" data-testid="card-revenue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                ${analytics?.totalRevenue || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">+{analytics?.revenueGrowth || "0"}%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-900 hover:shadow-lg transition-shadow" data-testid="card-transactions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-transactions">
                {analytics?.totalTransactions || "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">{analytics?.successRate || "0"}%</span> success rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-900 hover:shadow-lg transition-shadow" data-testid="card-customers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-customers">
                {analytics?.uniqueCustomers || "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">+{analytics?.newCustomers || "0"}</span> this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 dark:border-pink-900 hover:shadow-lg transition-shadow" data-testid="card-volume">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-monthly-volume">
                ${analytics?.monthlyVolume || "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fee rate: <span className="text-pink-600 font-medium">{merchant?.feePercentage ? `${merchant.feePercentage}%` : "Contact us"}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="api-keys" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api-keys" data-testid="tab-api-keys">
              <Shield className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              <CreditCard className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="payment-links" data-testid="tab-payment-links">
              <LinkIcon className="w-4 h-4 mr-2" />
              Payment Links
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Use these keys to integrate CODEX Pay into your application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiKeys?.map((key: any) => (
                  <div key={key.id} className="p-4 rounded-lg border bg-card space-y-3" data-testid={`api-key-${key.keyType}`}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">
                          {key.keyType === "publishable" ? "Publishable Key" : "Secret Key"}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {key.keyType === "publishable" ? "Safe to use in frontend code" : "Keep this secret - server-side only"}
                        </p>
                      </div>
                      <Badge variant={key.environment === "live" ? "default" : "secondary"}>
                        {key.environment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showSecretKey && key.keyType === "secret" ? "text" : "password"}
                        value={key.keyPreview || `${key.keyPrefix}_••••••••••••••••••••••••••`}
                        readOnly
                        className="font-mono text-sm"
                        data-testid={`input-${key.keyType}-key`}
                      />
                      {key.keyType === "secret" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          data-testid="button-toggle-secret-visibility"
                        >
                          {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(key.key || key.keyPreview, key.keyType)}
                        data-testid={`button-copy-${key.keyType}-key`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {key.lastUsed && (
                      <p className="text-xs text-muted-foreground">
                        Last used: {new Date(key.lastUsed).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}

                <Button className="w-full" variant="outline" data-testid="button-create-api-key">
                  <Shield className="w-4 h-4 mr-2" />
                  Create New API Key
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Integration</CardTitle>
                <CardDescription>
                  Copy this code to start accepting payments in 2 minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                  <code>{`// Install SDK
npm install @codex-pay/sdk

// Create payment intent
import { CodexPay } from '@codex-pay/sdk';
const codexPay = new CodexPay('${apiKeys?.find((k: any) => k.keyType === "secret")?.keyPreview || "sk_live_..."}');

const paymentIntent = await codexPay.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'USD',
  acceptedCryptos: ['ETH', 'USDC', 'BTC'],
  metadata: { orderId: 'order_123' }
});

// ✨ That's it! Direct settlement to your wallet.
// Crypto-native payments with blockchain verification.`}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>
                  Real-time payment activity across all currencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
                ) : (recentPayments?.length || 0) === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <Wallet className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No payments yet</p>
                    <p className="text-sm text-muted-foreground">Create a payment link or integrate the API to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPayments?.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                        data-testid={`payment-${payment.intentId}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            payment.status === "succeeded" ? "bg-green-100 dark:bg-green-900" :
                            payment.status === "failed" ? "bg-red-100 dark:bg-red-900" :
                            "bg-yellow-100 dark:bg-yellow-900"
                          }`}>
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium">{payment.intentId}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.customerEmail || payment.customerWallet?.slice(0, 10) + "..."}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{payment.amount} {payment.currency}</div>
                          <Badge variant={payment.status === "succeeded" ? "default" : "secondary"}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Links Tab */}
          <TabsContent value="payment-links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Links</CardTitle>
                <CardDescription>
                  Create shareable payment pages - no code required
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No payment links yet</p>
                  <Button data-testid="button-create-payment-link">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Create Payment Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Track your payment performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-3">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Analytics dashboard coming soon</p>
                  <p className="text-sm text-muted-foreground">Real-time insights, conversion rates, and revenue tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Why CODEX Pay */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Why Crypto Payments?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">Beta</div>
                <div className="text-sm font-medium">Competitive Fees*</div>
                <div className="text-xs text-muted-foreground">Contact us for pricing</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">Direct*</div>
                <div className="text-sm font-medium">Crypto Settlements</div>
                <div className="text-xs text-muted-foreground">Payments to your wallet</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-600">Expanding*</div>
                <div className="text-sm font-medium">Global Coverage</div>
                <div className="text-xs text-muted-foreground">Growing availability</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">*Features and availability may vary. Contact us for current terms.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
