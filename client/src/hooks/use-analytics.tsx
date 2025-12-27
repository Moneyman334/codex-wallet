import { useState, useEffect, useCallback } from 'react';

export interface AnalyticsEvent {
  eventType: string;
  eventCategory: string;
  eventData?: any;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface PageView {
  path: string;
  timestamp: number;
  duration?: number;
}

export interface UserAction {
  action: string;
  category: string;
  value?: any;
  timestamp: number;
}

const ANALYTICS_KEY = 'codex_analytics';
const SESSION_KEY = 'codex_session_id';
const MAX_EVENTS = 1000;

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function getStoredAnalytics() {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
  return {
    events: [],
    pageViews: [],
    actions: [],
    sessions: {},
  };
}

function saveAnalytics(data: any) {
  try {
    if (data.events.length > MAX_EVENTS) {
      data.events = data.events.slice(-MAX_EVENTS);
    }
    if (data.pageViews.length > MAX_EVENTS) {
      data.pageViews = data.pageViews.slice(-MAX_EVENTS);
    }
    if (data.actions.length > MAX_EVENTS) {
      data.actions = data.actions.slice(-MAX_EVENTS);
    }
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save analytics:', error);
  }
}

export function useAnalytics() {
  const sessionId = getSessionId();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const trackEvent = useCallback((
    eventType: string,
    eventCategory: string,
    eventData?: any
  ) => {
    const analytics = getStoredAnalytics();
    const event: AnalyticsEvent = {
      eventType,
      eventCategory,
      eventData,
      timestamp: Date.now(),
      sessionId,
    };
    analytics.events.push(event);
    saveAnalytics(analytics);
    refresh();
  }, [sessionId, refresh]);

  const trackPageView = useCallback((path: string) => {
    const analytics = getStoredAnalytics();
    const pageView: PageView = {
      path,
      timestamp: Date.now(),
    };
    analytics.pageViews.push(pageView);
    
    if (!analytics.sessions[sessionId]) {
      analytics.sessions[sessionId] = {
        startTime: Date.now(),
        pageViews: [],
        actions: [],
      };
    }
    analytics.sessions[sessionId].pageViews.push(path);
    
    saveAnalytics(analytics);
    refresh();
  }, [sessionId, refresh]);

  const trackAction = useCallback((
    action: string,
    category: string,
    value?: any
  ) => {
    const analytics = getStoredAnalytics();
    const userAction: UserAction = {
      action,
      category,
      value,
      timestamp: Date.now(),
    };
    analytics.actions.push(userAction);
    
    if (analytics.sessions[sessionId]) {
      analytics.sessions[sessionId].actions.push(userAction);
    }
    
    saveAnalytics(analytics);
    refresh();
  }, [sessionId, refresh]);

  const getAnalytics = useCallback(() => {
    return getStoredAnalytics();
  }, [refreshKey]);

  const clearAnalytics = useCallback(() => {
    localStorage.removeItem(ANALYTICS_KEY);
    refresh();
  }, [refresh]);

  const getSessionAnalytics = useCallback(() => {
    const analytics = getStoredAnalytics();
    return analytics.sessions[sessionId] || null;
  }, [sessionId, refreshKey]);

  const getInsights = useCallback(() => {
    const analytics = getStoredAnalytics();
    
    const totalPageViews = analytics.pageViews.length;
    const totalActions = analytics.actions.length;
    const totalSessions = Object.keys(analytics.sessions).length;
    
    const topPages = analytics.pageViews.reduce((acc: any, pv: PageView) => {
      acc[pv.path] = (acc[pv.path] || 0) + 1;
      return acc;
    }, {});
    
    const topActions = analytics.actions.reduce((acc: any, action: UserAction) => {
      const key = `${action.category}:${action.action}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    const avgSessionDuration = Object.values(analytics.sessions).reduce((acc: number, session: any) => {
      if (session.pageViews.length > 0) {
        const duration = Date.now() - session.startTime;
        return acc + duration;
      }
      return acc;
    }, 0) / Math.max(totalSessions, 1);
    
    return {
      totalPageViews,
      totalActions,
      totalSessions,
      topPages,
      topActions,
      avgSessionDuration,
      sessionId,
    };
  }, [sessionId, refreshKey]);

  return {
    trackEvent,
    trackPageView,
    trackAction,
    getAnalytics,
    clearAnalytics,
    getSessionAnalytics,
    getInsights,
    sessionId,
    refreshKey,
  };
}

export function usePageTracking(pageName: string) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName);
  }, [pageName, trackPageView]);
}
