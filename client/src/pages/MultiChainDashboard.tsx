import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMultiChainWallet } from '@/hooks/useMultiChainWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  ArrowUpDown, 
  TrendingUp, 
  Coins, 
  Shield,
  Zap,
  Globe,
  ChevronRight
} from 'lucide-react';
import { SUPPORTED_CHAINS } from '@shared/blockchain-config';

export default function MultiChainDashboard() {
  const {
    address,
    currentChain,
    supportedChains,
    isConnected,
    connectWallet,
    switchChain,
  } = useMultiChainWallet();

  const [selectedTab, setSelectedTab] = useState('overview');

  // Aggregate portfolio value across all chains
  const { data: portfolioData } = useQuery({
    queryKey: [`/api/portfolio/${address}`],
    enabled: !!address,
  });

  // Get user's multi-chain balances
  const { data: balances } = useQuery({
    queryKey: [`/api/wallets/balances/${address}`],
    enabled: !!address,
  });

  const totalValue = (portfolioData as any)?.totalValue || 0;
  const chainCount = (portfolioData as any)?.activeChains || 0;
  const assetCount = (portfolioData as any)?.totalAssets || 0;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border-purple-500/30">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">
              Welcome to CODEX Wallet
            </CardTitle>
            <CardDescription className="text-lg text-gray-300">
              Your gateway to 13 blockchains, one unified experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-400">13</div>
                <div className="text-sm text-gray-400">Blockchains</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400">$0</div>
                <div className="text-sm text-gray-400">Gas Fees</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">1-Click</div>
                <div className="text-sm text-gray-400">Connect</div>
              </div>
            </div>

            <Button
              onClick={connectWallet}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6"
              data-testid="button-connect-wallet"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet - Start Your Empire
            </Button>

            <p className="text-center text-sm text-gray-400">
              No wallet? No problem! We'll guide you through setup in 30 seconds.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Empire Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Managing {chainCount} chains • {assetCount} assets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Protected
            </Badge>
            {currentChain && (
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                <Zap className="w-3 h-3 mr-1" />
                {currentChain.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${totalValue.toLocaleString()}</div>
              <p className="text-sm text-green-400 mt-1">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                +12.5% (24h)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Active Chains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{chainCount} / 13</div>
              <p className="text-sm text-blue-400 mt-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Multi-chain enabled
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Pending Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">$1,234</div>
              <p className="text-sm text-green-400 mt-1">
                <Coins className="w-4 h-4 inline mr-1" />
                Ready to claim
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="bg-black/40 border border-purple-500/30">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Wallet className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets" data-testid="tab-assets">
            <Coins className="w-4 h-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="chains" data-testid="tab-chains">
            <Globe className="w-4 h-4 mr-2" />
            Chains
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your multi-chain empire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-2 border-purple-500/30 hover:bg-purple-500/20"
                  data-testid="button-send"
                >
                  <ArrowUpDown className="w-6 h-6" />
                  <span>Send</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-2 border-blue-500/30 hover:bg-blue-500/20"
                  data-testid="button-receive"
                >
                  <Wallet className="w-6 h-6" />
                  <span>Receive</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-2 border-green-500/30 hover:bg-green-500/20"
                  data-testid="button-swap"
                >
                  <ArrowUpDown className="w-6 h-6" />
                  <span>Swap</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-2 border-yellow-500/30 hover:bg-yellow-500/20"
                  data-testid="button-bridge"
                >
                  <Globe className="w-6 h-6" />
                  <span>Bridge</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Last 5 cross-chain activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                No recent transactions. Start trading to see your activity here!
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          {(balances as any)?.map((balance: any) => (
            <Card key={balance.id} className="bg-black/40 backdrop-blur-xl border-purple-500/30">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{balance.symbol}</div>
                    <div className="text-sm text-gray-400">{balance.chainName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">{balance.amount}</div>
                  <div className="text-sm text-gray-400">${balance.usdValue}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Chains Tab */}
        <TabsContent value="chains" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportedChains.map((chain) => (
              <Card 
                key={chain.id} 
                className={`bg-black/40 backdrop-blur-xl border-purple-500/30 cursor-pointer transition-all hover:border-purple-500 ${
                  currentChain?.id === chain.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => switchChain(chain)}
                data-testid={`card-chain-${chain.symbol.toLowerCase()}`}
              >
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{chain.name}</div>
                      <div className="text-sm text-gray-400">{chain.symbol}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your cross-chain activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-400">
                <ArrowUpDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activity yet. Make your first transaction!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
