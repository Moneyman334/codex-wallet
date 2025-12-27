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

// Global component to track all page views
export function PageTracker() {
  const [location] = useLocation();
  const sessionStartTime = useRef<number>(Date.now());
  
  useEffect(() => {
    // Track page view when path changes
    trackPageView(location);
    
    // Update session start time for duration tracking
    sessionStartTime.current = Date.now();
  }, [location]);
  
  useEffect(() => {
    // Track session duration and end session on unmount (page unload)
    const handleBeforeUnload = () => {
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      // End session on page unload
      navigator.sendBeacon('/api/analytics/end-session', JSON.stringify({
        sessionId: getSessionId(),
        duration
      }));
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  return null; // This component doesn't render anything
}
