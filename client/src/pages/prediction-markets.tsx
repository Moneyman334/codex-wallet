import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrendingUp, Target, Trophy, DollarSign, Users, Clock, Zap, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Market {
  id: string;
  question: string;
  description: string;
  creator: string;
  category: string;
  endDate: string;
  resolutionDate: string;
  status: 'active' | 'resolved' | 'cancelled';
  yesPool: string;
  noPool: string;
  totalVolume: string;
  outcome?: 'yes' | 'no';
  createdAt: string;
}

interface Position {
  id: string;
  marketId: string;
  user: string;
  prediction: 'yes' | 'no';
  amount: string;
  shares: string;
  avgPrice: string;
  pnl?: string;
  status: 'active' | 'settled' | 'cancelled';
  createdAt: string;
}

export default function PredictionMarketsPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');

  const { data: markets } = useQuery<Market[]>({
    queryKey: ['/api/prediction-markets'],
  });

  const { data: myPositions } = useQuery<Position[]>({
    queryKey: ['/api/prediction-markets/positions', account],
    enabled: !!account,
  });

  const placeBetMutation = useMutation({
    mutationFn: async ({ marketId, outcome, amount }: { marketId: string; outcome: 'yes' | 'no'; amount: string }) => {
      if (!account) throw new Error("Connect wallet to place bet");
      return apiRequest('POST', '/api/prediction-markets/bet', {
        marketId,
        user: account,
        prediction: outcome,
        amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet Placed!",
        description: "Your prediction has been recorded",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets/positions', account] });
      setSelectedMarket(null);
      setBetAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Bet Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const claimWinningsMutation = useMutation({
    mutationFn: async (positionId: string) => {
      return apiRequest('POST', '/api/prediction-markets/claim', {
        positionId,
        user: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Winnings Claimed!",
        description: "Your winnings have been sent to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-markets/positions', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      case 'settled': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateOdds = (yesPool: string, noPool: string, outcome: 'yes' | 'no') => {
    const yes = parseFloat(yesPool);
    const no = parseFloat(noPool);
    const total = yes + no;
    
    if (total === 0) return 50;
    
    if (outcome === 'yes') {
      return ((yes / total) * 100).toFixed(1);
    } else {
      return ((no / total) * 100).toFixed(1);
    }
  };

  const calculatePotentialReturn = (amount: string, yesPool: string, noPool: string, outcome: 'yes' | 'no') => {
    const bet = parseFloat(amount);
    const yes = parseFloat(yesPool);
    const no = parseFloat(noPool);
    const total = yes + no + bet;
    
    if (outcome === 'yes') {
      return (bet * (total / (yes + bet))).toFixed(2);
    } else {
      return (bet * (total / (no + bet))).toFixed(2);
    }
  };

  const activeMarkets = markets?.filter(m => m.status === 'active') || [];
  const resolvedMarkets = markets?.filter(m => m.status === 'resolved') || [];
  
  const totalWagered = myPositions?.reduce((sum, pos) => sum + parseFloat(pos.amount), 0) || 0;
  const totalPnL = myPositions?.reduce((sum, pos) => sum + parseFloat(pos.pnl || '0'), 0) || 0;
  const activePositions = myPositions?.filter(p => p.status === 'active').length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Prediction Markets</h1>
        <p className="text-muted-foreground">Bet on the future with decentralized prediction markets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Wagered</p>
                <p className="text-3xl font-bold" data-testid="text-total-wagered">
                  ${totalWagered.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Positions</p>
                <p className="text-3xl font-bold">{activePositions}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Markets</p>
                <p className="text-3xl font-bold">{activeMarkets.length}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!account ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Prediction Markets</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to start predicting the future
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Markets ({activeMarkets.length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({resolvedMarkets.length})</TabsTrigger>
              <TabsTrigger value="my-positions">My Positions ({myPositions?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeMarkets.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Active Markets</h3>
                    <p className="text-muted-foreground">Check back soon for new prediction opportunities</p>
                  </CardContent>
                </Card>
              ) : (
                activeMarkets.map(market => {
                  const yesOdds = calculateOdds(market.yesPool, market.noPool, 'yes');
                  const noOdds = calculateOdds(market.noPool, market.yesPool, 'no');
                  const totalPool = parseFloat(market.yesPool) + parseFloat(market.noPool);
                  const timeLeft = new Date(market.endDate).getTime() - new Date().getTime();
                  const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));

                  return (
                    <Card key={market.id} data-testid={`market-${market.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{market.category}</Badge>
                              <Badge className={getStatusColor(market.status)}>
                                {market.status}
                              </Badge>
                            </div>
                            <CardTitle className="text-xl mb-2">{market.question}</CardTitle>
                            <CardDescription>{market.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Volume</p>
                            <p className="text-lg font-bold">${totalPool.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Time Left</p>
                            <p className="text-lg font-bold">{daysLeft} days</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="text-lg font-bold">{format(new Date(market.createdAt), 'MMM d')}</p>
                          </div>
                        </div>

                        {/* Odds Display */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-green-600">YES</span>
                              <span className="text-2xl font-bold text-green-600">{yesOdds}%</span>
                            </div>
                            <Progress value={parseFloat(yesOdds)} className="h-2" />
                            <p className="text-sm text-muted-foreground mt-2">Pool: ${market.yesPool}</p>
                          </div>

                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-red-600">NO</span>
                              <span className="text-2xl font-bold text-red-600">{noOdds}%</span>
                            </div>
                            <Progress value={parseFloat(noOdds)} className="h-2" />
                            <p className="text-sm text-muted-foreground mt-2">Pool: ${market.noPool}</p>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full" onClick={() => setSelectedMarket(market)} data-testid={`button-bet-${market.id}`}>
                              <Target className="h-4 w-4 mr-2" />
                              Place Prediction
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Place Your Prediction</DialogTitle>
                              <DialogDescription>
                                {market.question}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Select Outcome</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <Button
                                    variant={selectedOutcome === 'yes' ? 'default' : 'outline'}
                                    className="h-20"
                                    onClick={() => setSelectedOutcome('yes')}
                                    data-testid="button-select-yes"
                                  >
                                    <div className="text-center">
                                      <div className="text-2xl font-bold">YES</div>
                                      <div className="text-sm">{yesOdds}% odds</div>
                                    </div>
                                  </Button>
                                  <Button
                                    variant={selectedOutcome === 'no' ? 'default' : 'outline'}
                                    className="h-20"
                                    onClick={() => setSelectedOutcome('no')}
                                    data-testid="button-select-no"
                                  >
                                    <div className="text-center">
                                      <div className="text-2xl font-bold">NO</div>
                                      <div className="text-sm">{noOdds}% odds</div>
                                    </div>
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="bet-amount">Amount to Bet</Label>
                                <Input
                                  id="bet-amount"
                                  type="number"
                                  placeholder="100"
                                  value={betAmount}
                                  onChange={(e) => setBetAmount(e.target.value)}
                                  data-testid="input-bet-amount"
                                />
                              </div>

                              {betAmount && parseFloat(betAmount) > 0 && (
                                <div className="p-4 bg-muted rounded-lg">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm">Your Bet:</span>
                                      <span className="font-semibold">${betAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm">Current Odds:</span>
                                      <span className="font-semibold">
                                        {selectedOutcome === 'yes' ? yesOdds : noOdds}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm">Potential Return:</span>
                                      <span className="font-bold text-green-600">
                                        ${calculatePotentialReturn(betAmount, market.yesPool, market.noPool, selectedOutcome)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm">Potential Profit:</span>
                                      <span className="font-bold text-lg">
                                        +${(parseFloat(calculatePotentialReturn(betAmount, market.yesPool, market.noPool, selectedOutcome)) - parseFloat(betAmount)).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <Button
                                className="w-full"
                                onClick={() => placeBetMutation.mutate({ marketId: market.id, outcome: selectedOutcome, amount: betAmount })}
                                disabled={!betAmount || parseFloat(betAmount) === 0 || placeBetMutation.isPending}
                                data-testid="button-confirm-bet"
                              >
                                {placeBetMutation.isPending ? 'Placing Bet...' : 'Confirm Prediction'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {resolvedMarkets.map(market => (
                <Card key={market.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{market.category}</Badge>
                          <Badge className={getStatusColor(market.status)}>
                            Resolved: {market.outcome?.toUpperCase()}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{market.question}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Final Volume</p>
                        <p className="font-semibold">${market.totalVolume}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Winning Pool</p>
                        <p className="font-semibold">
                          {market.outcome === 'yes' ? `YES - $${market.yesPool}` : `NO - $${market.noPool}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Resolved</p>
                        <p className="font-semibold">{format(new Date(market.resolutionDate), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="my-positions" className="space-y-4">
              {!myPositions || myPositions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Positions Yet</h3>
                    <p className="text-muted-foreground mb-6">Place your first prediction to get started</p>
                    <Button onClick={() => document.querySelector('[value="active"]')?.click()}>
                      Browse Markets
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myPositions.map(position => {
                  const market = markets?.find(m => m.id === position.marketId);
                  const pnl = parseFloat(position.pnl || '0');
                  const canClaim = position.status === 'active' && market?.status === 'resolved' && market.outcome === position.prediction;

                  return (
                    <Card key={position.id} data-testid={`position-${position.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={position.prediction === 'yes' ? 'bg-green-500' : 'bg-red-500'}>
                                {position.prediction.toUpperCase()}
                              </Badge>
                              <Badge className={getStatusColor(position.status)}>
                                {position.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg">{market?.question}</h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Amount Bet</p>
                            <p className="font-semibold">${position.amount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Shares</p>
                            <p className="font-semibold">{position.shares}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Avg Price</p>
                            <p className="font-semibold">${position.avgPrice}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">P&L</p>
                            <p className={`font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {canClaim && (
                          <Button
                            className="w-full"
                            onClick={() => claimWinningsMutation.mutate(position.id)}
                            disabled={claimWinningsMutation.isPending}
                            data-testid={`button-claim-${position.id}`}
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            Claim Winnings
                          </Button>
                        )}

                        {market?.status === 'resolved' && market.outcome !== position.prediction && (
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">
                              Market resolved: {market.outcome?.toUpperCase()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
