import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, Gift, Zap } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";

interface LoyaltyAccount {
  id: string;
  walletAddress: string;
  points: string;
  lifetimePoints: string;
  tier: string;
  lastUpdated: string;
}

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: string;
  description: string;
  createdAt: string;
}

const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 999, color: "bg-orange-700", nextTier: "Silver", nextThreshold: 1000 },
  silver: { min: 1000, max: 2499, color: "bg-gray-400", nextTier: "Gold", nextThreshold: 2500 },
  gold: { min: 2500, max: 4999, color: "bg-yellow-500", nextTier: "Platinum", nextThreshold: 5000 },
  platinum: { min: 5000, max: Infinity, color: "bg-purple-500", nextTier: null, nextThreshold: null },
};

const TIER_BENEFITS: Record<string, string[]> = {
  bronze: ["Earn 1% on purchases", "Birthday bonus", "Early sale access"],
  silver: ["Earn 1.5% on purchases", "Free shipping", "Exclusive deals", "Priority support"],
  gold: ["Earn 2% on purchases", "VIP events", "Special gifts", "Fast-track returns"],
  platinum: ["Earn 3% on purchases", "Personal concierge", "Luxury perks", "Ultimate benefits"],
};

export default function Loyalty() {
  const { account } = useWeb3();

  const { data: loyaltyAccount, isLoading } = useQuery<LoyaltyAccount>({
    queryKey: ['/api/loyalty', account],
    enabled: !!account,
  });

  const { data: transactions } = useQuery<LoyaltyTransaction[]>({
    queryKey: ['/api/loyalty', loyaltyAccount?.id, '/transactions'],
    enabled: !!loyaltyAccount?.id,
  });

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Loyalty Rewards</h2>
            <p className="text-muted-foreground mb-4">Connect your wallet to view your loyalty points</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading loyalty account...</p>
        </div>
      </div>
    );
  }

  const tier = loyaltyAccount?.tier?.toLowerCase() || "bronze";
  const points = parseInt(loyaltyAccount?.points || "0");
  const lifetimePoints = parseInt(loyaltyAccount?.lifetimePoints || "0");
  const tierInfo = TIER_THRESHOLDS[tier as keyof typeof TIER_THRESHOLDS] || TIER_THRESHOLDS.bronze;
  
  const progress = tierInfo.nextThreshold 
    ? ((points - tierInfo.min) / (tierInfo.nextThreshold - tierInfo.min)) * 100
    : 100;
  
  const pointsToNext = tierInfo.nextThreshold ? tierInfo.nextThreshold - points : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Loyalty Rewards</h1>
        <p className="text-muted-foreground">Earn points on every purchase and unlock exclusive benefits</p>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-1">Your Points</CardTitle>
                <CardDescription>Current balance</CardDescription>
              </div>
              <Badge className={`${tierInfo.color} text-white text-lg px-4 py-2`}>
                {tier.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold">{points}</span>
                  <span className="text-xl text-muted-foreground">points</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lifetime earned: {lifetimePoints} points
                </p>
              </div>

              {tierInfo.nextTier && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress to {tierInfo.nextTier}</span>
                    <span className="font-medium">{pointsToNext} points needed</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Earned This Month</p>
                <p className="font-semibold">{Math.floor(Math.random() * 500)} pts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points Value</p>
                <p className="font-semibold">${(points * 0.01).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Benefits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your {tier.charAt(0).toUpperCase() + tier.slice(1)} Benefits</CardTitle>
          <CardDescription>Exclusive perks for your tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIER_BENEFITS[tier].map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Tiers Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>All Tiers</CardTitle>
          <CardDescription>See what you can unlock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(TIER_THRESHOLDS).map(([tierName, info]) => (
              <div
                key={tierName}
                className={`p-4 rounded-lg border-2 ${
                  tier === tierName ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`h-12 w-12 rounded-full ${info.color} flex items-center justify-center mb-3`}>
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">{tierName.toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {info.min === 0 ? '0' : info.min.toLocaleString()}+ points
                </p>
                {tier === tierName && (
                  <Badge variant="default" className="text-xs">Current Tier</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
          <CardDescription>Recent point transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start shopping to earn points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={tx.type === "earned" ? "default" : "secondary"}>
                    {tx.type === "earned" ? "+" : "-"}{tx.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
