import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowUpDown, Zap, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const TOKENS = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
  { symbol: "SOL", name: "Solana", icon: "◎" },
  { symbol: "XRP", name: "XRP", icon: "✕" },
  { symbol: "DOGE", name: "Dogecoin", icon: "Ð" },
];

export function QuickTradeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [showTokenList, setShowTokenList] = useState(false);
  const { toast } = useToast();

  const { data: prices } = useQuery<Record<string, { usd: number }>>({
    queryKey: ["/api/prices/top"],
  });

  const currentPrice = prices?.[selectedToken.symbol.toLowerCase()]?.usd || 0;
  const totalValue = parseFloat(amount || "0") * currentPrice;

  const tradeMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Please enter a valid amount greater than 0");
      }
      return apiRequest("POST", "/api/paper/trade", {
        type: tradeType,
        symbol: selectedToken.symbol,
        amount: parsedAmount,
      });
    },
    onSuccess: () => {
      toast({
        title: `${tradeType === "buy" ? "Bought" : "Sold"} ${amount} ${selectedToken.symbol}`,
        description: `Total: $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/paper/account"] });
    },
    onError: () => {
      toast({
        title: "Trade failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 p-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105"
        data-testid="quick-trade-fab"
      >
        <Zap className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-80 bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="font-semibold text-white">Quick Trade</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setTradeType("buy")}
            className={`flex-1 ${
              tradeType === "buy"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            data-testid="quick-trade-buy"
          >
            Buy
          </Button>
          <Button
            onClick={() => setTradeType("sell")}
            className={`flex-1 ${
              tradeType === "sell"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            data-testid="quick-trade-sell"
          >
            Sell
          </Button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowTokenList(!showTokenList)}
            className="w-full flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-purple-500/50 transition-colors"
            data-testid="quick-trade-token-select"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedToken.icon}</span>
              <span className="font-medium text-white">{selectedToken.symbol}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showTokenList && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-10">
              {TOKENS.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    setSelectedToken(token);
                    setShowTokenList(false);
                  }}
                  className="w-full flex items-center gap-2 p-3 hover:bg-gray-700 transition-colors"
                >
                  <span className="text-lg">{token.icon}</span>
                  <span className="text-white">{token.symbol}</span>
                  <span className="text-gray-400 text-sm ml-auto">{token.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Amount</label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
            data-testid="quick-trade-amount"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Price</span>
          <span className="text-white">
            ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Total</span>
          <span className="text-white font-semibold">
            ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>

        <Button
          onClick={() => tradeMutation.mutate()}
          disabled={!amount || parseFloat(amount) <= 0 || tradeMutation.isPending}
          className={`w-full ${
            tradeType === "buy"
              ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
          }`}
          data-testid="quick-trade-execute"
        >
          {tradeMutation.isPending ? (
            <ArrowUpDown className="w-4 h-4 animate-spin" />
          ) : (
            `${tradeType === "buy" ? "Buy" : "Sell"} ${selectedToken.symbol}`
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Paper trading mode - no real funds used
        </p>
      </div>
    </div>
  );
}

export default QuickTradeWidget;
