import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, Lock, Eye, AlertTriangle, CheckCircle, 
  Smartphone, Key, Globe, Clock, Activity, 
  ShieldCheck, ShieldAlert, Fingerprint, Bell
} from "lucide-react";

interface SecurityFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  recommended: boolean;
  icon: React.ReactNode;
}

interface RecentActivity {
  id: string;
  action: string;
  device: string;
  location: string;
  time: Date;
  suspicious: boolean;
}

export default function SecurityCenter() {
  const [securityScore, setSecurityScore] = useState(75);
  const [features, setFeatures] = useState<SecurityFeature[]>([
    {
      id: "2fa",
      name: "Two-Factor Authentication",
      description: "Require a code from your phone for every login",
      enabled: true,
      recommended: true,
      icon: <Smartphone className="h-4 w-4" />
    },
    {
      id: "biometric",
      name: "Biometric Login",
      description: "Use Face ID or fingerprint for quick, secure access",
      enabled: false,
      recommended: true,
      icon: <Fingerprint className="h-4 w-4" />
    },
    {
      id: "whitelist",
      name: "Withdrawal Whitelist",
      description: "Only allow withdrawals to pre-approved addresses",
      enabled: true,
      recommended: true,
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: "alerts",
      name: "Real-Time Alerts",
      description: "Get notified instantly of any account activity",
      enabled: true,
      recommended: true,
      icon: <Bell className="h-4 w-4" />
    },
    {
      id: "antiPhishing",
      name: "Anti-Phishing Code",
      description: "Personal code in all our emails to verify authenticity",
      enabled: false,
      recommended: true,
      icon: <Eye className="h-4 w-4" />
    },
    {
      id: "timelock",
      name: "24-Hour Withdrawal Delay",
      description: "New withdrawal addresses require 24-hour cooling period",
      enabled: false,
      recommended: false,
      icon: <Clock className="h-4 w-4" />
    }
  ]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      action: "Login",
      device: "iPhone 15 Pro",
      location: "New York, US",
      time: new Date(Date.now() - 1000 * 60 * 5),
      suspicious: false
    },
    {
      id: "2",
      action: "Withdrawal Request",
      device: "Chrome on MacOS",
      location: "New York, US",
      time: new Date(Date.now() - 1000 * 60 * 60 * 2),
      suspicious: false
    },
    {
      id: "3",
      action: "2FA Enabled",
      device: "Chrome on MacOS",
      location: "New York, US",
      time: new Date(Date.now() - 1000 * 60 * 60 * 24),
      suspicious: false
    }
  ]);

  useEffect(() => {
    const enabledCount = features.filter(f => f.enabled).length;
    const recommendedEnabled = features.filter(f => f.recommended && f.enabled).length;
    const recommendedTotal = features.filter(f => f.recommended).length;
    const score = Math.round((enabledCount / features.length) * 50 + (recommendedEnabled / recommendedTotal) * 50);
    setSecurityScore(score);
  }, [features]);

  const toggleFeature = (id: string) => {
    setFeatures(prev => prev.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const getScoreColor = () => {
    if (securityScore >= 80) return "text-green-400";
    if (securityScore >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = () => {
    if (securityScore >= 80) return "Excellent";
    if (securityScore >= 60) return "Good";
    if (securityScore >= 40) return "Fair";
    return "Needs Improvement";
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6" data-testid="security-center">
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" />
            Security Center
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your protection is our priority. Manage your security settings here.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative">
              <svg className="w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${securityScore * 3.52} 352`}
                  strokeLinecap="round"
                  className={getScoreColor()}
                  transform="rotate(-90 64 64)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor()}`} data-testid="security-score">{securityScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-semibold ${getScoreColor()}`}>{getScoreLabel()}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {securityScore < 80 
                  ? "Enable more security features to protect your assets."
                  : "Great job! Your account is well protected."
                }
              </p>
              {securityScore < 100 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  data-testid="improve-security-btn"
                  onClick={() => {
                    const firstDisabled = features.find(f => f.recommended && !f.enabled);
                    if (firstDisabled) toggleFeature(firstDisabled.id);
                  }}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Improve Security
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {features.map((feature) => (
            <div 
              key={feature.id}
              className="flex items-center justify-between p-4 bg-card/30 rounded-lg border border-border/30"
              data-testid={`feature-${feature.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${feature.enabled ? "bg-green-500/20" : "bg-slate-800"}`}>
                  {feature.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{feature.name}</span>
                    {feature.recommended && (
                      <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/50">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                </div>
              </div>
              <Switch 
                checked={feature.enabled}
                onCheckedChange={() => toggleFeature(feature.id)}
                data-testid={`toggle-${feature.id}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.map((activity) => (
            <div 
              key={activity.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                activity.suspicious 
                  ? "bg-red-500/10 border-red-500/30" 
                  : "bg-card/30 border-border/30"
              }`}
              data-testid={`activity-${activity.id}`}
            >
              <div className="flex items-center gap-3">
                {activity.suspicious ? (
                  <ShieldAlert className="h-5 w-5 text-red-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
                <div>
                  <div className="font-medium text-sm">{activity.action}</div>
                  <div className="text-xs text-muted-foreground">
                    {activity.device} • {activity.location}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(activity.time)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-green-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-green-400">We Never Call You</h4>
            <p className="text-sm text-muted-foreground mt-1">
              CODEX will NEVER call or message you asking for your password, 2FA codes, or seed phrase. 
              Anyone claiming to be CODEX support asking for this info is a scammer. 
              Report suspicious contact immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
