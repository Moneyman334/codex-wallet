import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useCallback, useMemo } from 'react';

export function useHaptics() {
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);

  const impact = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }, [isNative]);

  const lightImpact = useCallback(async () => {
    await impact(ImpactStyle.Light);
  }, [impact]);

  const mediumImpact = useCallback(async () => {
    await impact(ImpactStyle.Medium);
  }, [impact]);

  const heavyImpact = useCallback(async () => {
    await impact(ImpactStyle.Heavy);
  }, [impact]);

  const notification = useCallback(async (type: NotificationType = NotificationType.Success) => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.debug('Haptic notification not available:', error);
    }
  }, [isNative]);

  const successNotification = useCallback(async () => {
    await notification(NotificationType.Success);
  }, [notification]);

  const warningNotification = useCallback(async () => {
    await notification(NotificationType.Warning);
  }, [notification]);

  const errorNotification = useCallback(async () => {
    await notification(NotificationType.Error);
  }, [notification]);

  const selectionChanged = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.debug('Haptic selection not available:', error);
    }
  }, [isNative]);

  const selectionStart = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.debug('Haptic selection start not available:', error);
    }
  }, [isNative]);

  const selectionEnd = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.debug('Haptic selection end not available:', error);
    }
  }, [isNative]);

  const vibrate = useCallback(async (duration: number = 300) => {
    if (!isNative) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.debug('Vibration not available:', error);
    }
  }, [isNative]);

  return {
    isNative,
    impact,
    lightImpact,
    mediumImpact,
    heavyImpact,
    notification,
    successNotification,
    warningNotification,
    errorNotification,
    selectionChanged,
    selectionStart,
    selectionEnd,
    vibrate,
  };
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'medium') {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    switch (type) {
      case 'light':
        Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        Haptics.notification({ type: NotificationType.Error });
        break;
      case 'selection':
        Haptics.selectionChanged();
        break;
    }
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}
