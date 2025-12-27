import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = 'offline_cache_';
const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

export function useOfflineCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
  } = {}
) {
  const { ttl = DEFAULT_TTL, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const cacheKey = `${CACHE_PREFIX}${key}`;

  const getCachedData = useCallback(async (): Promise<CacheEntry<T> | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: cacheKey });
        if (result.value) {
          return JSON.parse(result.value) as CacheEntry<T>;
        }
      } else {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached) as CacheEntry<T>;
        }
      }
    } catch (err) {
      console.warn('Failed to read cache:', err);
    }
    return null;
  }, [cacheKey]);

  const setCachedData = useCallback(async (newData: T) => {
    const entry: CacheEntry<T> = {
      data: newData,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({
          key: cacheKey,
          value: JSON.stringify(entry),
        });
      } else {
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      }
    } catch (err) {
      console.warn('Failed to write cache:', err);
    }
  }, [cacheKey, ttl]);

  const clearCache = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: cacheKey });
      } else {
        localStorage.removeItem(cacheKey);
      }
    } catch (err) {
      console.warn('Failed to clear cache:', err);
    }
  }, [cacheKey]);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const freshData = await fetchFn();
      setData(freshData);
      setIsFromCache(false);
      await setCachedData(freshData);
    } catch (err) {
      const cachedEntry = await getCachedData();
      if (cachedEntry) {
        setData(cachedEntry.data);
        setIsFromCache(true);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetchFn, getCachedData, setCachedData]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      const cachedEntry = await getCachedData();
      
      if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
        setData(cachedEntry.data);
        setIsFromCache(true);
        setIsLoading(false);
        refetch();
        return;
      }

      await refetch();
    };

    loadData();
  }, [enabled, key]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    refetch,
    clearCache,
  };
}

export async function clearAllOfflineCache() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { keys } = await Preferences.keys();
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          await Preferences.remove({ key });
        }
      }
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (err) {
    console.warn('Failed to clear all cache:', err);
  }
}

export async function getCacheSize(): Promise<number> {
  let totalSize = 0;
  try {
    if (Capacitor.isNativePlatform()) {
      const { keys } = await Preferences.keys();
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          const result = await Preferences.get({ key });
          if (result.value) {
            totalSize += result.value.length * 2; // approximate bytes
          }
        }
      }
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length * 2;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to calculate cache size:', err);
  }
  return totalSize;
}
