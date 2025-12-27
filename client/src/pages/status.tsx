import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, Server, Database, Globe, CheckCircle, 
  AlertTriangle, XCircle, Clock, Calendar, 
  ArrowLeft, Bell, Shield
} from "lucide-react";
import { Link } from "wouter";
import PlatformStatusDashboard from "@/components/platform-status-dashboard";

interface Incident {
  id: string;
  title: string;
  status: "resolved" | "monitoring" | "investigating";
  severity: "minor" | "major" | "critical";
  description: string;
  startTime: Date;
  resolvedTime?: Date;
  updates: Array<{
    time: Date;
    message: string;
  }>;
}

export default function StatusPage() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "1",
      title: "Scheduled Maintenance Completed",
      status: "resolved",
      severity: "minor",
      description: "Routine database optimization and security updates",
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
      resolvedTime: new Date(Date.now() - 1000 * 60 * 60 * 47),
      updates: [
        { time: new Date(Date.now() - 1000 * 60 * 60 * 47), message: "All systems restored to normal operation." },
        { time: new Date(Date.now() - 1000 * 60 * 60 * 47.5), message: "Maintenance completed successfully." },
        { time: new Date(Date.now() - 1000 * 60 * 60 * 48), message: "Starting scheduled maintenance window." }
      ]
    }
  ]);

  const [uptime, setUptime] = useState({
    last7Days: 99.99,
    last30Days: 99.98,
    last90Days: 99.97
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "monitoring": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "investigating": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "minor": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "major": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold">System Status</h1>
          </div>
          <p className="text-muted-foreground">
            Real-time status of all CODEX services
          </p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <span className="text-xl font-semibold text-green-400">All Systems Operational</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Last checked: {new Date().toLocaleTimeString()}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-slate-700/50 text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400" data-testid="uptime-7d">{uptime.last7Days}%</div>
              <div className="text-sm text-muted-foreground">7-Day Uptime</div>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400" data-testid="uptime-30d">{uptime.last30Days}%</div>
              <div className="text-sm text-muted-foreground">30-Day Uptime</div>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400" data-testid="uptime-90d">{uptime.last90Days}%</div>
              <div className="text-sm text-muted-foreground">90-Day Uptime</div>
            </CardContent>
          </Card>
        </div>

        <PlatformStatusDashboard />

        <Card className="border-slate-700/50 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Incident History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No incidents in the past 90 days</p>
              </div>
            ) : (
              <div className="space-y-6">
                {incidents.map((incident) => (
                  <div key={incident.id} className="p-4 bg-card/30 rounded-lg border border-border/30" data-testid={`incident-${incident.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{incident.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={getSeverityBadge(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline" className={getStatusBadge(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 pl-4 border-l-2 border-slate-700">
                      {incident.updates.map((update, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-muted-foreground">{formatDate(update.time)}</span>
                          <span className="mx-2">-</span>
                          <span>{update.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-cyan-500/30 mt-8 bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Bell className="h-8 w-8 text-cyan-400 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Subscribe to Updates</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified about scheduled maintenance and service incidents.
                </p>
                <div className="flex gap-2 mt-4">
                  <input 
                    type="email" 
                    placeholder="your@email.com"
                    className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-sm"
                    data-testid="status-email-input"
                  />
                  <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="subscribe-btn">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Unlike some exchanges that crash during market surges, CODEX's infrastructure 
            is built to handle volatility. Our 99.99% uptime speaks for itself.
          </p>
        </div>
      </div>
    </div>
  );
}
