import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { useBiometric } from '@/hooks/use-biometric';
import { useLocalNotifications } from '@/hooks/use-local-notifications';
import { useHaptics } from '@/hooks/use-haptics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Fingerprint, 
  Scan, 
  Shield, 
  Bell, 
  Smartphone,
  ChevronRight,
  Check,
  Wallet,
  LineChart,
  QrCode,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IOS_ONBOARDING_COMPLETE_KEY = 'ios_onboarding_complete';
const IOS_BIOMETRIC_VERIFIED_KEY = 'ios_biometric_verified_session';

function detectIsIOS(): boolean {
  if (Capacitor.getPlatform() === 'ios') {
    return true;
  }
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) && !/Windows/.test(ua);
  }
  return false;
}

interface IOSOnboardingProps {
  onComplete: () => void;
}

function IOSOnboarding({ onComplete }: IOSOnboardingProps) {
  const [step, setStep] = useState(0);
  const { successNotification, mediumImpact } = useHaptics();
  const { requestPermission: requestNotificationPermission } = useLocalNotifications();
  const { enableBiometric, isAvailable: biometricAvailable, biometryTypeName } = useBiometric();

  const features = [
    {
      icon: Wallet,
      title: 'View Your Portfolio',
      description: 'Track all your cryptocurrency holdings in one secure place with real-time USD values.',
      color: 'from-purple-500 to-blue-500',
    },
    {
      icon: LineChart,
      title: 'Live Price Tracking',
      description: 'Monitor live prices for Bitcoin, Ethereum, and 100+ cryptocurrencies.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: QrCode,
      title: 'Receive Crypto Easily',
      description: 'Generate QR codes to receive cryptocurrency payments securely.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: biometricAvailable ? (biometryTypeName === 'Face ID' ? Scan : Fingerprint) : Lock,
      title: biometricAvailable ? `Secure with ${biometryTypeName}` : 'Secure Authentication',
      description: biometricAvailable 
        ? `Protect your wallet with ${biometryTypeName} for quick and secure access.`
        : 'Your wallet is protected with enterprise-grade security.',
      color: 'from-orange-500 to-red-500',
      action: biometricAvailable ? 'enable_biometric' : null,
    },
    {
      icon: Bell,
      title: 'Price Alerts',
      description: 'Get notified when prices hit your targets with native push notifications.',
      color: 'from-pink-500 to-purple-500',
      action: 'enable_notifications',
    },
  ];

  const handleNext = async () => {
    mediumImpact();
    
    const currentFeature = features[step];
    
    if (currentFeature.action === 'enable_biometric') {
      await enableBiometric();
    } else if (currentFeature.action === 'enable_notifications') {
      await requestNotificationPermission();
    }

    if (step < features.length - 1) {
      setStep(step + 1);
    } else {
      successNotification();
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: IOS_ONBOARDING_COMPLETE_KEY, value: 'true' });
      } else {
        localStorage.setItem(IOS_ONBOARDING_COMPLETE_KEY, 'true');
      }
      onComplete();
    }
  };

  const handleSkip = async () => {
    mediumImpact();
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: IOS_ONBOARDING_COMPLETE_KEY, value: 'true' });
    } else {
      localStorage.setItem(IOS_ONBOARDING_COMPLETE_KEY, 'true');
    }
    onComplete();
  };

  const currentFeature = features[step];
  const Icon = currentFeature.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-background to-background/95 p-4"
      data-testid="ios-onboarding"
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-2">
          {features.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-8 mx-1 rounded-full transition-colors ${
                index <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="text-center pb-2">
                <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${currentFeature.color}`}>
                  <Icon className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-2xl" data-testid="onboarding-title">
                  {currentFeature.title}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {currentFeature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <Button
                  onClick={handleNext}
                  className="w-full h-12 text-base"
                  size="lg"
                  data-testid="onboarding-next-button"
                >
                  {step === features.length - 1 ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Get Started
                    </>
                  ) : currentFeature.action ? (
                    <>
                      Enable & Continue
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                {step < features.length - 1 && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full"
                    data-testid="onboarding-skip-button"
                  >
                    Skip Tour
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface BiometricAppGateProps {
  onSuccess: () => void;
}

function BiometricAppGate({ onSuccess }: BiometricAppGateProps) {
  const { biometryTypeName, authenticate, isAvailable, isLoading } = useBiometric();
  const { errorNotification, successNotification } = useHaptics();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    const success = await authenticate('Unlock CODEX Wallet');
    
    if (success) {
      successNotification();
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: IOS_BIOMETRIC_VERIFIED_KEY, value: Date.now().toString() });
      }
      onSuccess();
    } else {
      errorNotification();
      setAttempts(prev => prev + 1);
      setError(`${biometryTypeName} failed. Please try again.`);
    }
    
    setIsAuthenticating(false);
  };

  useEffect(() => {
    if (!isLoading && isAvailable) {
      handleAuthenticate();
    } else if (!isLoading && !isAvailable) {
      onSuccess();
    }
  }, [isLoading, isAvailable]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Shield className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return null;
  }

  const getBiometricIcon = () => {
    if (biometryTypeName === 'Face ID' || biometryTypeName === 'Face Authentication') {
      return <Scan className="h-16 w-16" />;
    }
    return <Fingerprint className="h-16 w-16" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/95 p-4"
      data-testid="biometric-app-gate"
    >
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-primary">
          {error ? (
            <Shield className="h-16 w-16 text-destructive" />
          ) : (
            getBiometricIcon()
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-2">CODEX Wallet</h1>
        <p className="text-muted-foreground mb-8">
          {error ? 'Authentication failed' : `Use ${biometryTypeName} to unlock`}
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive max-w-xs mx-auto"
          >
            {error}
          </motion.div>
        )}

        <Button
          onClick={handleAuthenticate}
          disabled={isAuthenticating}
          size="lg"
          className="min-w-[200px]"
          data-testid="biometric-unlock-button"
        >
          {isAuthenticating ? (
            'Authenticating...'
          ) : (
            <>
              {getBiometricIcon()}
              <span className="ml-2">Use {biometryTypeName}</span>
            </>
          )}
        </Button>

        {attempts >= 3 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Having trouble? Close and reopen the app.
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface IOSAppGateProps {
  children: React.ReactNode;
}

export function IOSAppGate({ children }: IOSAppGateProps) {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const { isEnabled: biometricEnabled, isLoading: biometricLoading } = useBiometric();

  useEffect(() => {
    const checkState = async () => {
      if (!detectIsIOS()) {
        setIsReady(true);
        return;
      }

      let onboardingComplete = false;
      
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: IOS_ONBOARDING_COMPLETE_KEY });
        onboardingComplete = value === 'true';
      } else {
        onboardingComplete = localStorage.getItem(IOS_ONBOARDING_COMPLETE_KEY) === 'true';
      }

      if (!onboardingComplete) {
        setShowOnboarding(true);
      } else if (biometricEnabled && !biometricLoading) {
        setShowBiometric(true);
      } else {
        setIsReady(true);
      }
    };

    if (!biometricLoading) {
      checkState();
    }
  }, [biometricEnabled, biometricLoading]);

  if (showOnboarding) {
    return (
      <IOSOnboarding
        onComplete={() => {
          setShowOnboarding(false);
          if (biometricEnabled) {
            setShowBiometric(true);
          } else {
            setIsReady(true);
          }
        }}
      />
    );
  }

  if (showBiometric) {
    return (
      <BiometricAppGate
        onSuccess={() => {
          setShowBiometric(false);
          setIsReady(true);
        }}
      />
    );
  }

  if (!isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Smartphone className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
