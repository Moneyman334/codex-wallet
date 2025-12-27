import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Users, DollarSign, Target, CheckCircle, 
  Clock, XCircle, Mail, Key, Activity 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type BetaSignup = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  website: string | null;
  monthlyVolume: string;
  businessType: string;
  useCase: string;
  status: string;
  notes: string | null;
  approvedAt: string | null;
  convertedToMerchantId: string | null;
  createdAt: string;
};

type Merchant = {
  id: string;
  businessName: string;
  businessEmail: string;
  verificationStatus: string;
  isActive: string;
  createdAt: string;
};

export default function MerchantAcquisitionDashboard() {
  const { data: signupsData, isLoading: loadingSignups } = useQuery<{ signups: BetaSignup[]; total: number }>({
    queryKey: ["/api/codex-pay/beta-signups"],
  });

  const { data: merchantsData, isLoading: loadingMerchants } = useQuery<Merchant[]>({
    queryKey: ["/api/codex-pay/merchants"],
  });

  const signups = signupsData?.signups || [];
  const merchants = merchantsData || [];
  
  // Calculate metrics
  const totalSignups = signups.length;
  // Count only beta auto-approved merchants (those with convertedToMerchantId filled - treat empty string as null)
  const autoApprovedCount = signups.filter(s => s.convertedToMerchantId && s.convertedToMerchantId !== '').length;
  const conversionRate = totalSignups > 0 ? (autoApprovedCount / totalSignups) * 100 : 0;
  
  // Revenue projections (assuming $50k avg monthly volume per merchant)
  const avgMonthlyVolumePerMerchant = 50000;
  const feePercentage = 0.005; // 0.5%
  const projectedMonthlyRevenue = autoApprovedCount * avgMonthlyVolumePerMerchant * feePercentage;
  const projectedAnnualRevenue = projectedMonthlyRevenue * 12;
  
  // Get recent signups (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSignups = signups.filter(s => new Date(s.createdAt) > sevenDaysAgo);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6" data-testid="merchant-dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white dark:text-white flex items-center gap-3">
              <Target className="w-10 h-10 text-purple-400" />
              Merchant Acquisition Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Track beta signups, conversions, and revenue projections
            </p>
          </div>
          <Badge variant="outline" className="text-purple-300 border-purple-500/50 px-4 py-2">
            <Activity className="w-4 h-4 mr-2" />
            Live Data
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Signups */}
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border-blue-500/30" data-testid="total-signups-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white dark:text-white" data-testid="total-signups">{totalSignups}</div>
              <p className="text-xs text-gray-400 mt-1">
                {recentSignups.length} in last 7 days
              </p>
            </CardContent>
          </Card>

          {/* Auto-Approved */}
          <Card className="bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-500/30" data-testid="auto-approved-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Auto-Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white dark:text-white" data-testid="auto-approved">{autoApprovedCount}</div>
              <p className="text-xs text-gray-400 mt-1">
                {10 - autoApprovedCount} slots remaining
              </p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border-purple-500/30" data-testid="conversion-rate-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white dark:text-white" data-testid="conversion-rate">{conversionRate.toFixed(0)}%</div>
              <p className="text-xs text-gray-400 mt-1">
                Signup to merchant
              </p>
            </CardContent>
          </Card>

          {/* Projected Revenue */}
          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-900/5 border-yellow-500/30" data-testid="revenue-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white dark:text-white" data-testid="monthly-revenue">
                {formatCurrency(projectedMonthlyRevenue)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatCurrency(projectedAnnualRevenue)}/year projected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signups */}
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Recent Beta Signups
            </CardTitle>
            <CardDescription className="text-gray-400">
              Latest merchant applications (showing last 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSignups ? (
              <div className="text-center py-8 text-gray-400">Loading signups...</div>
            ) : signups.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No signups yet</div>
            ) : (
              <div className="space-y-3">
                {signups.slice(0, 10).map((signup) => (
                  <div
                    key={signup.id}
                    className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-purple-500/50 transition-colors"
                    data-testid={`signup-${signup.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white dark:text-white">{signup.businessName}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {signup.contactName} • {signup.email}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {signup.monthlyVolume}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {signup.businessType}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {signup.convertedToMerchantId ? (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Auto-Approved
                          </Badge>
                        ) : signup.status === 'pending' ? (
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            <XCircle className="w-3 h-3 mr-1" />
                            {signup.status}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(signup.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Merchants */}
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-green-400" />
              Active Merchants (Auto-Approved)
            </CardTitle>
            <CardDescription className="text-gray-400">
              Merchants with API keys and active accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMerchants ? (
              <div className="text-center py-8 text-gray-400">Loading merchants...</div>
            ) : merchants.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No active merchants yet</div>
            ) : (
              <div className="space-y-3">
                {merchants.filter(m => m.verificationStatus === 'approved').map((merchant) => (
                  <div
                    key={merchant.id}
                    className="p-4 rounded-lg bg-green-900/10 border border-green-500/30 hover:border-green-500/50 transition-colors"
                    data-testid={`merchant-${merchant.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white dark:text-white flex items-center gap-2">
                          {merchant.businessName}
                          {merchant.isActive === 'true' && (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                              Active
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">{merchant.businessEmail}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <Key className="w-3 h-3 mr-1" />
                          API Keys Issued
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(merchant.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile App Promo for Merchants */}
        <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Mobile App Launching Soon
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage your CODEX Pay merchant account on Android & iOS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Monitor transactions in real-time
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Manage settlements and payouts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    View analytics and revenue reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Push notifications for new payments
                  </li>
                </ul>
                <div className="flex gap-3 mt-4">
                  <Badge className="bg-black/40 border-gray-700 opacity-50">
                    Google Play - Coming Soon
                  </Badge>
                  <Badge className="bg-black/40 border-gray-700 opacity-50">
                    App Store - Coming Soon
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Goal: First 10 Merchants
            </CardTitle>
            <CardDescription className="text-gray-400">
              Track progress toward auto-approval milestone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Progress</span>
                  <span className="text-purple-300 font-semibold">{autoApprovedCount} / 10 merchants</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${(autoApprovedCount / 10) * 100}%` }}
                    data-testid="progress-bar"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 rounded-lg bg-slate-800/30">
                  <p className="text-2xl font-bold text-white dark:text-white">{10 - autoApprovedCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Slots Remaining</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800/30">
                  <p className="text-2xl font-bold text-white dark:text-white">{formatCurrency(projectedMonthlyRevenue)}</p>
                  <p className="text-xs text-gray-400 mt-1">Current MRR</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800/30">
                  <p className="text-2xl font-bold text-white dark:text-white">{formatCurrency((10 * avgMonthlyVolumePerMerchant * feePercentage))}</p>
                  <p className="text-xs text-gray-400 mt-1">Target MRR (10 merchants)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
