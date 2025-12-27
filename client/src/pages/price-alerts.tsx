import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocalNotifications } from "@/hooks/use-local-notifications";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Bell, 
  BellRing, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  RefreshCw,
  Target,
  Zap,
  AlertTriangle,
  Check,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  currentPrice: number;
  triggered: boolean;
  enabled: boolean;
  createdAt: string;
}

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

const SUPPORTED_CRYPTOS: CryptoPrice[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 0, change24h: 0, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 0, change24h: 0, icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', price: 0, change24h: 0, icon: '◎' },
  { symbol: 'MATIC', name: 'Polygon', price: 0, change24h: 0, icon: '◆' },
  { symbol: 'ARB', name: 'Arbitrum', price: 0, change24h: 0, icon: '🔷' },
  { symbol: 'OP', name: 'Optimism', price: 0, change24h: 0, icon: '🔴' },
  { symbol: 'AVAX', name: 'Avalanche', price: 0, change24h: 0, icon: '🔺' },
  { symbol: 'BNB', name: 'BNB Chain', price: 0, change24h: 0, icon: '💎' },
];

export default function PriceAlertsPage() {
  const { toast } = useToast();
  const { permission, requestPermission, schedulePriceAlert } = useLocalNotifications();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');
  const [prices, setPrices] = useState<Record<string, number>>({});

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<PriceAlert[]>({
    queryKey: ['/api/price-alerts'],
  });

  const { data: livePrices, isLoading: pricesLoading } = useQuery<Record<string, { usd: number; usd_24h_change: number }>>({
    queryKey: ['/api/crypto/prices'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (livePrices) {
      const priceMap: Record<string, number> = {};
      Object.entries(livePrices).forEach(([key, value]) => {
        priceMap[key.toUpperCase()] = value.usd;
      });
      setPrices(priceMap);
    }
  }, [livePrices]);

  const createAlertMutation = useMutation({
    mutationFn: async (data: { symbol: string; targetPrice: number; direction: 'above' | 'below' }) => {
      return await apiRequest('POST', '/api/price-alerts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-alerts'] });
      setIsAddDialogOpen(false);
      setTargetPrice('');
      toast({
        title: "Alert Created",
        description: `Price alert for ${selectedCrypto} has been set.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to Create Alert",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest('DELETE', `/api/price-alerts/${alertId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-alerts'] });
      toast({
        title: "Alert Deleted",
        description: "Price alert has been removed.",
      });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ alertId, enabled }: { alertId: string; enabled: boolean }) => {
      return await apiRequest('PATCH', `/api/price-alerts/${alertId}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-alerts'] });
    },
  });

  const handleCreateAlert = () => {
    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid target price.",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate({
      symbol: selectedCrypto,
      targetPrice: parseFloat(targetPrice),
      direction: alertDirection,
    });
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Notifications Enabled",
        description: "You'll receive push notifications for price alerts.",
      });
    } else {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your device settings.",
        variant: "destructive",
      });
    }
  };

  const getCurrentPrice = (symbol: string): number => {
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'MATIC': 'matic-network',
      'ARB': 'arbitrum',
      'OP': 'optimism',
      'AVAX': 'avalanche-2',
      'BNB': 'binancecoin',
    };
    return prices[symbolMap[symbol]?.toUpperCase()] || livePrices?.[symbolMap[symbol]]?.usd || 0;
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const getAlertStatus = (alert: PriceAlert): 'triggered' | 'close' | 'active' => {
    if (alert.triggered) return 'triggered';
    const currentPrice = getCurrentPrice(alert.symbol);
    const diff = Math.abs(currentPrice - alert.targetPrice) / alert.targetPrice;
    if (diff < 0.05) return 'close';
    return 'active';
  };

  const activeAlerts = alerts.filter(a => !a.triggered && a.enabled);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <BellRing className="h-10 w-10 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Price Alerts
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Get notified when crypto prices hit your targets
          </p>
        </div>

        {!permission.granted && permission.isNative && (
          <Card className="border-orange-500/50 bg-orange-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-500 mb-1">Enable Push Notifications</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get instant alerts when prices hit your targets
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    onClick={handleEnableNotifications}
                    data-testid="button-enable-notifications"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Enable Notifications
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{activeAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{triggeredAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Triggered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">30s</p>
              <p className="text-sm text-muted-foreground">Update Interval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{permission.granted ? 'On' : 'Off'}</p>
              <p className="text-sm text-muted-foreground">Notifications</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Alerts</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchAlerts()}
              data-testid="button-refresh-alerts"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-alert">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Price Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Cryptocurrency</Label>
                    <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                      <SelectTrigger data-testid="select-crypto">
                        <SelectValue placeholder="Select crypto" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CRYPTOS.map(crypto => (
                          <SelectItem key={crypto.symbol} value={crypto.symbol}>
                            <span className="flex items-center gap-2">
                              <span>{crypto.icon}</span>
                              <span>{crypto.name} ({crypto.symbol})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-xl font-bold">{formatPrice(getCurrentPrice(selectedCrypto))}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Alert Direction</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={alertDirection === 'above' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setAlertDirection('above')}
                        data-testid="button-direction-above"
                      >
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Above
                      </Button>
                      <Button
                        type="button"
                        variant={alertDirection === 'below' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setAlertDirection('below')}
                        data-testid="button-direction-below"
                      >
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Below
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Price (USD)</Label>
                    <Input
                      type="number"
                      placeholder="Enter target price"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      data-testid="input-target-price"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAlert}
                    disabled={createAlertMutation.isPending}
                    data-testid="button-create-alert"
                  >
                    {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {alertsLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Price Alerts</h3>
              <p className="text-muted-foreground mb-4">
                Create your first alert to get notified when prices hit your targets
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-create-first-alert">
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const status = getAlertStatus(alert);
              const currentPrice = getCurrentPrice(alert.symbol);
              const priceDiff = ((currentPrice - alert.targetPrice) / alert.targetPrice) * 100;
              const crypto = SUPPORTED_CRYPTOS.find(c => c.symbol === alert.symbol);
              
              return (
                <Card 
                  key={alert.id} 
                  className={`transition-all ${
                    status === 'triggered' ? 'border-green-500/50 bg-green-500/5' :
                    status === 'close' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                  }`}
                  data-testid={`alert-card-${alert.id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{crypto?.icon || '🪙'}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{alert.symbol}</h3>
                            <Badge variant={status === 'triggered' ? 'default' : status === 'close' ? 'secondary' : 'outline'}>
                              {status === 'triggered' ? (
                                <><Check className="h-3 w-3 mr-1" /> Triggered</>
                              ) : status === 'close' ? (
                                <><Zap className="h-3 w-3 mr-1" /> Close</>
                              ) : (
                                'Active'
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {alert.direction === 'above' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span>
                              Alert when {alert.direction} {formatPrice(alert.targetPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Current Price</p>
                          <p className="text-lg font-bold">{formatPrice(currentPrice)}</p>
                          <p className={`text-xs ${priceDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(2)}% from target
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.enabled}
                            onCheckedChange={(enabled) => toggleAlertMutation.mutate({ alertId: alert.id, enabled })}
                            data-testid={`switch-alert-${alert.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAlertMutation.mutate(alert.id)}
                            data-testid={`button-delete-alert-${alert.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Live Price Feed
            </CardTitle>
            <CardDescription>Real-time prices updated every 30 seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SUPPORTED_CRYPTOS.map(crypto => {
                const price = getCurrentPrice(crypto.symbol);
                const change = livePrices?.[crypto.symbol.toLowerCase()]?.usd_24h_change || 0;
                return (
                  <div 
                    key={crypto.symbol}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedCrypto(crypto.symbol);
                      setIsAddDialogOpen(true);
                    }}
                    data-testid={`price-card-${crypto.symbol}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{crypto.icon}</span>
                      <span className="font-medium">{crypto.symbol}</span>
                    </div>
                    <p className="font-bold">{price > 0 ? formatPrice(price) : 'Loading...'}</p>
                    {change !== 0 && (
                      <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
