import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, Bot, Zap, Crown, Star, Shield } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { useLocation } from "wouter";

interface BotPlan {
  id: string;
  name: string;
  price: string;
  currency: string;
  features: string[];
  maxActiveStrategies: string;
  maxDailyTrades: string;
  popular: boolean;
}

interface BotSubscription {
  id: string;
  userId: string;
  planType: string;
  status: string;
  expiresAt: string;
  maxActiveStrategies: string;
  maxDailyTrades: string;
}

export default function BotSubscriptionPage() {
  const { toast } = useToast();
  const { account, isConnected } = useWeb3();
  const [, setLocation] = useLocation();

  const { data: plans, isLoading: plansLoading } = useQuery<BotPlan[]>({
    queryKey: ['/api/bot/plans'],
  });

  const { data: subscription } = useQuery<BotSubscription>({
    queryKey: ['/api/bot/subscription', account],
    enabled: isConnected && !!account,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan: BotPlan) => {
      if (!account) throw new Error("Please connect your wallet");
      
      return apiRequest('POST', '/api/bot/subscribe', {
        userId: account,
        planType: plan.id,
        price: plan.price,
        currency: plan.currency,
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscription Activated!",
        description: "Redirecting to AI Trading Bot dashboard...",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/subscription', account] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/plans'] });
      
      // Redirect to auto-trading bot page after 1.5 seconds
      setTimeout(() => {
        setLocation('/auto-trading-bot');
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPlanIcon = (name: string) => {
    if (name.toLowerCase().includes("elite")) {
      return <Crown className="h-8 w-8" />;
    }
    if (name.toLowerCase().includes("pro")) {
      return <Star className="h-8 w-8" />;
    }
    return <Zap className="h-8 w-8" />;
  };

  const hasActivePlan = (planId: string) => {
    return subscription?.planType === planId && subscription?.status === "active";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="h-12 w-12 text-purple-400" data-testid="icon-bot" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-title">
              AI Trading Bot Plans
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-subtitle">
            Unlock advanced AI-powered trading strategies with our premium subscription plans
          </p>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <Card className="mb-8 border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-500/5" data-testid="card-wallet-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 justify-center">
                <Shield className="h-5 w-5 text-yellow-500" data-testid="icon-warning" />
                <p className="text-center text-yellow-200 dark:text-yellow-300" data-testid="text-warning">
                  Connect your wallet to subscribe to a bot plan
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Subscription */}
        {subscription && subscription.status === "active" && (
          <Card className="mb-8 border-green-500/50 bg-green-500/10 dark:bg-green-500/5" data-testid="card-active-subscription">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-500" data-testid="badge-active">Active Subscription</Badge>
                  <span className="font-semibold text-lg capitalize" data-testid="text-plan-name">{subscription.planType} Plan</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-semibold" data-testid="text-expiry-date">
                    {new Date(subscription.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span data-testid="text-max-strategies">Max Strategies: {subscription.maxActiveStrategies}</span>
                <span>•</span>
                <span data-testid="text-max-trades">Max Daily Trades: {subscription.maxDailyTrades}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Loading */}
        {plansLoading ? (
          <div className="text-center py-12" data-testid="loading-plans">
            <Bot className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading subscription plans...</p>
          </div>
        ) : !plans || plans.length === 0 ? (
          <div className="text-center py-12" data-testid="no-plans">
            <p className="text-muted-foreground">No subscription plans available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isSubscribed = hasActivePlan(plan.id);
              const isPopular = plan.popular;
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all hover:scale-105 ${
                    isPopular 
                      ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5' 
                      : isSubscribed 
                        ? 'border-green-500/50 bg-green-500/5' 
                        : 'border-border'
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1" data-testid={`badge-popular-${plan.id}`}>
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Active Badge */}
                  {isSubscribed && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500" data-testid={`badge-subscribed-${plan.id}`}>Active</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-8">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-2xl ${
                        isPopular 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                          : 'bg-purple-500/10 text-purple-400'
                      }`} data-testid={`icon-plan-${plan.id}`}>
                        {getPlanIcon(plan.name)}
                      </div>
                    </div>
                    <CardTitle className="text-3xl mb-2" data-testid={`text-plan-title-${plan.id}`}>{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center gap-1 mt-4">
                      <span className="text-5xl font-bold" data-testid={`text-price-${plan.id}`}>${plan.price}</span>
                      <span className="text-muted-foreground" data-testid={`text-interval-${plan.id}`}>/month</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Features */}
                    <div className="space-y-3" data-testid={`features-${plan.id}`}>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3" data-testid={`feature-${plan.id}-${idx}`}>
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Subscribe Button */}
                    <Button
                      className={`w-full h-12 text-base ${
                        isPopular 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                          : ''
                      }`}
                      disabled={!isConnected || isSubscribed || subscribeMutation.isPending}
                      onClick={() => subscribeMutation.mutate(plan)}
                      data-testid={`button-subscribe-${plan.id}`}
                    >
                      {!isConnected 
                        ? "Connect Wallet" 
                        : isSubscribed 
                          ? "Current Plan" 
                          : subscribeMutation.isPending 
                            ? "Activating..." 
                            : "Subscribe Now"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 border-indigo-500/30" data-testid="card-why-subscribe">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2" data-testid="heading-why-subscribe">
                <Shield className="h-5 w-5 text-indigo-400" />
                Why Subscribe?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-3 text-muted-foreground" data-testid="content-benefits">
              <p data-testid="benefit-ai">• <strong className="text-foreground">AI-Powered Strategies:</strong> Advanced algorithms analyze market trends 24/7</p>
              <p data-testid="benefit-risk">• <strong className="text-foreground">Risk Management:</strong> Automated stop-loss and take-profit protection</p>
              <p data-testid="benefit-monitoring">• <strong className="text-foreground">Real-time Monitoring:</strong> Live activity feed and performance tracking</p>
              <p data-testid="benefit-demo">• <strong className="text-foreground">Demo Mode:</strong> Test strategies risk-free before going live</p>
              <p data-testid="benefit-exchanges">• <strong className="text-foreground">Multiple Exchanges:</strong> Support for major cryptocurrency exchanges</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links to Related Features */}
        {subscription && subscription.status === "active" && (
          <div className="mt-8 text-center">
            <Card className="max-w-3xl mx-auto border-purple-500/30" data-testid="card-quick-links">
              <CardHeader>
                <CardTitle className="text-xl" data-testid="heading-quick-links">
                  ⚡ Access Your Trading Tools
                </CardTitle>
                <CardDescription data-testid="text-quick-links-desc">
                  Your subscription is active! Start using these powerful features:
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center" data-testid="content-quick-links">
                <Button
                  onClick={() => setLocation('/auto-trading-bot')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-goto-trading-bot"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Go to AI Trading Bot
                </Button>
                <Button
                  onClick={() => setLocation('/auto-compound')}
                  variant="outline"
                  className="border-purple-500/50"
                  data-testid="button-goto-auto-compound"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Compound Earnings
                </Button>
                <Button
                  onClick={() => setLocation('/vaults')}
                  variant="outline"
                  className="border-purple-500/50"
                  data-testid="button-goto-vaults"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  House Vaults
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
