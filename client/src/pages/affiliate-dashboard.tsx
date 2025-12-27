import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, ExternalLink, TrendingUp, Users, DollarSign, CheckCircle } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";

interface Affiliate {
  id: string;
  walletAddress: string;
  referralCode: string;
  commissionRate: string;
  totalEarned: string;
  pendingEarnings: string;
  totalReferrals: string;
  status: string;
}

interface Referral {
  id: string;
  referredWallet: string;
  commissionAmount: string;
  orderAmount: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export default function AffiliateDashboard() {
  const { toast } = useToast();
  const { account } = useWeb3();
  const [copied, setCopied] = useState(false);

  const { data: affiliate, isLoading } = useQuery<Affiliate>({
    queryKey: ['/api/affiliates/wallet', account],
    enabled: !!account,
  });

  const { data: referrals } = useQuery<Referral[]>({
    queryKey: ['/api/affiliates', affiliate?.id, '/referrals'],
    enabled: !!affiliate?.id,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Please connect your wallet");
      
      return apiRequest('POST', '/api/affiliates', {
        walletAddress: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome to the Affiliate Program!",
        description: "Your unique referral code has been generated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/affiliates/wallet', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyReferralLink = () => {
    if (!affiliate) return;
    
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}?ref=${affiliate.referralCode}`;
    
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-lg">Connect your wallet to access the affiliate dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading affiliate data...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Join Our Affiliate Program</CardTitle>
            <CardDescription>
              Earn {5}% commission on every sale you refer. Get your unique referral link and start earning today!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold">Earn 5% Commission</h3>
                <p className="text-sm text-muted-foreground">On every referred sale</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold">Track Referrals</h3>
                <p className="text-sm text-muted-foreground">Real-time dashboard</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-semibold">Instant Payouts</h3>
                <p className="text-sm text-muted-foreground">On-chain payments</p>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending}
              data-testid="button-register-affiliate"
            >
              {registerMutation.isPending ? "Registering..." : "Join Affiliate Program"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}?ref=${affiliate.referralCode}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">Track your earnings and referrals</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${affiliate.totalEarned}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">${affiliate.pendingEarnings}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliate.totalReferrals}</div>
            <p className="text-xs text-muted-foreground mt-1">Successful referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{affiliate.commissionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Per sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link to earn commissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
              data-testid="input-referral-link"
            />
            <Button
              onClick={copyReferralLink}
              variant="outline"
              data-testid="button-copy-link"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Referral Code:</span>
            <Badge variant="secondary" className="font-mono">{affiliate.referralCode}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Referrals History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>Track your commission earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground mt-1">Share your referral link to start earning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`referral-${referral.id}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-sm">
                        {referral.referredWallet.slice(0, 6)}...{referral.referredWallet.slice(-4)}
                      </p>
                      <Badge variant={
                        referral.status === "paid" ? "default" :
                        referral.status === "approved" ? "secondary" :
                        "outline"
                      }>
                        {referral.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Order: ${referral.orderAmount} • {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">
                      +${referral.commissionAmount}
                    </div>
                    {referral.paidAt && (
                      <p className="text-xs text-muted-foreground">
                        Paid {new Date(referral.paidAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
