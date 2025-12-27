import { useEffect, useState } from 'react';
import { useDemoMode } from './use-demo-mode';
import { useWalletNexus } from '@/lib/wallet-nexus';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface UserWallet {
  id: string;
  address: string;
  balance: string;
  network: string;
}

interface UserPreferences {
  autoLoginEnabled: string;
  autoConnectEnabled: string;
  lastWalletId?: string;
}

export function useDevWalletAutoConnect() {
  const { isDemoMode, enableDemoMode } = useDemoMode();
  const { wallets, isInitialized } = useWalletNexus();
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);

  // Fetch user's actual wallet from database
  const { data: userWallets } = useQuery<UserWallet[]>({
    queryKey: ['/api/wallets'],
    enabled: import.meta.env.DEV && isInitialized,
  });

  // Fetch user preferences
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['/api/preferences'],
    enabled: import.meta.env.DEV && isInitialized,
  });

  useEffect(() => {
    // Auto-connect is enabled for development/demo purposes
    // Fetches user's wallets and connects them if autoConnectEnabled is set
    if (!hasAttemptedConnect && userWallets && preferences?.autoConnectEnabled === 'true') {
      console.log('ℹ️ Auto-connecting wallets for demo owner account...');
      setHasAttemptedConnect(true);
      // Wallets will be automatically available through the wallet nexus
    } else if (!hasAttemptedConnect) {
      console.log('ℹ️ Auto-connect disabled - manual MetaMask connection required');
      setHasAttemptedConnect(true);
    }
  }, [hasAttemptedConnect, userWallets, preferences]);

  // Separate effect for reload to avoid dependency loop
  // Disabled to prevent unwanted page reloads
  // useEffect(() => {
  //   if (needsReload && isDemoMode) {
  //     console.log('🔄 Reloading to apply wallet connection...');
  //     window.location.reload();
  //   }
  // }, [needsReload, isDemoMode]);

  return { isDemoMode, isConnected: wallets.size > 0 };
}
