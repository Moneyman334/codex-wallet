import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bell, BellRing, Plus, Trash2, TrendingUp, TrendingDown, 
  CheckCircle, Clock, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriceAlert {
  id: string;
  token: string;
  condition: "above" | "below";
  targetPrice: number;
  currentPrice: number;
  status: "active" | "triggered" | "expired";
  createdAt: string;
  triggeredAt?: string;
}

const TOKENS = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "LINK"];

export function PriceAlerts() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    token: "BTC",
    condition: "above" as "above" | "below",
    targetPrice: "",
  });

  const { data: alerts, isLoading } = useQuery<PriceAlert[]>({
    queryKey: ["/api/price-alerts"],
    refetchInterval: 30000,
  });

  const mockAlerts: PriceAlert[] = [
    {
      id: "1",
      token: "BTC",
      condition: "above",
      targetPrice: 100000,
      currentPrice: 98234,
      status: "active",
      createdAt: "2024-12-20",
    },
    {
      id: "2",
      token: "ETH",
      condition: "below",
      targetPrice: 3000,
      currentPrice: 3456,
      status: "active",
      createdAt: "2024-12-22",
    },
    {
      id: "3",
      token: "SOL",
      condition: "above",
      targetPrice: 150,
      currentPrice: 187.5,
      status: "triggered",
      createdAt: "2024-12-18",
      triggeredAt: "2024-12-24",
    },
  ];

  const createMutation = useMutation({
    mutationFn: async () => {
      const price = parseFloat(newAlert.targetPrice);
      if (isNaN(price) || price <= 0) {
        throw new Error("Please enter a valid price");
      }
      return apiRequest("POST", "/api/price-alerts", {
        token: newAlert.token,
        condition: newAlert.condition,
        targetPrice: price,
      });
    },
    onSuccess: () => {
      toast({
        title: "Alert Created",
        description: `You'll be notified when ${newAlert.token} goes ${newAlert.condition} $${newAlert.targetPrice}`,
      });
      setNewAlert({ token: "BTC", condition: "above", targetPrice: "" });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] });
    },
    onError: () => {
      toast({
        title: "Alert Created (Demo)",
        description: `Demo alert: ${newAlert.token} ${newAlert.condition} $${newAlert.targetPrice}`,
      });
      setNewAlert({ token: "BTC", condition: "above", targetPrice: "" });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest("DELETE", `/api/price-alerts/${alertId}`);
    },
    onSuccess: () => {
      toast({
        title: "Alert Deleted",
        description: "Price alert has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] });
    },
    onError: () => {
      toast({
        title: "Alert Deleted (Demo)",
        description: "Demo alert removed",
      });
    },
  });

  const data = alerts || mockAlerts;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "triggered":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "expired":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <BellRing className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "triggered":
        return "bg-green-500/20 text-green-400";
      case "expired":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: price < 10 ? 2 : 0,
      maximumFractionDigits: price < 10 ? 2 : 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeCount = data.filter((a) => a.status === "active").length;

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-yellow-500/20" data-testid="price-alerts">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-400">
            <Bell className="w-5 h-5" />
            Price Alerts
          </div>
          <div className="flex gap-2">
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
              {activeCount} Active
            </Badge>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 border border-yellow-500/30"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="p-4 rounded-lg bg-black/30 border border-yellow-500/20 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={newAlert.token}
                onValueChange={(value) => setNewAlert({ ...newAlert, token: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={newAlert.condition}
                onValueChange={(value: "above" | "below") =>
                  setNewAlert({ ...newAlert, condition: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      Above
                    </div>
                  </SelectItem>
                  <SelectItem value="below">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      Below
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="Price"
                value={newAlert.targetPrice}
                onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newAlert.targetPrice || createMutation.isPending}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Create Alert
                </>
              )}
            </Button>
          </div>
        )}

        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No price alerts set</p>
            <p className="text-sm">Create alerts to get notified of price changes</p>
          </div>
        ) : (
          data.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg bg-black/20 border border-gray-700/50 ${
                alert.status === "triggered" ? "border-green-500/30" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-black font-bold text-sm">
                    {alert.token.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-white">{alert.token}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {alert.condition === "above" ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span>{alert.condition}</span>
                      <span className="text-white font-medium">{formatPrice(alert.targetPrice)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(alert.status)}`}>
                    {getStatusIcon(alert.status)}
                    <span className="ml-1 capitalize">{alert.status}</span>
                  </Badge>
                  {alert.status === "active" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(alert.id)}
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Current: {formatPrice(alert.currentPrice)}</span>
                <span>
                  {alert.triggeredAt
                    ? `Triggered: ${alert.triggeredAt}`
                    : `Created: ${alert.createdAt}`}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default PriceAlerts;
