import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { useBlockchainBalance } from "@/hooks/useBlockchainBalance";
import { triggerHaptic } from "@/hooks/use-haptics";
import { 
  ArrowRightLeft, 
  Zap, 
  Shield, 
  Clock, 
  Wallet, 
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Activity,
  Lock
} from "lucide-react";
import { Link } from "wouter";

interface Chain {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  nativeToken: string;
  chainId: number;
}

interface Token {
  symbol: string;
  name: string;
  balance: string;
}

interface BridgeProtocol {
  id: string;
  name: string;
  logo: string;
  fee: string;
  estimatedTime: string;
  security: string;
  audited: boolean;
  tvl: string;
  supportedChains: string[];
}

const BRIDGE_PROTOCOLS: BridgeProtocol[] = [
  {
    id: "wormhole",
    name: "Wormhole",
    logo: "🕳️",
    fee: "0.05%",
    estimatedTime: "~15 min",
    security: "Guardian Network",
    audited: true,
    tvl: "$2.4B",
    supportedChains: ["ethereum", "polygon", "arbitrum", "optimism", "base", "bsc", "avalanche", "solana"],
  },
  {
    id: "layerzero",
    name: "LayerZero",
    logo: "⚡",
    fee: "0.08%",
    estimatedTime: "~2-5 min",
    security: "Ultra Light Node",
    audited: true,
    tvl: "$1.8B",
    supportedChains: ["ethereum", "polygon", "arbitrum", "optimism", "base", "bsc", "avalanche"],
  },
  {
    id: "across",
    name: "Across Protocol",
    logo: "🌉",
    fee: "0.04%",
    estimatedTime: "~1-2 min",
    security: "Optimistic Oracle",
    audited: true,
    tvl: "$890M",
    supportedChains: ["ethereum", "polygon", "arbitrum", "optimism", "base"],
  },
  {
    id: "stargate",
    name: "Stargate Finance",
    logo: "⭐",
    fee: "0.06%",
    estimatedTime: "~1 min",
    security: "LayerZero",
    audited: true,
    tvl: "$420M",
    supportedChains: ["ethereum", "polygon", "arbitrum", "optimism", "bsc", "avalanche"],
  },
];

