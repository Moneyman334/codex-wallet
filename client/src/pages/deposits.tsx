import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Wallet, ArrowDownToLine } from "lucide-react";
import { SiBitcoin, SiEthereum, SiLitecoin, SiDogecoin, SiSolana } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface WalletAddress {
  blockchain: string;
  symbol: string;
  address: string;
  icon: React.ElementType;
  color: string;
  network?: string;
}

const PLATFORM_WALLETS: WalletAddress[] = [
  {
    blockchain: "Bitcoin",
    symbol: "BTC",
    address: "bc1qvv9wyycejw0prwq5m6m7tdn27hn8dznha28n4v",
    icon: SiBitcoin,
    color: "text-orange-500",
    network: "Bitcoin Mainnet"
  },
  {
    blockchain: "Ethereum",
    symbol: "ETH",
    address: "0x093050017e0374A5777476b3B9Da94244612F980",
    icon: SiEthereum,
    color: "text-blue-500",
    network: "Ethereum Mainnet"
  },
  {
    blockchain: "Solana",
    symbol: "SOL",
    address: "Fq69RNQ1GPLNmm96F85HHQs1gGWGyZTk5aUHgQ1NiZWW",
    icon: SiSolana,
    color: "text-purple-500",
    network: "Solana Mainnet"
  },
  {
    blockchain: "Litecoin",
    symbol: "LTC",
    address: "ltc1qlwfhp7e33n253spqw2fc2a2jzk3n0zw86khwz7",
    icon: SiLitecoin,
    color: "text-gray-400",
    network: "Litecoin Mainnet"
  },
  {
    blockchain: "Dogecoin",
    symbol: "DOGE",
    address: "DS7NZp68a3hicC2V2din2ChtQ8gpVLfHmC",
    icon: SiDogecoin,
    color: "text-yellow-500",
    network: "Dogecoin Mainnet"
  }
];

export default function DepositsPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (address: string, blockchain: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast({
        title: "Address Copied!",
        description: `${blockchain} address copied to clipboard`,
      });
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <ArrowDownToLine className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-deposits-title">Crypto Deposits</h1>
          <p className="text-muted-foreground">Deposit crypto to your platform account</p>
        </div>
      </div>

      <Card className="mb-6 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Multi-Chain Deposit Support
          </CardTitle>
          <CardDescription>
            We accept deposits from 5 major blockchains. Select your preferred network below.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="BTC" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          {PLATFORM_WALLETS.map((wallet) => {
            const Icon = wallet.icon;
            return (
              <TabsTrigger 
                key={wallet.symbol} 
                value={wallet.symbol}
                className="flex items-center gap-2"
                data-testid={`tab-${wallet.symbol.toLowerCase()}`}
              >
                <Icon className={`h-4 w-4 ${wallet.color}`} />
                {wallet.symbol}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PLATFORM_WALLETS.map((wallet) => {
          const Icon = wallet.icon;
          return (
            <TabsContent key={wallet.symbol} value={wallet.symbol} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${wallet.color}`} />
                      {wallet.blockchain} QR Code
                    </CardTitle>
                    <CardDescription>Scan to deposit {wallet.symbol}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg" data-testid={`qr-${wallet.symbol.toLowerCase()}`}>
                      <QRCodeSVG 
                        value={wallet.address}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <Badge className={`mt-4 ${wallet.color} border-current`} variant="outline">
                      {wallet.network}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Address Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Deposit Address</CardTitle>
                    <CardDescription>
                      Send {wallet.symbol} to this address
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg break-all font-mono text-sm">
                      <p data-testid={`address-${wallet.symbol.toLowerCase()}`}>{wallet.address}</p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(wallet.address, wallet.blockchain)}
                      className="w-full"
                      variant={copiedAddress === wallet.address ? "secondary" : "default"}
                      data-testid={`button-copy-${wallet.symbol.toLowerCase()}`}
                    >
                      {copiedAddress === wallet.address ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Address
                        </>
                      )}
                    </Button>

                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-semibold text-sm">Important Notes:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Only send {wallet.symbol} to this address</li>
                        <li>• Minimum deposit: 0.001 {wallet.symbol}</li>
                        <li>• Deposits appear after 3 confirmations</li>
                        <li>• Wrong network = permanent loss of funds</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Deposit Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>How to Deposit {wallet.symbol}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">1</Badge>
                      <span>Copy the {wallet.blockchain} address above or scan the QR code</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                      <span>Open your {wallet.symbol} wallet and initiate a send transaction</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">3</Badge>
                      <span>Paste the address and enter the amount you wish to deposit</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">4</Badge>
                      <span>Confirm the transaction and wait for network confirmations</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">5</Badge>
                      <span>Your platform balance will be credited automatically</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Warning Card */}
      <Card className="mt-6 border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="text-yellow-500">⚠️ Security Warning</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Always verify the deposit address before sending funds</p>
          <p>• Only deposit from networks matching the selected blockchain</p>
          <p>• Smart contract deposits may require additional gas fees</p>
          <p>• We are not responsible for funds sent to wrong addresses or networks</p>
        </CardContent>
      </Card>
    </div>
  );
}
