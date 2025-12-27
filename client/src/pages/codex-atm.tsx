import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Wallet, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery } from "@tanstack/react-query";
import { ComplianceDisclaimer } from "@/components/ui/compliance-disclaimer";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  decimals: number;
  contractAddress?: string;
}

interface PriceData {
  [key: string]: { usd: number };
}

export default function CodexATMPage() {
  const { toast } = useToast();
  const { 
    isConnected, 
    account, 
    balance, 
    network, 
    connectWallet, 
    tokens,
    isLoadingTokens 
  } = useWeb3();
  
  const [selectedCrypto, setSelectedCrypto] = useState<string>("ETH");

  const { data: prices } = useQuery<PriceData>({
    queryKey: ["/api/prices"],
    refetchInterval: 30000,
  });

  const ethPrice = prices?.ETH?.usd || prices?.ethereum?.usd || 0;
  const ethBalanceNum = parseFloat(balance || "0");
  const ethUsdValue = (ethBalanceNum * ethPrice).toFixed(2);

  const tokenBalances: TokenBalance[] = [
    {
      symbol: network?.symbol || "ETH",
      name: network?.name || "Ethereum",
      balance: balance || "0",
      usdValue: ethUsdValue,
      decimals: 18,
    },
    ...(tokens || []).map((token) => ({
      symbol: token.symbol,
      name: token.name,
      balance: token.balance,
      usdValue: (parseFloat(token.balance) * (prices?.[token.symbol]?.usd || 0)).toFixed(2),
      decimals: token.decimals,
      contractAddress: token.address,
    })),
  ];

  const totalUsdValue = tokenBalances.reduce(
    (sum, token) => sum + parseFloat(token.usdValue || "0"),
    0
  );

  const moonPayApiKey = import.meta.env.VITE_MOONPAY_API_KEY;
  const rampApiKey = import.meta.env.VITE_RAMP_API_KEY;

  const openMoonPayWidget = (cryptoSymbol: string) => {
    setSelectedCrypto(cryptoSymbol);
    
    if (!moonPayApiKey) {
      toast({
        title: "⚠️ Configuration Required",
        description: "Off-ramp API key not configured. Contact admin to enable cash-out.",
        variant: "destructive",
      });
      return;
    }
    
    const moonPayUrl = new URL("https://sell.moonpay.com");
    moonPayUrl.searchParams.set("apiKey", moonPayApiKey);
    moonPayUrl.searchParams.set("baseCurrencyCode", cryptoSymbol.toLowerCase());
    moonPayUrl.searchParams.set("walletAddress", account || "");
    moonPayUrl.searchParams.set("colorCode", "#9945FF");
    moonPayUrl.searchParams.set("theme", "dark");
    
    const newWindow = window.open(moonPayUrl.toString(), "_blank", "noopener,noreferrer,width=500,height=700");
    if (newWindow) newWindow.opener = null;
    
    toast({
      title: "🚀 Opening Cash-Out Widget",
      description: "Complete your withdrawal in the off-ramp provider window",
    });
  };

  const openRampWidget = (cryptoSymbol: string) => {
    if (!rampApiKey) {
      toast({
        title: "⚠️ Configuration Required",
        description: "Off-ramp API key not configured. Contact admin to enable cash-out.",
        variant: "destructive",
      });
      return;
    }
    
    const rampUrl = new URL("https://app.ramp.network/off-ramp");
    rampUrl.searchParams.set("hostApiKey", rampApiKey);
    rampUrl.searchParams.set("swapAsset", cryptoSymbol === "ETH" ? "ETH_ETH" : cryptoSymbol);
    rampUrl.searchParams.set("userAddress", account || "");
    rampUrl.searchParams.set("variant", "hosted-mobile");
    
    const newWindow = window.open(rampUrl.toString(), "_blank", "noopener,noreferrer,width=500,height=700");
    if (newWindow) newWindow.opener = null;
    
    toast({
      title: "🚀 Opening Cash-Out Widget",
      description: "Complete your withdrawal in the off-ramp provider window",
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full bg-slate-900/80 border-yellow-500/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-yellow-500/20 rounded-full w-fit">
              <Wallet className="w-12 h-12 text-yellow-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Connect Your Wallet
            </CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Connect your Web3 wallet to access CODEX ATM. Off-ramp services provided by third-party providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => connectWallet()}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-6 text-lg"
              data-testid="button-connect-wallet"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </Button>
            <p className="text-center text-sm text-gray-500">
              Your real blockchain balances will be displayed
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">
            CODEX ATM
          </h1>
          <p className="text-xl text-gray-300">Crypto-to-fiat conversion via trusted third-party providers</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Connected: {account?.slice(0, 6)}...{account?.slice(-4)}</span>
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              {network?.name || "Ethereum"}
            </Badge>
          </div>
        </div>

        {/* Third-Party Disclaimer */}
        <ComplianceDisclaimer type="thirdParty" />

        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Estimated Portfolio Value</p>
                <p className="text-4xl font-bold text-yellow-400" data-testid="total-balance">
                  ${totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-400 mt-1">Based on current market prices</p>
              </div>
              <div className="text-right">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected Wallet
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cashout" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
            <TabsTrigger value="cashout" data-testid="tab-cashout">Cash Out</TabsTrigger>
            <TabsTrigger value="balances" data-testid="tab-balances">My Balances</TabsTrigger>
          </TabsList>

          <TabsContent value="cashout" className="space-y-4">
            <Card className="bg-slate-900/80 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-yellow-400">Choose Off-Ramp Provider</CardTitle>
                <CardDescription className="text-gray-400">
                  Select a trusted provider to convert your crypto to fiat currency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`bg-slate-800/50 border-purple-500/30 transition-all ${moonPayApiKey ? 'hover:border-purple-500 cursor-pointer' : 'opacity-60'} group`}
                    onClick={() => moonPayApiKey && openMoonPayWidget(selectedCrypto)}
                    data-testid="provider-moonpay"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                          <DollarSign className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-300">Provider 1</h3>
                          <p className="text-sm text-gray-400">Industry-leading off-ramp</p>
                        </div>
                        <Badge className={moonPayApiKey ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                          {moonPayApiKey ? "Ready" : "Setup Required"}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-300">
                          <span>Fees:</span>
                          <span>1-2%</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Payout:</span>
                          <span>Bank, Card</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Time:</span>
                          <span>1-3 business days</span>
                        </div>
                      </div>
                      <Button 
                        className={`w-full mt-4 ${moonPayApiKey ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600'}`}
                        disabled={!moonPayApiKey}
                        data-testid="button-moonpay"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {moonPayApiKey ? 'Cash Out' : 'Not Configured'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`bg-slate-800/50 border-green-500/30 transition-all ${rampApiKey ? 'hover:border-green-500 cursor-pointer' : 'opacity-60'} group`}
                    onClick={() => rampApiKey && openRampWidget(selectedCrypto)}
                    data-testid="provider-ramp"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                          <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white group-hover:text-green-300">Provider 2</h3>
                          <p className="text-sm text-gray-400">Fast global coverage</p>
                        </div>
                        <Badge className={rampApiKey ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                          {rampApiKey ? "Ready" : "Setup Required"}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-300">
                          <span>Fees:</span>
                          <span>0.5-2.5%</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Payout:</span>
                          <span>Bank Transfer</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Time:</span>
                          <span>1-5 business days</span>
                        </div>
                      </div>
                      <Button 
                        className={`w-full mt-4 ${rampApiKey ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600'}`}
                        disabled={!rampApiKey}
                        data-testid="button-ramp"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {rampApiKey ? 'Cash Out' : 'Not Configured'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {!moonPayApiKey && !rampApiKey && (
                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-300">
                        <p className="font-medium text-red-400 mb-1">Off-ramp providers not configured</p>
                        <p className="text-gray-400">
                          To enable crypto-to-fiat cash out, add VITE_MOONPAY_API_KEY or VITE_RAMP_API_KEY to your environment secrets. 
                          Add off-ramp API keys to your environment secrets to enable crypto-to-fiat functionality.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-yellow-500/10 border-yellow-500/30">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300">
                      <p className="font-medium text-yellow-400 mb-1">How it works:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-400">
                        <li>Click on a provider above to open their secure widget</li>
                        <li>Complete identity verification (KYC) if required</li>
                        <li>Send your crypto to the provider's address</li>
                        <li>Receive fiat directly to your bank account</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-4">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-400 flex items-center gap-2">
                  <Wallet className="w-6 h-6" />
                  Your Blockchain Balances
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Live data from your connected wallet on {network?.name || "Ethereum"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTokens ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    <span className="ml-2 text-gray-400">Loading balances...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tokenBalances.map((token) => (
                      <Card 
                        key={token.symbol} 
                        className={`bg-slate-800/50 border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer ${
                          selectedCrypto === token.symbol ? 'border-purple-500 bg-purple-500/10' : ''
                        }`}
                        onClick={() => setSelectedCrypto(token.symbol)}
                        data-testid={`balance-${token.symbol}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/20 rounded-full">
                                <DollarSign className="w-5 h-5 text-purple-400" />
                              </div>
                              <div>
                                <div className="font-bold text-white">{token.symbol}</div>
                                <div className="text-sm text-gray-400">{token.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-white">
                                {parseFloat(token.balance).toFixed(6)} {token.symbol}
                              </div>
                              <div className="text-sm text-green-400">
                                ${parseFloat(token.usdValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {tokenBalances.length === 1 && parseFloat(balance || "0") === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No tokens found in this wallet</p>
                        <p className="text-sm">Deposit some crypto to get started</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-6 text-lg"
                    onClick={() => openMoonPayWidget(selectedCrypto)}
                    disabled={parseFloat(balance || "0") === 0}
                    data-testid="button-cashout-selected"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Cash Out {selectedCrypto}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-slate-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>
                <strong className="text-white">Real blockchain data.</strong> All balances are fetched directly from the {network?.name || "Ethereum"} blockchain via your connected wallet.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
