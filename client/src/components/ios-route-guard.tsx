import { Capacitor } from '@capacitor/core';
import { Redirect } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Shield, ArrowLeft, Globe, Smartphone, ExternalLink } from 'lucide-react';
import { isHiddenOnIOS } from '@/lib/ios-lite-config';
import { ReactNode } from 'react';

// Detect iOS ONLY when running as native Capacitor app
// Do NOT block Safari browser on iOS - website should be fully accessible
function detectIsIOS(): boolean {
  // Only block when running as native iOS app via Capacitor
  // This allows the website to work fully on iPhone Safari
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    return true;
  }
  return false;
}

interface IOSRouteGuardProps {
  children: ReactNode;
  featureId: string;
}

export function IOSRouteGuard({ children, featureId }: IOSRouteGuardProps) {
  const isIOS = detectIsIOS();
  
  if (isIOS && isHiddenOnIOS(featureId)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Feature Not Available</h2>
            <p className="text-muted-foreground mb-4">
              Due to App Store guidelines, trading and DeFi features are not available in the iOS app.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Access full features on our web platform or Android app:
            </p>
            
            <div className="space-y-3 mb-6">
              <a 
                href="https://getcodexpay.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="button-open-web-full">
                  <Globe className="h-4 w-4 mr-2" />
                  Open Web App
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=com.omniversesyndicate.codex" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full border-purple-500/50" data-testid="button-get-android-full">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Get Android App
                </Button>
              </a>
            </div>
            
            <Link href="/">
              <Button variant="ghost" className="w-full" data-testid="button-go-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return <>{children}</>;
}

export function useIOSRouteRedirect() {
  const isIOS = detectIsIOS();
  return { isIOS, shouldRedirect: isIOS };
}
