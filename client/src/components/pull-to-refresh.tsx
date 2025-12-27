import { useState, useRef, useCallback, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { triggerHaptic } from '@/hooks/use-haptics';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80,
  disabled = false 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const isNative = Capacitor.isNativePlatform();
  
  if (!isNative || disabled) {
    return <>{children}</>;
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    const dampedDistance = Math.min(distance * 0.4, threshold * 1.5);
    setPullDistance(dampedDistance);
    
    if (dampedDistance >= threshold && pullDistance < threshold) {
      triggerHaptic('medium');
    }
  }, [isRefreshing, threshold, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('success');
      
      try {
        await onRefresh();
      } catch (err) {
        triggerHaptic('error');
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`
          absolute top-0 left-0 right-0 flex items-center justify-center
          transition-all duration-200 ease-out overflow-hidden
          ${isRefreshing ? 'bg-primary/5' : ''}
        `}
        style={{ 
          height: isRefreshing ? 56 : pullDistance,
          opacity: progress,
        }}
      >
        <div 
          className={`
            flex items-center justify-center w-10 h-10 rounded-full
            ${shouldTrigger || isRefreshing ? 'bg-primary/20' : 'bg-muted'}
            transition-colors duration-200
          `}
        >
          <RefreshCw 
            className={`
              h-5 w-5 transition-all duration-200
              ${shouldTrigger || isRefreshing ? 'text-primary' : 'text-muted-foreground'}
              ${isRefreshing ? 'animate-spin' : ''}
            `}
            style={{ 
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)` 
            }}
          />
        </div>
      </div>
      
      <div 
        style={{ 
          transform: `translateY(${isRefreshing ? 56 : pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