export default function BridgePage() {
  const { account, isConnected } = useWeb3();
  const { toast } = useToast();
  const { ethBalance, ethFormatted } = useBlockchainBalance();
  
  const [fromChain, setFromChain] = useState<string>("ethereum");
  const [toChain, setToChain] = useState<string>("polygon");
  const [amount, setAmount] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("ETH");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("wormhole");
  const [isProcessing, setIsProcessing] = useState(false);

  const chains: Chain[] = [
    { id: "ethereum", name: "Ethereum", symbol: "ETH", logo: "⟠", nativeToken: "ETH", chainId: 1 },
    { id: "polygon", name: "Polygon", symbol: "MATIC", logo: "◆", nativeToken: "MATIC", chainId: 137 },
    { id: "arbitrum", name: "Arbitrum", symbol: "ARB", logo: "🔷", nativeToken: "ETH", chainId: 42161 },
    { id: "optimism", name: "Optimism", symbol: "OP", logo: "🔴", nativeToken: "ETH", chainId: 10 },
    { id: "base", name: "Base", symbol: "BASE", logo: "🔵", nativeToken: "ETH", chainId: 8453 },
    { id: "bsc", name: "BNB Chain", symbol: "BNB", logo: "💎", nativeToken: "BNB", chainId: 56 },
    { id: "avalanche", name: "Avalanche", symbol: "AVAX", logo: "🔺", nativeToken: "AVAX", chainId: 43114 },
  ];

  const tokens: Token[] = [
    { symbol: "ETH", name: "Ethereum", balance: ethFormatted || "0" },
    { symbol: "USDC", name: "USD Coin", balance: "0" },
    { symbol: "USDT", name: "Tether", balance: "0" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "0" },
    { symbol: "DAI", name: "Dai Stablecoin", balance: "0" },
  ];

  const currentProtocol = BRIDGE_PROTOCOLS.find(p => p.id === selectedProtocol);
  const availableProtocols = BRIDGE_PROTOCOLS.filter(p => 
    p.supportedChains.includes(fromChain) && p.supportedChains.includes(toChain)
  );

  useEffect(() => {
    if (availableProtocols.length > 0 && !availableProtocols.find(p => p.id === selectedProtocol)) {
      setSelectedProtocol(availableProtocols[0].id);
    }
  }, [fromChain, toChain, availableProtocols, selectedProtocol]);

  const handleBridge = async () => {
    triggerHaptic('medium');
    
    if (!isConnected) {
      triggerHaptic('error');
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to use the bridge",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      triggerHaptic('error');
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to bridge",
        variant: "destructive",
      });
      return;
    }

    if (fromChain === toChain) {
      triggerHaptic('error');
      toast({
        title: "Same Chain Selected",
        description: "Please select different source and destination chains",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    toast({
      title: "Bridge Transaction Initiated",
      description: `Bridging ${amount} ${selectedToken} via ${currentProtocol?.name} from ${chains.find(c => c.id === fromChain)?.name} to ${chains.find(c => c.id === toChain)?.name}`,
    });

    setTimeout(() => {
      setIsProcessing(false);
      triggerHaptic('success');
      toast({
        title: "Transaction Submitted",
        description: `Your ${selectedToken} is being bridged. Expected arrival: ${currentProtocol?.estimatedTime}`,
      });
    }, 2000);
  };

  const handleFlipChains = () => {
    triggerHaptic('selection');
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  const calculateReceiveAmount = () => {
    if (!amount || parseFloat(amount) <= 0 || !currentProtocol) return "0.00";
    const amountNum = parseFloat(amount);
    const feePercent = parseFloat(currentProtocol.fee) / 100;
    const feeAmount = amountNum * feePercent;
    return (amountNum - feeAmount).toFixed(6);
  };

  const fromChainData = chains.find(c => c.id === fromChain);
  const toChainData = chains.find(c => c.id === toChain);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <ArrowRightLeft className="h-10 w-10 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Cross-Chain Bridge
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Transfer assets securely across 7 blockchain networks using industry-leading protocols
          </p>
        </div>

        {!isConnected && (
          <Card className="border-orange-500/50 bg-orange-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-500 mb-1">Wallet Connection Required</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect your wallet to start bridging assets across chains
                  </p>
                  <Link href="/wallet-nexus">
                    <Button variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500/10" data-testid="button-connect-wallet">
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Fast Transfers</div>
                  <div className="text-sm text-muted-foreground">1-15 minutes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold">Audited Protocols</div>
                  <div className="text-sm text-muted-foreground">Battle-tested</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold">$5.5B+ TVL</div>
                  <div className="text-sm text-muted-foreground">Combined protocols</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Lock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="font-semibold">Non-Custodial</div>
                  <div className="text-sm text-muted-foreground">Your keys</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Bridge Assets</CardTitle>
              <CardDescription>
                Select chains, token, and bridge protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>From Chain</Label>
                  <Select value={fromChain} onValueChange={setFromChain}>
                    <SelectTrigger data-testid="select-from-chain">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{chain.logo}</span>
                            <span>{chain.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>To Chain</Label>
                  <Select value={toChain} onValueChange={setToChain}>
                    <SelectTrigger data-testid="select-to-chain">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{chain.logo}</span>
                            <span>{chain.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFlipChains}
                  className="rounded-full"
                  data-testid="button-flip-chains"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Token</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger data-testid="select-token">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{token.symbol}</span>
                            <span className="text-sm text-muted-foreground ml-2">{token.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Amount</Label>
                    {isConnected && selectedToken === "ETH" && (
                      <span className="text-sm text-muted-foreground">
                        Balance: {ethFormatted || "0"} ETH
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-20"
                      data-testid="input-amount"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1"
                      onClick={() => {
                        if (selectedToken === "ETH" && ethFormatted) {
                          setAmount(ethFormatted);
                        }
                      }}
                      data-testid="button-max"
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && fromChain !== toChain && currentProtocol && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="font-semibold">{calculateReceiveAmount()} {selectedToken}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Protocol Fee ({currentProtocol.fee}):</span>
                      <span>{(parseFloat(amount) * parseFloat(currentProtocol.fee) / 100).toFixed(6)} {selectedToken}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Estimated Time:
                      </span>
                      <span>{currentProtocol.estimatedTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bridge Protocol:</span>
                      <span className="flex items-center gap-1">
                        {currentProtocol.logo} {currentProtocol.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleBridge}
                disabled={!isConnected || !amount || parseFloat(amount) <= 0 || fromChain === toChain || isProcessing}
                className="w-full"
                size="lg"
                data-testid="button-bridge"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {!isConnected ? "Connect Wallet" : fromChain === toChain ? "Select Different Chains" : `Bridge via ${currentProtocol?.name}`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Select Protocol
              </CardTitle>
              <CardDescription>Choose your preferred bridge</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedProtocol} onValueChange={setSelectedProtocol} className="space-y-3">
                {availableProtocols.map((protocol) => (
                  <div key={protocol.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={protocol.id} id={protocol.id} className="mt-1" />
                    <Label htmlFor={protocol.id} className="flex-1 cursor-pointer">
                      <div className={`p-3 rounded-lg border transition-colors ${selectedProtocol === protocol.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{protocol.logo}</span>
                          <span className="font-semibold">{protocol.name}</span>
                          {protocol.audited && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Audited
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Fee: <span className="text-foreground">{protocol.fee}</span></div>
                          <div>Time: <span className="text-foreground">{protocol.estimatedTime}</span></div>
                          <div>Security: <span className="text-foreground">{protocol.security}</span></div>
                          <div>TVL: <span className="text-foreground">{protocol.tvl}</span></div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {availableProtocols.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No protocols support this route</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-500/10 p-4 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
          <p>
            All bridges use non-custodial smart contracts audited by leading security firms. Your tokens will arrive at the same wallet address on the destination chain. Ensure you have gas tokens on the destination chain.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supported Networks</CardTitle>
            <CardDescription>Bridge assets across these major blockchain networks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <span className="text-2xl">{chain.logo}</span>
                  <div>
                    <div className="font-semibold">{chain.name}</div>
                    <div className="text-xs text-muted-foreground">Chain ID: {chain.chainId}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
