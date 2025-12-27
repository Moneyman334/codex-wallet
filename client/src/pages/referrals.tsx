import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, DollarSign, TrendingUp, Copy, Share2, ExternalLink, CheckCircle, Clock, Ban } from "lucide-react";
import { format } from "date-fns";

interface Affiliate {
  id: string;
  walletAddress: string;
  referralCode: string;
  commissionRate: string;
  totalEarned: string;
  pendingEarnings: string;
  totalReferrals: string;
  status: 'active' | 'suspended' | 'banned';
  payoutWallet: string | null;
  createdAt: string;
}

interface Referral {
  id: string;
  affiliateId: string;
  referredWallet: string;
  orderId: string | null;
  commissionAmount: string;
  commissionRate: string;
  orderAmount: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paidAt: string | null;
  paidTxHash: string | null;
  createdAt: string;
}

export default function ReferralsPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: affiliate } = useQuery<Affiliate>({
    queryKey: ['/api/affiliates/me', account],
    enabled: !!account,
  });

  const { data: referrals } = useQuery<Referral[]>({
    queryKey: ['/api/affiliates/referrals', account],
    enabled: !!account && !!affiliate,
  });

  const createAffiliateMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Connect wallet to become an affiliate");
      return apiRequest('POST', '/api/affiliates', {
        walletAddress: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Affiliate Account Created!",
        description: "You can now start earning commissions",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/affiliates/me', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Affiliate Account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/affiliates/withdraw', {
        walletAddress: account,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Withdrawal Successful!",
        description: `${data.amount} sent to your wallet`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/affiliates/me', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyReferralLink = () => {
    if (!affiliate) return;
    const referralLink = `${window.location.origin}?ref=${affiliate.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!affiliate) return;
    const referralLink = `${window.location.origin}?ref=${affiliate.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Web3 Blockchain Empire',
          text: 'Start earning with blockchain payments!',
          url: referralLink,
        });
      } catch (err) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'suspended':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'suspended':
      case 'cancelled':
      case 'banned':
        return <Ban className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to join our affiliate program and start earning
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Join Our Affiliate Program</CardTitle>
            <CardDescription>
              Earn 5% commission on every sale you refer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-6 border rounded-lg text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold mb-2">Earn Commission</h3>
                <p className="text-sm text-muted-foreground">
                  Get paid for every successful referral
                </p>
              </div>
              <div className="p-6 border rounded-lg text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                <h3 className="font-semibold mb-2">Track Referrals</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor all your referrals in real-time
                </p>
              </div>
              <div className="p-6 border rounded-lg text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-purple-500" />
                <h3 className="font-semibold mb-2">Instant Payouts</h3>
                <p className="text-sm text-muted-foreground">
                  Withdraw your earnings anytime
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => createAffiliateMutation.mutate()}
              disabled={createAffiliateMutation.isPending}
              data-testid="button-create-affiliate"
            >
              {createAffiliateMutation.isPending ? 'Creating...' : 'Become an Affiliate'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const approvedReferrals = referrals?.filter(r => r.status === 'approved' || r.status === 'paid') || [];
  const pendingReferrals = referrals?.filter(r => r.status === 'pending') || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">Manage your referrals and track your earnings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-3xl font-bold" data-testid="text-total-earned">
                  ${parseFloat(affiliate.totalEarned).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold" data-testid="text-pending-earnings">
                  ${parseFloat(affiliate.pendingEarnings).toFixed(2)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-3xl font-bold" data-testid="text-total-referrals">
                  {affiliate.totalReferrals}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="text-3xl font-bold">{affiliate.commissionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Referral Link Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>Share this link to earn commissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Referral Code</p>
              <p className="text-2xl font-mono font-bold" data-testid="text-referral-code">
                {affiliate.referralCode}
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}?ref=${affiliate.referralCode}`}
                data-testid="input-referral-link"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyReferralLink}
                data-testid="button-copy-link"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={shareReferral}
                data-testid="button-share-link"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Card */}
        <Card>
          <CardHeader>
            <CardTitle>Withdraw Earnings</CardTitle>
            <CardDescription>Available to withdraw</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-green-600">
                ${parseFloat(affiliate.totalEarned).toFixed(2)}
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => withdrawMutation.mutate()}
              disabled={parseFloat(affiliate.totalEarned) === 0 || withdrawMutation.isPending}
              data-testid="button-withdraw"
            >
              {withdrawMutation.isPending ? 'Processing...' : 'Withdraw'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All Referrals ({referrals?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedReferrals.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingReferrals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {!referrals || referrals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No Referrals Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Share your referral link to start earning commissions
                </p>
                <Button onClick={copyReferralLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Referral Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            referrals.map(referral => (
              <Card key={referral.id} data-testid={`referral-${referral.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(referral.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(referral.status)}
                            {referral.status}
                          </span>
                        </Badge>
                        {referral.orderId && (
                          <span className="text-sm text-muted-foreground">
                            Order #{referral.orderId.slice(0, 8)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Referred Wallet</p>
                          <p className="font-mono text-sm">
                            {referral.referredWallet.slice(0, 6)}...{referral.referredWallet.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Order Amount</p>
                          <p className="font-semibold">${parseFloat(referral.orderAmount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Commission</p>
                          <p className="font-bold text-green-600">
                            ${parseFloat(referral.commissionAmount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="text-sm">{format(new Date(referral.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>

                      {referral.paidTxHash && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-muted-foreground">Paid on {format(new Date(referral.paidAt!), 'MMM d, yyyy')}</span>
                          <a
                            href={`https://etherscan.io/tx/${referral.paidTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View TX <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedReferrals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No approved referrals yet</p>
              </CardContent>
            </Card>
          ) : (
            approvedReferrals.map(referral => (
              <Card key={referral.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {referral.referredWallet.slice(0, 6)}...{referral.referredWallet.slice(-4)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      +${parseFloat(referral.commissionAmount).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingReferrals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No pending referrals</p>
              </CardContent>
            </Card>
          ) : (
            pendingReferrals.map(referral => (
              <Card key={referral.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {referral.referredWallet.slice(0, 6)}...{referral.referredWallet.slice(-4)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-500 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                      <p className="text-lg font-bold">
                        ${parseFloat(referral.commissionAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
