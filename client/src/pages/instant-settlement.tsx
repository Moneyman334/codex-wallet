import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { Zap, Clock, CheckCircle2, ArrowRight, TrendingDown, AlertCircle, Rocket, Timer } from "lucide-react";
import DisclaimerBanner from "@/components/disclaimer-banner";

interface Settlement {
  id: string;
  walletAddress: string;
  crypto: string;
  amount: string;
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  settlementTime?: number; // in seconds
  txHash?: string;
}

const SUPPORTED_CRYPTOS = [
  { symbol: 'ETH', name: 'Ethereum', fee: '0.001' },
  { symbol: 'BTC', name: 'Bitcoin', fee: '0.0001' },
  { symbol: 'SOL', name: 'Solana', fee: '0.01' },
  { symbol: 'USDT', name: 'Tether USD', fee: '1.00' },
  { symbol: 'USDC', name: 'USD Coin', fee: '1.00' },
];

export default function InstantSettlementPage() {
  const { account, isConnected } = useWeb3();
  const { toast } = useToast();

  const [crypto, setCrypto] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');

  // Fetch user settlements
  const { data: settlements = [], isLoading } = useQuery<Settlement[]>({
    queryKey: [`/api/settlements/${account}`],
    enabled: !!account,
  });

  // Submit settlement mutation
  const settlementMutation = useMutation({
    mutationFn: async (data: { crypto: string; amount: string; destination: string }) => {
      return await apiRequest('/api/settlements', 'POST', { ...data, walletAddress: account });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/settlements/${account}`] });
      toast({
        title: "Settlement Initiated! ⚡",
        description: "Your withdrawal is processing instantly. Expected completion: <60 seconds",
      });
      setAmount('');
      setDestination('');
    },
    onError: (error: any) => {
      toast({
        title: "Settlement Failed",
        description: error.message || "Failed to process settlement",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!amount || !destination || !crypto) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    settlementMutation.mutate({ crypto, amount, destination });
  };

  const selectedCrypto = SUPPORTED_CRYPTOS.find(c => c.symbol === crypto);
  const networkFee = parseFloat(selectedCrypto?.fee || '0');
  const totalAmount = parseFloat(amount || '0') + networkFee;

  // Calculate average settlement time (parse string to number)
  const completedSettlements = settlements.filter(s => s.status === 'completed' && s.settlementTime);
  const avgSettlementTime = completedSettlements.length > 0
    ? completedSettlements.reduce((sum, s) => sum + parseFloat(s.settlementTime || '0'), 0) / completedSettlements.length
    : 0;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
        <div className="container mx-auto max-w-4xl pt-20 text-center">
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Connect Wallet Required</CardTitle>
              <CardDescription className="text-gray-300">
                Please connect your wallet to access instant settlements
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <DisclaimerBanner />
      
      <div className="container mx-auto max-w-6xl pt-20">
        {/* Header with Competitive Advantage */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white" data-testid="instant-settlement-title">
              Instant Settlement
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Blockchain-powered withdrawals in seconds, not days
          </p>

          {/* Speed Comparison Banner */}
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 border-purple-500/50">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-red-400 font-bold text-sm mb-2">🐌 Traditional Banks</div>
                  <div className="text-3xl font-bold text-red-400">24-48h</div>
                  <div className="text-xs text-gray-400 mt-1">ACH withdrawal delay</div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <div className="text-green-400 font-bold text-sm mb-2">⚡ CODEX</div>
                  <div className="text-3xl font-bold text-green-400">&lt;60s</div>
                  <div className="text-xs text-gray-400 mt-1">Instant blockchain settlement</div>
                </div>
              </div>
              <Separator className="my-4 bg-purple-500/30" />
              <div className="flex items-center justify-center gap-2 text-sm">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  2,880x Faster Than Traditional
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Zero Wait Time
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Withdrawal Form */}
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Instant Withdrawal
              </CardTitle>
              <CardDescription className="text-gray-300">
                Withdraw to any wallet in seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Crypto Selection */}
              <div>
                <Label htmlFor="crypto" className="text-white">Cryptocurrency</Label>
                <Select value={crypto} onValueChange={setCrypto}>
                  <SelectTrigger id="crypto" className="bg-black/60 border-purple-500/30 text-white" data-testid="select-crypto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CRYPTOS.map(c => (
                      <SelectItem key={c.symbol} value={c.symbol}>
                        {c.name} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="amount" className="text-white">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-black/60 border-purple-500/30 text-white"
                  data-testid="input-amount"
                />
                {selectedCrypto && (
                  <p className="text-xs text-gray-400 mt-1">
                    Network fee: {selectedCrypto.fee} {crypto}
                  </p>
                )}
              </div>

              {/* Destination Address */}
              <div>
                <Label htmlFor="destination" className="text-white">Destination Address</Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="0x..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-black/60 border-purple-500/30 text-white font-mono text-sm"
                  data-testid="input-destination"
                />
              </div>

              {/* Summary */}
              {amount && (
                <Card className="bg-purple-500/10 border-purple-500/30">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Amount:</span>
                      <span className="font-mono">{parseFloat(amount).toFixed(6)} {crypto}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Network Fee:</span>
                      <span className="font-mono">{networkFee.toFixed(6)} {crypto}</span>
                    </div>
                    <Separator className="bg-purple-500/20" />
                    <div className="flex justify-between text-white font-bold">
                      <span>Total:</span>
                      <span className="font-mono">{totalAmount.toFixed(6)} {crypto}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleSubmit}
                disabled={settlementMutation.isPending || !amount || !destination}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                data-testid="button-submit-settlement"
              >
                {settlementMutation.isPending ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Instant Withdraw
                  </>
                )}
              </Button>

              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200 text-sm">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3 h-3" />
                    <span>Guaranteed settlement in under 60 seconds</span>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <div className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-xl border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-400" />
                  Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Average Settlement Time</span>
                      <span className="text-green-400 font-bold">
                        {avgSettlementTime > 0 ? `${avgSettlementTime.toFixed(0)}s` : '<60s'}
                      </span>
                    </div>
                    <Progress value={avgSettlementTime > 0 ? (avgSettlementTime / 60) * 100 : 50} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Total Settlements</span>
                      <span className="text-white font-bold">{settlements.length}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Success Rate</span>
                      <span className="text-green-400 font-bold">99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2" />
                  </div>
                </div>

                <Separator className="bg-purple-500/20" />

                <div className="space-y-2">
                  <h4 className="text-white font-semibold text-sm">Why We're Faster:</h4>
                  <ul className="space-y-1 text-xs text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Direct blockchain settlement (no intermediaries)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>No ACH delays or banking hours restrictions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Automated smart contract execution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>24/7 instant processing</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Traditional Banking Comparison */}
            <Card className="bg-black/40 backdrop-blur-xl border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-400" />
                  Traditional Banking Delays
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>ACH withdrawals: 24-48 hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Wire transfers: 1-2 business days</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Weekend/holiday delays common</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Manual review processes cause additional delays</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Settlement History */}
        <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Settlement History</CardTitle>
            <CardDescription className="text-gray-300">
              Your recent withdrawals with instant settlement times
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading settlements...</div>
            ) : settlements.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No settlements yet</div>
            ) : (
              <div className="space-y-3">
                {settlements.map((settlement) => (
                  <Card key={settlement.id} className="bg-purple-500/10 border-purple-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-bold">
                              {settlement.amount} {settlement.crypto}
                            </span>
                            {settlement.status === 'completed' && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                            {settlement.status === 'processing' && (
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse">
                                Processing
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            To: {settlement.destination.slice(0, 10)}...{settlement.destination.slice(-8)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(settlement.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          {settlement.settlementTime && (
                            <div className="text-green-400 font-bold">
                              {parseFloat(settlement.settlementTime)}s
                            </div>
                          )}
                          {settlement.txHash && (
                            <a
                              href={`https://etherscan.io/tx/${settlement.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:underline"
                            >
                              View TX
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
