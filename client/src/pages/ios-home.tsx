import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  PieChart, 
  History, 
  Bell, 
  Shield, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Scan,
  Share2,
  Globe,
  Smartphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useWeb3 } from '@/hooks/use-web3';
import { useHaptics } from '@/hooks/use-haptics';
import { useClipboard } from '@/hooks/use-clipboard';
import { useShare } from '@/hooks/use-share';
import { useQuery } from '@tanstack/react-query';
import { PullToRefresh } from '@/components/pull-to-refresh';
import { MobileTabBarSpacer } from '@/components/mobile-tab-bar';
import { NativeQRScanner } from '@/components/native-qr-scanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

interface RawPriceData {
  [key: string]: { usd: number; lastUpdated: string };
}

const CRYPTO_NAMES: Record<string, string> = {
  ETH: 'Ethereum',
  BTC: 'Bitcoin',
  USDC: 'USD Coin',
  USDT: 'Tether',
  DAI: 'Dai',
  SOL: 'Solana',
  LTC: 'Litecoin',
  DOGE: 'Dogecoin',
};

export default function IOSHomePage() {
  const { isConnected, account, balance } = useWeb3();
  const { lightImpact, successNotification, mediumImpact } = useHaptics();
  const { writeToClipboard } = useClipboard();
  const { shareWalletAddress } = useShare();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);

  const { data: rawPrices, refetch: refetchPrices } = useQuery<RawPriceData>({
    queryKey: ['/api/prices/top'],
    enabled: true,
    staleTime: 60000,
  });

  // Transform raw price object into array format for display
  const prices: PriceData[] = rawPrices 
    ? Object.entries(rawPrices)
        .filter(([symbol]) => ['eth', 'btc', 'usdc'].includes(symbol.toLowerCase()))
        .map(([symbol, data]) => ({
          symbol: symbol.toUpperCase(),
          name: CRYPTO_NAMES[symbol.toUpperCase()] || symbol.toUpperCase(),
          price: data?.usd || 0,
          change24h: 0, // API doesn't provide 24h change
        }))
    : [
        { symbol: 'ETH', name: 'Ethereum', price: 3450.00, change24h: 2.5 },
        { symbol: 'BTC', name: 'Bitcoin', price: 67500.00, change24h: 1.2 },
        { symbol: 'USDC', name: 'USD Coin', price: 1.00, change24h: 0.01 },
      ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    lightImpact();
    await refetchPrices();
    setIsRefreshing(false);
    successNotification();
  };

  const handleCopyAddress = async () => {
    if (account) {
      await writeToClipboard(account);
      setCopied(true);
      successNotification();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleScan = () => {
    mediumImpact();
    setShowScanner(true);
  };

  const handleScanResult = (result: string) => {
    setScannedAddress(result);
    setShowScanner(false);
  };

  const handleReceive = () => {
    mediumImpact();
    setShowReceive(true);
  };

  const handleShareAddress = async () => {
    if (account) {
      await shareWalletAddress(account);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const quickActions = [
    { icon: Scan, label: 'Scan', action: handleScan, color: 'text-blue-400' },
    { icon: QrCode, label: 'Receive', action: handleReceive, color: 'text-green-400' },
    { icon: PieChart, label: 'Portfolio', path: '/portfolio', color: 'text-purple-400' },
    { icon: Bell, label: 'Alerts', path: '/notifications', color: 'text-yellow-400' },
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-4">
        <div className="container max-w-lg mx-auto px-4 pt-6 space-y-6">
          
          {/* Full Features Banner */}
          <Card className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 border-purple-500/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
            <CardContent className="p-4 relative">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                    Want Full Trading Features?
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Access trading, staking, swaps, bridges, NFT marketplace and more on our web platform or Android app.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a 
                      href="https://getcodexpay.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="button-open-web">
                        <Globe className="h-3 w-3 mr-1.5" />
                        Open Web App
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </Button>
                    </a>
                    <a 
                      href="https://play.google.com/store/apps/details?id=com.omniversesyndicate.codex" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button size="sm" variant="outline" className="h-8 text-xs border-purple-500/50" data-testid="button-get-android">
                        <Smartphone className="h-3 w-3 mr-1.5" />
                        Get Android App
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30 overflow-hidden">
            <CardContent className="p-6">
              {isConnected && account ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Total Balance</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="h-8 w-8 p-0"
                      data-testid="button-refresh-balance"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="text-4xl font-bold mb-2">
                    {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH'}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex-1 bg-background/50 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatAddress(account)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyAddress}
                        className="h-6 w-6 p-0"
                        data-testid="button-copy-address"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <Link href="/wallet">
                      <Button variant="outline" size="sm" className="h-10" data-testid="button-view-qr">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Wallet className="h-12 w-12 mx-auto mb-3 text-purple-400" />
                  <p className="text-lg font-medium mb-2">Connect Your Wallet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    View your balances and track your portfolio
                  </p>
                  <Link href="/wallet">
                    <Button className="w-full" data-testid="button-connect-wallet">
                      Connect Wallet
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(({ icon: Icon, label, path, action, color }) => {
              const CardComponent = (
                <Card 
                  className="bg-background/50 border-border/50 hover:bg-background/80 transition-colors cursor-pointer active:scale-95"
                  onClick={action}
                  data-testid={`card-action-${label.toLowerCase()}`}
                >
                  <CardContent className="p-3 flex flex-col items-center">
                    <div className={`p-2 rounded-lg bg-background mb-2 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{label}</span>
                  </CardContent>
                </Card>
              );

              if (path) {
                return <Link key={label} href={path}>{CardComponent}</Link>;
              }
              return <div key={label}>{CardComponent}</div>;
            })}
          </div>

          {/* Price Tracker */}
          <Card className="bg-background/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Price Tracker</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(prices || [
                { symbol: 'ETH', name: 'Ethereum', price: 3450.00, change24h: 2.5 },
                { symbol: 'BTC', name: 'Bitcoin', price: 67500.00, change24h: 1.2 },
                { symbol: 'USDC', name: 'USD Coin', price: 1.00, change24h: 0.01 },
              ]).map((coin) => (
                <div 
                  key={coin.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{coin.name}</p>
                      <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${coin.price.toLocaleString()}</p>
                    <p className={`text-xs flex items-center gap-1 ${
                      coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {coin.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(coin.change24h).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity Preview */}
          <Card className="bg-background/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Recent Activity</span>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="h-8 text-xs" data-testid="button-view-all-activity">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <ArrowDownLeft className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Received ETH</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                    <p className="text-sm font-medium text-green-400">+0.5 ETH</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sent ETH</p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                    <p className="text-sm font-medium text-blue-400">-0.1 ETH</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Connect wallet to see activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Status */}
          <Link href="/security-center">
            <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30 cursor-pointer hover:bg-green-900/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Security Status</p>
                  <p className="text-xs text-green-400">All systems secure</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

        </div>
        
        <MobileTabBarSpacer />
      </div>

      {/* Native QR Scanner */}
      <NativeQRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanResult}
        title="Scan Wallet Address"
      />

      {/* Scanned Address Dialog */}
      <Dialog open={!!scannedAddress} onOpenChange={() => setScannedAddress(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanned Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted font-mono text-sm break-all">
              {scannedAddress}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (scannedAddress) writeToClipboard(scannedAddress);
                  setScannedAddress(null);
                }}
                className="flex-1"
                data-testid="button-copy-scanned"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={showReceive} onOpenChange={setShowReceive}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Receive Crypto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {account ? (
              <>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(account)}`}
                    alt="Wallet QR Code"
                    className="w-44 h-44"
                  />
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">Your Wallet Address</p>
                  <p className="font-mono text-sm break-all">{account}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleCopyAddress}
                    className="flex-1"
                    data-testid="button-copy-receive"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button 
                    onClick={handleShareAddress}
                    className="flex-1"
                    data-testid="button-share-receive"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Connect your wallet to receive crypto</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PullToRefresh>
  );
}
