export class SafeStorage {
  static get(key: string, defaultValue: any = null): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Failed to read from localStorage: ${key}`, e);
      return defaultValue;
    }
  }

  static set(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Failed to write to localStorage: ${key}`, e);
      return false;
    }
  }

  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Failed to remove from localStorage: ${key}`, e);
      return false;
    }
  }

  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Failed to clear localStorage', e);
      return false;
    }
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true, onRetry } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
        
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }
        
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const networkErrors = [
    'network error',
    'failed to fetch',
    'network request failed',
    'networkerror',
    'timeout',
    'connection',
    'econnrefused',
    'enotfound',
  ];
  
  return networkErrors.some(err => message.includes(err));
}

export function createSafeInterval(
  callback: () => void,
  intervalMs: number
): () => void {
  let intervalId: number | null = null;
  let isRunning = true;

  const wrappedCallback = () => {
    if (!isRunning) return;
    
    try {
      callback();
    } catch (error) {
      console.error('Error in interval callback:', error);
    }
  };

  intervalId = window.setInterval(wrappedCallback, intervalMs);

  return () => {
    isRunning = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export function createSafeTimeout(
  callback: () => void,
  delayMs: number
): () => void {
  let timeoutId: number | null = null;
  let isCancelled = false;

  const wrappedCallback = () => {
    if (isCancelled) return;
    
    try {
      callback();
    } catch (error) {
      console.error('Error in timeout callback:', error);
    }
  };

  timeoutId = window.setTimeout(wrappedCallback, delayMs);

  return () => {
    isCancelled = true;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}

export class MemoryLeakDetector {
  private static intervals = new Set<number>();
  private static timeouts = new Set<number>();

  static trackInterval(id: number) {
    this.intervals.add(id);
  }

  static trackTimeout(id: number) {
    this.timeouts.add(id);
  }

  static clearInterval(id: number) {
    window.clearInterval(id);
    this.intervals.delete(id);
  }

  static clearTimeout(id: number) {
    window.clearTimeout(id);
    this.timeouts.delete(id);
  }

  static cleanup() {
    this.intervals.forEach(id => window.clearInterval(id));
    this.timeouts.forEach(id => window.clearTimeout(id));
    this.intervals.clear();
    this.timeouts.clear();
  }

  static getStats() {
    return {
      activeIntervals: this.intervals.size,
      activeTimeouts: this.timeouts.size,
    };
  }
}

export function handleAsyncError(error: any, context: string): void {
  console.error(`Async error in ${context}:`, error);
  
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      error: error?.toString() || 'Unknown error',
      stack: error?.stack,
      isNetworkError: isNetworkError(error),
    };
    
    const asyncErrors = SafeStorage.get('async_errors', []);
    asyncErrors.push(errorLog);
    if (asyncErrors.length > 50) asyncErrors.shift();
    SafeStorage.set('async_errors', asyncErrors);
  } catch (e) {
    console.error('Failed to log async error:', e);
  }
}
