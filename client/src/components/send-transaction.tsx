import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { useHaptics } from "@/hooks/use-haptics";
import { useBiometric } from "@/hooks/use-biometric";
import { useShare } from "@/hooks/use-share";
import { RefreshCw, Share2, Check } from "lucide-react";

interface SendTransactionProps {
  account?: string;
  balance?: string;
}

export default function SendTransaction({ account, balance }: SendTransactionProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState({
    gasLimit: "21,000",
    gasPrice: "25 gwei",
    estimatedFee: "0.000525 ETH"
  });
  
  const { toast } = useToast();
  const { sendTransaction, estimateGas } = useWeb3();
  const { heavyImpact, successNotification, errorNotification, mediumImpact } = useHaptics();
  const { isEnabled: biometricEnabled, authenticate: biometricAuth, biometryTypeName } = useBiometric();
  const { shareTransaction, isSharing } = useShare();

  const refreshGasEstimate = async () => {
    if (!recipientAddress || !sendAmount) return;
    
    try {
      const estimate = await estimateGas(recipientAddress, sendAmount);
      setGasEstimate(estimate);
      toast({
        title: "Gas estimate updated",
        description: "Latest gas prices fetched successfully",
      });
    } catch (error) {
      console.error("Failed to estimate gas:", error);
      toast({
        title: "Failed to estimate gas",
        description: "Please check your transaction details",
        variant: "destructive",
      });
    }
  };

  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    heavyImpact();
    
    if (!recipientAddress || !sendAmount) {
      errorNotification();
      toast({
        title: "Missing information",
        description: "Please fill in all transaction details",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(sendAmount) > parseFloat(balance || "0")) {
      errorNotification();
      toast({
        title: "Insufficient balance",
        description: "You don't have enough ETH for this transaction",
        variant: "destructive",
      });
      return;
    }

    if (biometricEnabled) {
      const authenticated = await biometricAuth(`Authenticate with ${biometryTypeName} to send ${sendAmount} ETH`);
      if (!authenticated) {
        errorNotification();
        toast({
          title: "Authentication Required",
          description: `${biometryTypeName} verification failed. Transaction cancelled.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const txHash = await sendTransaction(recipientAddress, sendAmount);
      successNotification();
      setLastTxHash(txHash);
      toast({
        title: "Transaction sent",
        description: `Transaction hash: ${txHash}`,
      });
      
      setRecipientAddress("");
      setSendAmount("");
    } catch (error: any) {
      console.error("Transaction failed:", error);
      errorNotification();
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareTransaction = async () => {
    if (lastTxHash) {
      mediumImpact();
      const result = await shareTransaction(lastTxHash, "Transaction");
      if (result) {
        successNotification();
        toast({
          title: "Shared",
          description: "Transaction details shared successfully",
        });
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Send Transaction</h2>
        
        <form onSubmit={handleSendTransaction} className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="font-mono"
              data-testid="recipient-address-input"
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              data-testid="send-amount-input"
            />
          </div>
          
          {/* Gas Estimation */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Gas Estimation</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refreshGasEstimate}
                className="text-xs text-primary hover:underline p-0 h-auto"
                data-testid="refresh-gas-button"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Gas Limit</div>
                <div className="font-mono" data-testid="gas-limit">
                  {gasEstimate.gasLimit}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Gas Price</div>
                <div className="font-mono" data-testid="gas-price">
                  {gasEstimate.gasPrice}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Est. Fee</div>
                <div className="font-mono" data-testid="estimated-fee">
                  {gasEstimate.estimatedFee}
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !recipientAddress || !sendAmount}
            data-testid="send-transaction-button"
            haptic="heavy"
          >
            {isLoading ? "Sending..." : "Send Transaction"}
          </Button>
        </form>

        {lastTxHash && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Transaction Sent</span>
            </div>
            <div className="text-xs font-mono text-muted-foreground break-all mb-3">
              {lastTxHash}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTransaction}
              disabled={isSharing}
              className="w-full"
              data-testid="share-transaction-button"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Transaction
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
