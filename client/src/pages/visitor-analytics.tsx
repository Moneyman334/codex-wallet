import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/seo";
import {
  Users, Eye, Clock, Monitor, Globe, RefreshCw,
  TrendingUp, BarChart3, Activity
} from "lucide-react";

interface VisitorStats {
  totalSessions: number;
  totalPageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
}

export default function VisitorAnalyticsPage() {
  const { data: stats, isLoading, refetch } = useQuery<VisitorStats>({
    queryKey: ['/api/analytics/visitors'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const metrics = [
    {
      title: "Total Sessions",
      value: stats?.totalSessions?.toLocaleString() || "0",
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Total Page Views",
      value: stats?.totalPageViews?.toLocaleString() || "0",
      icon: <Eye className="h-5 w-5" />,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Unique Visitors",
      value: stats?.uniqueVisitors?.toLocaleString() || "0",
      icon: <Users className="h-5 w-5" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Avg. Session Time",
      value: formatDuration(stats?.avgSessionDuration || 0),
      icon: <Clock className="h-5 w-5" />,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  return (
    <>
      <SEO 
        title="Visitor Analytics Dashboard | CODEX"
        description="Real-time visitor analytics and traffic insights"
        canonicalUrl="/visitor-analytics"
      />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Visitor Analytics
              </h1>
              <p className="text-muted-foreground mt-2">
                Real-time visitor tracking and behavior insights
              </p>
            </div>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              data-testid="button-refresh-analytics"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`metric-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor} ${metric.color}`}>
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Pages & Device Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Top Pages
              </CardTitle>
              <CardDescription>Most visited pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topPages && stats.topPages.length > 0 ? (
                  stats.topPages.map((page, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {page.path}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {page.views.toLocaleString()} views
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, (page.views / (stats.topPages[0]?.views || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No page view data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-400" />
                Device Breakdown
              </CardTitle>
              <CardDescription>Visitor devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.deviceBreakdown && stats.deviceBreakdown.length > 0 ? (
                  stats.deviceBreakdown.map((device, index) => {
                    const total = stats.deviceBreakdown.reduce((sum, d) => sum + d.count, 0);
                    const percentage = total > 0 ? (device.count / total) * 100 : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{device.device}</span>
                          <span className="text-sm text-muted-foreground">
                            {device.count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No device data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-400" />
              Browser Breakdown
            </CardTitle>
            <CardDescription>Browsers used by visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.browserBreakdown && stats.browserBreakdown.length > 0 ? (
                stats.browserBreakdown.map((browser, index) => {
                  const total = stats.browserBreakdown.reduce((sum, b) => sum + b.count, 0);
                  const percentage = total > 0 ? (browser.count / total) * 100 : 0;
                  
                  return (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{browser.browser}</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold mb-1">{browser.count}</div>
                      <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                      <div className="w-full bg-secondary rounded-full h-1 mt-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-1 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No browser data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>Auto-refreshing every 30 seconds</span>
          </div>
        </div>
      </div>
    </>
  );
}
