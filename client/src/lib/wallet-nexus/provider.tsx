import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  WalletNexusState,
  WalletNexusActions,
  WalletType,
  WalletInfo,
  TransactionRequest,
  ChainType,
  WalletSession,
} from './types';
import { getConnector } from './connectors';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'codex_wallet_nexus_session';
const DEMO_STORAGE_KEY = 'codex_wallet_nexus_demo_session';

type WalletNexusContextType = WalletNexusState & WalletNexusActions;

const WalletNexusContext = createContext<WalletNexusContextType | null>(null);

export function WalletNexusProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const [state, setState] = useState<WalletNexusState>({
    wallets: new Map(),
    primaryWalletId: null,
    isInitialized: false,
    isConnecting: false,
    totalBalanceUSD: '0',
    error: null,
  });

  const updateState = (updates: Partial<WalletNexusState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const loadSession = useCallback(async () => {
    try {
      const isDemoMode = localStorage.getItem('codex_demo_mode') === 'true';
      const storageKey = isDemoMode ? DEMO_STORAGE_KEY : STORAGE_KEY;
      const storedSession = localStorage.getItem(storageKey);
      if (storedSession) {
        const session: WalletSession = JSON.parse(storedSession);
        const walletsMap = new Map<string, WalletInfo>();
        
        session.wallets.forEach(wallet => {
          walletsMap.set(wallet.id, {
            ...wallet,
            isConnected: false,
          });
        });

        updateState({
          wallets: walletsMap,
          primaryWalletId: session.primaryWalletId,
          totalBalanceUSD: session.totalBalanceUSD,
          isInitialized: true,
        });

        for (const wallet of session.wallets) {
          try {
            const connector = getConnector(wallet.type);
            const reconnectedWallet = await connector.checkConnection();
            
            if (reconnectedWallet) {
              walletsMap.set(reconnectedWallet.id, {
                ...reconnectedWallet,
                isPrimary: wallet.isPrimary,
                lastUsed: wallet.lastUsed,
              });
            }
          } catch (error) {
            console.error(`Failed to reconnect ${wallet.type}:`, error);
          }
        }

        updateState({
          wallets: walletsMap,
        });

        return walletsMap;
      }
    } catch (error) {
      console.error('Failed to load wallet session:', error);
    }
    
    updateState({ isInitialized: true });
    return new Map();
  }, []);

  const saveSession = useCallback((wallets: Map<string, WalletInfo>, primaryWalletId: string | null, totalBalanceUSD: string) => {
    try {
      const isDemoMode = localStorage.getItem('codex_demo_mode') === 'true';
      const storageKey = isDemoMode ? DEMO_STORAGE_KEY : STORAGE_KEY;
      const session: WalletSession = {
        wallets: Array.from(wallets.values()),
        primaryWalletId,
        totalBalanceUSD,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      localStorage.setItem(storageKey, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save wallet session:', error);
    }
  }, []);

  const connectWallet = useCallback(async (type: WalletType): Promise<WalletInfo> => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const connector = getConnector(type);
      const walletInfo = await connector.connect();

      let updatedWallet: WalletInfo;
      let newPrimaryId: string | null;

      setState(prev => {
        const existingWallet = prev.wallets.get(walletInfo.id);
        const isPrimary = prev.wallets.size === 0 || (existingWallet?.isPrimary ?? false);

        updatedWallet = {
          ...walletInfo,
          isPrimary,
          lastUsed: Date.now(),
        };

        const newWallets = new Map(prev.wallets);
        newWallets.set(walletInfo.id, updatedWallet);

        newPrimaryId = isPrimary ? walletInfo.id : prev.primaryWalletId;

        saveSession(newWallets, newPrimaryId, prev.totalBalanceUSD);

        return {
          ...prev,
          wallets: newWallets,
          primaryWalletId: newPrimaryId,
          isConnecting: false,
        };
      });

      toast({
        title: 'Wallet Connected',
        description: `${walletInfo.name} connected successfully`,
      });

      return updatedWallet!;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message,
      }));

      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });

      throw error;
    }
  }, [saveSession, toast]);

  const disconnectWallet = useCallback(async (walletId: string): Promise<void> => {
    let walletName: string;

    try {
      setState(prev => {
        const wallet = prev.wallets.get(walletId);
        if (!wallet) {
          throw new Error('Wallet not found');
        }
        walletName = wallet.name;
        return prev;
      });

      const wallet = state.wallets.get(walletId);
      if (wallet) {
        const connector = getConnector(wallet.type);
        await connector.disconnect(walletId);
      }

      setState(prev => {
        const newWallets = new Map(prev.wallets);
        newWallets.delete(walletId);

        let newPrimaryId = prev.primaryWalletId;
        if (prev.primaryWalletId === walletId) {
          const firstWallet = Array.from(newWallets.values())[0];
          newPrimaryId = firstWallet?.id || null;
          
          if (firstWallet) {
            newWallets.set(firstWallet.id, {
              ...firstWallet,
              isPrimary: true,
            });
          }
        }

        saveSession(newWallets, newPrimaryId, prev.totalBalanceUSD);

        return {
          ...prev,
          wallets: newWallets,
          primaryWalletId: newPrimaryId,
        };
      });

      toast({
        title: 'Wallet Disconnected',
        description: `${walletName!} disconnected successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect wallet',
        variant: 'destructive',
      });
      throw error;
    }
  }, [saveSession, toast]);

  const disconnectAll = useCallback(async (): Promise<void> => {
    try {
      const walletsToDisconnect = Array.from(state.wallets.entries());
      
      const disconnectPromises = walletsToDisconnect.map(([walletId, wallet]) => {
        const connector = getConnector(wallet.type);
        return connector.disconnect(walletId).catch(err => {
          console.error(`Failed to disconnect ${walletId}:`, err);
        });
      });

      await Promise.all(disconnectPromises);

      setState({
        wallets: new Map(),
        primaryWalletId: null,
        isInitialized: true,
        isConnecting: false,
        totalBalanceUSD: '0',
        error: null,
      });

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DEMO_STORAGE_KEY);

      toast({
        title: 'All Wallets Disconnected',
        description: 'Successfully disconnected all wallets',
      });
    } catch (error: any) {
      toast({
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect all wallets',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const setPrimaryWallet = useCallback((walletId: string): void => {
    setState(prev => {
      const wallet = prev.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const newWallets = new Map(prev.wallets);
      
      newWallets.forEach((w, id) => {
        newWallets.set(id, {
          ...w,
          isPrimary: id === walletId,
        });
      });

      saveSession(newWallets, walletId, prev.totalBalanceUSD);

      toast({
        title: 'Primary Wallet Updated',
        description: `${wallet.name} is now your primary wallet`,
      });

      return {
        ...prev,
        wallets: newWallets,
        primaryWalletId: walletId,
      };
    });
  }, [saveSession, toast]);

  const switchChain = useCallback(async (walletId: string, chainId: string): Promise<void> => {
    let wallet: WalletInfo | undefined;
    
    setState(prev => {
      wallet = prev.wallets.get(walletId);
      return prev;
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
      const connector = getConnector(wallet.type);
      await connector.switchChain(walletId, chainId);

      setState(prev => {
        const newWallets = new Map(prev.wallets);
        const currentWallet = newWallets.get(walletId);
        if (currentWallet) {
          newWallets.set(walletId, {
            ...currentWallet,
            chainId,
          });
        }

        saveSession(newWallets, prev.primaryWalletId, prev.totalBalanceUSD);

        return {
          ...prev,
          wallets: newWallets,
        };
      });

      toast({
        title: 'Chain Switched',
        description: 'Successfully switched chain',
      });
    } catch (error: any) {
      toast({
        title: 'Chain Switch Failed',
        description: error.message || 'Failed to switch chain',
        variant: 'destructive',
      });
      throw error;
    }
  }, [saveSession, toast]);

  const refreshBalances = useCallback(async (): Promise<void> => {
    try {
      const walletsToRefresh = Array.from(state.wallets.entries());
      
      const updatePromises = walletsToRefresh.map(async ([id, wallet]) => {
        try {
          const connector = getConnector(wallet.type);
          const balance = await connector.getBalance(id);
          return { id, balance };
        } catch (error) {
          console.error(`Failed to refresh balance for ${id}:`, error);
          return { id, balance: wallet.balance };
        }
      });

      const results = await Promise.all(updatePromises);

      setState(prev => {
        const newWallets = new Map(prev.wallets);
        results.forEach(({ id, balance }) => {
          const wallet = newWallets.get(id);
          if (wallet && balance) {
            newWallets.set(id, {
              ...wallet,
              balance,
            });
          }
        });

        saveSession(newWallets, prev.primaryWalletId, prev.totalBalanceUSD);

        return {
          ...prev,
          wallets: newWallets,
        };
      });
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  }, [saveSession]);

  const refreshWallet = useCallback(async (walletId: string): Promise<void> => {
    let wallet: WalletInfo | undefined;
    
    setState(prev => {
      wallet = prev.wallets.get(walletId);
      return prev;
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
      const connector = getConnector(wallet.type);
      const balance = await connector.getBalance(walletId);

      setState(prev => {
        const newWallets = new Map(prev.wallets);
        const currentWallet = newWallets.get(walletId);
        if (currentWallet) {
          newWallets.set(walletId, {
            ...currentWallet,
            balance,
          });
        }

        saveSession(newWallets, prev.primaryWalletId, prev.totalBalanceUSD);

        return {
          ...prev,
          wallets: newWallets,
        };
      });
    } catch (error) {
      console.error(`Failed to refresh wallet ${walletId}:`, error);
      throw error;
    }
  }, [saveSession]);

  const getWallet = useCallback((walletId: string): WalletInfo | undefined => {
    return state.wallets.get(walletId);
  }, [state.wallets]);

  const getPrimaryWallet = useCallback((): WalletInfo | undefined => {
    if (!state.primaryWalletId) return undefined;
    return state.wallets.get(state.primaryWalletId);
  }, [state.wallets, state.primaryWalletId]);

  const getAllWallets = useCallback((): WalletInfo[] => {
    return Array.from(state.wallets.values()).sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return (b.lastUsed || 0) - (a.lastUsed || 0);
    });
  }, [state.wallets]);

  const getWalletsByChain = useCallback((chainType: ChainType): WalletInfo[] => {
    return Array.from(state.wallets.values()).filter(w => w.chainType === chainType);
  }, [state.wallets]);

  const signMessage = useCallback(async (walletId: string, message: string): Promise<string> => {
    let wallet: WalletInfo | undefined;
    
    setState(prev => {
      wallet = prev.wallets.get(walletId);
      return prev;
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const connector = getConnector(wallet.type);
    return await connector.signMessage(walletId, message);
  }, []);

  const sendTransaction = useCallback(async (walletId: string, tx: TransactionRequest): Promise<string> => {
    let wallet: WalletInfo | undefined;
    
    setState(prev => {
      wallet = prev.wallets.get(walletId);
      return prev;
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const connector = getConnector(wallet.type);
    const txHash = await connector.sendTransaction(walletId, tx);

    setTimeout(() => {
      refreshWallet(walletId);
    }, 3000);

    return txHash;
  }, [refreshWallet]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const handleAccountsChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { walletId } = customEvent.detail;
      refreshWallet(walletId).catch(console.error);
    };

    const handleChainChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { walletId } = customEvent.detail;
      refreshWallet(walletId).catch(console.error);
    };

    const handleDisconnected = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { walletId } = customEvent.detail;
      disconnectWallet(walletId).catch(console.error);
    };

    window.addEventListener('wallet-accounts-changed', handleAccountsChanged);
    window.addEventListener('wallet-chain-changed', handleChainChanged);
    window.addEventListener('wallet-disconnected', handleDisconnected);

    return () => {
      window.removeEventListener('wallet-accounts-changed', handleAccountsChanged);
      window.removeEventListener('wallet-chain-changed', handleChainChanged);
      window.removeEventListener('wallet-disconnected', handleDisconnected);
    };
  }, [refreshWallet, disconnectWallet]);

  const contextValue: WalletNexusContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    disconnectAll,
    setPrimaryWallet,
    switchChain,
    refreshBalances,
    refreshWallet,
    getWallet,
    getPrimaryWallet,
    getAllWallets,
    getWalletsByChain,
    signMessage,
    sendTransaction,
  };

  return (
    <WalletNexusContext.Provider value={contextValue}>
      {children}
    </WalletNexusContext.Provider>
  );
}

export function useWalletNexus(): WalletNexusContextType {
  const context = useContext(WalletNexusContext);
  if (!context) {
    throw new Error('useWalletNexus must be used within WalletNexusProvider');
  }
  return context;
}
