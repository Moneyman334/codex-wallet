import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, Server, Database, Globe, Wifi, 
  CheckCircle, AlertTriangle, XCircle, Clock,
  Zap, Shield, TrendingUp
} from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency: number;
  uptime: number;
  icon: React.ReactNode;
}

export default function PlatformStatusDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Trading Engine", status: "operational", latency: 12, uptime: 99.99, icon: <Zap className="h-4 w-4" /> },
    { name: "Wallet Services", status: "operational", latency: 8, uptime: 99.98, icon: <Shield className="h-4 w-4" /> },
    { name: "Price Feeds", status: "operational", latency: 45, uptime: 99.97, icon: <TrendingUp className="h-4 w-4" /> },
    { name: "API Gateway", status: "operational", latency: 15, uptime: 99.99, icon: <Globe className="h-4 w-4" /> },
    { name: "Database", status: "operational", latency: 3, uptime: 99.99, icon: <Database className="h-4 w-4" /> },
    { name: "Blockchain Nodes", status: "operational", latency: 120, uptime: 99.95, icon: <Server className="h-4 w-4" /> },
  ]);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [overallStatus, setOverallStatus] = useState<"operational" | "degraded" | "down">("operational");

  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prev => prev.map(service => ({
        ...service,
        latency: Math.max(1, service.latency + Math.floor(Math.random() * 10) - 5)
      })));
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hasDown = services.some(s => s.status === "down");
    const hasDegraded = services.some(s => s.status === "degraded");
    setOverallStatus(hasDown ? "down" : hasDegraded ? "degraded" : "operational");
  }, [services]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "degraded": return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "down": return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      operational: "bg-green-500/20 text-green-400 border-green-500/50",
      degraded: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      down: "bg-red-500/20 text-red-400 border-red-500/50"
    };
    return variants[status] || variants.operational;
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-green-400";
    if (latency < 200) return "text-yellow-400";
    return "text-red-400";
  };

  const averageUptime = services.reduce((acc, s) => acc + s.uptime, 0) / services.length;

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50" data-testid="status-dashboard">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            Platform Status
          </CardTitle>
          <Badge variant="outline" className={getStatusBadge(overallStatus)} data-testid="overall-status">
            {getStatusIcon(overallStatus)}
            <span className="ml-1 capitalize">{overallStatus === "operational" ? "All Systems Operational" : overallStatus}</span>
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
          <Clock className="h-3 w-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
            <div className="text-3xl font-bold text-green-400" data-testid="uptime-display">{averageUptime.toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">30-Day Uptime</div>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-center">
            <div className="text-3xl font-bold text-blue-400" data-testid="latency-display">
              {Math.round(services.reduce((acc, s) => acc + s.latency, 0) / services.length)}ms
            </div>
            <div className="text-xs text-muted-foreground">Avg Response Time</div>
          </div>
        </div>

        <div className="space-y-3">
          {services.map((service, index) => (
            <div 
              key={service.name}
              className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/30"
              data-testid={`service-${index}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  {service.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Uptime: {service.uptime}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`font-mono text-sm ${getLatencyColor(service.latency)}`}>
                    {service.latency}ms
                  </div>
                  <div className="text-xs text-muted-foreground">latency</div>
                </div>
                {getStatusIcon(service.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20 mt-4">
          <div className="flex items-start gap-3">
            <Wifi className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-cyan-400">Built for High Availability</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Our infrastructure is designed to handle traffic spikes during market surges. 
                Reliable performance when you need it most.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <a 
            href="/status" 
            className="text-xs text-cyan-400 hover:text-cyan-300 underline"
            data-testid="full-status-link"
          >
            View full status history →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
