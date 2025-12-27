import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Info, AlertCircle, CheckCircle, DollarSign, 
  Percent, Clock, Shield, TrendingDown 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeeBreakdown {
  networkFee: number;
  platformFee: number;
  slippage: number;
  total: number;
  currency: string;
}

interface TransparentFeeDisplayProps {
  amount: number;
  tokenSymbol: string;
  action: "swap" | "send" | "stake" | "withdraw";
  estimatedGas?: number;
  tokenUsdPrice?: number;
  className?: string;
}

export default function TransparentFeeDisplay({ 
  amount, 
  tokenSymbol, 
  action,
  estimatedGas = 0.002,
  tokenUsdPrice,
  className = ""
}: TransparentFeeDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getPlatformFeeRate = () => {
    switch (action) {
      case "swap": return 0.003;
      case "send": return 0;
      case "stake": return 0.001;
      case "withdraw": return 0.001;
      default: return 0;
    }
  };

  const platformFeeRate = getPlatformFeeRate();
  const isValidAmount = amount > 0;
  const platformFee = isValidAmount ? amount * platformFeeRate : 0;
  const networkFee = isValidAmount ? estimatedGas : 0;
  const slippage = isValidAmount && action === "swap" ? amount * 0.005 : 0;
  const totalFees = platformFee + networkFee + slippage;
  const youReceive = isValidAmount ? amount - totalFees : 0;

  const getComparisonText = () => {
    if (amount <= 0) return "Enter amount to see savings";
    const ourFeeRate = (totalFees / amount) * 100;
    const typicalExchangeFeeRate = 3.0;
    const savingsPercent = typicalExchangeFeeRate - ourFeeRate;
    if (savingsPercent > 0) {
      return `Save ~${savingsPercent.toFixed(1)}% vs typical exchange fees`;
    }
    return "Competitive rates";
  };
  
  const getOurFeeRate = () => {
    if (amount <= 0) return "0.00";
    return ((totalFees / amount) * 100).toFixed(2);
  };

  return (
    <Card className={`bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30 ${className}`} data-testid="fee-display-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span>Fee Transparency</span>
          </div>
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50" data-testid="savings-badge">
            <TrendingDown className="h-3 w-3 mr-1" />
            {getComparisonText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">You're {action}ing</span>
          <span className="font-mono font-semibold" data-testid="input-amount">{amount.toFixed(6)} {tokenSymbol}</span>
        </div>

        <Separator className="bg-green-500/20" />

        <div className="space-y-2">
          <TooltipProvider>
            <div className="flex justify-between items-center text-sm">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1 text-muted-foreground cursor-help">
                  <Info className="h-3 w-3" />
                  Network Fee (Gas)
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Blockchain transaction fee paid to network validators. This goes directly to the Ethereum network, not us.</p>
                </TooltipContent>
              </Tooltip>
              <span className="font-mono text-yellow-400" data-testid="network-fee">~{networkFee.toFixed(6)} ETH</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1 text-muted-foreground cursor-help">
                  <Percent className="h-3 w-3" />
                  Platform Fee ({(platformFeeRate * 100).toFixed(1)}%)
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Our fee for processing your transaction. Typical exchanges charge 1-3%.</p>
                </TooltipContent>
              </Tooltip>
              <span className="font-mono text-blue-400" data-testid="platform-fee">{platformFee.toFixed(6)} {tokenSymbol}</span>
            </div>

            {action === "swap" && (
              <div className="flex justify-between items-center text-sm">
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 text-muted-foreground cursor-help">
                    <AlertCircle className="h-3 w-3" />
                    Max Slippage (0.5%)
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Maximum price difference between your order and execution. Usually much lower - this is worst case.</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-mono text-orange-400" data-testid="slippage-fee">≤{slippage.toFixed(6)} {tokenSymbol}</span>
              </div>
            )}
          </TooltipProvider>
        </div>

        <Separator className="bg-green-500/20" />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Fees</span>
            <span className="font-mono text-red-400" data-testid="total-fees">{totalFees.toFixed(6)} {tokenSymbol}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span className="text-green-400">You Receive</span>
            <span className="font-mono text-green-400" data-testid="you-receive">{youReceive.toFixed(6)} {tokenSymbol}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
          <p className="text-xs text-green-300">
            <strong>No hidden fees.</strong> What you see is exactly what you pay. We believe in complete transparency.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Shield className="h-5 w-5 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300">
            <strong>Price Protection:</strong> If gas spikes above estimate, we'll notify you before proceeding.
          </p>
        </div>

        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
          data-testid="toggle-details"
        >
          {showDetails ? "Hide" : "Show"} fee comparison with competitors
        </button>

        {showDetails && (
          <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border/50">
            <h4 className="text-sm font-semibold mb-3">Fee Rate Comparison</h4>
            <p className="text-xs text-muted-foreground mb-3">Percentage of transaction amount</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-400">CODEX</span>
                <span className="font-mono text-green-400">{getOurFeeRate()}%</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Centralized Exchanges (typical)</span>
                <span className="font-mono">1.00% - 3.00%</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Kraken</span>
                <span className="font-mono">0.25% - 0.40%</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Binance</span>
                <span className="font-mono">0.10%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
