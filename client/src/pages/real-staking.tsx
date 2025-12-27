import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAaveStaking } from '@/hooks/useAaveStaking';
import { useBlockchainBalance } from '@/hooks/useBlockchainBalance';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, Shield, ExternalLink } from 'lucide-react';
import { useChainId } from 'wagmi';
import { getBlockExplorerUrl } from '@/lib/blockchain/config';
import { ComplianceDisclaimer } from '@/components/ui/compliance-disclaimer';

export default function RealStakingPage() {
  const { toast } = useToast();
  const chainId = useChainId();
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Track which transaction hashes we've already shown toasts for
  const processedStakeHash = useRef<string | null>(null);
  const processedWithdrawHash = useRef<string | null>(null);

  const {
    stakedBalance,
    apy,
    totalCollateral,
    healthFactor,
    stake,
    withdraw,
    isStaking,
    isWithdrawing,
    isStakeSuccess,
    isWithdrawSuccess,
    stakeHash,
    withdrawHash,
    marketName,
    isMarketAvailable,
  } = useAaveStaking();

  const {
    ethBalance,
    ethFormatted,
    wethBalance,
    isConnected,
    refetchBalances,
  } = useBlockchainBalance();

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to stake',
        variant: 'destructive',
      });
      return;
    }

    try {
      await stake(stakeAmount);
      toast({
        title: 'Staking Transaction Submitted',
        description: 'Your ETH is being staked...',
      });
    } catch (error: any) {
      toast({
        title: 'Staking Failed',
        description: error.message || 'Failed to stake ETH',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to withdraw',
        variant: 'destructive',
      });
      return;
    }

    try {
      await withdraw(withdrawAmount);
      toast({
        title: 'Withdrawal Transaction Submitted',
        description: 'Your ETH is being withdrawn...',
      });
    } catch (error: any) {
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to withdraw ETH',
        variant: 'destructive',
      });
    }
  };

  // Handle stake success - runs only once per transaction
  useEffect(() => {
    if (isStakeSuccess && stakeHash && processedStakeHash.current !== stakeHash) {
      processedStakeHash.current = stakeHash;
      toast({
        title: '✅ Staking Successful!',
        description: (
          <a
            href={getBlockExplorerUrl(chainId, stakeHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 underline"
          >
            View on Block Explorer <ExternalLink className="h-4 w-4" />
          </a>
        ),
      });
      refetchBalances();
      setStakeAmount('');
    }
  }, [isStakeSuccess, stakeHash, chainId, toast, refetchBalances]);

  // Handle withdraw success - runs only once per transaction
  useEffect(() => {
    if (isWithdrawSuccess && withdrawHash && processedWithdrawHash.current !== withdrawHash) {
      processedWithdrawHash.current = withdrawHash;
      toast({
        title: '✅ Withdrawal Successful!',
        description: (
          <a
            href={getBlockExplorerUrl(chainId, withdrawHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 underline"
          >
            View on Block Explorer <ExternalLink className="h-4 w-4" />
          </a>
        ),
      });
      refetchBalances();
      setWithdrawAmount('');
    }
  }, [isWithdrawSuccess, withdrawHash, chainId, toast, refetchBalances]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              DeFi Staking
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Powered by DeFi Lending Protocols - {marketName}
            </p>
          </div>
          <ConnectButton />
        </div>

        {/* Financial Disclaimer */}
        <ComplianceDisclaimer type="financial" />

        {!isConnected ? (
          <Card className="bg-black/90 border-cyan-500/50">
            <CardContent className="p-12 text-center">
              <Wallet className="h-20 w-20 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-3xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to stake ETH. Yields are variable and set by the protocol.
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        ) : !isMarketAvailable ? (
          <Card className="bg-black/90 border-yellow-500/50">
            <CardContent className="p-12 text-center">
              <Shield className="h-20 w-20 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-3xl font-bold mb-2">Unsupported Network</h2>
              <p className="text-muted-foreground">
                Please switch to a supported network (Ethereum, Polygon, Arbitrum, Optimism, Base, or Sepolia Testnet)
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-black/90 border-cyan-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Wallet Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-400">{parseFloat(ethFormatted).toFixed(4)} ETH</div>
                  <p className="text-xs text-muted-foreground mt-1">Available to stake</p>
                </CardContent>
              </Card>

              <Card className="bg-black/90 border-purple-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Staked Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">{parseFloat(stakedBalance).toFixed(4)} ETH</div>
                  <p className="text-xs text-muted-foreground mt-1">Currently staked</p>
                </CardContent>
              </Card>

              <Card className="bg-black/90 border-green-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Current APY</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">{apy.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Annual yield</p>
                </CardContent>
              </Card>

              <Card className="bg-black/90 border-blue-500/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Health Factor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">
                    {healthFactor > 0 ? healthFactor.toFixed(2) : '∞'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Account health</p>
                </CardContent>
              </Card>
            </div>

            {/* Staking Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stake Card */}
              <Card className="bg-black/90 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpCircle className="h-6 w-6 text-cyan-400" />
                    Stake ETH
                  </CardTitle>
                  <CardDescription>
                    Deposit ETH to earn {apy.toFixed(2)}% APY
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Amount to Stake</label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="text-xl"
                      data-testid="input-stake-amount"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStakeAmount((parseFloat(ethBalance) * 0.25).toFixed(4))}
                        data-testid="button-stake-25"
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStakeAmount((parseFloat(ethBalance) * 0.5).toFixed(4))}
                        data-testid="button-stake-50"
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStakeAmount((parseFloat(ethBalance) * 0.75).toFixed(4))}
                        data-testid="button-stake-75"
                      >
                        75%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStakeAmount((parseFloat(ethBalance) * 0.9).toFixed(4))}
                        data-testid="button-stake-max"
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    onClick={handleStake}
                    disabled={isStaking || !stakeAmount}
                    data-testid="button-stake"
                  >
                    {isStaking ? 'Staking...' : 'Stake ETH'}
                  </Button>
                </CardContent>
              </Card>

              {/* Withdraw Card */}
              <Card className="bg-black/90 border-pink-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownCircle className="h-6 w-6 text-pink-400" />
                    Withdraw ETH
                  </CardTitle>
                  <CardDescription>
                    Withdraw your staked ETH plus earned rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Amount to Withdraw</label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="text-xl"
                      data-testid="input-withdraw-amount"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount((parseFloat(stakedBalance) * 0.25).toFixed(4))}
                        data-testid="button-withdraw-25"
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount((parseFloat(stakedBalance) * 0.5).toFixed(4))}
                        data-testid="button-withdraw-50"
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount((parseFloat(stakedBalance) * 0.75).toFixed(4))}
                        data-testid="button-withdraw-75"
                      >
                        75%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(parseFloat(stakedBalance).toFixed(4))}
                        data-testid="button-withdraw-max"
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || !withdrawAmount}
                    data-testid="button-withdraw"
                  >
                    {isWithdrawing ? 'Withdrawing...' : 'Withdraw ETH'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <Card className="bg-black/90 border-purple-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Badge className="mb-2 bg-cyan-500">Step 1</Badge>
                    <h3 className="font-bold mb-1">Stake ETH</h3>
                    <p className="text-sm text-muted-foreground">
                      Deposit your ETH into a DeFi lending pool to start earning real yields
                    </p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-purple-500">Step 2</Badge>
                    <h3 className="font-bold mb-1">Earn Rewards</h3>
                    <p className="text-sm text-muted-foreground">
                      Your ETH automatically earns interest every block. APY updates in real-time based on market conditions
                    </p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-pink-500">Step 3</Badge>
                    <h3 className="font-bold mb-1">Withdraw Anytime</h3>
                    <p className="text-sm text-muted-foreground">
                      Withdraw your staked ETH plus all earned rewards at any time with no lock-up period
                    </p>
                  </div>
                </div>
                <div className="border-t border-purple-500/30 pt-4">
                  <h4 className="font-bold mb-2">💡 Key Benefits:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Real on-chain yields from DeFi protocols (TVL: $10B+)</li>
                    <li>✓ No lock-up periods - withdraw anytime</li>
                    <li>✓ Battle-tested smart contracts with $billions secured</li>
                    <li>✓ Transparent, verifiable transactions on the blockchain</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            {(stakeHash || withdrawHash) && (
              <Card className="bg-black/90 border-purple-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-6 w-6 text-purple-400" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>
                    View your transactions on the blockchain explorer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stakeHash && (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-400">Stake Transaction</p>
                          <p className="text-xs text-muted-foreground">
                            {stakeHash.slice(0, 10)}...{stakeHash.slice(-8)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getBlockExplorerUrl(chainId, stakeHash), '_blank')}
                          data-testid="button-view-stake-tx"
                        >
                          View on Explorer
                        </Button>
                      </div>
                    )}
                    {withdrawHash && (
                      <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/50 rounded-lg">
                        <div>
                          <p className="font-medium text-orange-400">Withdraw Transaction</p>
                          <p className="text-xs text-muted-foreground">
                            {withdrawHash.slice(0, 10)}...{withdrawHash.slice(-8)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getBlockExplorerUrl(chainId, withdrawHash), '_blank')}
                          data-testid="button-view-withdraw-tx"
                        >
                          View on Explorer
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
