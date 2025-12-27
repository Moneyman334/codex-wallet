import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

// Generate a unique session ID
function getSessionId(): string {
  const STORAGE_KEY = 'visitor_session_id';
  let sessionId = sessionStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

// Track page view to backend
async function trackPageView(path: string, title?: string) {
  const sessionId = getSessionId();
  
  try {
    await fetch('/api/analytics/track-pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        path,
        title: title || document.title,
        referrer: document.referrer
      }),
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

// Track custom event to backend
export async function trackEvent(
  eventType: string,
  eventCategory: string,
  eventLabel?: string,
  eventValue?: string,
  metadata?: any
) {
  const sessionId = getSessionId();
  const path = window.location.pathname;
  
  try {
    await fetch('/api/analytics/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        eventType,
        eventCategory,
        eventLabel,
        eventValue,
        path,
        metadata
      }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Hook to track page views automatically
export function usePageTracking(customPath?: string) {
  const [location] = useLocation();
  const path = customPath || location;
  const sessionStartTime = useRef<number>(Date.now());
  
  useEffect(() => {
    // Track page view when component mounts or path changes
    trackPageView(path);
    
    // Track session duration and end session on unmount
    return () => {
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      // End session on page unload
      navigator.sendBeacon('/api/analytics/end-session', JSON.stringify({
        sessionId: getSessionId(),
        duration
      }));
    };
  }, [path]);
}
