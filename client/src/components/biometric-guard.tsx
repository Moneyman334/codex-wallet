import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, Shield, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBiometric, BiometryType } from '@/hooks/use-biometric';
import { useHaptics } from '@/hooks/use-haptics';

const AUTH_STATE_KEY = 'biometric_auth_state';
const FALLBACK_PIN_KEY = 'fallback_pin';
const LOCK_TIMEOUT = 1000 * 60 * 5; // 5 minutes

interface BiometricGuardProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function BiometricGuard({ children, enabled = true }: BiometricGuardProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  
  const { authenticate, isAvailable, biometryType, biometryTypeName, isEnabled } = useBiometric();
  const { mediumImpact, successNotification, errorNotification, heavyImpact } = useHaptics();

  const isNative = Capacitor.isNativePlatform();

  const saveAuthState = useCallback(async () => {
    if (!isNative) return;
    try {
      await Preferences.set({
        key: AUTH_STATE_KEY,
        value: JSON.stringify({ timestamp: Date.now(), authenticated: true }),
      });
    } catch (error) {
      console.debug('Failed to save auth state:', error);
    }
  }, [isNative]);

  const checkAuthState = useCallback(async (): Promise<boolean> => {
    if (!isNative) return true;
    try {
      const { value } = await Preferences.get({ key: AUTH_STATE_KEY });
      if (value) {
        const state = JSON.parse(value);
        const elapsed = Date.now() - state.timestamp;
        return elapsed < LOCK_TIMEOUT && state.authenticated;
      }
    } catch (error) {
      console.debug('Failed to check auth state:', error);
    }
    return false;
  }, [isNative]);

  const performBiometricAuth = useCallback(async () => {
    await mediumImpact();
    setAuthAttempts(prev => prev + 1);
    
    try {
      const success = await authenticate('Unlock CODEX Wallet');
      if (success) {
        await successNotification();
        await saveAuthState();
        setIsLocked(false);
        setAuthAttempts(0);
      } else {
        await errorNotification();
        if (authAttempts >= 2) {
          setShowPinInput(true);
        }
      }
    } catch (error) {
      console.debug('Biometric auth failed:', error);
      await errorNotification();
      if (authAttempts >= 2) {
        setShowPinInput(true);
      }
    }
  }, [authenticate, mediumImpact, successNotification, errorNotification, saveAuthState, authAttempts]);

  const verifyPin = useCallback(async () => {
    await mediumImpact();
    try {
      const { value } = await Preferences.get({ key: FALLBACK_PIN_KEY });
      if (value && value === pin) {
        await successNotification();
        await saveAuthState();
        setIsLocked(false);
        setPin('');
        setPinError('');
        setAuthAttempts(0);
      } else if (!value) {
        setPinError('No PIN configured. Please use biometrics.');
        setPin('');
      } else {
        await heavyImpact();
        setAuthAttempts(prev => prev + 1);
        if (authAttempts >= 4) {
          setPinError('Too many attempts. Try again later.');
        } else {
          setPinError('Incorrect PIN');
        }
        setPin('');
      }
    } catch (error) {
      console.debug('PIN verification failed:', error);
      setPinError('Verification failed');
    }
  }, [pin, mediumImpact, successNotification, heavyImpact, saveAuthState, authAttempts]);

  useEffect(() => {
    if (!enabled || !isNative) {
      setIsLocked(false);
      setIsChecking(false);
      return;
    }

    const initAuth = async () => {
      const stillAuthenticated = await checkAuthState();
      if (stillAuthenticated) {
        setIsLocked(false);
      } else if (isAvailable && isEnabled) {
        await performBiometricAuth();
      } else {
        setShowPinInput(true);
      }
      setIsChecking(false);
    };

    initAuth();
  }, [enabled, isNative, isAvailable, isEnabled, checkAuthState, performBiometricAuth]);

  useEffect(() => {
    if (!isNative) return;

    let listener: { remove: () => void } | null = null;
    
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && enabled) {
        const stillAuthenticated = await checkAuthState();
        if (!stillAuthenticated) {
          setIsLocked(true);
          setIsChecking(false);
          if (isAvailable && isEnabled) {
            await performBiometricAuth();
          } else {
            setShowPinInput(true);
          }
        }
      }
    }).then(handle => {
      listener = handle;
    });

    return () => {
      listener?.remove();
    };
  }, [isNative, enabled, isAvailable, isEnabled, checkAuthState, performBiometricAuth]);

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
            <Shield className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
          <p className="text-gray-400">Checking security...</p>
        </motion.div>
      </div>
    );
  }

  if (!isLocked) {
    return <>{children}</>;
  }

  const BiometricIcon = biometryType === BiometryType.FACE_ID ? Eye : Fingerprint;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex flex-col items-center justify-center px-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-8 border border-purple-500/30">
            <Lock className="w-12 h-12 text-purple-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">CODEX Wallet Locked</h1>
          <p className="text-gray-400 mb-8">
            {showPinInput
              ? 'Enter your PIN to unlock'
              : `Use ${biometryTypeName} to unlock your wallet`}
          </p>

          {showPinInput ? (
            <div className="w-full space-y-4">
              <div className="relative">
                <Input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError('');
                  }}
                  placeholder="Enter PIN"
                  maxLength={6}
                  className="bg-white/10 border-white/20 text-white text-center text-2xl tracking-widest py-6"
                  data-testid="pin-input"
                />
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {pinError && (
                <p className="text-red-400 text-sm">{pinError}</p>
              )}

              <Button
                onClick={verifyPin}
                disabled={pin.length < 4}
                className="w-full py-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-2xl text-lg font-semibold"
                data-testid="pin-submit-button"
              >
                Unlock
              </Button>

              {isAvailable && isEnabled && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPinInput(false);
                    performBiometricAuth();
                  }}
                  className="w-full text-gray-400 hover:text-white"
                  data-testid="use-biometric-button"
                >
                  <BiometricIcon className="w-5 h-5 mr-2" />
                  Use {biometryTypeName}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={performBiometricAuth}
                className="w-full py-8 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3"
                data-testid="biometric-unlock-button"
              >
                <BiometricIcon className="w-8 h-8" />
                Unlock with {biometryTypeName}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowPinInput(true)}
                className="w-full text-gray-400 hover:text-white"
                data-testid="use-pin-button"
              >
                Use PIN instead
              </Button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-12 flex items-center gap-2 text-gray-500 text-sm"
        >
          <Shield className="w-4 h-4" />
          <span>Protected by CODEX Wallet Security</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export async function setFallbackPin(pin: string): Promise<void> {
  try {
    await Preferences.set({ key: FALLBACK_PIN_KEY, value: pin });
  } catch (error) {
    console.debug('Failed to set fallback PIN:', error);
  }
}
