import { useState, useEffect, useCallback } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  const checkNativeNetwork = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsOnline(navigator.onLine);
      return;
    }

    try {
      const status: ConnectionStatus = await Network.getStatus();
      setIsOnline(status.connected);
      setConnectionType(status.connectionType);
    } catch (error) {
      console.debug('Failed to check network status:', error);
      setIsOnline(true);
    }
  }, []);

  useEffect(() => {
    checkNativeNetwork();

    if (Capacitor.isNativePlatform()) {
      const listener = Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        const wasOnline = isOnline;
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);

        if (!status.connected) {
          setWasOffline(true);
          console.warn('⚠️ Connection lost');
        } else if (wasOnline === false) {
          console.log('✅ Connection restored');
          window.location.reload();
        }
      });

      return () => {
        listener.then(l => l.remove());
      };
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        console.log('✅ Connection restored');
        window.location.reload();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.warn('⚠️ Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, isOnline, checkNativeNetwork]);

  return { isOnline, wasOffline, connectionType };
}
