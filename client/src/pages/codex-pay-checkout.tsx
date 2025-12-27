import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, Zap, Wallet, Shield } from "lucide-react";

export default function ChaosPayCheckout() {
  const [, params] = useRoute("/codex-pay/checkout/:intentId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { account, connectWallet } = useWeb3();
  const [isPaying, setIsPaying] = useState(false);

  const intentId = params?.intentId;

  // Fetch payment intent
  const { data: intent, isLoading } = useQuery<any>({
    queryKey: [`/api/codex-pay/intent/${intentId}`],
    enabled: !!intentId,
  });

  const processPayment = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Please connect your wallet first");
      if (!intentId) throw new Error("Invalid payment");

      setIsPaying(true);

      // Simulate payment (in production, send real transaction)
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`;

      const response = await apiRequest("POST", "/api/codex-pay/process-payment", {
        intentId,
        customerWallet: account,
        txHash: mockTxHash,
        paymentMethod: "metamask",
      });

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful! 🎉",
        description: "Thank you for your payment",
      });
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (error: any) => {
      setIsPaying(false);
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!intent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Not Found</CardTitle>
            <CardDescription>This payment link is invalid or expired</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isCompleted = intent.status === "succeeded";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            {isCompleted ? (
              <Check className="w-8 h-8 text-white" />
            ) : (
              <Zap className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">
              {isCompleted ? "Payment Complete" : "CODEX Pay Checkout"}
            </CardTitle>
            <CardDescription>
              {isCompleted ? "Thank you for your payment!" : "Secure cryptocurrency payment"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="space-y-3 p-4 rounded-lg border bg-card">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-bold text-2xl">${intent.amount} {intent.currency}</span>
            </div>
            {intent.description && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Description</span>
                <span>{intent.description}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {intent.status}
              </Badge>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>Instant</span>
            </div>
          </div>

          {/* Action Button */}
          {!isCompleted && (
            <div className="space-y-3">
              {!account ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => connectWallet()}
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet to Pay
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => processPayment.mutate()}
                  disabled={isPaying}
                  data-testid="button-pay-now"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Pay ${intent.amount}
                    </>
                  )}
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Powered by CODEX Pay • Crypto-native payments
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
