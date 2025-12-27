import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      toast({
        title: "Back online",
        description: "Your connection has been restored",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      toast({
        title: "Connection lost",
        description: "You're currently offline. Some features may not work.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically
    const interval = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        setIsOnline(currentStatus);
        if (!currentStatus) {
          handleOffline();
        } else {
          handleOnline();
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, toast]);

  return (
    <>
      {/* Status Badge in UI */}
      <Badge 
        variant={isOnline ? "default" : "destructive"} 
        className="gap-2"
        data-testid="network-status-badge"
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
      </Badge>

      {/* Offline Banner */}
      <AnimatePresence>
        {showBanner && !isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm font-medium shadow-lg"
            data-testid="offline-banner"
          >
            <div className="flex items-center justify-center space-x-2">
              <WifiOff className="h-4 w-4" />
              <span>You're offline. Some features may not work until connection is restored.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
