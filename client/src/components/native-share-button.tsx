import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/hooks/use-haptics';
import { useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';

interface NativeShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function NativeShareButton({
  title,
  text,
  url,
  dialogTitle = 'Share',
  variant = 'outline',
  size = 'default',
  className = '',
  showLabel = true,
}: NativeShareButtonProps) {
  const isNative = Capacitor.isNativePlatform();

  const handleShare = async () => {
    triggerHaptic('light');

    if (isNative) {
      try {
        await Share.share({
          title,
          text,
          url,
          dialogTitle,
        });
        triggerHaptic('success');
      } catch (error) {
        console.debug('Share failed:', error);
      }
    } else {
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
        } catch (error) {
          console.debug('Web share failed:', error);
        }
      } else {
        const shareText = `${title}${text ? '\n' + text : ''}${url ? '\n' + url : ''}`;
        await navigator.clipboard.writeText(shareText);
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
      data-testid="native-share-button"
    >
      <Share2 className="w-4 h-4" />
      {showLabel && size !== 'icon' && <span className="ml-2">Share</span>}
    </Button>
  );
}

interface CopyAddressButtonProps {
  address: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CopyAddressButton({
  address,
  label,
  variant = 'ghost',
  size = 'sm',
  className = '',
}: CopyAddressButtonProps) {
  const [copied, setCopied] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const handleCopy = async () => {
    triggerHaptic('light');

    try {
      if (isNative) {
        await Clipboard.write({ string: address });
      } else {
        await navigator.clipboard.writeText(address);
      }
      
      triggerHaptic('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.debug('Copy failed:', error);
      triggerHaptic('error');
    }
  };

  const displayAddress = address.length > 12
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`font-mono ${className}`}
      data-testid="copy-address-button"
    >
      {label || displayAddress}
      {copied ? (
        <Check className="w-4 h-4 ml-2 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 ml-2 opacity-50" />
      )}
    </Button>
  );
}

export function ShareTransactionButton({
  txHash,
  network = 'ethereum',
  amount,
  symbol,
}: {
  txHash: string;
  network?: string;
  amount?: string;
  symbol?: string;
}) {
  const explorerUrls: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    base: 'https://basescan.org/tx/',
  };

  const explorerUrl = explorerUrls[network] || explorerUrls.ethereum;
  const txUrl = `${explorerUrl}${txHash}`;

  return (
    <NativeShareButton
      title="Transaction Details"
      text={amount && symbol ? `${amount} ${symbol} transaction` : 'View transaction details'}
      url={txUrl}
      dialogTitle="Share Transaction"
      variant="ghost"
      size="sm"
    />
  );
}

export function ShareWalletButton({ address }: { address: string }) {
  return (
    <NativeShareButton
      title="My Wallet Address"
      text={address}
      dialogTitle="Share Wallet Address"
      variant="outline"
      size="sm"
    />
  );
}
