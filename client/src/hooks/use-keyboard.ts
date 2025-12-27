import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback, useEffect } from 'react';

export interface KeyboardState {
  isVisible: boolean;
  height: number;
  isNative: boolean;
}

export function useKeyboard() {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    isNative: Capacitor.isNativePlatform(),
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const showListener = Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
      setKeyboardState(prev => ({
        ...prev,
        isVisible: true,
        height: info.keyboardHeight,
      }));
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardState(prev => ({
        ...prev,
        isVisible: false,
        height: 0,
      }));
    });

    return () => {
      showListener.then(l => l.remove());
      hideListener.then(l => l.remove());
    };
  }, []);

  const hideKeyboard = useCallback(async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement) {
        activeElement.blur();
      }
      return;
    }

    try {
      await Keyboard.hide();
    } catch (error) {
      console.debug('Failed to hide keyboard:', error);
    }
  }, []);

  const showKeyboard = useCallback(async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Keyboard.show();
    } catch (error) {
      console.debug('Failed to show keyboard:', error);
    }
  }, []);

  const setAccessoryBarVisible = useCallback(async (visible: boolean): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Keyboard.setAccessoryBarVisible({ isVisible: visible });
    } catch (error) {
      console.debug('Failed to set accessory bar visibility:', error);
    }
  }, []);

  const setScroll = useCallback(async (enabled: boolean): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Keyboard.setScroll({ isDisabled: !enabled });
    } catch (error) {
      console.debug('Failed to set keyboard scroll:', error);
    }
  }, []);

  return {
    ...keyboardState,
    hideKeyboard,
    showKeyboard,
    setAccessoryBarVisible,
    setScroll,
  };
}
