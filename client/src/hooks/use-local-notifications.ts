import { LocalNotifications, ScheduleOptions, PendingResult } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback, useEffect } from 'react';

export interface NotificationPermission {
  granted: boolean;
  isNative: boolean;
}

export function useLocalNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    isNative: Capacitor.isNativePlatform(),
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setPermission({ granted: false, isNative: false });
      setIsLoading(false);
      return;
    }

    try {
      const result = await LocalNotifications.checkPermissions();
      setPermission({
        granted: result.display === 'granted',
        isNative: true,
      });
    } catch (error) {
      console.debug('Failed to check notification permissions:', error);
      setPermission({ granted: false, isNative: true });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      setPermission({ granted, isNative: true });
      return granted;
    } catch (error) {
      console.debug('Failed to request notification permissions:', error);
      return false;
    }
  }, []);

  const scheduleNotification = useCallback(async (options: {
    id: number;
    title: string;
    body: string;
    schedule?: { at: Date };
    extra?: Record<string, unknown>;
  }): Promise<boolean> => {
    if (!Capacitor.isNativePlatform() || !permission.granted) {
      return false;
    }

    try {
      const scheduleOptions: ScheduleOptions = {
        notifications: [
          {
            id: options.id,
            title: options.title,
            body: options.body,
            schedule: options.schedule,
            extra: options.extra,
          },
        ],
      };

      await LocalNotifications.schedule(scheduleOptions);
      return true;
    } catch (error) {
      console.debug('Failed to schedule notification:', error);
      return false;
    }
  }, [permission.granted]);

  const scheduleTransactionNotification = useCallback(async (
    txHash: string,
    type: 'sent' | 'received' | 'swap' | 'stake',
    amount: string,
    symbol: string
  ): Promise<boolean> => {
    const titles: Record<string, string> = {
      sent: 'Transaction Sent',
      received: 'Payment Received',
      swap: 'Swap Complete',
      stake: 'Staking Confirmed',
    };

    const bodies: Record<string, string> = {
      sent: `You sent ${amount} ${symbol}`,
      received: `You received ${amount} ${symbol}`,
      swap: `Swapped ${amount} ${symbol}`,
      stake: `Staked ${amount} ${symbol}`,
    };

    return scheduleNotification({
      id: Date.now(),
      title: titles[type] || 'Transaction Update',
      body: bodies[type] || `Transaction: ${amount} ${symbol}`,
      extra: { txHash, type },
    });
  }, [scheduleNotification]);

  const schedulePriceAlert = useCallback(async (
    symbol: string,
    price: string,
    direction: 'up' | 'down'
  ): Promise<boolean> => {
    return scheduleNotification({
      id: Date.now(),
      title: `${symbol} Price Alert`,
      body: `${symbol} is ${direction === 'up' ? '📈 up' : '📉 down'} to $${price}`,
      extra: { symbol, price, direction },
    });
  }, [scheduleNotification]);

  const getPendingNotifications = useCallback(async (): Promise<PendingResult | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      return await LocalNotifications.getPending();
    } catch (error) {
      console.debug('Failed to get pending notifications:', error);
      return null;
    }
  }, []);

  const cancelNotification = useCallback(async (id: number): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      return true;
    } catch (error) {
      console.debug('Failed to cancel notification:', error);
      return false;
    }
  }, []);

  const cancelAllNotifications = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      return true;
    } catch (error) {
      console.debug('Failed to cancel all notifications:', error);
      return false;
    }
  }, []);

  return {
    permission,
    isLoading,
    requestPermission,
    scheduleNotification,
    scheduleTransactionNotification,
    schedulePriceAlert,
    getPendingNotifications,
    cancelNotification,
    cancelAllNotifications,
    refreshPermission: checkPermission,
  };
}
