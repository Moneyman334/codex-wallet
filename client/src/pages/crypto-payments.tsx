import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Coins, QrCode, Copy, Check, ArrowRight, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PaymentRequest {
  amount: number;
  currency: string;
  crypto: string;
}

interface PaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  created_at: string;
  expiration_estimate_date: string;
}

export default function CryptoPaymentsPage() {
  const [amount, setAmount] = useState("100");
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [activePayment, setActivePayment] = useState<PaymentResponse | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { toast } = useToast();

  // Fetch available cryptocurrencies
  const { data: currencies, isLoading: currenciesLoading } = useQuery<string[]>({
    queryKey: ['/api/payments/currencies'],
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentRequest) => {
      const response = await apiRequest('POST', '/api/payments/create', data);
      return await response.json() as PaymentResponse;
    },
    onSuccess: (data: PaymentResponse) => {
      setActivePayment(data);
      toast({
        title: "Payment Created!",
        description: `Send ${data.pay_amount} ${data.pay_currency.toUpperCase()} to complete payment`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Creation Failed",
        description: error.message || "Could not create payment",
        variant: "destructive",
      });
    },
  });

  // Check payment status
  const { data: paymentStatus } = useQuery<PaymentResponse>({
    queryKey: ['/api/payments/status', activePayment?.payment_id],
    enabled: !!activePayment?.payment_id,
    refetchInterval: 5000, // Check every 5 seconds
  });

  const handleCreatePayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    createPaymentMutation.mutate({
      amount: parseFloat(amount),
      currency: "usd",
      crypto: selectedCrypto,
    });
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      toast({
        title: "Address Copied!",
        description: "Payment address copied to clipboard",
      });
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy address",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'bg-green-500';
      case 'confirming':
        return 'bg-yellow-500 animate-pulse';
      case 'waiting':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const popularCryptos = [
    { symbol: 'btc', name: 'Bitcoin', icon: '₿' },
    { symbol: 'eth', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'usdt', name: 'Tether', icon: '₮' },
    { symbol: 'bnb', name: 'BNB', icon: '🔶' },
    { symbol: 'sol', name: 'Solana', icon: '◎' },
    { symbol: 'xrp', name: 'XRP', icon: '✕' },
    { symbol: 'ada', name: 'Cardano', icon: '₳' },
    { symbol: 'doge', name: 'Dogecoin', icon: 'Ð' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-crypto-payments-title">
            Multi-Crypto Payments
          </h1>
          <p className="text-muted-foreground">Accept 300+ cryptocurrencies instantly</p>
        </div>
      </div>

      {!activePayment ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Payment</CardTitle>
              <CardDescription>
                Choose your preferred cryptocurrency and amount
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-payment-amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Select Cryptocurrency</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger data-testid="select-crypto">
                    <SelectValue placeholder="Select crypto" />
                  </SelectTrigger>
                  <SelectContent>
                    {currenciesLoading ? (
                      <SelectItem value="loading">Loading...</SelectItem>
                    ) : currencies && currencies.length > 0 ? (
                      currencies.map((crypto) => (
                        <SelectItem key={crypto} value={crypto}>
                          {crypto.toUpperCase()}
                        </SelectItem>
                      ))
                    ) : (
                      popularCryptos.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          {crypto.icon} {crypto.name} ({crypto.symbol.toUpperCase()})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreatePayment}
                disabled={createPaymentMutation.isPending}
                className="w-full"
                data-testid="button-create-payment"
              >
                {createPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  <>
                    Create Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Popular Cryptocurrencies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Popular Cryptocurrencies
              </CardTitle>
              <CardDescription>300+ coins supported</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {popularCryptos.map((crypto) => (
                  <Button
                    key={crypto.symbol}
                    variant={selectedCrypto === crypto.symbol ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedCrypto(crypto.symbol)}
                    data-testid={`quick-select-${crypto.symbol}`}
                  >
                    <span className="text-lg mr-2">{crypto.icon}</span>
                    {crypto.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payment Details */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Details</CardTitle>
                <Badge className={getStatusColor(paymentStatus?.payment_status || activePayment.payment_status)}>
                  {(paymentStatus?.payment_status || activePayment.payment_status).toUpperCase()}
                </Badge>
              </div>
              <CardDescription>
                Payment ID: {activePayment.payment_id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG 
                      value={activePayment.pay_address}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Scan to pay</p>
                </div>

                {/* Payment Info */}
                <div className="space-y-4">
                  <div>
                    <Label>Amount to Pay</Label>
                    <div className="text-2xl font-bold">
                      {activePayment.pay_amount} {activePayment.pay_currency.toUpperCase()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ≈ ${activePayment.price_amount} USD
                    </p>
                  </div>

                  <div>
                    <Label>Payment Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-muted p-2 rounded text-sm break-all">
                        {activePayment.pay_address}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyAddress(activePayment.pay_address)}
                      >
                        {copiedAddress ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      <li>1. Send exactly {activePayment.pay_amount} {activePayment.pay_currency.toUpperCase()}</li>
                      <li>2. To the address above</li>
                      <li>3. Wait for blockchain confirmation</li>
                      <li>4. Payment will be credited automatically</li>
                    </ol>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setActivePayment(null);
                  setAmount("");
                }}
                variant="outline"
                className="w-full"
              >
                Create New Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">300+ Cryptocurrencies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Accept Bitcoin, Ethereum, Solana, and 300+ other cryptocurrencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instant Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Real-time payment status updates and automatic credit to your account
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Low Fees (0.5%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Industry-leading transaction fees with no hidden costs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
