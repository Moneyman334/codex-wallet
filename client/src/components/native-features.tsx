import { useNetwork } from "@/hooks/use-network";
import { useAppLifecycle } from "@/hooks/use-app-lifecycle";
import { useLocalNotifications } from "@/hooks/use-local-notifications";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";
import { useEffect } from "react";

export function OfflineIndicator() {
  const { isOffline, isNative } = useNetwork();

  if (!isOffline) return null;

  return (
    <Alert 
      variant="destructive" 
      className="fixed top-0 left-0 right-0 z-50 rounded-none border-x-0 border-t-0"
      data-testid="offline-indicator"
    >
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're offline. Some features may not work correctly.
      </AlertDescription>
    </Alert>
  );
}

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const { isActive, lastResumeTime, deepLinkUrl, clearDeepLink } = useAppLifecycle();
  const { permission, requestPermission } = useLocalNotifications();

  useEffect(() => {
    if (permission.isNative && !permission.granted) {
      requestPermission();
    }
  }, [permission.isNative, permission.granted, requestPermission]);

  useEffect(() => {
    if (deepLinkUrl) {
      console.log('Deep link received:', deepLinkUrl);
      clearDeepLink();
    }
  }, [deepLinkUrl, clearDeepLink]);

  useEffect(() => {
    if (lastResumeTime) {
      console.debug('App resumed at:', new Date(lastResumeTime).toISOString());
    }
  }, [lastResumeTime]);

  return <>{children}</>;
}
