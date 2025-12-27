import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Trash2, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TokenApproval {
  id: string;
  token: string;
  tokenSymbol: string;
  spender: string;
  spenderName: string;
  allowance: string;
  isUnlimited: boolean;
  network: string;
  approvedAt: string;
  riskLevel: "low" | "medium" | "high";
}

export function TokenApprovalManager() {
  const { toast } = useToast();
  const [revoking, setRevoking] = useState<string | null>(null);

  const { data: approvals, isLoading } = useQuery<TokenApproval[]>({
    queryKey: ["/api/wallet/approvals"],
    refetchInterval: 60000,
  });

  const mockApprovals: TokenApproval[] = [
    {
      id: "1",
      token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      tokenSymbol: "USDC",
      spender: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      spenderName: "Uniswap V2 Router",
      allowance: "Unlimited",
      isUnlimited: true,
      network: "Ethereum",
      approvedAt: "2024-01-15",
      riskLevel: "low",
    },
    {
      id: "2",
      token: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      tokenSymbol: "USDT",
      spender: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      spenderName: "Uniswap V3 Router",
      allowance: "5,000 USDT",
      isUnlimited: false,
      network: "Ethereum",
      approvedAt: "2024-02-20",
      riskLevel: "low",
    },
    {
      id: "3",
      token: "0x6B175474E89094C44Da98b954EescdeCB5f",
      tokenSymbol: "DAI",
      spender: "0x1111111254EEB25477B68fb85Ed929f73A960582",
      spenderName: "1inch Router",
      allowance: "Unlimited",
      isUnlimited: true,
      network: "Ethereum",
      approvedAt: "2024-03-10",
      riskLevel: "medium",
    },
    {
      id: "4",
      token: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      tokenSymbol: "WBTC",
      spender: "0xUnknownContract123456789",
      spenderName: "Unknown Contract",
      allowance: "Unlimited",
      isUnlimited: true,
      network: "Ethereum",
      approvedAt: "2023-11-05",
      riskLevel: "high",
    },
  ];

  const revokeMutation = useMutation({
    mutationFn: async (approvalId: string) => {
      setRevoking(approvalId);
      return apiRequest("POST", `/api/wallet/approvals/${approvalId}/revoke`);
    },
    onSuccess: () => {
      toast({
        title: "Approval Revoked",
        description: "Token approval has been successfully revoked",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/approvals"] });
    },
    onError: () => {
      toast({
        title: "Revocation Failed",
        description: "Connect your wallet to revoke approvals",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setRevoking(null);
    },
  });

  const data = approvals || mockApprovals;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="w-3 h-3" />;
      case "medium":
        return <Clock className="w-3 h-3" />;
      default:
        return <CheckCircle className="w-3 h-3" />;
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const highRiskCount = data.filter((a) => a.riskLevel === "high").length;
  const unlimitedCount = data.filter((a) => a.isUnlimited).length;

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-purple-500/20" data-testid="token-approval-manager">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-400">
            <Shield className="w-5 h-5" />
            Token Approvals
          </div>
          <div className="flex gap-2">
            {highRiskCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {highRiskCount} High Risk
              </Badge>
            )}
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
              {data.length} Active
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unlimitedCount > 0 && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>You have {unlimitedCount} unlimited approvals. Consider revoking unused ones.</span>
            </div>
          </div>
        )}

        {data.map((approval) => (
          <div
            key={approval.id}
            className="p-4 rounded-lg bg-black/20 border border-gray-700/50 hover:border-purple-500/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {approval.tokenSymbol.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{approval.tokenSymbol}</span>
                    <Badge className={`text-xs ${getRiskColor(approval.riskLevel)}`}>
                      {getRiskIcon(approval.riskLevel)}
                      <span className="ml-1 capitalize">{approval.riskLevel}</span>
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">{approval.network}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => revokeMutation.mutate(approval.id)}
                disabled={revoking === approval.id}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30"
              >
                {revoking === approval.id ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Revoke
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-1">Spender</div>
                <div className="flex items-center gap-1">
                  <span className="text-white">{approval.spenderName}</span>
                  <a
                    href={`https://etherscan.io/address/${approval.spender}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-xs text-gray-500">{shortenAddress(approval.spender)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Allowance</div>
                <div className={`font-medium ${approval.isUnlimited ? "text-yellow-400" : "text-white"}`}>
                  {approval.allowance}
                </div>
                <div className="text-xs text-gray-500">Approved: {approval.approvedAt}</div>
              </div>
            </div>
          </div>
        ))}

        <p className="text-xs text-gray-500 text-center pt-2">
          Review and revoke token approvals to protect your assets
        </p>
      </CardContent>
    </Card>
  );
}

export default TokenApprovalManager;
