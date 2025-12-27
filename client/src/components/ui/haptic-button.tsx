import { forwardRef, type MouseEvent } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { triggerHaptic } from '@/hooks/use-haptics';

interface HapticButtonProps extends ButtonProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
}

const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ onClick, hapticType = 'light', children, ...props }, ref) => {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      triggerHaptic(hapticType);
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

export { HapticButton };
