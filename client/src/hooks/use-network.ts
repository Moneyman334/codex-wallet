import { Network, ConnectionStatus, ConnectionType } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback, useEffect } from 'react';

export interface NetworkState {
  isConnected: boolean;
  connectionType: ConnectionType;
  isNative: boolean;
}

export function useNetwork() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    connectionType: 'unknown' as ConnectionType,
    isNative: Capacitor.isNativePlatform(),
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setNetworkState({
        isConnected: navigator.onLine,
        connectionType: 'unknown' as ConnectionType,
        isNative: false,
      });
      setIsLoading(false);
      return;
    }

    try {
      const status: ConnectionStatus = await Network.getStatus();
      setNetworkState({
        isConnected: status.connected,
        connectionType: status.connectionType,
        isNative: true,
      });
    } catch (error) {
      console.debug('Failed to check network status:', error);
      setNetworkState({
        isConnected: true,
        connectionType: 'unknown' as ConnectionType,
        isNative: true,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkStatus();

    if (Capacitor.isNativePlatform()) {
      const listener = Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        setNetworkState({
          isConnected: status.connected,
          connectionType: status.connectionType,
          isNative: true,
        });
      });

      return () => {
        listener.then(l => l.remove());
      };
    } else {
      const handleOnline = () => setNetworkState(prev => ({ ...prev, isConnected: true }));
      const handleOffline = () => setNetworkState(prev => ({ ...prev, isConnected: false }));

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [checkStatus]);

  const isWifi = networkState.connectionType === 'wifi';
  const isCellular = networkState.connectionType === 'cellular';
  const isOffline = !networkState.isConnected;

  return {
    ...networkState,
    isLoading,
    isWifi,
    isCellular,
    isOffline,
    refreshStatus: checkStatus,
  };
}
