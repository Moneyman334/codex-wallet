import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback, useEffect } from 'react';

export interface AppState {
  isActive: boolean;
  isNative: boolean;
  lastResumeTime: number | null;
  lastPauseTime: number | null;
}

export function useAppLifecycle() {
  const [appState, setAppState] = useState<AppState>({
    isActive: true,
    isNative: Capacitor.isNativePlatform(),
    lastResumeTime: null,
    lastPauseTime: null,
  });
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      const handleVisibilityChange = () => {
        const isActive = !document.hidden;
        setAppState(prev => ({
          ...prev,
          isActive,
          ...(isActive ? { lastResumeTime: Date.now() } : { lastPauseTime: Date.now() }),
        }));
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    const stateListener = App.addListener('appStateChange', ({ isActive }) => {
      setAppState(prev => ({
        ...prev,
        isActive,
        ...(isActive ? { lastResumeTime: Date.now() } : { lastPauseTime: Date.now() }),
      }));
    });

    const urlListener = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      setDeepLinkUrl(event.url);
    });

    return () => {
      stateListener.then(l => l.remove());
      urlListener.then(l => l.remove());
    };
  }, []);

  const exitApp = useCallback(async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await App.exitApp();
    } catch (error) {
      console.debug('Failed to exit app:', error);
    }
  }, []);

  const getAppInfo = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      return await App.getInfo();
    } catch (error) {
      console.debug('Failed to get app info:', error);
      return null;
    }
  }, []);

  const getLaunchUrl = useCallback(async (): Promise<string | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const result = await App.getLaunchUrl();
      return result?.url || null;
    } catch (error) {
      console.debug('Failed to get launch URL:', error);
      return null;
    }
  }, []);

  const clearDeepLink = useCallback(() => {
    setDeepLinkUrl(null);
  }, []);

  return {
    ...appState,
    deepLinkUrl,
    exitApp,
    getAppInfo,
    getLaunchUrl,
    clearDeepLink,
  };
}
