import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useAnalytics, usePageTracking } from "@/hooks/use-analytics";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, TrendingUp, Shield, Monitor, Star, Trash2, Code, AlertTriangle, Fingerprint } from "lucide-react";
import { BiometricSettings } from "@/components/biometric-settings";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface DBUserPreferences {
  id: string;
  userId: string;
  autoLoginEnabled: string;
  autoConnectEnabled: string;
  lastWalletId: string | null;
  createdAt: string;
  updatedAt: string;
}

const tradingPairs = [
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'MATIC-USD', 
  'LINK-USD', 'UNI-USD', 'AAVE-USD', 'ATOM-USD'
];

export default function Settings() {
  const { preferences, updateTradingPreferences, updateDisplayPreferences, updateSecurityPreferences, resetPreferences, addFavoritePair, removeFavoritePair } = useUserPreferences();
  const { trackAction, getInsights, clearAnalytics } = useAnalytics();
  const { toast } = useToast();
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const insights = getInsights();

  // Fetch API-backed user preferences
  const { data: dbPreferences } = useQuery<DBUserPreferences>({
    queryKey: ['/api/preferences'],
  });

  // Mutation to update API-backed preferences
  const updateDBPreferences = useMutation({
    mutationFn: async (updates: Partial<DBUserPreferences>) => {
      const response = await apiRequest('PATCH', '/api/preferences', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
      toast({
        title: "Preferences Updated",
        description: "Your development preferences have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const handleResetPreferences = () => {
    resetPreferences();
    trackAction('reset_preferences', 'settings');
    toast({
      title: "Preferences Reset",
      description: "All preferences have been restored to defaults",
    });
  };

  const handleClearAnalytics = () => {
    clearAnalytics();
    trackAction('clear_analytics', 'settings');
    toast({
      title: "Analytics Cleared",
      description: "All analytics data has been cleared",
    });
  };

  const toggleFavoritePair = (pair: string) => {
    if (preferences.trading.favoritePairs.includes(pair)) {
      removeFavoritePair(pair);
      trackAction('remove_favorite_pair', 'trading', { pair });
    } else {
      addFavoritePair(pair);
      trackAction('add_favorite_pair', 'trading', { pair });
    }
  };

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest('DELETE', '/api/auth/account', { password });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted",
      });
      // Redirect to home page
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-blue-950 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-purple-500/20 backdrop-blur-sm border border-purple-500/20">
            <SettingsIcon className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Settings & Preferences
            </h1>
            <p className="text-gray-400 mt-1">Customize your CODEX experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trading Preferences */}
          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-trading-preferences">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <CardTitle className="text-white">Trading Preferences</CardTitle>
              </div>
              <CardDescription>Configure your default trading settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-pair" className="text-gray-200">Default Trading Pair</Label>
                <Select
                  value={preferences.trading.defaultTradingPair}
                  onValueChange={(value) => {
                    updateTradingPreferences({ defaultTradingPair: value });
                    trackAction('change_default_pair', 'trading', { pair: value });
                  }}
                >
                  <SelectTrigger id="default-pair" className="bg-slate-800 border-purple-500/20" data-testid="select-default-pair">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingPairs.map(pair => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-order-type" className="text-gray-200">Default Order Type</Label>
                <Select
                  value={preferences.trading.defaultOrderType}
                  onValueChange={(value: any) => {
                    updateTradingPreferences({ defaultOrderType: value });
                    trackAction('change_order_type', 'trading', { type: value });
                  }}
                >
                  <SelectTrigger id="default-order-type" className="bg-slate-800 border-purple-500/20" data-testid="select-default-order-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop_loss">Stop Loss</SelectItem>
                    <SelectItem value="take_profit">Take Profit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-purple-500/20" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-200">Sound Effects</Label>
                  <p className="text-sm text-gray-400">Play sounds on order execution</p>
                </div>
                <Switch
                  checked={preferences.trading.soundEnabled}
                  onCheckedChange={(checked) => updateTradingPreferences({ soundEnabled: checked })}
                  data-testid="switch-sound-enabled"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-200">Confirm Transactions</Label>
                  <p className="text-sm text-gray-400">Ask before placing orders</p>
                </div>
                <Switch
                  checked={preferences.trading.confirmTransactions}
                  onCheckedChange={(checked) => updateTradingPreferences({ confirmTransactions: checked })}
                  data-testid="switch-confirm-transactions"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-200">Price Alerts</Label>
                  <p className="text-sm text-gray-400">Enable price notifications</p>
                </div>
                <Switch
                  checked={preferences.trading.priceAlerts}
                  onCheckedChange={(checked) => updateTradingPreferences({ priceAlerts: checked })}
                  data-testid="switch-price-alerts"
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-display-preferences">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white">Display Settings</CardTitle>
              </div>
              <CardDescription>Customize your viewing experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="chart-type" className="text-gray-200">Chart Type</Label>
                <Select
                  value={preferences.display.chartType}
                  onValueChange={(value: any) => updateDisplayPreferences({ chartType: value })}
                >
                  <SelectTrigger id="chart-type" className="bg-slate-800 border-purple-500/20" data-testid="select-chart-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="candle">Candlestick</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh-interval" className="text-gray-200">Price Refresh Interval</Label>
                <Select
                  value={preferences.display.refreshInterval.toString()}
                  onValueChange={(value) => updateDisplayPreferences({ refreshInterval: parseInt(value) })}
                >
                  <SelectTrigger id="refresh-interval" className="bg-slate-800 border-purple-500/20" data-testid="select-refresh-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3000">3 seconds</SelectItem>
                    <SelectItem value="5000">5 seconds</SelectItem>
                    <SelectItem value="10000">10 seconds</SelectItem>
                    <SelectItem value="30000">30 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-purple-500/20" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-200">Compact Mode</Label>
                  <p className="text-sm text-gray-400">Reduce spacing and padding</p>
                </div>
                <Switch
                  checked={preferences.display.compactMode}
                  onCheckedChange={(checked) => updateDisplayPreferences({ compactMode: checked })}
                  data-testid="switch-compact-mode"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-200">Advanced Stats</Label>
                  <p className="text-sm text-gray-400">Show detailed statistics</p>
                </div>
                <Switch
                  checked={preferences.display.showAdvancedStats}
                  onCheckedChange={(checked) => updateDisplayPreferences({ showAdvancedStats: checked })}
                  data-testid="switch-advanced-stats"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Preferences */}
          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-security-preferences">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-400" />
                <CardTitle className="text-white">Security Settings</CardTitle>
              </div>
              <CardDescription>Manage your security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="auto-lock" className="text-gray-200">Auto-Lock Timeout</Label>
                <Select
                  value={preferences.security.autoLockTimeout.toString()}
                  onValueChange={(value) => updateSecurityPreferences({ autoLockTimeout: parseInt(value) })}
                >
                  <SelectTrigger id="auto-lock" className="bg-slate-800 border-purple-500/20" data-testid="select-auto-lock">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60000">1 minute</SelectItem>
                    <SelectItem value="300000">5 minutes</SelectItem>
                    <SelectItem value="900000">15 minutes</SelectItem>
                    <SelectItem value="1800000">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-purple-500/20" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-200">Require Confirmation</Label>
                  <p className="text-sm text-gray-400">Confirm sensitive actions</p>
                </div>
                <Switch
                  checked={preferences.security.requireConfirmation}
                  onCheckedChange={(checked) => updateSecurityPreferences({ requireConfirmation: checked })}
                  data-testid="switch-require-confirmation"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-200">Security Alerts</Label>
                  <p className="text-sm text-gray-400">Show wallet security warnings</p>
                </div>
                <Switch
                  checked={preferences.security.showSecurityAlerts}
                  onCheckedChange={(checked) => updateSecurityPreferences({ showSecurityAlerts: checked })}
                  data-testid="switch-security-alerts"
                />
              </div>
            </CardContent>
          </Card>

          {/* Biometric Security (iOS/Android) */}
          <BiometricSettings />

          {/* Development Preferences (API-backed) */}
          {import.meta.env.DEV && (
            <Card className="bg-slate-900/50 border-green-500/20 backdrop-blur-sm" data-testid="card-dev-preferences">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-green-400" />
                  <CardTitle className="text-white">Development Preferences</CardTitle>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    DEV
                  </Badge>
                </div>
                <CardDescription>Configure auto-login and wallet auto-connect (dev only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-200">Auto-Login (Owner)</Label>
                    <p className="text-sm text-gray-400">Automatically login as owner in dev mode</p>
                  </div>
                  <Switch
                    checked={dbPreferences?.autoLoginEnabled === 'true'}
                    onCheckedChange={(checked) => {
                      updateDBPreferences.mutate({ autoLoginEnabled: checked ? 'true' : 'false' });
                      trackAction('toggle_auto_login', 'dev_preferences', { enabled: checked });
                    }}
                    data-testid="switch-auto-login"
                  />
                </div>

                <Separator className="bg-green-500/20" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-200">Auto-Connect Wallet</Label>
                    <p className="text-sm text-gray-400">Automatically connect your wallet in dev mode</p>
                  </div>
                  <Switch
                    checked={dbPreferences?.autoConnectEnabled === 'true'}
                    onCheckedChange={(checked) => {
                      updateDBPreferences.mutate({ autoConnectEnabled: checked ? 'true' : 'false' });
                      trackAction('toggle_auto_wallet_connect', 'dev_preferences', { enabled: checked });
                    }}
                    data-testid="switch-auto-wallet-connect"
                  />
                </div>

                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-400">
                    ℹ️ Changes take effect on next page reload. These settings are stored in the database and persist across sessions.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Favorite Trading Pairs */}
          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm" data-testid="card-favorite-pairs">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <CardTitle className="text-white">Favorite Trading Pairs</CardTitle>
              </div>
              <CardDescription>Quick access to your preferred pairs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {tradingPairs.map(pair => {
                  const isFavorite = preferences.trading.favoritePairs.includes(pair);
                  return (
                    <Button
                      key={pair}
                      variant={isFavorite ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFavoritePair(pair)}
                      className={isFavorite 
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                        : "bg-slate-800 border-purple-500/20 hover:bg-slate-700"
                      }
                      data-testid={`button-favorite-${pair}`}
                    >
                      <Star className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      {pair}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Analytics Insights */}
          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm md:col-span-2" data-testid="card-analytics-insights">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Analytics Insights</CardTitle>
                  <CardDescription>Your platform usage statistics</CardDescription>
                </div>
                <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                  Session: {insights.sessionId.slice(0, 16)}...
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-sm text-gray-400">Total Page Views</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-page-views">{insights.totalPageViews}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-sm text-gray-400">Total Actions</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-actions">{insights.totalActions}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-sm text-gray-400">Sessions</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-sessions">{insights.totalSessions}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-sm text-gray-400">Avg Session Time</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-avg-session-duration">
                    {Math.round(insights.avgSessionDuration / 60000)}m
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-2">Top Pages</h4>
                  <div className="space-y-1">
                    {Object.entries(insights.topPages)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([page, count]) => (
                        <div key={page} className="flex justify-between text-sm">
                          <span className="text-gray-400">{page}</span>
                          <span className="text-purple-400">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-2">Top Actions</h4>
                  <div className="space-y-1">
                    {Object.entries(insights.topActions)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([action, count]) => (
                        <div key={action} className="flex justify-between text-sm">
                          <span className="text-gray-400">{action}</span>
                          <span className="text-blue-400">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Developer Login Section */}
        <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Code className="h-5 w-5 text-orange-400" />
              <div>
                <CardTitle>Developer Access</CardTitle>
                <CardDescription>Quick owner login for development</CardDescription>
              </div>
              <Badge variant="outline" className="border-orange-500/50 text-orange-400 ml-auto">
                DEV MODE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Click the button below to log in as the platform owner and access all admin dashboards.
            </p>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/dev-login-owner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const data = await response.json();
                  
                  if (data.success) {
                    // Invalidate auth cache to force refresh
                    await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                    
                    toast({
                      title: "✅ Logged in as Owner!",
                      description: "Refreshing page to load owner dashboards...",
                    });
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    toast({
                      title: "Error",
                      description: data.error || "Failed to log in",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to connect to server",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              data-testid="button-dev-login-owner"
            >
              <Code className="h-4 w-4 mr-2" />
              Login as Owner
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              After logging in, visit: /empire-owner-dashboard or /owner-analytics
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleResetPreferences}
            className="bg-slate-800 border-purple-500/20 hover:bg-slate-700"
            data-testid="button-reset-preferences"
          >
            Reset Preferences
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAnalytics}
            className="bg-slate-800 border-red-500/20 hover:bg-slate-700 text-red-400 hover:text-red-300"
            data-testid="button-clear-analytics"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Analytics Data
          </Button>
        </div>

        {/* Danger Zone - Account Deletion */}
        <Card className="bg-gradient-to-br from-red-950/40 to-orange-950/40 border-red-500/50 backdrop-blur-sm" data-testid="card-delete-account">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <div>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-red-300/70">Permanent account deletion</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-200 font-semibold mb-2">⚠️ Warning: This action is irreversible</p>
              <p className="text-xs text-red-300/80">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-xs text-red-300/80 mt-2 ml-4 space-y-1">
                <li>• All your wallets and transaction history</li>
                <li>• Trading bot configurations and trade history</li>
                <li>• Copy trading relationships and earnings</li>
                <li>• NFTs, tokens, and all blockchain assets</li>
                <li>• Staking positions and rewards</li>
                <li>• Analytics data and preferences</li>
                <li>• All other account data</li>
              </ul>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                  data-testid="button-delete-account-trigger"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-red-500/50">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Confirm Account Deletion
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This action cannot be undone. Please enter your password to confirm deletion.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-password" className="text-gray-200">Password</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="bg-slate-800 border-red-500/30"
                      data-testid="input-delete-password"
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setDeletePassword("");
                      setShowDeleteDialog(false);
                    }}
                    className="bg-slate-800 border-slate-600"
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (deletePassword) {
                        deleteAccountMutation.mutate(deletePassword);
                        setShowDeleteDialog(false);
                        setDeletePassword("");
                      }
                    }}
                    disabled={!deletePassword || deleteAccountMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="button-confirm-delete"
                  >
                    {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
