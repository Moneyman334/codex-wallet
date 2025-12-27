import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, Globe, CheckCircle, Lock, RefreshCw, Clock, Wallet, Database, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface ProofSnapshot {
  id: string;
  snapshotTime: string;
  totalEthReserves: string;
  totalUserBalances: string;
  reserveRatio: string;
  merkleRoot: string;
  blockNumber: string;
  chainId: string;
  metadata?: any;
}

interface ChainBreakdown {
  chainId: string;
  chainName: string;
  totalReserves: string;
  userBalances: string;
  blockNumber: string;
  platformAddresses: Array<{ address: string; balance: string; label: string }>;
}

interface MultiChainProof {
  totalReserves: string;
  totalUserBalances: string;
  reserveRatio: string;
  chainBreakdown: ProofSnapshot[];
  chainsTracked: number;
  lastUpdated: string;
}

export default function ProofOfReserves() {
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState('1');

  // Fetch latest snapshot
  const { data: snapshot, isLoading: snapshotLoading } = useQuery<ProofSnapshot>({
    queryKey: ['/api/proof-of-reserves/latest', selectedChain],
    queryFn: () => fetch(`/api/proof-of-reserves/latest?chainId=${selectedChain}`).then(r => r.json()),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch multi-chain proof
  const { data: multiChain, isLoading: multiChainLoading } = useQuery<MultiChainProof>({
    queryKey: ['/api/proof-of-reserves/multi-chain'],
    queryFn: () => fetch('/api/proof-of-reserves/multi-chain').then(r => r.json()),
    refetchInterval: 60000,
  });

  // Fetch history
  const { data: history, isLoading: historyLoading } = useQuery<ProofSnapshot[]>({
    queryKey: ['/api/proof-of-reserves/history', selectedChain],
    queryFn: () => fetch(`/api/proof-of-reserves/history?chainId=${selectedChain}&limit=10`).then(r => r.json()),
  });

  // Generate snapshot mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/proof-of-reserves/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chainId: selectedChain }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate proof');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Proof Generated",
        description: "New Proof of Reserves snapshot created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proof-of-reserves/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proof-of-reserves/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proof-of-reserves/multi-chain'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Generation Failed",
        description: error.message || "Failed to generate proof snapshot",
      });
    },
  });

  const formatEth = (wei: string): string => {
    try {
      const eth = Number(wei) / 1e18;
      return eth.toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const formatReserveRatio = (ratio: string): number => {
    try {
      return Number(ratio) * 100; // Convert to percentage
    } catch {
      return 0;
    }
  };

  const getChainName = (chainId: string): string => {
    const names: Record<string, string> = {
      '1': 'Ethereum',
      '11155111': 'Sepolia',
      '137': 'Polygon',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '8453': 'Base',
    };
    return names[chainId] || `Chain ${chainId}`;
  };

  const getReserveStatus = (ratio: number): { color: string; status: string } => {
    if (ratio >= 100) return { color: 'text-green-500', status: 'Fully Backed' };
    if (ratio >= 90) return { color: 'text-yellow-500', status: 'Healthy' };
    if (ratio >= 75) return { color: 'text-orange-500', status: 'Warning' };
    return { color: 'text-red-500', status: 'Critical' };
  };

  const reservePercentage = snapshot ? formatReserveRatio(snapshot.reserveRatio) : 0;
  const { color, status } = getReserveStatus(reservePercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Proof of Reserves
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Real-time blockchain transparency and cryptographic verification
            </p>
          </div>
          
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-generate-proof"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Proof
              </>
            )}
          </Button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Reserves */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-purple-400" />
                Total Reserves
              </CardTitle>
              <CardDescription className="text-slate-400">Platform holdings across all chains</CardDescription>
            </CardHeader>
            <CardContent>
              {multiChainLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-800 rounded mb-2"></div>
                  <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                </div>
              ) : multiChain ? (
                <>
                  <div className="text-3xl font-bold text-white" data-testid="text-total-reserves">
                    {formatEth(multiChain.totalReserves)} ETH
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {multiChain.chainsTracked} chains tracked
                  </div>
                </>
              ) : (
                <div className="text-slate-500">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Reserve Ratio */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Reserve Ratio
              </CardTitle>
              <CardDescription className="text-slate-400">Platform reserves vs user deposits</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshotLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-800 rounded mb-2"></div>
                  <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                </div>
              ) : snapshot ? (
                <>
                  <div className={`text-3xl font-bold ${color}`} data-testid="text-reserve-ratio">
                    {reservePercentage.toFixed(2)}%
                  </div>
                  <Badge 
                    variant={reservePercentage >= 100 ? "default" : "destructive"}
                    className="mt-2"
                  >
                    {status}
                  </Badge>
                  <Progress 
                    value={Math.min(reservePercentage, 100)} 
                    className="mt-3 h-2"
                  />
                </>
              ) : (
                <div className="text-slate-500">No snapshot available</div>
              )}
            </CardContent>
          </Card>

          {/* Last Snapshot */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-blue-400" />
                Last Snapshot
              </CardTitle>
              <CardDescription className="text-slate-400">Most recent proof generation</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshotLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-800 rounded mb-2"></div>
                  <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                </div>
              ) : snapshot ? (
                <>
                  <div className="text-2xl font-bold text-white" data-testid="text-last-snapshot">
                    {formatDistanceToNow(new Date(snapshot.snapshotTime), { addSuffix: true })}
                  </div>
                  <div className="text-sm text-slate-400 mt-2">
                    Block #{snapshot.blockNumber}
                  </div>
                </>
              ) : (
                <div className="text-slate-500">No snapshot available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Views */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Globe className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="chains" data-testid="tab-chains">
              <Wallet className="w-4 h-4 mr-2" />
              Multi-Chain
            </TabsTrigger>
            <TabsTrigger value="verification" data-testid="tab-verification">
              <Lock className="w-4 h-4 mr-2" />
              Verification
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Current Snapshot Details</CardTitle>
                <CardDescription className="text-slate-400">
                  Latest cryptographic proof for {getChainName(selectedChain)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {snapshotLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="animate-pulse flex items-center gap-4">
                        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                        <div className="h-4 bg-slate-800 rounded flex-1"></div>
                      </div>
                    ))}
                  </div>
                ) : snapshot ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Platform Reserves:</span>
                      <span className="font-mono text-white font-semibold">
                        {formatEth(snapshot.totalEthReserves)} ETH
                      </span>
                    </div>
                    <Separator className="bg-slate-800" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">User Deposits:</span>
                      <span className="font-mono text-white font-semibold">
                        {formatEth(snapshot.totalUserBalances)} ETH
                      </span>
                    </div>
                    <Separator className="bg-slate-800" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Merkle Root:</span>
                      <span className="font-mono text-xs text-purple-400 truncate max-w-md">
                        {snapshot.merkleRoot || 'N/A'}
                      </span>
                    </div>
                    <Separator className="bg-slate-800" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Block Number:</span>
                      <span className="font-mono text-white">
                        #{snapshot.blockNumber}
                      </span>
                    </div>
                    <Separator className="bg-slate-800" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Chain ID:</span>
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                        {getChainName(snapshot.chainId)}
                      </Badge>
                    </div>

                    {snapshot.metadata && (
                      <>
                        <Separator className="bg-slate-800" />
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Users Verified:</span>
                          <span className="font-mono text-white">
                            {snapshot.metadata.userCount || 0}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No snapshot available for this chain</p>
                    <Button
                      onClick={() => generateMutation.mutate()}
                      variant="outline"
                      className="mt-4 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                      data-testid="button-generate-first-proof"
                    >
                      Generate First Proof
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historical Snapshots */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Historical Snapshots</CardTitle>
                <CardDescription className="text-slate-400">
                  Previous proof of reserves audits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse h-16 bg-slate-800 rounded"></div>
                    ))}
                  </div>
                ) : history && history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((h, idx) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                        data-testid={`snapshot-history-${idx}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {formatDistanceToNow(new Date(h.snapshotTime), { addSuffix: true })}
                            </div>
                            <div className="text-sm text-slate-400">
                              Block #{h.blockNumber} • Ratio: {(Number(h.reserveRatio) * 100).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No historical data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multi-Chain Tab */}
          <TabsContent value="chains" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Multi-Chain Reserves</CardTitle>
                <CardDescription className="text-slate-400">
                  Aggregated proof across all supported networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {multiChainLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse h-24 bg-slate-800 rounded"></div>
                    ))}
                  </div>
                ) : multiChain && multiChain.chainBreakdown ? (
                  <div className="space-y-4">
                    {multiChain.chainBreakdown.map((chain) => (
                      <div
                        key={chain.id}
                        className="p-4 bg-slate-800/50 rounded-lg space-y-2"
                        data-testid={`chain-${chain.chainId}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-blue-400" />
                            <span className="font-semibold text-white">
                              {getChainName(chain.chainId)}
                            </span>
                          </div>
                          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                            {(Number(chain.reserveRatio) * 100).toFixed(2)}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-slate-400">Reserves</div>
                            <div className="font-mono text-white">
                              {formatEth(chain.totalEthReserves)} ETH
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">User Deposits</div>
                            <div className="font-mono text-white">
                              {formatEth(chain.totalUserBalances)} ETH
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-500">
                          Block #{chain.blockNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No multi-chain data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Cryptographic Verification</CardTitle>
                <CardDescription className="text-slate-400">
                  Verify your balance is included in the Merkle tree
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-start gap-4">
                      <Lock className="w-6 h-6 text-purple-400 mt-1" />
                      <div className="space-y-2">
                        <h3 className="font-semibold text-white">How It Works</h3>
                        <p className="text-sm text-slate-300">
                          Each Proof of Reserves snapshot generates a Merkle tree containing all user balances.
                          You can cryptographically verify that your balance is included without revealing
                          other users' data - ensuring complete transparency and privacy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {snapshot?.metadata?.userCount || 0}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Verified Users
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-400">
                        256-bit
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        SHA-256 Security
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        100%
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Verifiable
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Coming Soon: Self-Service Verification</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2">
                      Connect your wallet to instantly verify your balance inclusion in the latest Merkle tree
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg text-center">
            <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="font-semibold text-white">CCSS Compliant</div>
            <div className="text-xs text-slate-400 mt-1">Industry Standard</div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg text-center">
            <Lock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="font-semibold text-white">SOC 2 Ready</div>
            <div className="text-xs text-slate-400 mt-1">Audit Prepared</div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="font-semibold text-white">Real-Time</div>
            <div className="text-xs text-slate-400 mt-1">Live Blockchain Data</div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg text-center">
            <Database className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <div className="font-semibold text-white">Multi-Chain</div>
            <div className="text-xs text-slate-400 mt-1">6 Networks Tracked</div>
          </div>
        </div>
      </div>
    </div>
  );
}
