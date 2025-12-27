import { useState, useEffect } from 'react';
import { useBiometric } from '@/hooks/use-biometric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Scan, ShieldAlert, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BiometricLockScreenProps {
  onSuccess: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  reason?: string;
}

export function BiometricLockScreen({
  onSuccess,
  onCancel,
  title = 'Authentication Required',
  description = 'Please verify your identity to continue',
  reason,
}: BiometricLockScreenProps) {
  const { biometryTypeName, authenticate, isAvailable } = useBiometric();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBiometricIcon = () => {
    if (biometryTypeName === 'Face ID' || biometryTypeName === 'Face Authentication') {
      return <Scan className="h-16 w-16" />;
    }
    return <Fingerprint className="h-16 w-16" />;
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    const success = await authenticate(reason || `Verify with ${biometryTypeName}`);
    
    if (success) {
      onSuccess();
    } else {
      setError(`${biometryTypeName} authentication failed. Please try again.`);
    }
    
    setIsAuthenticating(false);
  };

  useEffect(() => {
    if (isAvailable) {
      handleAuthenticate();
    }
  }, []);

  if (!isAvailable) {
    onSuccess();
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
        data-testid="biometric-lock-screen"
      >
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
              {error ? (
                <ShieldAlert className="h-16 w-16 text-destructive" />
              ) : (
                getBiometricIcon()
              )}
            </div>
            <CardTitle data-testid="biometric-title">{title}</CardTitle>
            <CardDescription data-testid="biometric-description">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive"
                data-testid="biometric-error"
              >
                {error}
              </motion.div>
            )}
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleAuthenticate}
                disabled={isAuthenticating}
                className="w-full"
                size="lg"
                data-testid="biometric-retry-button"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    {getBiometricIcon()}
                    <span className="ml-2">Use {biometryTypeName}</span>
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isAuthenticating}
                  className="w-full"
                  data-testid="biometric-cancel-button"
                >
                  Cancel
                </Button>
              )}
            </div>
            
            <p className="text-center text-xs text-muted-foreground">
              Your biometric data never leaves your device
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

interface BiometricGateProps {
  children: React.ReactNode;
  onAuthenticated?: () => void;
  title?: string;
  description?: string;
  reason?: string;
}

export function BiometricGate({
  children,
  onAuthenticated,
  title,
  description,
  reason,
}: BiometricGateProps) {
  const { isEnabled, isLoading } = useBiometric();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (isLoading) {
    return null;
  }

  if (!isEnabled || isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <BiometricLockScreen
      onSuccess={() => {
        setIsAuthenticated(true);
        onAuthenticated?.();
      }}
      title={title}
      description={description}
      reason={reason}
    />
  );
}
