import { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { isFeatureAllowedOnIOS, isRouteAllowedOnIOS, getIOSLiteMessage } from '@/lib/ios-lite-config';

export interface IOSLiteState {
  isIOSLite: boolean;
  isNative: boolean;
  platform: string;
  isFeatureAllowed: (feature: string) => boolean;
  isRouteAllowed: (route: string) => boolean;
  getLiteMessage: () => string;
}

export function useIOSLite(): IOSLiteState {
  const platform = useMemo(() => Capacitor.getPlatform(), []);
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
  const isIOSLite = useMemo(() => platform === 'ios', [platform]);

  return {
    isIOSLite,
    isNative,
    platform,
    isFeatureAllowed: isFeatureAllowedOnIOS,
    isRouteAllowed: isRouteAllowedOnIOS,
    getLiteMessage: getIOSLiteMessage,
  };
}
