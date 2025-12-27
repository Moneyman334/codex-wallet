import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, AlertCircle, XCircle, Clock, Blocks, Users } from "lucide-react";

interface NetworkStatusData {
  network: string;
  symbol: string;
  status: "operational" | "degraded" | "down";
  blockHeight: number;
  blockTime: number;
  tps: number;
  pendingTxs: number;
  validators: number;
  lastBlock: string;
}

const NETWORK_COLORS: Record<string, string> = {
  ethereum: "border-blue-500/30",
  polygon: "border-purple-500/30",
  arbitrum: "border-cyan-500/30",
  optimism: "border-red-500/30",
  base: "border-blue-600/30",
  bsc: "border-yellow-500/30",
  avalanche: "border-red-600/30",
  solana: "border-green-500/30",
};

export function BlockchainNetworkStatus() {
  const { data: networks, isLoading } = useQuery<NetworkStatusData[]>({
    queryKey: ["/api/networks/status"],
    refetchInterval: 30000,
  });

  const mockNetworks: NetworkStatusData[] = [
    {
      network: "Ethereum",
      symbol: "ETH",
      status: "operational",
      blockHeight: 19234567,
      blockTime: 12.1,
      tps: 15,
      pendingTxs: 145234,
      validators: 895432,
      lastBlock: "2s ago",
    },
    {
      network: "Polygon",
      symbol: "MATIC",
      status: "operational",
      blockHeight: 52345678,
      blockTime: 2.1,
      tps: 65,
      pendingTxs: 12456,
      validators: 100,
      lastBlock: "1s ago",
    },
    {
      network: "Arbitrum",
      symbol: "ARB",
      status: "operational",
      blockHeight: 178234567,
      blockTime: 0.25,
      tps: 420,
      pendingTxs: 8234,
      validators: 12,
      lastBlock: "<1s ago",
    },
    {
      network: "Optimism",
      symbol: "OP",
      status: "operational",
      blockHeight: 115678234,
      blockTime: 2.0,
      tps: 85,
      pendingTxs: 5678,
      validators: 1,
      lastBlock: "1s ago",
    },
    {
      network: "Base",
      symbol: "ETH",
      status: "operational",
      blockHeight: 8234567,
      blockTime: 2.0,
      tps: 120,
      pendingTxs: 3456,
      validators: 1,
      lastBlock: "1s ago",
    },
    {
      network: "BNB Chain",
      symbol: "BNB",
      status: "degraded",
      blockHeight: 35234567,
      blockTime: 3.1,
      tps: 45,
      pendingTxs: 89234,
      validators: 21,
      lastBlock: "4s ago",
    },
  ];

  const data = networks || mockNetworks;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "degraded":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case "down":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500/20 text-green-400";
      case "degraded":
        return "bg-yellow-500/20 text-yellow-400";
      case "down":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-700 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const operationalCount = data.filter((n) => n.status === "operational").length;

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-cyan-500/20" data-testid="blockchain-network-status">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Activity className="w-5 h-5" />
            Blockchain Networks
          </div>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
            {operationalCount}/{data.length} Online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((network) => (
          <div
            key={network.network}
            className={`p-3 rounded-lg bg-black/20 border ${NETWORK_COLORS[network.network.toLowerCase()] || "border-gray-700"} hover:bg-black/30 transition-colors`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(network.status)}
                <span className="font-medium text-white">{network.network}</span>
                <span className="text-xs text-gray-400">({network.symbol})</span>
              </div>
              <Badge className={`text-xs ${getStatusColor(network.status)}`}>
                {network.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1 text-gray-400">
                <Blocks className="w-3 h-3" />
                <span>{formatNumber(network.blockHeight)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{network.blockTime}s</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Activity className="w-3 h-3" />
                <span>{network.tps} TPS</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-3 h-3" />
                <span>{formatNumber(network.validators)}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default BlockchainNetworkStatus;
