import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Bell, Fingerprint, Wallet, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBiometric } from '@/hooks/use-biometric';
import { useLocalNotifications } from '@/hooks/use-local-notifications';
import { useHaptics } from '@/hooks/use-haptics';

const ONBOARDING_COMPLETE_KEY = 'ios_onboarding_complete';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Shield;
  action?: () => Promise<void>;
  actionLabel?: string;
  optional?: boolean;
}

export function IOSNativeOnboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { enableBiometric, isAvailable: biometricAvailable, biometryTypeName } = useBiometric();
  const { requestPermission: requestNotifications, permission } = useLocalNotifications();
  const { mediumImpact, successNotification } = useHaptics();

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to CODEX Wallet',
      description: 'Your secure, non-custodial crypto wallet. Your keys, your crypto, your control.',
      icon: Sparkles,
    },
    {
      id: 'security',
      title: 'Bank-Grade Security',
      description: 'Your private keys are stored only on your device. We never have access to your funds.',
      icon: Shield,
    },
    {
      id: 'biometric',
      title: `Enable ${biometryTypeName}`,
      description: `Secure your wallet with ${biometryTypeName} for quick and safe access every time you open the app.`,
      icon: Fingerprint,
      action: async () => {
        await mediumImpact();
        const success = await enableBiometric();
        if (success) {
          await successNotification();
          setCompletedSteps(prev => new Set(Array.from(prev).concat('biometric')));
        }
      },
      actionLabel: `Enable ${biometryTypeName}`,
      optional: !biometricAvailable,
    },
    {
      id: 'notifications',
      title: 'Stay Informed',
      description: 'Get instant alerts for transactions, price movements, and security events.',
      icon: Bell,
      action: async () => {
        await mediumImpact();
        const granted = await requestNotifications();
        if (granted) {
          await successNotification();
          setCompletedSteps(prev => new Set(Array.from(prev).concat('notifications')));
        }
      },
      actionLabel: 'Enable Notifications',
      optional: true,
    },
    {
      id: 'wallet',
      title: 'You\'re All Set!',
      description: 'Start exploring the world of decentralized finance with CODEX Wallet.',
      icon: Wallet,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const Icon = currentStepData.icon;

  const handleNext = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    await mediumImpact();
    
    if (isLastStep) {
      await Preferences.set({ key: ONBOARDING_COMPLETE_KEY, value: 'true' });
      await successNotification();
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleAction = async () => {
    if (currentStepData.action) {
      await currentStepData.action();
    }
  };

  const handleSkip = async () => {
    await mediumImpact();
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-8 border border-purple-500/30"
            >
              <Icon className="w-12 h-12 text-purple-400" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white mb-4"
            >
              {currentStepData.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 text-base leading-relaxed"
            >
              {currentStepData.description}
            </motion.p>

            {currentStepData.action && !completedSteps.has(currentStepData.id) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <Button
                  onClick={handleAction}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-6 rounded-2xl text-lg font-semibold"
                  data-testid="onboarding-action-button"
                >
                  {currentStepData.actionLabel}
                </Button>
              </motion.div>
            )}

            {completedSteps.has(currentStepData.id) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-8 flex items-center gap-2 text-green-400"
              >
                <Check className="w-6 h-6" />
                <span className="font-semibold">Enabled</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12 safe-area-bottom">
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-purple-500'
                  : index < currentStep
                  ? 'w-2 bg-purple-500/50'
                  : 'w-2 bg-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-4">
          {currentStepData.optional && !completedSteps.has(currentStepData.id) && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 py-6 text-gray-400 hover:text-white"
              data-testid="onboarding-skip-button"
            >
              Skip
            </Button>
          )}
          <Button
            onClick={handleNext}
            className={`flex-1 py-6 rounded-2xl text-lg font-semibold ${
              currentStepData.action && !completedSteps.has(currentStepData.id) && !currentStepData.optional
                ? 'bg-gray-700 text-gray-400'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            disabled={currentStepData.action && !completedSteps.has(currentStepData.id) && !currentStepData.optional}
            data-testid="onboarding-next-button"
          >
            {isLastStep ? 'Get Started' : 'Continue'}
            {!isLastStep && <ChevronRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export async function checkOnboardingComplete(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }
  try {
    const { value } = await Preferences.get({ key: ONBOARDING_COMPLETE_KEY });
    return value === 'true';
  } catch {
    return false;
  }
}

export async function resetOnboarding(): Promise<void> {
  try {
    await Preferences.remove({ key: ONBOARDING_COMPLETE_KEY });
  } catch (error) {
    console.debug('Failed to reset onboarding:', error);
  }
}
