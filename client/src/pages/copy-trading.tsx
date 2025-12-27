import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, TrendingUp, Copy, DollarSign, Activity, 
  Star, Award, Zap, UserPlus, UserMinus 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ComplianceDisclaimer } from "@/components/ui/compliance-disclaimer";

interface TopTrader {
  id: string;
  username: string;
  avatar?: string;
  totalProfit: string;
  winRate: string;
  totalTrades: number;
  copiers: number;
  riskScore: number;
  avgMonthlyReturn: string;
  joinedAt: string;
  isVerified: boolean;
}

interface CopyRelationship {
  id: string;
  traderId: string;
  traderUsername: string;
  copyAmount: string;
  copyPercentage: number;
  isActive: boolean;
  totalCopiedProfit: string;
  totalCopiedTrades: number;
  startedAt: string;
}

interface CopiedTrade {
  id: string;
  traderId: string;
  traderUsername: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  profit: string;
  status: 'pending' | 'completed' | 'failed';
  copiedAt: string;
}

export default function CopyTradingPage() {
  const { toast } = useToast();
  const [selectedTraderId, setSelectedTraderId] = useState<string | null>(null);
  const [copyAmount, setCopyAmount] = useState("1000");
  const [copyPercentage, setCopyPercentage] = useState([50]);

  const { data: topTraders = [] } = useQuery<TopTrader[]>({
    queryKey: ['/api/copy-trading/top-traders'],
  });

  const { data: myRelationships = [] } = useQuery<CopyRelationship[]>({
    queryKey: ['/api/copy-trading/my-relationships'],
  });

  const { data: copiedTrades = [] } = useQuery<CopiedTrade[]>({
    queryKey: ['/api/copy-trading/copied-trades'],
  });

  const followTraderMutation = useMutation({
    mutationFn: async ({ traderId, copyAmount, copyPercentage }: { traderId: string; copyAmount: string; copyPercentage: number }) => {
      return apiRequest('POST', '/api/copy-trading/follow', { traderId, copyAmount, copyPercentage });
    },
    onSuccess: () => {
      toast({
        title: "Trader Followed! 🎉",
        description: "You're now copying this trader's positions automatically",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/copy-trading/my-relationships'] });
      setSelectedTraderId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Follow Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfollowTraderMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      return apiRequest('POST', '/api/copy-trading/unfollow', { relationshipId });
    },
    onSuccess: () => {
      toast({
        title: "Unfollowed Trader",
        description: "You've stopped copying this trader's positions",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/copy-trading/my-relationships'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Unfollow Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeRelationships = myRelationships.filter(r => r.isActive);
  const totalCopiedProfit = myRelationships.reduce((sum, r) => sum + parseFloat(r.totalCopiedProfit || "0"), 0);
  const totalCopiedTrades = myRelationships.reduce((sum, r) => sum + (r.totalCopiedTrades || 0), 0);

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 3) return "text-green-500";
    if (riskScore <= 6) return "text-yellow-500";
    return "text-red-500";
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore <= 3) return "Low Risk";
    if (riskScore <= 6) return "Medium Risk";
    return "High Risk";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Users className="h-10 w-10 text-purple-500" />
          Copy Trading
        </h1>
        <p className="text-muted-foreground">Follow other traders and replicate their positions (beta feature)</p>
      </div>

      {/* Trading Risk Disclaimer */}
      <ComplianceDisclaimer type="trading" className="mb-6" />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-purple-200 dark:border-purple-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Following</p>
                <p className="text-3xl font-bold text-purple-500">{activeRelationships.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Copied Profit</p>
                <p className="text-3xl font-bold text-green-500">
                  ${totalCopiedProfit.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Copied Trades</p>
                <p className="text-3xl font-bold text-blue-500">{totalCopiedTrades}</p>
              </div>
              <Copy className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Traders</p>
                <p className="text-3xl font-bold text-orange-500">{topTraders.length}</p>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="traders" data-testid="tab-traders">Top Traders</TabsTrigger>
          <TabsTrigger value="following" data-testid="tab-following">Following</TabsTrigger>
          <TabsTrigger value="trades" data-testid="tab-trades">Copied Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="traders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {topTraders.map((trader) => {
              const isFollowing = myRelationships.some(r => r.traderId === trader.id && r.isActive);
              
              return (
                <Card 
                  key={trader.id}
                  className={`transition-all ${isFollowing ? 'border-purple-500 shadow-purple-500/20 shadow-lg' : ''}`}
                  data-testid={`card-trader-${trader.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
                            {trader.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {trader.username}
                            {trader.isVerified && (
                              <Badge className="bg-blue-500">
                                <Award className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{trader.copiers} copiers</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Profit</p>
                        <p className="text-2xl font-bold text-green-500">
                          ${parseFloat(trader.totalProfit).toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-2xl font-bold text-blue-500">
                          {trader.winRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Return</p>
                        <p className="text-2xl font-bold text-purple-500">
                          {trader.avgMonthlyReturn}%
                        </p>
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Risk Level</p>
                        <Badge className={getRiskColor(trader.riskScore)}>
                          {getRiskLabel(trader.riskScore)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded ${
                              i < trader.riskScore
                                ? trader.riskScore <= 3
                                  ? 'bg-green-500'
                                  : trader.riskScore <= 6
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <span className="text-muted-foreground">
                        {trader.totalTrades} trades
                      </span>
                      <span className="text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(trader.joinedAt), { addSuffix: true })}
                      </span>
                    </div>

                    {isFollowing ? (
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => {
                          const rel = myRelationships.find(r => r.traderId === trader.id && r.isActive);
                          if (rel) unfollowTraderMutation.mutate(rel.id);
                        }}
                        disabled={unfollowTraderMutation.isPending}
                        data-testid={`button-unfollow-${trader.id}`}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Unfollow Trader
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500"
                        onClick={() => setSelectedTraderId(trader.id)}
                        data-testid={`button-follow-${trader.id}`}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow Trader
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Follow Trader Dialog */}
          {selectedTraderId && (
            <Card className="border-purple-500">
              <CardHeader>
                <CardTitle>Configure Copy Trading</CardTitle>
                <CardDescription>
                  Set your copy trading parameters for {topTraders.find(t => t.id === selectedTraderId)?.username}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Copy Amount (USD)
                  </label>
                  <Input
                    type="number"
                    value={copyAmount}
                    onChange={(e) => setCopyAmount(e.target.value)}
                    placeholder="1000"
                    data-testid="input-copy-amount"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum amount to allocate for copying this trader
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Copy Percentage: {copyPercentage[0]}%
                  </label>
                  <Slider
                    value={copyPercentage}
                    onValueChange={setCopyPercentage}
                    min={10}
                    max={100}
                    step={10}
                    className="mb-2"
                    data-testid="slider-copy-percentage"
                  />
                  <p className="text-sm text-muted-foreground">
                    Copy {copyPercentage[0]}% of each trade this trader makes
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
                    onClick={() => 
                      followTraderMutation.mutate({
                        traderId: selectedTraderId,
                        copyAmount,
                        copyPercentage: copyPercentage[0],
                      })
                    }
                    disabled={followTraderMutation.isPending}
                    data-testid="button-confirm-follow"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Start Copying
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTraderId(null)}
                    data-testid="button-cancel-follow"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {myRelationships.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Not Following Anyone Yet</h3>
                <p className="text-muted-foreground">
                  Start copying successful traders to automate your profits
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myRelationships.map((rel) => (
                <Card key={rel.id} data-testid={`card-relationship-${rel.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                            {rel.traderUsername[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{rel.traderUsername}</p>
                          <p className="text-sm text-muted-foreground">
                            Copying {rel.copyPercentage}% of trades
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-green-500">
                          +${parseFloat(rel.totalCopiedProfit).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rel.totalCopiedTrades} trades copied
                        </p>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => unfollowTraderMutation.mutate(rel.id)}
                        disabled={unfollowTraderMutation.isPending}
                        data-testid={`button-unfollow-relationship-${rel.id}`}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          {copiedTrades.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Copy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Copied Trades Yet</h3>
                <p className="text-muted-foreground">
                  Follow traders to start automatically copying their positions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {copiedTrades.map((trade) => (
                <Card key={trade.id} data-testid={`card-copied-trade-${trade.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${trade.side === 'buy' ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'}`}>
                          <TrendingUp className={`h-5 w-5 ${trade.side === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{trade.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            Copied from {trade.traderUsername}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          {trade.amount} @ ${parseFloat(trade.price).toFixed(2)}
                        </p>
                        <p className={`text-sm font-semibold ${parseFloat(trade.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(trade.profit) >= 0 ? '+' : ''}${parseFloat(trade.profit).toFixed(2)}
                        </p>
                      </div>

                      <Badge 
                        variant={trade.status === 'completed' ? 'default' : trade.status === 'pending' ? 'secondary' : 'destructive'}
                        data-testid={`status-copied-trade-${trade.id}`}
                      >
                        {trade.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
