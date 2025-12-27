import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/hooks/use-haptics';

interface EnhancedOfflineBannerProps {
  onRetry?: () => void;
  showCachedDataHint?: boolean;
}

export function EnhancedOfflineBanner({ 
  onRetry, 
  showCachedDataHint = true 
}: EnhancedOfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    const checkConnection = async () => {
      if (isNative) {
        try {
          const status = await Network.getStatus();
          setIsOnline(status.connected);
          setConnectionType(status.connectionType);
        } catch (error) {
          console.debug('Network check failed:', error);
        }
      } else {
        setIsOnline(navigator.onLine);
      }
    };

    checkConnection();

    if (isNative) {
      let listener: { remove: () => void } | null = null;
      
      Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
        
        if (status.connected) {
          triggerHaptic('success');
        } else {
          triggerHaptic('warning');
        }
      }).then(handle => {
        listener = handle;
      });

      return () => {
        listener?.remove();
      };
    } else {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleRetry = async () => {
    triggerHaptic('light');
    setIsRetrying(true);

    if (Capacitor.isNativePlatform()) {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    } else {
      setIsOnline(navigator.onLine);
    }

    if (onRetry) {
      await onRetry();
    }

    setTimeout(() => setIsRetrying(false), 1000);
  };

  if (isOnline) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[90] safe-area-top"
        data-testid="offline-banner"
      >
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">You're Offline</p>
                {showCachedDataHint && (
                  <p className="text-sm text-white/80">Viewing cached data</p>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="text-white hover:bg-white/20"
              data-testid="retry-connection-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ConnectionStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    const checkConnection = async () => {
      if (isNative) {
        try {
          const status = await Network.getStatus();
          setIsOnline(status.connected);
          setConnectionType(status.connectionType);
        } catch (error) {
          console.debug('Network check failed:', error);
        }
      } else {
        setIsOnline(navigator.onLine);
      }
    };

    checkConnection();

    if (isNative) {
      let listener: { remove: () => void } | null = null;
      
      Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      }).then(handle => {
        listener = handle;
      });

      return () => {
        listener?.remove();
      };
    } else {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <div 
      className={`flex items-center gap-2 text-sm ${
        isOnline ? 'text-green-500' : 'text-amber-500'
      }`}
      data-testid="connection-status-indicator"
    >
      {isOnline ? (
        <>
          <Cloud className="w-4 h-4" />
          <span>Connected</span>
          {connectionType !== 'unknown' && connectionType !== 'none' && (
            <span className="text-gray-500">({connectionType})</span>
          )}
        </>
      ) : (
        <>
          <CloudOff className="w-4 h-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

export function OfflineDataBadge({ isFromCache }: { isFromCache: boolean }) {
  if (!isFromCache) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-medium"
      data-testid="offline-data-badge"
    >
      <CloudOff className="w-3 h-3" />
      <span>Cached</span>
    </motion.div>
  );
}
