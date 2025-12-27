import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface TradeExecutionProps {
  symbol?: string;
  currentPrice?: number;
  availableBalance?: number;
}

export function TradeExecution({ 
  symbol = "BTC/USDT", 
  currentPrice = 98500,
  availableBalance = 10000
}: TradeExecutionProps) {
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState(currentPrice.toString());
  const [sliderValue, setSliderValue] = useState([0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseAsset = symbol.split("/")[0];
  const quoteAsset = symbol.split("/")[1];
  
  const amountNum = parseFloat(amount) || 0;
  const priceNum = orderType === "market" ? currentPrice : parseFloat(limitPrice) || currentPrice;
  const total = amountNum * priceNum;
  const fee = total * 0.001;
  const maxBuyAmount = availableBalance / currentPrice;
  const maxSellAmount = 0.5; // Mock holding

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const percentage = value[0] / 100;
    if (side === "buy") {
      setAmount((maxBuyAmount * percentage).toFixed(6));
    } else {
      setAmount((maxSellAmount * percentage).toFixed(6));
    }
  };

  const handleSubmit = async () => {
    if (!amount || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (side === "buy" && total > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need $${total.toFixed(2)} but only have $${availableBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate order execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: `${side === "buy" ? "Buy" : "Sell"} Order ${orderType === "market" ? "Executed" : "Placed"}`,
      description: `${orderType === "market" ? "Successfully executed" : "Successfully placed"} ${side} order for ${amountNum.toFixed(6)} ${baseAsset} at $${priceNum.toLocaleString()}`,
    });
    
    setIsSubmitting(false);
    setAmount("");
    setSliderValue([0]);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800" data-testid="trade-execution">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300">Trade {symbol}</CardTitle>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Wallet className="w-3 h-3" />
            <span>${availableBalance.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={side === "buy" ? "default" : "outline"}
            className={`${side === "buy" ? "bg-green-600 hover:bg-green-700" : "border-gray-700 text-gray-400"}`}
            onClick={() => setSide("buy")}
            data-testid="buy-button"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Buy
          </Button>
          <Button
            variant={side === "sell" ? "default" : "outline"}
            className={`${side === "sell" ? "bg-red-600 hover:bg-red-700" : "border-gray-700 text-gray-400"}`}
            onClick={() => setSide("sell")}
            data-testid="sell-button"
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Sell
          </Button>
        </div>

        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as typeof orderType)}>
          <TabsList className="w-full bg-gray-800">
            <TabsTrigger value="market" className="flex-1 data-[state=active]:bg-purple-600" data-testid="market-order-tab">
              <Zap className="w-3 h-3 mr-1" />
              Market
            </TabsTrigger>
            <TabsTrigger value="limit" className="flex-1 data-[state=active]:bg-purple-600" data-testid="limit-order-tab">
              Limit
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {orderType === "limit" && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Limit Price ({quoteAsset})</Label>
            <Input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="bg-gray-800 border-gray-700"
              placeholder="Enter limit price"
              data-testid="limit-price-input"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-400">Amount ({baseAsset})</Label>
            <span className="text-xs text-gray-500">
              Max: {(side === "buy" ? maxBuyAmount : maxSellAmount).toFixed(6)} {baseAsset}
            </span>
          </div>
          <Input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              const max = side === "buy" ? maxBuyAmount : maxSellAmount;
              const percentage = (parseFloat(e.target.value) || 0) / max * 100;
              setSliderValue([Math.min(percentage, 100)]);
            }}
            className="bg-gray-800 border-gray-700"
            placeholder={`Enter ${baseAsset} amount`}
            data-testid="amount-input"
          />
        </div>

        <div className="space-y-2">
          <Slider
            value={sliderValue}
            onValueChange={handleSliderChange}
            max={100}
            step={1}
            className="py-2"
            data-testid="amount-slider"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="space-y-2 p-3 bg-gray-800/50 rounded-lg">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Price</span>
            <span className="text-white font-mono">
              ${priceNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Total</span>
            <span className="text-white font-mono">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Fee (0.1%)</span>
            <span className="text-yellow-400 font-mono">
              ${fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-gray-700">
            <span className="text-gray-400">You {side === "buy" ? "Pay" : "Receive"}</span>
            <span className="text-white font-bold font-mono">
              ${(side === "buy" ? total + fee : total - fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {orderType === "market" && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-400">
              Market orders execute immediately at best available price
            </span>
          </div>
        )}

        <Button
          className={`w-full h-12 text-lg font-bold ${
            side === "buy" 
              ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
              : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting || !amount || amountNum <= 0}
          data-testid="submit-order-button"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              {side === "buy" ? (
                <>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Buy {baseAsset}
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 mr-2" />
                  Sell {baseAsset}
                </>
              )}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default TradeExecution;
