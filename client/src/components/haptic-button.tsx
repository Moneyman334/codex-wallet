import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { triggerHaptic } from '@/hooks/use-haptics';
import { Capacitor } from '@capacitor/core';

interface HapticButtonProps extends ButtonProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';
  hapticOnPress?: boolean;
}

export const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ hapticType = 'light', hapticOnPress = true, onClick, children, ...props }, ref) => {
    const isNative = Capacitor.isNativePlatform();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticOnPress && isNative) {
        triggerHaptic(hapticType);
      }
      onClick?.(e);
    };

    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);

HapticButton.displayName = 'HapticButton';

export function withHapticFeedback<P extends { onClick?: (e: any) => void }>(
  Component: React.ComponentType<P>,
  hapticType: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light'
) {
  return function HapticWrapper(props: P) {
    const isNative = Capacitor.isNativePlatform();
    
    const handleClick = (e: any) => {
      if (isNative) {
        triggerHaptic(hapticType);
      }
      props.onClick?.(e);
    };

    return <Component {...props} onClick={handleClick} />;
  };
}

export function useHapticPress(
  hapticType: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light'
) {
  const isNative = Capacitor.isNativePlatform();

  return {
    onTouchStart: () => {
      if (isNative) {
        triggerHaptic(hapticType);
      }
    },
  };
}
