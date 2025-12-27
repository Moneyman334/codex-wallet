import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType as NativeBiometryType } from 'capacitor-native-biometric';
import { useState, useCallback, useEffect } from 'react';

export enum BiometryType {
  NONE = 0,
  TOUCH_ID = 1,
  FACE_ID = 2,
  FINGERPRINT = 3,
  FACE_AUTHENTICATION = 4,
  IRIS_AUTHENTICATION = 5,
}

export interface BiometricState {
  isAvailable: boolean;
  isNative: boolean;
  biometryType: BiometryType | null;
  biometryTypeName: string;
  isEnabled: boolean;
}

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';
const BIOMETRIC_CREDENTIALS_SERVER = 'com.omniversesyndicate.codex';

function mapNativeBiometryType(type: NativeBiometryType | undefined): BiometryType {
  if (!type) return BiometryType.NONE;
  
  switch (type) {
    case NativeBiometryType.TOUCH_ID:
      return BiometryType.TOUCH_ID;
    case NativeBiometryType.FACE_ID:
      return BiometryType.FACE_ID;
    case NativeBiometryType.FINGERPRINT:
      return BiometryType.FINGERPRINT;
    case NativeBiometryType.FACE_AUTHENTICATION:
      return BiometryType.FACE_AUTHENTICATION;
    case NativeBiometryType.IRIS_AUTHENTICATION:
      return BiometryType.IRIS_AUTHENTICATION;
    default:
      return BiometryType.NONE;
  }
}

function getBiometryTypeName(type: BiometryType | null): string {
  switch (type) {
    case BiometryType.FACE_ID:
      return 'Face ID';
    case BiometryType.TOUCH_ID:
      return 'Touch ID';
    case BiometryType.FINGERPRINT:
      return 'Fingerprint';
    case BiometryType.FACE_AUTHENTICATION:
      return 'Face Authentication';
    case BiometryType.IRIS_AUTHENTICATION:
      return 'Iris Authentication';
    default:
      return 'Biometric';
  }
}

async function getStoredEnabled(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
      return value === 'true';
    } catch {
      return false;
    }
  }
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
}

async function setStoredEnabled(enabled: boolean): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: enabled ? 'true' : 'false' });
    } catch (error) {
      console.debug('Failed to save biometric preference:', error);
    }
  } else {
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  }
}

export function useBiometric() {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    isNative: false,
    biometryType: null,
    biometryTypeName: 'Biometric',
    isEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkBiometricAvailability = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      setState({
        isAvailable: false,
        isNative: false,
        biometryType: null,
        biometryTypeName: 'Biometric',
        isEnabled: false,
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      const biometryType = mapNativeBiometryType(result.biometryType);
      const isEnabled = await getStoredEnabled();
      
      setState({
        isAvailable: result.isAvailable,
        isNative: true,
        biometryType,
        biometryTypeName: getBiometryTypeName(biometryType),
        isEnabled: isEnabled && result.isAvailable,
      });
    } catch (error) {
      console.debug('Biometric availability check failed:', error);
      setState({
        isAvailable: false,
        isNative: true,
        biometryType: null,
        biometryTypeName: 'Biometric',
        isEnabled: false,
      });
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      return false;
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason: reason || 'Authenticate to access CODEX Wallet',
        title: 'CODEX Wallet',
        subtitle: 'Biometric Authentication',
        description: reason || 'Please verify your identity',
        useFallback: true,
        fallbackTitle: 'Use Device Password',
        maxAttempts: 3,
      });
      return true;
    } catch (error) {
      console.debug('Biometric authentication failed:', error);
      return false;
    }
  }, []);

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      return false;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        return false;
      }

      const authenticated = await authenticate('Enable biometric authentication');
      if (!authenticated) {
        return false;
      }

      await setStoredEnabled(true);
      
      try {
        await NativeBiometric.setCredentials({
          username: 'codex_user',
          password: 'biometric_enabled',
          server: BIOMETRIC_CREDENTIALS_SERVER,
        });
      } catch (credError) {
        console.debug('Failed to store biometric credentials:', credError);
      }

      setState(prev => ({ ...prev, isEnabled: true }));
      return true;
    } catch (error) {
      console.debug('Enable biometric failed:', error);
      return false;
    }
  }, [authenticate]);

  const disableBiometric = useCallback(async (): Promise<boolean> => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      return false;
    }

    try {
      await setStoredEnabled(false);
      
      try {
        await NativeBiometric.deleteCredentials({
          server: BIOMETRIC_CREDENTIALS_SERVER,
        });
      } catch (credError) {
        console.debug('Failed to delete biometric credentials:', credError);
      }

      setState(prev => ({ ...prev, isEnabled: false }));
      return true;
    } catch (error) {
      console.debug('Disable biometric failed:', error);
      return false;
    }
  }, []);

  const requireBiometricForAction = useCallback(async (
    action: () => Promise<void> | void,
    reason?: string
  ): Promise<boolean> => {
    if (!state.isEnabled || !state.isAvailable) {
      await action();
      return true;
    }

    const authenticated = await authenticate(reason);
    if (authenticated) {
      await action();
      return true;
    }
    return false;
  }, [authenticate, state.isEnabled, state.isAvailable]);

  return {
    ...state,
    isLoading,
    authenticate,
    enableBiometric,
    disableBiometric,
    requireBiometricForAction,
    refreshAvailability: checkBiometricAvailability,
  };
}

export async function verifyBiometric(reason?: string): Promise<boolean> {
  const isNative = Capacitor.isNativePlatform();
  
  if (!isNative) {
    return false;
  }

  try {
    await NativeBiometric.verifyIdentity({
      reason: reason || 'Verify your identity',
      title: 'CODEX Wallet',
      useFallback: true,
      maxAttempts: 3,
    });
    return true;
  } catch (error) {
    console.debug('Biometric verification failed:', error);
    return false;
  }
}

export async function checkBiometricAvailable(): Promise<boolean> {
  const isNative = Capacitor.isNativePlatform();
  
  if (!isNative) {
    return false;
  }

  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
}
