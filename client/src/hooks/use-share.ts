import { Share, ShareOptions, ShareResult } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback } from 'react';

export interface ShareState {
  isNative: boolean;
  isSharing: boolean;
}

export interface UseShareReturn extends ShareState {
  share: (options: ShareOptions) => Promise<ShareResult | null>;
  shareWalletAddress: (address: string) => Promise<ShareResult | null>;
  shareTransaction: (txHash: string, type?: string) => Promise<ShareResult | null>;
  shareReferralLink: (code: string) => Promise<ShareResult | null>;
  shareNFT: (name: string, url: string) => Promise<ShareResult | null>;
  canShare: () => Promise<boolean>;
}

export function useShare(): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const canShare = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      return typeof navigator.share === 'function';
    }
    try {
      const result = await Share.canShare();
      return result.value;
    } catch {
      return false;
    }
  }, [isNative]);

  const share = useCallback(async (options: ShareOptions): Promise<ShareResult | null> => {
    setIsSharing(true);
    try {
      if (!isNative && typeof navigator.share === 'function') {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        });
        return { activityType: 'web-share' };
      }

      if (isNative) {
        const result = await Share.share(options);
        return result;
      }

      console.debug('Share not available on this platform');
      return null;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      console.debug('Share failed:', error);
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [isNative]);

  const shareWalletAddress = useCallback(async (address: string): Promise<ShareResult | null> => {
    return share({
      title: 'My Wallet Address',
      text: `My crypto wallet address: ${address}`,
      dialogTitle: 'Share Wallet Address',
    });
  }, [share]);

  const shareTransaction = useCallback(async (
    txHash: string,
    type: string = 'Transaction',
    explorerUrl?: string
  ): Promise<ShareResult | null> => {
    const url = explorerUrl || `https://etherscan.io/tx/${txHash}`;
    return share({
      title: `${type} Confirmation`,
      text: `${type} completed! Hash: ${txHash}`,
      url: url,
      dialogTitle: `Share ${type}`,
    });
  }, [share]);

  const shareReferralLink = useCallback(async (code: string): Promise<ShareResult | null> => {
    const referralUrl = `https://getcodexpay.com/ref/${code}`;
    return share({
      title: 'Join CODEX',
      text: `Use my referral code ${code} to get started with CODEX!`,
      url: referralUrl,
      dialogTitle: 'Share Referral',
    });
  }, [share]);

  const shareNFT = useCallback(async (name: string, url: string): Promise<ShareResult | null> => {
    return share({
      title: `Check out this NFT: ${name}`,
      text: `I found this amazing NFT: ${name}`,
      url: url,
      dialogTitle: 'Share NFT',
    });
  }, [share]);

  return {
    isNative,
    isSharing,
    share,
    shareWalletAddress,
    shareTransaction,
    shareReferralLink,
    shareNFT,
    canShare,
  };
}

export async function nativeShare(options: ShareOptions): Promise<ShareResult | null> {
  const isNative = Capacitor.isNativePlatform();
  
  try {
    if (!isNative && typeof navigator.share === 'function') {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return { activityType: 'web-share' };
    }

    if (isNative) {
      return await Share.share(options);
    }

    return null;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return null;
    }
    console.debug('Native share failed:', error);
    return null;
  }
}
