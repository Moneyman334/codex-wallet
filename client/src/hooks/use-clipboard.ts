import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { useCallback } from 'react';
import { useHaptics } from './use-haptics';

export function useClipboard() {
  const isNative = Capacitor.isNativePlatform();
  const { successNotification } = useHaptics();

  const writeToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (isNative) {
        await Clipboard.write({ string: text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      await successNotification();
      return true;
    } catch (error) {
      console.debug('Failed to copy to clipboard:', error);
      return false;
    }
  }, [isNative, successNotification]);

  const readFromClipboard = useCallback(async (): Promise<string | null> => {
    try {
      if (isNative) {
        const result = await Clipboard.read();
        return result.value || null;
      } else if (navigator.clipboard) {
        return await navigator.clipboard.readText();
      }
      return null;
    } catch (error) {
      console.debug('Failed to read from clipboard:', error);
      return null;
    }
  }, [isNative]);

  const copyWalletAddress = useCallback(async (address: string): Promise<boolean> => {
    return writeToClipboard(address);
  }, [writeToClipboard]);

  const copyTransactionHash = useCallback(async (txHash: string): Promise<boolean> => {
    return writeToClipboard(txHash);
  }, [writeToClipboard]);

  const copyReferralCode = useCallback(async (code: string): Promise<boolean> => {
    return writeToClipboard(code);
  }, [writeToClipboard]);

  const pasteAddress = useCallback(async (): Promise<string | null> => {
    const text = await readFromClipboard();
    if (text && /^0x[a-fA-F0-9]{40}$/.test(text)) {
      return text;
    }
    return null;
  }, [readFromClipboard]);

  return {
    isNative,
    writeToClipboard,
    readFromClipboard,
    copyWalletAddress,
    copyTransactionHash,
    copyReferralCode,
    pasteAddress,
  };
}
