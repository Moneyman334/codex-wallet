import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrendingUp, Lock, Unlock, Calculator, DollarSign, Clock, Zap, Award } from "lucide-react";

interface StakingPool {
  id: string;
  name: string;
  token: string;
  apy: number;
  tvl: string;
  lockPeriod: number;
  minStake: string;
  maxStake?: string;
  active: boolean;
}

interface UserStake {
  id: string;
  poolId: string;
  amount: string;
  startDate: string;
  lockEnd: string;
  rewardsEarned: string;
  status: 'active' | 'unlocked' | 'withdrawn';
}

export default function StakingPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [calculatorAmount, setCalculatorAmount] = useState(1000);
  const [calculatorDays, setCalculatorDays] = useState(365);

  const { data: pools } = useQuery<StakingPool[]>({
    queryKey: ['/api/staking/pools'],
  });

  const { data: userStakes } = useQuery<UserStake[]>({
    queryKey: ['/api/staking/my-stakes', account],
    enabled: !!account,
  });

  const stakeMutation = useMutation({
    mutationFn: async ({ poolId, amount }: { poolId: string; amount: string }) => {
      if (!account) throw new Error("Connect wallet to stake");
      return apiRequest('POST', '/api/staking/stake', {
        poolId,
        wallet: account,
        amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Staking Successful!",
        description: "Your tokens have been staked and are earning rewards",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staking/my-stakes', account] });
      setStakeAmount("");
      setSelectedPool(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Staking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unstakeMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      return apiRequest('POST', '/api/staking/unstake', {
        stakeId,
        wallet: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Unstaked Successfully!",
        description: "Your tokens and rewards have been returned to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staking/my-stakes', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Unstaking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const claimRewardsMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      return apiRequest('POST', '/api/staking/claim-rewards', {
        stakeId,
        wallet: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Rewards Claimed!",
        description: "Your staking rewards have been sent to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staking/my-stakes', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate rewards
  const calculateRewards = (amount: number, apy: number, days: number) => {
    const yearlyReturn = amount * (apy / 100);
    const dailyReturn = yearlyReturn / 365;
    return dailyReturn * days;
  };

  const calculatedRewards = selectedPool
    ? calculateRewards(parseFloat(stakeAmount || "0"), selectedPool.apy, selectedPool.lockPeriod)
    : 0;

  const calculatorRewards = calculatorAmount && pools?.length
    ? calculateRewards(calculatorAmount, pools[0].apy, calculatorDays)
    : 0;

  // Stats
  const totalStaked = userStakes?.reduce((sum, stake) => 
    stake.status === 'active' ? sum + parseFloat(stake.amount) : sum, 0
  ) || 0;

  const totalRewards = userStakes?.reduce((sum, stake) => 
    sum + parseFloat(stake.rewardsEarned), 0
  ) || 0;

  const activeStakes = userStakes?.filter(s => s.status === 'active').length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Staking Rewards</h1>
        <p className="text-muted-foreground">Stake your tokens and earn passive rewards</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staked</p>
                <p className="text-3xl font-bold">${totalStaked.toFixed(2)}</p>
              </div>
              <Lock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rewards</p>
                <p className="text-3xl font-bold">${totalRewards.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Stakes</p>
                <p className="text-3xl font-bold">{activeStakes}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg APY</p>
                <p className="text-3xl font-bold">
                  {pools && pools.length > 0
                    ? (pools.reduce((sum, p) => sum + p.apy, 0) / pools.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pools" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pools">Staking Pools</TabsTrigger>
          <TabsTrigger value="my-stakes">My Stakes</TabsTrigger>
          <TabsTrigger value="calculator">APY Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {pools?.filter(p => p.active).map(pool => (
              <Card key={pool.id} data-testid={`pool-${pool.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{pool.name}</CardTitle>
                      <CardDescription>{pool.token} Staking</CardDescription>
                    </div>
                    <Badge className="text-lg px-3 py-1 bg-green-500">
                      {pool.apy}% APY
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">TVL</p>
                      <p className="text-lg font-bold">${pool.tvl}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lock Period</p>
                      <p className="text-lg font-bold">{pool.lockPeriod} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Min Stake</p>
                      <p className="text-lg font-bold">{pool.minStake} {pool.token}</p>
                    </div>
                    {pool.maxStake && (
                      <div>
                        <p className="text-sm text-muted-foreground">Max Stake</p>
                        <p className="text-lg font-bold">{pool.maxStake} {pool.token}</p>
                      </div>
                    )}
                  </div>

                  {selectedPool?.id === pool.id ? (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="stake-amount">Amount to Stake</Label>
                        <Input
                          id="stake-amount"
                          type="number"
                          placeholder="0.0"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          data-testid="input-stake-amount"
                        />
                        <p className="text-sm text-muted-foreground">
                          Min: {pool.minStake} {pool.token}
                        </p>
                      </div>

                      {parseFloat(stakeAmount || "0") > 0 && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Estimated Rewards</p>
                          <p className="text-2xl font-bold">
                            {calculatedRewards.toFixed(4)} {pool.token}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            After {pool.lockPeriod} days
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => stakeMutation.mutate({ poolId: pool.id, amount: stakeAmount })}
                          disabled={!stakeAmount || parseFloat(stakeAmount) < parseFloat(pool.minStake) || stakeMutation.isPending}
                          data-testid="button-stake"
                        >
                          {stakeMutation.isPending ? 'Staking...' : 'Stake Now'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedPool(null);
                            setStakeAmount("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => setSelectedPool(pool)}
                      disabled={!account}
                      data-testid={`button-select-${pool.id}`}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {account ? 'Stake Tokens' : 'Connect Wallet'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-stakes" className="space-y-6">
          {!account ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">
                  Connect your wallet to view your stakes
                </p>
              </CardContent>
            </Card>
          ) : !userStakes || userStakes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No Active Stakes</h3>
                <p className="text-muted-foreground mb-6">Start staking to earn passive rewards</p>
                <Button onClick={() => (document.querySelector('[value="pools"]') as HTMLElement)?.click()}>
                  Browse Pools
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userStakes.map(stake => {
                const pool = pools?.find(p => p.id === stake.poolId);
                const isUnlocked = new Date(stake.lockEnd) <= new Date();
                const daysRemaining = Math.max(0, Math.ceil((new Date(stake.lockEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                const lockProgress = pool ? ((pool.lockPeriod - daysRemaining) / pool.lockPeriod) * 100 : 0;

                return (
                  <Card key={stake.id} data-testid={`stake-${stake.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{pool?.name || 'Staking Pool'}</h3>
                          <p className="text-sm text-muted-foreground">{pool?.token} Staking</p>
                        </div>
                        <Badge variant={isUnlocked ? 'default' : 'secondary'}>
                          {isUnlocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                          {stake.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Staked Amount</p>
                          <p className="text-lg font-bold">{stake.amount} {pool?.token}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rewards Earned</p>
                          <p className="text-lg font-bold text-green-600">{stake.rewardsEarned} {pool?.token}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{isUnlocked ? 'Unlocked' : 'Days Remaining'}</p>
                          <p className="text-lg font-bold">{isUnlocked ? '✓' : daysRemaining}</p>
                        </div>
                      </div>

                      {!isUnlocked && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Lock Progress</span>
                            <span>{lockProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={lockProgress} />
                        </div>
                      )}

                      <div className="flex gap-2">
                        {isUnlocked && stake.status === 'active' && (
                          <>
                            <Button
                              onClick={() => unstakeMutation.mutate(stake.id)}
                              disabled={unstakeMutation.isPending}
                              data-testid={`button-unstake-${stake.id}`}
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Unstake
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => claimRewardsMutation.mutate(stake.id)}
                              disabled={claimRewardsMutation.isPending}
                              data-testid={`button-claim-${stake.id}`}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Claim Rewards
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                Staking Calculator
              </CardTitle>
              <CardDescription>Estimate your potential staking rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Stake Amount (USD)</Label>
                  <Input
                    type="number"
                    value={calculatorAmount}
                    onChange={(e) => setCalculatorAmount(parseFloat(e.target.value) || 0)}
                    data-testid="input-calculator-amount"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Lock Period (Days)</Label>
                    <span className="text-sm font-medium">{calculatorDays} days</span>
                  </div>
                  <Slider
                    value={[calculatorDays]}
                    onValueChange={([value]) => setCalculatorDays(value)}
                    min={1}
                    max={365}
                    step={1}
                    data-testid="slider-calculator-days"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">APY Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pools && pools.length > 0 ? pools[0].apy : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Rewards</p>
                  <p className="text-2xl font-bold">${calculatorRewards.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Initial Stake:</span>
                  <span className="font-semibold">${calculatorAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rewards:</span>
                  <span className="font-semibold text-green-600">+${calculatorRewards.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total After {calculatorDays} days:</span>
                  <span className="font-bold">${(calculatorAmount + calculatorRewards).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
