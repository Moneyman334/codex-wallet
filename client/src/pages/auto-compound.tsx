import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  DollarSign, 
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Target,
  Lock,
  Unlock,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  stakeETH, 
  unstakeETH, 
  fetchUserStake, 
  waitForTransaction, 
  getSepoliaExplorerUrl,
  ensureSepoliaNetwork,
  isContractConfigured,
  getContractAddress
} from "@/lib/stakingClient";

export default function AutoCompoundPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedPool, setSelectedPool] = useState<any>(null);

  const [onChainStaked, setOnChainStaked] = useState<number>(0);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [onChainTxStatus, setOnChainTxStatus] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [customStakeAmount, setCustomStakeAmount] = useState("0.01");

  useEffect(() => {
    async function loadOnChainStake() {
      if (!account || !isContractConfigured()) return;
      try {
        const stake = await fetchUserStake(account);
        setOnChainStaked(stake.amountEth);
      } catch (err) {
        console.error("Failed to fetch on-chain stake:", err);
      }
    }
    loadOnChainStake();
  }, [account]);

  const handleOnChainStake = async () => {
    if (!account) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!isContractConfigured()) {
      toast({
        title: "Contract Not Configured",
        description: "The staking contract address needs to be set. Deploy your contract on Sepolia and update stakingClient.ts",
        variant: "destructive",
      });
      return;
    }

    setOnChainLoading(true);
    setOnChainTxStatus("Switching to Sepolia network...");

    try {
      await ensureSepoliaNetwork();
      setOnChainTxStatus("Sending transaction to blockchain...");

      const hash = await stakeETH(customStakeAmount);
      setLastTxHash(hash);
      setOnChainTxStatus("Waiting for confirmation...");

      const success = await waitForTransaction(hash);

      if (success) {
        const stake = await fetchUserStake(account);
        setOnChainStaked(stake.amountEth);
        setOnChainTxStatus("Stake successful on-chain!");
        toast({
          title: "On-Chain Stake Successful!",
          description: `Successfully staked ${customStakeAmount} ETH on Sepolia`,
        });
      } else {
        setOnChainTxStatus("Transaction failed");
        toast({
          title: "Transaction Failed",
          description: "The transaction was reverted",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("On-chain stake error:", err);
      setOnChainTxStatus(`Error: ${err?.message || "Transaction failed"}`);
      toast({
        title: "Staking Error",
        description: err?.message || "Failed to stake on-chain",
        variant: "destructive",
      });
    } finally {
      setOnChainLoading(false);
    }
  };

  const handleOnChainUnstake = async () => {
    if (!account || onChainStaked <= 0) return;

    setOnChainLoading(true);
    setOnChainTxStatus("Withdrawing from blockchain...");

    try {
      await ensureSepoliaNetwork();
      const hash = await unstakeETH(onChainStaked.toString());
      setLastTxHash(hash);
      setOnChainTxStatus("Waiting for confirmation...");

      const success = await waitForTransaction(hash);

      if (success) {
        const stake = await fetchUserStake(account);
        setOnChainStaked(stake.amountEth);
        setOnChainTxStatus("Withdrawal successful!");
        toast({
          title: "Withdrawal Successful!",
          description: "Your ETH has been withdrawn from the contract",
        });
      }
    } catch (err: any) {
      console.error("On-chain unstake error:", err);
      setOnChainTxStatus(`Error: ${err?.message || "Withdrawal failed"}`);
      toast({
        title: "Withdrawal Error",
        description: err?.message || "Failed to withdraw",
        variant: "destructive",
      });
    } finally {
      setOnChainLoading(false);
    }
  };

  // Fetch pools
  const { data: pools, isLoading: poolsLoading } = useQuery<any[]>({
    queryKey: ['/api/auto-compound/pools'],
  });

  // Fetch user stakes
  const { data: userStakes, isLoading: stakesLoading } = useQuery<any[]>({
    queryKey: ['/api/auto-compound/stakes', account],
    enabled: !!account,
  });

  // Fetch user events
  const { data: userEvents } = useQuery<any[]>({
    queryKey: ['/api/auto-compound/events', account],
    enabled: !!account,
  });

  // Stake mutation
  const stakeMutation = useMutation({
    mutationFn: async ({ poolId, amount }: { poolId: string; amount: string }) => {
      return apiRequest("POST", `/api/auto-compound/pools/${poolId}/stake`, {
        walletAddress: account,
        initialStake: amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-compound/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auto-compound/stakes', account] });
      toast({
        title: "Success!",
        description: "Your stake has been created successfully.",
      });
      setStakeAmount("");
      setSelectedPool(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create stake",
        variant: "destructive",
      });
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      return apiRequest("POST", `/api/auto-compound/stakes/${stakeId}/withdraw`, {
        walletAddress: account
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-compound/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auto-compound/stakes', account] });
      toast({
        title: "Success!",
        description: "Your stake has been withdrawn successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw stake",
        variant: "destructive",
      });
    },
  });

  const handleStake = () => {
    if (!selectedPool || !stakeAmount || !account) return;
    stakeMutation.mutate({ poolId: selectedPool.id, amount: stakeAmount });
  };

  const handleWithdraw = (stakeId: string) => {
    withdrawMutation.mutate(stakeId);
  };

  const calculateProjectedEarnings = (stake: string, apy: string, days: number) => {
    const principal = parseFloat(stake);
    const rate = parseFloat(apy) / 100;
    const time = days / 365;
    // Compound interest formula: A = P(1 + r)^t
    const amount = principal * Math.pow(1 + rate, time);
    return (amount - principal).toFixed(4);
  };

  const totalStaked = userStakes?.reduce((sum: number, s: any) => 
    s.status === 'active' ? sum + parseFloat(s.currentBalance || '0') : sum, 0) || 0;
  
  const totalEarned = userStakes?.reduce((sum: number, s: any) => 
    sum + parseFloat(s.totalEarned || '0'), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 animate-float">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 glow-primary">
              <Zap className="h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]" data-testid="title-auto-compound">
                Auto-Compound Staking
              </h1>
              <p className="text-muted-foreground mt-1">Most efficient staking with automatic compounding</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {account && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="premium-card cosmic-dust border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 glow-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Your Stakes</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-500" data-testid="stat-your-stakes">
                  {totalStaked.toFixed(2)} ETH
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total staked amount</p>
              </CardContent>
            </Card>

            <Card className="premium-card cosmic-dust border-green-500/30 hover:border-green-500/60 transition-all duration-300 glow-secondary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500" data-testid="stat-total-earned">
                  {totalEarned.toFixed(4)} ETH
                </div>
                <p className="text-xs text-muted-foreground mt-1">From compounding</p>
              </CardContent>
            </Card>

            <Card className="premium-card cosmic-dust border-blue-500/30 hover:border-blue-500/60 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Pools</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500" data-testid="stat-active-pools">
                  {pools?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Available for staking</p>
              </CardContent>
            </Card>

            <Card className="premium-card cosmic-dust border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-300 glow-accent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Compounds</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500" data-testid="stat-compounds">
                  {userStakes?.reduce((sum: number, s: any) => sum + parseInt(s.compoundCount || '0'), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total compound events</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Real On-Chain Staking - Sepolia Testnet */}
        <Card className="mb-8 border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" data-testid="card-onchain-staking">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20">
                  <Zap className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Real On-Chain Staking
                    <Badge className="bg-emerald-500">LIVE</Badge>
                    <Badge variant="outline" className="text-xs">Sepolia Testnet</Badge>
                  </CardTitle>
                  <CardDescription>
                    Stake real ETH on the blockchain - not a demo, not fake numbers
                  </CardDescription>
                </div>
              </div>
              {isContractConfigured() ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isContractConfigured() ? (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">Contract Not Deployed Yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Deploy the SimpleStaking contract on Sepolia using Remix, then update the address in <code className="text-xs bg-muted px-1 py-0.5 rounded">client/src/lib/stakingClient.ts</code>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Current address: <code className="bg-muted px-1 py-0.5 rounded">{getContractAddress()}</code>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground mb-1">Your On-Chain Stake</div>
                    <div className="text-3xl font-bold text-emerald-500" data-testid="stat-onchain-staked">
                      {onChainStaked.toFixed(6)} ETH
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Read directly from Sepolia blockchain</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground mb-1">Contract Status</div>
                    <Badge className="bg-emerald-500">Active on Sepolia</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Contract: {getContractAddress().slice(0, 10)}...{getContractAddress().slice(-8)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="stake-amount">Amount to Stake (ETH)</Label>
                    <Input
                      id="stake-amount"
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={customStakeAmount}
                      onChange={(e) => setCustomStakeAmount(e.target.value)}
                      placeholder="0.01"
                      disabled={onChainLoading}
                      data-testid="input-onchain-stake-amount"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={handleOnChainStake}
                      disabled={onChainLoading || !account}
                      className="bg-emerald-500 hover:bg-emerald-600"
                      data-testid="button-onchain-stake"
                    >
                      {onChainLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          Stake {customStakeAmount} ETH
                        </>
                      )}
                    </Button>
                    {onChainStaked > 0 && (
                      <Button
                        onClick={handleOnChainUnstake}
                        disabled={onChainLoading}
                        variant="outline"
                        data-testid="button-onchain-unstake"
                      >
                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                        Withdraw All
                      </Button>
                    )}
                  </div>
                </div>

                {onChainTxStatus && (
                  <div className={`p-3 rounded-lg text-sm ${onChainTxStatus.includes('successful') || onChainTxStatus.includes('Successful') ? 'bg-emerald-500/10 text-emerald-500' : onChainTxStatus.includes('Error') ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {onChainTxStatus}
                  </div>
                )}

                {lastTxHash && (
                  <a
                    href={getSepoliaExplorerUrl(lastTxHash as `0x${string}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-500 hover:underline"
                    data-testid="link-tx-explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View transaction on Sepolia Etherscan
                  </a>
                )}
              </>
            )}

            {!account && (
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-muted-foreground">Connect your wallet to stake on-chain</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="pools" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pools" data-testid="tab-pools">Available Pools</TabsTrigger>
            <TabsTrigger value="stakes" data-testid="tab-stakes">My Stakes</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          </TabsList>

          {/* Available Pools */}
          <TabsContent value="pools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {poolsLoading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading pools...</p>
                </div>
              ) : pools && pools.length > 0 ? (
                pools.map((pool: any) => (
                  <Card 
                    key={pool.id} 
                    className={`glass-strong aurora-border cosmic-dust border-2 border-purple-500/30 hover:border-purple-500 transition-all duration-300 glow-primary cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 ${selectedPool?.id === pool.id ? 'border-purple-500 shadow-xl shadow-purple-500/30' : ''}`}
                    data-testid={`pool-card-${pool.id}`}
                    onClick={() => setSelectedPool(pool)}
                    data-selected={selectedPool?.id === pool.id ? 'true' : 'false'}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl flex items-center gap-2">
                          {pool.name}
                          {selectedPool?.id === pool.id && (
                            <Badge className="bg-green-500">Selected</Badge>
                          )}
                        </CardTitle>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/50">
                          {pool.tokenSymbol}
                        </Badge>
                      </div>
                      <CardDescription>{pool.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* APY */}
                      <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {pool.baseApy}% APY
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">With {pool.compoundFrequency} compounding</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">{pool.totalStakers}</div>
                            <div className="text-xs text-muted-foreground">Stakers</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="font-medium">{parseFloat(pool.totalStaked).toFixed(1)} ETH</div>
                            <div className="text-xs text-muted-foreground">Total Staked</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          <div>
                            <div className="font-medium">{pool.minStake} ETH</div>
                            <div className="text-xs text-muted-foreground">Min Stake</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {parseInt(pool.lockPeriod) > 0 ? (
                            <Lock className="h-4 w-4 text-red-500" />
                          ) : (
                            <Unlock className="h-4 w-4 text-green-500" />
                          )}
                          <div>
                            <div className="font-medium">{pool.lockPeriod} days</div>
                            <div className="text-xs text-muted-foreground">Lock Period</div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Stake Form */}
                      {selectedPool?.id === pool.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label>Amount to Stake</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                type="number"
                                step="0.01"
                                min={pool.minStake}
                                placeholder={`Min ${pool.minStake} ETH`}
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                data-testid={`input-stake-amount-${pool.id}`}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStakeAmount(pool.minStake)}
                                data-testid={`button-min-${pool.id}`}
                              >
                                Min
                              </Button>
                            </div>
                          </div>

                          {stakeAmount && parseFloat(stakeAmount) >= parseFloat(pool.minStake) && (
                            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">30 days:</span>
                                <span className="font-medium text-green-500">
                                  +{calculateProjectedEarnings(stakeAmount, pool.baseApy, 30)} ETH
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">90 days:</span>
                                <span className="font-medium text-green-500">
                                  +{calculateProjectedEarnings(stakeAmount, pool.baseApy, 90)} ETH
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">1 year:</span>
                                <span className="font-medium text-green-500">
                                  +{calculateProjectedEarnings(stakeAmount, pool.baseApy, 365)} ETH
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={handleStake}
                              disabled={!account || !stakeAmount || parseFloat(stakeAmount) < parseFloat(pool.minStake) || stakeMutation.isPending}
                              data-testid={`button-confirm-stake-${pool.id}`}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              {stakeMutation.isPending ? "Staking..." : "Confirm Stake"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPool(null);
                                setStakeAmount("");
                              }}
                              data-testid={`button-cancel-${pool.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPool(pool);
                          }}
                          data-testid={`button-stake-${pool.id}`}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          {selectedPool?.id === pool.id ? 'Selected - Enter Amount Above' : "Select Pool & Stake"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="p-12 text-center">
                    <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-xl text-muted-foreground">No pools available at the moment</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* My Stakes */}
          <TabsContent value="stakes" className="space-y-4">
            {!account ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">Connect your wallet to view your stakes</p>
                </CardContent>
              </Card>
            ) : stakesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading your stakes...</p>
              </div>
            ) : userStakes && userStakes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userStakes.map((stake: any) => {
                  const pool = pools?.find((p: any) => p.id === stake.poolId);
                  const isLocked = stake.unlocksAt && new Date(stake.unlocksAt) > new Date();
                  const daysRemaining = isLocked ? Math.ceil((new Date(stake.unlocksAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

                  return (
                    <Card key={stake.id} className={stake.status === 'withdrawn' ? 'opacity-60' : ''} data-testid={`stake-card-${stake.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {pool?.name || 'Pool'}
                            {stake.status === 'active' ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-500/10 text-gray-500">Withdrawn</Badge>
                            )}
                          </CardTitle>
                          {isLocked && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked {daysRemaining}d
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Initial Stake</div>
                            <div className="text-lg font-bold">{parseFloat(stake.initialStake).toFixed(4)} ETH</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Current Balance</div>
                            <div className="text-lg font-bold text-green-500">{parseFloat(stake.currentBalance).toFixed(4)} ETH</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Total Earned</div>
                            <div className="text-lg font-bold text-purple-500">{parseFloat(stake.totalEarned || '0').toFixed(4)} ETH</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Compounds</div>
                            <div className="text-lg font-bold text-blue-500">{stake.compoundCount || 0}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Effective APY: </span>
                            <span className="font-bold text-purple-500">{stake.effectiveApy}%</span>
                          </div>
                          {stake.status === 'active' && (
                            <Button
                              size="sm"
                              variant={isLocked ? "destructive" : "default"}
                              onClick={() => handleWithdraw(stake.id)}
                              disabled={withdrawMutation.isPending}
                              data-testid={`button-withdraw-${stake.id}`}
                            >
                              <ArrowDownCircle className="h-4 w-4 mr-2" />
                              {isLocked ? `Withdraw (${pool?.earlyWithdrawPenalty}% penalty)` : "Withdraw"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">You don't have any active stakes yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Stake in a pool to start earning compound interest!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-4">
            {!account ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">Connect your wallet to view your history</p>
                </CardContent>
              </Card>
            ) : userEvents && userEvents.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Compound Events</CardTitle>
                  <CardDescription>History of automatic compound operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userEvents.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <div>
                            <div className="font-medium">+{parseFloat(event.rewardAmount).toFixed(6)} ETH</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.compoundedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">Balance</div>
                          <div className="font-medium">{parseFloat(event.balanceAfter).toFixed(4)} ETH</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">No compound events yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Your compound history will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
