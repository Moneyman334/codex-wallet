import { useState, useEffect } from 'react';

export interface TradingPreferences {
  defaultTradingPair: string;
  defaultOrderType: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  favoritePairs: string[];
  soundEnabled: boolean;
  confirmTransactions: boolean;
  priceAlerts: boolean;
}

export interface DisplayPreferences {
  compactMode: boolean;
  showAdvancedStats: boolean;
  chartType: 'line' | 'candle';
  refreshInterval: number;
}

export interface SecurityPreferences {
  requireConfirmation: boolean;
  showSecurityAlerts: boolean;
  autoLockTimeout: number;
}

export interface UserPreferences {
  trading: TradingPreferences;
  display: DisplayPreferences;
  security: SecurityPreferences;
}

const defaultPreferences: UserPreferences = {
  trading: {
    defaultTradingPair: 'BTC-USD',
    defaultOrderType: 'market',
    favoritePairs: ['BTC-USD', 'ETH-USD'],
    soundEnabled: true,
    confirmTransactions: true,
    priceAlerts: true,
  },
  display: {
    compactMode: false,
    showAdvancedStats: true,
    chartType: 'line',
    refreshInterval: 5000,
  },
  security: {
    requireConfirmation: true,
    showSecurityAlerts: true,
    autoLockTimeout: 300000,
  },
};

const STORAGE_KEY = 'codex_user_preferences';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    return defaultPreferences;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, [preferences]);

  const updateTradingPreferences = (updates: Partial<TradingPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      trading: { ...prev.trading, ...updates },
    }));
  };

  const updateDisplayPreferences = (updates: Partial<DisplayPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      display: { ...prev.display, ...updates },
    }));
  };

  const updateSecurityPreferences = (updates: Partial<SecurityPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      security: { ...prev.security, ...updates },
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  const addFavoritePair = (pair: string) => {
    setPreferences(prev => ({
      ...prev,
      trading: {
        ...prev.trading,
        favoritePairs: [...new Set([...prev.trading.favoritePairs, pair])],
      },
    }));
  };

  const removeFavoritePair = (pair: string) => {
    setPreferences(prev => ({
      ...prev,
      trading: {
        ...prev.trading,
        favoritePairs: prev.trading.favoritePairs.filter(p => p !== pair),
      },
    }));
  };

  return {
    preferences,
    updateTradingPreferences,
    updateDisplayPreferences,
    updateSecurityPreferences,
    resetPreferences,
    addFavoritePair,
    removeFavoritePair,
  };
}
