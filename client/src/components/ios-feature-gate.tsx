import { useIOSLite } from '@/hooks/use-ios-lite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Smartphone, Lock } from 'lucide-react';

interface IOSFeatureGateProps {
  feature: string;
  featureTitle?: string;
  children: React.ReactNode;
}

export function IOSFeatureGate({ feature, featureTitle, children }: IOSFeatureGateProps) {
  const { isIOSLite, isFeatureAllowed } = useIOSLite();

  if (!isIOSLite || isFeatureAllowed(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-xl">
            {featureTitle || 'Feature Coming Soon'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This feature is available on our full platform. For the complete CODEX Wallet experience including trading, staking, and more:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <Globe className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <p className="font-medium text-sm">Visit Our Website</p>
                <p className="text-xs text-muted-foreground">getcodexpay.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <Smartphone className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <p className="font-medium text-sm">Android App</p>
                <p className="text-xs text-muted-foreground">Full features on Google Play</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => window.history.back()}
            data-testid="button-go-back"
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function IOSLiteBanner() {
  const { isIOSLite } = useIOSLite();

  if (!isIOSLite) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30 px-4 py-2">
      <p className="text-center text-sm text-purple-200">
        <Smartphone className="w-4 h-4 inline mr-2" />
        iOS Wallet Companion - View balances, track prices, receive payments
      </p>
    </div>
  );
}
