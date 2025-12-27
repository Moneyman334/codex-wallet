import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, Zap, Crown, Star } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  billingInterval: string;
  trialDays: string;
  features: string[];
  isActive: string;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  startDate: string;
  nextBillingDate: string;
  cancelledAt: string | null;
  trialEndsAt: string | null;
}

export default function Subscriptions() {
  const { toast } = useToast();
  const { account } = useWeb3();

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscriptions/plans'],
  });

  const { data: userSubscriptions } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions/wallet', account],
    enabled: !!account,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!account) throw new Error("Please connect your wallet");
      
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      
      return apiRequest('POST', '/api/subscriptions', {
        planId,
        customerWallet: account,
        nextBillingDate: nextBilling.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "Your subscription has been activated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/wallet', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return apiRequest('POST', `/api/subscriptions/${subscriptionId}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/wallet', account] });
    },
  });

  const hasActivePlan = (planId: string) => {
    return userSubscriptions?.some(
      sub => sub.planId === planId && sub.status === "active"
    );
  };

  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      daily: "per day",
      weekly: "per week",
      monthly: "per month",
      yearly: "per year",
    };
    return labels[interval] || interval;
  };

  const getPlanIcon = (name: string) => {
    if (name.toLowerCase().includes("premium") || name.toLowerCase().includes("pro")) {
      return <Crown className="h-6 w-6" />;
    }
    if (name.toLowerCase().includes("enterprise")) {
      return <Star className="h-6 w-6" />;
    }
    return <Zap className="h-6 w-6" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Subscription Plans</h1>
        <p className="text-muted-foreground">Choose the perfect plan for your needs</p>
      </div>

      {!account && (
        <Card className="mb-8 border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-center">Connect your wallet to subscribe to a plan</p>
          </CardContent>
        </Card>
      )}

      {plansLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      ) : !plans || plans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subscription plans available</p>
        </div>
      ) : (
        <>
          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {plans.map((plan) => {
              const isSubscribed = hasActivePlan(plan.id);
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${isSubscribed ? 'border-green-500' : ''}`}
                  data-testid={`plan-${plan.id}`}
                >
                  {isSubscribed && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getPlanIcon(plan.name)}
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">
                          {getIntervalLabel(plan.billingInterval)}
                        </span>
                      </div>
                      {plan.trialDays !== "0" && (
                        <p className="text-sm text-green-500 mt-1">
                          {plan.trialDays} days free trial
                        </p>
                      )}
                    </div>

                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={!account || isSubscribed || subscribeMutation.isPending}
                      onClick={() => subscribeMutation.mutate(plan.id)}
                      data-testid={`button-subscribe-${plan.id}`}
                    >
                      {!account ? "Connect Wallet" : isSubscribed ? "Subscribed" : 
                        subscribeMutation.isPending ? "Subscribing..." : "Subscribe Now"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Active Subscriptions */}
          {account && userSubscriptions && userSubscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Subscriptions</CardTitle>
                <CardDescription>Manage your active subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userSubscriptions.map((sub) => {
                    const plan = plans.find(p => p.id === sub.planId);
                    if (!plan) return null;

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`subscription-${sub.id}`}
                      >
                        <div>
                          <h3 className="font-semibold">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Status: <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                              {sub.status}
                            </Badge>
                          </p>
                          {sub.status === "active" && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                            </p>
                          )}
                          {sub.trialEndsAt && new Date(sub.trialEndsAt) > new Date() && (
                            <p className="text-sm text-green-500 mt-1">
                              Trial ends: {new Date(sub.trialEndsAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {sub.status === "active" && !sub.cancelledAt && (
                          <Button
                            variant="outline"
                            onClick={() => cancelMutation.mutate(sub.id)}
                            disabled={cancelMutation.isPending}
                            data-testid={`button-cancel-${sub.id}`}
                          >
                            {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
