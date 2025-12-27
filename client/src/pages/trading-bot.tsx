import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Bot, TrendingUp, TrendingDown, DollarSign, Activity, 
  Zap, Settings, PlayCircle, PauseCircle, BarChart3 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ComplianceDisclaimer } from "@/components/ui/compliance-disclaimer";

interface BotTrade {
  id: string;
  botId: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  profit: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface TradingBot {
  id: string;
  userId: string;
  name: string;
  strategy: string;
  isActive: boolean;
  tradingPairs: string[];
  maxTradeSize: string;
  stopLoss: string;
  takeProfit: string;
  totalProfit: string;
  totalTrades: number;
  winRate: string;
  createdAt: string;
  lastTradeAt?: string;
}

export default function TradingBotPage() {
  const { toast } = useToast();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  const { data: bots = [] } = useQuery<TradingBot[]>({
    queryKey: ['/api/trading-bots'],
  });

  const { data: trades = [] } = useQuery<BotTrade[]>({
    queryKey: ['/api/trading-bots/trades', selectedBotId],
    enabled: !!selectedBotId,
  });

  const toggleBotMutation = useMutation({
    mutationFn: async ({ botId, isActive }: { botId: string; isActive: boolean }) => {
      return apiRequest('POST', '/api/trading-bots/toggle', { botId, isActive });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isActive ? "Bot Activated 🤖" : "Bot Paused ⏸️",
        description: variables.isActive 
          ? "Your trading bot is now hunting for profitable trades!"
          : "Bot has been safely paused",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading-bots'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bot Toggle Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeBots = bots.filter(b => b.isActive);
  const totalProfit = bots.reduce((sum, b) => sum + parseFloat(b.totalProfit || "0"), 0);
  const totalTrades = bots.reduce((sum, b) => sum + (b.totalTrades || 0), 0);
  const avgWinRate = bots.length > 0 
    ? bots.reduce((sum, b) => sum + parseFloat(b.winRate || "0"), 0) / bots.length 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Bot className="h-10 w-10 text-blue-500" />
          Trading Automation
        </h1>
        <p className="text-muted-foreground">Automated trading strategies (beta feature)</p>
      </div>

      {/* Trading Risk Disclaimer */}
      <ComplianceDisclaimer type="trading" className="mb-6" />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Bots</p>
                <p className="text-3xl font-bold text-blue-500">{activeBots.length}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-3xl font-bold text-green-500">
                  ${totalProfit.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-3xl font-bold text-purple-500">{totalTrades}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                <p className="text-3xl font-bold text-orange-500">
                  {avgWinRate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bots" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bots" data-testid="tab-bots">My Bots</TabsTrigger>
          <TabsTrigger value="trades" data-testid="tab-trades">Recent Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="bots" className="space-y-4">
          {bots.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Trading Bots Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI trading bot to start automating profits
                </p>
                <Button data-testid="button-create-bot">
                  <Zap className="mr-2 h-4 w-4" />
                  Create Your First Bot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {bots.map((bot) => (
                <Card 
                  key={bot.id}
                  className={`transition-all ${bot.isActive ? 'border-green-500 shadow-green-500/20 shadow-lg' : ''}`}
                  data-testid={`card-bot-${bot.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {bot.name}
                          {bot.isActive && (
                            <Badge className="bg-green-500">
                              <Activity className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{bot.strategy}</CardDescription>
                      </div>
                      <Switch
                        checked={bot.isActive}
                        onCheckedChange={(checked) => 
                          toggleBotMutation.mutate({ botId: bot.id, isActive: checked })
                        }
                        disabled={toggleBotMutation.isPending}
                        data-testid={`switch-bot-${bot.id}`}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Profit</p>
                        <p className={`text-2xl font-bold ${parseFloat(bot.totalProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${parseFloat(bot.totalProfit).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-2xl font-bold text-blue-500">
                          {bot.winRate}%
                        </p>
                      </div>
                    </div>

                    {/* Trading Pairs */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Trading Pairs</p>
                      <div className="flex flex-wrap gap-2">
                        {bot.tradingPairs.map((pair, idx) => (
                          <Badge key={idx} variant="outline">
                            {pair}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Risk Management */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Stop Loss</p>
                        <p className="font-semibold text-red-500">-{bot.stopLoss}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Take Profit</p>
                        <p className="font-semibold text-green-500">+{bot.takeProfit}%</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <span className="text-muted-foreground">
                        {bot.totalTrades} trades
                      </span>
                      {bot.lastTradeAt && (
                        <span className="text-muted-foreground">
                          Last: {formatDistanceToNow(new Date(bot.lastTradeAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedBotId(bot.id)}
                        data-testid={`button-view-trades-${bot.id}`}
                      >
                        <Activity className="mr-2 h-4 w-4" />
                        View Trades
                      </Button>
                      <Button 
                        variant="outline"
                        data-testid={`button-settings-${bot.id}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          {!selectedBotId ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Select a Bot</h3>
                <p className="text-muted-foreground">
                  Choose a trading bot to view its trade history
                </p>
              </CardContent>
            </Card>
          ) : trades.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Trades Yet</h3>
                <p className="text-muted-foreground">
                  Your bot hasn't executed any trades yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trades.map((trade) => (
                <Card key={trade.id} data-testid={`card-trade-${trade.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${trade.side === 'buy' ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'}`}>
                          {trade.side === 'buy' ? (
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{trade.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          {trade.amount} @ ${parseFloat(trade.price).toFixed(2)}
                        </p>
                        <p className={`text-sm font-semibold ${parseFloat(trade.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(trade.profit) >= 0 ? '+' : ''}${parseFloat(trade.profit).toFixed(2)}
                        </p>
                      </div>

                      <Badge 
                        variant={trade.status === 'completed' ? 'default' : trade.status === 'pending' ? 'secondary' : 'destructive'}
                        data-testid={`status-trade-${trade.id}`}
                      >
                        {trade.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
