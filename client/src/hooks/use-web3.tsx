import { useState, useEffect, useCallback, useMemo } from "react";
import detectEthereumProvider from '@metamask/detect-provider';
import { 
  createWeb3Provider, 
  networks, 
  getNetworkByChainId,
  formatTokenAmount,
  getBlockExplorerUrl,
  isChainSupported,
  getAllNetworks,
  weiToGwei,
  WEI_PER_ETH,
  transferToken,
  approveToken,
  getTokenAllowance 
} from "@/lib/web3";
import { formatBalanceFromWei } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  tokenDetectionService, 
  DetectedToken, 
  TokenDetectionOptions 
} from "@/lib/tokenDetection";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { parseWeb3Error, getErrorAction } from "@/lib/web3-error-handler";

interface Web3State {
  isConnected: boolean;
  isCheckingConnection: boolean;
  needsReconnect: boolean;
  lastKnownAccount?: string;
  account?: string;
  balance?: string;
  network?: any;
  chainId?: string;
  blockNumber?: string;
  gasPrice?: string;
  tokens?: DetectedToken[];
  isLoadingTokens?: boolean;
  tokenError?: string;
}

export function useWeb3() {
  const [state, setState] = useState<Web3State>(() => {
    const wasConnected = localStorage.getItem('web3_connected') === 'true';
    const lastAccount = localStorage.getItem('web3_last_account') || undefined;
    return {
      isConnected: false,
      isCheckingConnection: false,
      needsReconnect: wasConnected && !!(lastAccount),
      lastKnownAccount: lastAccount,
    };
  });
  
  const { toast } = useToast();

  const updateState = (updates: Partial<Web3State>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const checkConnection = useCallback(async (clearOnEmpty: boolean = true) => {
    try {
      updateState({ isCheckingConnection: true });
      
      if (!window.ethereum) {
        updateState({ 
          isConnected: false, 
          isCheckingConnection: false 
        });
        // Only clear if explicitly requested (user disconnect) not on initial check
        if (clearOnEmpty) {
          localStorage.removeItem('web3_connected');
          localStorage.removeItem('web3_last_account');
        }
        return;
      }
      
      // Get MetaMask provider specifically (handles multiple wallet providers)
      let provider = window.ethereum;
      
      // Check if there are multiple wallet providers
      if ((window.ethereum as any).providers?.length > 0) {
        // Find MetaMask in the providers array
        const metamaskProvider = (window.ethereum as any).providers.find(
          (p: any) => p.isMetaMask
        );
        if (metamaskProvider) {
          provider = metamaskProvider;
        }
      }
      
      const accounts = await provider.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        const account = accounts[0];
        const balance = await provider.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        });
        
        const chainId = await provider.request({
          method: 'eth_chainId'
        });
        
        const network = getNetworkByChainId(chainId) || {
          name: 'Unsupported Network',
          symbol: 'ETH',
          decimals: 18,
          isTestnet: false,
          chainType: 'Unknown',
          icon: '❓',
          color: 'hsl(0, 0%, 50%)'
        };
        
        const balanceInToken = (() => {
          try {
            return formatBalanceFromWei(balance, network.decimals || 18, 4);
          } catch (error) {
            console.error("Balance conversion error:", error);
            return '0.0000';
          }
        })();
        
        updateState({
          isConnected: true,
          isCheckingConnection: false,
          needsReconnect: false,
          lastKnownAccount: account,
          account,
          balance: balanceInToken,
          network,
          chainId
        });
        
        // Save connection preference - wallet is connected and working
        localStorage.setItem('web3_connected', 'true');
        localStorage.setItem('web3_last_account', account);
        console.log('✅ Wallet connected and persisted:', account.slice(0, 8) + '...');
        
        // Get additional network info
        await refreshNetworkInfo();
      } else {
        // No accounts returned - MetaMask might be locked
        const lastAccount = localStorage.getItem('web3_last_account');
        const wasConnected = localStorage.getItem('web3_connected') === 'true';
        
        // Only clear localStorage if explicitly requested (user clicked disconnect)
        if (clearOnEmpty) {
          localStorage.removeItem('web3_connected');
          localStorage.removeItem('web3_last_account');
          updateState({ 
            isConnected: false, 
            isCheckingConnection: false,
            needsReconnect: false,
            lastKnownAccount: undefined,
            account: undefined
          });
        } else {
          // Keep the previous account reference for reconnection but clear active account data
          // This prevents UI components from falsely showing as connected
          updateState({ 
            isConnected: false, 
            isCheckingConnection: false,
            needsReconnect: wasConnected && !!lastAccount,
            lastKnownAccount: lastAccount || undefined,
            account: undefined,
            balance: undefined,
            network: undefined,
            chainId: undefined,
            blockNumber: undefined,
            gasPrice: undefined
          });
          if (lastAccount) {
            console.log('ℹ️ Wallet was previously connected. Unlock MetaMask to reconnect:', lastAccount.slice(0, 8) + '...');
          }
        }
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
      updateState({ 
        isConnected: false, 
        isCheckingConnection: false 
        });
      // Don't clear localStorage on error - might be temporary
    }
  }, []);

  // Check connection on mount - don't clear localStorage if wallet is locked
  useEffect(() => {
    checkConnection(false);
  }, [checkConnection]);

  const isMobile = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const isIOSFirefox = useMemo(() => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) && /FxiOS/i.test(navigator.userAgent);
  }, []);

  const connectWallet = useCallback(async (retryCount = 0) => {
    try {
      // Check for iOS Firefox first - it can't support MetaMask extensions
      if (isIOSFirefox || (isMobile && /Firefox/i.test(navigator.userAgent))) {
        toast({
          title: "Browser Not Supported",
          description: "iOS Firefox cannot connect to MetaMask. Please open this page in Safari or inside the MetaMask app's built-in browser.",
          variant: "destructive",
          duration: 10000,
        });
        return;
      }

      // Use MetaMask's official detection method (works in Firefox with multiple wallets)
      const detectedProvider = await detectEthereumProvider({ 
        mustBeMetaMask: true,
        silent: false,
        timeout: 3000
      }) as any;

      if (!detectedProvider) {
        // No MetaMask found - show installation instructions
        if (isMobile) {
          toast({
            title: "MetaMask Not Found",
            description: "Please open this page in MetaMask mobile browser. Tap the browser icon (🌐) in your MetaMask app and paste this URL.",
            variant: "destructive",
            duration: 10000,
          });
          return;
        }
        
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask browser extension to connect your wallet.",
          variant: "destructive",
        });
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      console.log('✅ MetaMask detected successfully!');
      
      // Show helpful message
      toast({
        title: "Check MetaMask",
        description: "Look for the MetaMask popup window and click 'Connect'. It might be hidden behind your browser!",
        duration: 5000,
      });
      
      // Request accounts from the REAL MetaMask provider
      const accountsPromise = detectedProvider.request({
        method: 'eth_requestAccounts'
      });
      
      // Add timeout to prevent infinite waiting (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - MetaMask popup might be hidden. Check all your browser windows!')), 15000);
      });
      
      const accounts = await Promise.race([accountsPromise, timeoutPromise]) as string[];

      if (accounts.length > 0) {
        await checkConnection();
        
        // Save wallet to database
        try {
          const account = accounts[0];
          const balance = await detectedProvider.request({
            method: 'eth_getBalance',
            params: [account, 'latest']
          });
          const chainId = await detectedProvider.request({
            method: 'eth_chainId'
          });
          const network = getNetworkByChainId(chainId);

          await apiRequest('POST', '/api/wallets', {
            address: account,
            balance: balance,
            network: network?.name || 'mainnet'
          });
          
          console.log('✅ Wallet saved to database:', account);
        } catch (saveError) {
          console.log('ℹ️ Could not save wallet to database:', saveError);
          // Don't fail connection if save fails
        }
        
        toast({
          title: "Wallet connected",
          description: "Successfully connected to your wallet",
        });
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      
      const errorInfo = parseWeb3Error(error);
      
      // Retry logic only for pending request errors
      if (retryCount < 2 && error.code === -32002) {
        toast({
          title: errorInfo.title,
          description: "Please check your wallet for pending requests...",
        });
        setTimeout(() => connectWallet(retryCount + 1), 1000);
        return;
      }
      
      // Show user-friendly error message
      toast({
        title: errorInfo.title,
        description: `${errorInfo.description}. ${getErrorAction(errorInfo)}`,
        variant: errorInfo.isUserRejection ? "default" : "destructive",
      });
    }
  }, [checkConnection, toast, isMobile]);

  const disconnectWallet = useCallback(() => {
    updateState({
      isConnected: false,
      needsReconnect: false,
      lastKnownAccount: undefined,
      account: undefined,
      balance: undefined,
      network: undefined,
      chainId: undefined,
      blockNumber: undefined,
      gasPrice: undefined
    });
    
    // Clear connection preference completely
    localStorage.removeItem('web3_connected');
    localStorage.removeItem('web3_last_account');
    
    console.log('🔌 Wallet explicitly disconnected by user');
    
    toast({
      title: "Wallet disconnected",
      description: "Successfully disconnected from wallet",
    });
  }, [toast]);

  const switchNetwork = useCallback(async (targetChainId: string) => {
    try {
      if (!window.ethereum) return;
      
      const targetNetwork = getNetworkByChainId(targetChainId);
      if (!targetNetwork) {
        toast({
          title: "Unsupported network",
          description: "The selected network is not supported",
          variant: "destructive",
        });
        return;
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
        
        toast({
          title: "Network switched",
          description: `Switched to ${targetNetwork.name}`,
        });
      } catch (switchError: any) {
        // If the network doesn't exist in MetaMask, try to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: targetNetwork.name,
                rpcUrls: [targetNetwork.rpcUrl],
                blockExplorerUrls: [targetNetwork.blockExplorerUrl],
                nativeCurrency: {
                  name: targetNetwork.symbol,
                  symbol: targetNetwork.symbol,
                  decimals: targetNetwork.decimals || 18
                }
              }],
            });
            
            toast({
              title: "Network added and switched",
              description: `Added and switched to ${targetNetwork.name}`,
            });
          } catch (addError: any) {
            console.error("Failed to add network:", addError);
            toast({
              title: "Failed to add network",
              description: addError.message || "Failed to add network to wallet",
              variant: "destructive",
            });
          }
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      const errorInfo = parseWeb3Error(error);
      toast({
        title: errorInfo.title,
        description: `${errorInfo.description}. ${getErrorAction(errorInfo)}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const refreshNetworkInfo = useCallback(async () => {
    try {
      if (!window.ethereum || !state.isConnected) return;

      const blockNumber = await window.ethereum.request({
        method: 'eth_blockNumber'
      });
      
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      const blockNum = parseInt(blockNumber, 16).toLocaleString();
      const gasPriceGwei = (() => {
        try {
          return parseFloat(weiToGwei(gasPrice)).toFixed(1);
        } catch {
          return '0.0';
        }
      })();

      updateState({
        blockNumber: blockNum,
        gasPrice: `${gasPriceGwei} gwei`
      });
    } catch (error) {
      console.error("Failed to refresh network info:", error);
    }
  }, [state.isConnected]);

  const refreshBalance = useCallback(async () => {
    try {
      if (!window.ethereum || !state.account || !state.isConnected) return;

      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [state.account, 'latest']
      });

      const network = state.network || {
        decimals: 18,
        symbol: 'ETH'
      };

      const balanceInToken = (() => {
        try {
          const balanceBigInt = BigInt(balance);
          const decimals = BigInt(network.decimals || 18);
          let divisor = BigInt(1);
          for (let i = 0; i < Number(decimals); i++) {
            divisor = divisor * BigInt(10);
          }
          const intPart = balanceBigInt / divisor;
          const remainder = balanceBigInt % divisor;
          const fractional = remainder.toString().padStart(Number(decimals), '0').slice(0, 4);
          return `${intPart.toString()}.${fractional.replace(/0+$/, '') || '0'}`;
        } catch (error) {
          console.error("Balance conversion error:", error);
          return '0.0000';
        }
      })();

      updateState({
        balance: balanceInToken
      });
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  }, [state.account, state.isConnected, state.network]);

  const estimateGas = useCallback(async (to: string, value: string) => {
    try {
      if (!window.ethereum || !state.account) {
        throw new Error("Wallet not connected");
      }

      const valueInWei = (() => {
        try {
          const [intPart, fracPart = '0'] = value.split('.');
          const paddedFrac = fracPart.padEnd(18, '0').slice(0, 18);
          const weiBigInt = BigInt(intPart) * WEI_PER_ETH + BigInt(paddedFrac);
          return '0x' + weiBigInt.toString(16);
        } catch {
          throw new Error('Invalid amount format');
        }
      })();
      
      const gasLimit = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: state.account,
          to,
          value: valueInWei
        }]
      });

      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      const gasLimitBigInt = BigInt(gasLimit);
      const gasPriceBigInt = BigInt(gasPrice);
      const feeBigInt = gasLimitBigInt * gasPriceBigInt;
      const feeInEth = (() => {
        const ethValue = feeBigInt / WEI_PER_ETH;
        const remainder = feeBigInt % WEI_PER_ETH;
        const fractional = remainder.toString().padStart(18, '0').slice(0, 6);
        return `${ethValue.toString()}.${fractional.replace(/0+$/, '') || '0'}`;
      })();
      
      const currentNetwork = getNetworkByChainId(state.chainId || '0x1');
      const feeSymbol = currentNetwork?.symbol || 'ETH';

      return {
        gasLimit: gasLimitBigInt.toLocaleString(),
        gasPrice: `${parseFloat(weiToGwei(gasPrice)).toFixed(1)} gwei`,
        estimatedFee: formatTokenAmount(feeInEth, feeSymbol)
      };
    } catch (error: any) {
      console.error("Failed to estimate gas:", error);
      throw error;
    }
  }, [state.account]);

  const sendTransaction = useCallback(async (to: string, value: string) => {
    try {
      if (!window.ethereum || !state.account) {
        throw new Error("Wallet not connected");
      }

      // SECURITY ENFORCEMENT: Validate transaction before sending
      const valueInWei = (() => {
        try {
          const [intPart, fracPart = '0'] = value.split('.');
          const paddedFrac = fracPart.padEnd(18, '0').slice(0, 18);
          const weiBigInt = BigInt(intPart) * WEI_PER_ETH + BigInt(paddedFrac);
          return weiBigInt.toString();
        } catch {
          throw new Error('Invalid amount format');
        }
      })();

      const validationResponse = await fetch('/api/security/validate-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: state.account,
          to,
          amount: value,
          amountWei: valueInWei,
          network: state.network?.name || 'Unknown',
          chainId: state.chainId || '0x1',
          timestamp: new Date().toISOString()
        })
      });

      if (!validationResponse.ok) {
        throw new Error('Transaction validation failed');
      }

      const validation = await validationResponse.json();

      // BLOCK if transaction is denied
      if (validation.blocked) {
        const error = new Error('Transaction blocked by security policy') as any;
        error.blocked = true;
        error.reason = validation.alerts?.[0]?.description || 'Address is blocked';
        throw error;
      }

      // ENFORCE warnings - require explicit confirmation
      if (validation.warnings && validation.warnings.length > 0) {
        const warningMessage = validation.warnings.join('\n\n');
        const confirmed = window.confirm(
          `⚠️ SECURITY WARNING:\n\n${warningMessage}\n\nDo you want to proceed with this transaction?`
        );
        
        if (!confirmed) {
          const error = new Error('Transaction cancelled by user due to security warnings') as any;
          error.cancelled = true;
          error.warnings = validation.warnings;
          throw error;
        }
      }

      const valueInHex = '0x' + BigInt(valueInWei).toString(16);
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: state.account,
          to,
          value: valueInHex
        }]
      });

      // Refresh balance after transaction
      setTimeout(() => {
        checkConnection();
      }, 2000);

      return txHash;
    } catch (error: any) {
      console.error("Failed to send transaction:", error);
      throw error;
    }
  }, [state.account, checkConnection]);

  // Initialize and setup event listeners
  useEffect(() => {
    // Auto-reconnect if previously connected - don't clear localStorage if wallet is locked
    const wasConnected = localStorage.getItem('web3_connected') === 'true';
    const lastAccount = localStorage.getItem('web3_last_account');
    
    if (wasConnected && window.ethereum) {
      console.log('🔄 Attempting to restore wallet connection...', lastAccount?.slice(0, 8) + '...');
      checkConnection(false); // Don't clear if MetaMask is locked
    }

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // MetaMask locked OR user disconnected via MetaMask
          // DON'T call disconnectWallet() - that clears localStorage
          // Instead, just check connection without clearing (preserve needsReconnect state)
          console.log('ℹ️ MetaMask accounts empty (locked or disconnected) - preserving session');
          checkConnection(false);
        } else {
          // Account changed - update connection (true to persist new account)
          checkConnection(true);
        }
      };

      const handleChainChanged = () => {
        // Reload page on chain change for data consistency
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkConnection, disconnectWallet]);

  // Periodic connection check - re-check every 30 seconds to catch MetaMask unlock
  useEffect(() => {
    const wasConnected = localStorage.getItem('web3_connected') === 'true';
    if (!wasConnected || !window.ethereum) return;

    const interval = setInterval(() => {
      // Only check if we're not already connected
      if (!state.isConnected) {
        checkConnection(false);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [state.isConnected, checkConnection]);

  // New utility functions for multi-chain support
  const getAvailableNetworks = useCallback(() => {
    return getAllNetworks();
  }, []);
  
  const getCurrentNetworkInfo = useCallback(() => {
    if (!state.chainId) return null;
    return getNetworkByChainId(state.chainId);
  }, [state.chainId]);
  
  const getTokenExplorerUrl = useCallback((address?: string, txHash?: string) => {
    if (!state.chainId) return '#';
    return getBlockExplorerUrl(state.chainId, txHash, address);
  }, [state.chainId]);
  
  const isCurrentNetworkSupported = useCallback(() => {
    return state.chainId ? isChainSupported(state.chainId) : false;
  }, [state.chainId]);

  // ========================
  // TOKEN MANAGEMENT
  // ========================

  const queryClient = useQueryClient();

  // Fetch tokens for current wallet and chain
  const {
    data: detectedTokens,
    isLoading: isLoadingTokens,
    error: tokenError,
    refetch: refetchTokens
  } = useQuery({
    queryKey: ['tokens', state.account, state.chainId],
    queryFn: async () => {
      if (!state.account || !state.chainId) return [];
      return tokenDetectionService.detectTokensForWallet(
        state.account,
        state.chainId,
        { includeZeroBalances: true }
      );
    },
    enabled: !!state.account && !!state.chainId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Detect tokens function
  const detectTokens = useCallback(async (options?: TokenDetectionOptions) => {
    if (!state.account || !state.chainId) return [];
    
    updateState({ isLoadingTokens: true, tokenError: undefined });
    
    try {
      const tokens = await tokenDetectionService.detectTokensForWallet(
        state.account,
        state.chainId,
        options
      );
      
      updateState({ tokens, isLoadingTokens: false });
      
      // Sync with backend
      for (const token of tokens) {
        try {
          await apiRequest('POST', '/api/tokens', {
            contractAddress: token.address,
            chainId: token.chainId,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals.toString(),
            logoUrl: token.logoUrl || null,
            isVerified: token.isPopular ? "true" : "false"
          });
        } catch (apiError) {
          // Token might already exist, continue
          console.debug('Token already exists in backend:', apiError);
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Failed to detect tokens:', error);
      updateState({ 
        tokenError: error instanceof Error ? error.message : 'Failed to detect tokens',
        isLoadingTokens: false 
      });
      return [];
    }
  }, [state.account, state.chainId]);

  // Add custom token
  const addCustomToken = useCallback(async (contractAddress: string) => {
    if (!state.account || !state.chainId) {
      throw new Error('Wallet not connected');
    }

    try {
      const customToken = await tokenDetectionService.addCustomToken(
        contractAddress,
        state.account,
        state.chainId
      );

      if (!customToken) {
        throw new Error('Failed to add custom token');
      }

      // Add to backend
      await apiRequest('POST', '/api/tokens', {
        contractAddress: customToken.address,
        chainId: customToken.chainId,
        name: customToken.name,
        symbol: customToken.symbol,
        decimals: customToken.decimals.toString(),
        logoUrl: customToken.logoUrl || null,
        isVerified: "false"
      });

      // Add to user tokens
      await apiRequest('POST', '/api/user-tokens', {
        userId: state.account, // Using account as user ID for now
        walletAddress: state.account,
        tokenId: customToken.address,
        isHidden: "false",
        sortOrder: "0"
      });

      // Refresh tokens
      await refetchTokens();
      
      toast({
        title: "Token added",
        description: `Successfully added ${customToken.symbol} (${customToken.name})`,
      });

      return customToken;
    } catch (error: any) {
      console.error('Failed to add custom token:', error);
      const errorInfo = parseWeb3Error(error);
      toast({
        title: errorInfo.title,
        description: `${errorInfo.description}. ${getErrorAction(errorInfo)}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [state.account, state.chainId, toast, refetchTokens]);

  // Transfer token
  const transferTokenMutation = useMutation({
    mutationFn: async ({ 
      tokenAddress, 
      toAddress, 
      amount, 
      decimals 
    }: { 
      tokenAddress: string;
      toAddress: string;
      amount: string;
      decimals: number;
    }) => {
      if (!state.account) {
        throw new Error('Wallet not connected');
      }

      return transferToken(tokenAddress, toAddress, amount, decimals, state.account);
    },
    onSuccess: (txHash, variables) => {
      toast({
        title: "Transfer initiated",
        description: `Token transfer transaction submitted: ${txHash.slice(0, 10)}...`,
      });

      // Refresh balances after a delay
      setTimeout(() => {
        refetchTokens();
        checkConnection();
      }, 3000);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (error: any) => {
      console.error('Token transfer failed:', error);
      const errorInfo = parseWeb3Error(error);
      toast({
        title: errorInfo.title,
        description: `${errorInfo.description}. ${getErrorAction(errorInfo)}`,
        variant: "destructive",
      });
    }
  });

  // Approve token spending
  const approveTokenMutation = useMutation({
    mutationFn: async ({ 
      tokenAddress, 
      spenderAddress, 
      amount, 
      decimals 
    }: { 
      tokenAddress: string;
      spenderAddress: string;
      amount: string;
      decimals: number;
    }) => {
      if (!state.account) {
        throw new Error('Wallet not connected');
      }

      return approveToken(tokenAddress, spenderAddress, amount, decimals, state.account);
    },
    onSuccess: (txHash) => {
      toast({
        title: "Approval successful",
        description: `Token approval transaction submitted: ${txHash.slice(0, 10)}...`,
      });
    },
    onError: (error: any) => {
      console.error('Token approval failed:', error);
      const errorInfo = parseWeb3Error(error);
      toast({
        title: errorInfo.title,
        description: `${errorInfo.description}. ${getErrorAction(errorInfo)}`,
        variant: "destructive",
      });
    }
  });

  // Get token allowance
  const getTokenAllowanceCallback = useCallback(async (
    tokenAddress: string,
    spenderAddress: string
  ) => {
    if (!state.account) {
      throw new Error('Wallet not connected');
    }

    return getTokenAllowance(tokenAddress, state.account, spenderAddress);
  }, [state.account]);

  // Refresh token balances
  const refreshTokenBalances = useCallback(async () => {
    if (!state.account || !detectedTokens?.length) return;

    try {
      const refreshedTokens = await tokenDetectionService.refreshTokenBalances(
        detectedTokens,
        state.account
      );
      
      updateState({ tokens: refreshedTokens });

      // Update backend balances
      for (const token of refreshedTokens) {
        try {
          await apiRequest('PUT', '/api/tokens/balances', {
            walletAddress: state.account,
            tokenId: token.address,
            balance: token.balanceInWei
          });
        } catch (error) {
          console.debug('Failed to update backend balance:', error);
        }
      }
      
      return refreshedTokens;
    } catch (error) {
      console.error('Failed to refresh token balances:', error);
      return detectedTokens;
    }
  }, [state.account, detectedTokens]);

  // Get token by address
  const getTokenByAddress = useCallback((address: string) => {
    return detectedTokens?.find(token => 
      token.address.toLowerCase() === address.toLowerCase()
    );
  }, [detectedTokens]);

  // Search tokens
  const searchTokens = useCallback((query: string) => {
    if (!detectedTokens) return [];
    return tokenDetectionService.searchTokens(detectedTokens, query);
  }, [detectedTokens]);

  // Update token state when detected tokens change
  useEffect(() => {
    updateState({ 
      tokens: detectedTokens,
      isLoadingTokens,
      tokenError: tokenError?.message 
    });
  }, [detectedTokens, isLoadingTokens, tokenError]);

  return useMemo(() => ({
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshNetworkInfo,
    refreshBalance,
    estimateGas,
    sendTransaction,
    getAvailableNetworks,
    getCurrentNetworkInfo,
    getTokenExplorerUrl,
    isCurrentNetworkSupported,
    // Token functions
    detectTokens,
    addCustomToken,
    transferToken: transferTokenMutation.mutate,
    approveToken: approveTokenMutation.mutate,
    getTokenAllowance: getTokenAllowanceCallback,
    refreshTokenBalances,
    getTokenByAddress,
    searchTokens,
    isTransferring: transferTokenMutation.isPending,
    isApproving: approveTokenMutation.isPending,
    refetchTokens
  }), [
    state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshNetworkInfo,
    refreshBalance,
    estimateGas,
    sendTransaction,
    getAvailableNetworks,
    getCurrentNetworkInfo,
    getTokenExplorerUrl,
    isCurrentNetworkSupported,
    detectTokens,
    addCustomToken,
    transferTokenMutation.mutate,
    transferTokenMutation.isPending,
    approveTokenMutation.mutate,
    approveTokenMutation.isPending,
    getTokenAllowanceCallback,
    refreshTokenBalances,
    getTokenByAddress,
    searchTokens,
    refetchTokens
  ]);
}
