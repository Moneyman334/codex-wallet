import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { SUPPORTED_CHAINS, getChainById, getEVMChains, type ChainConfig } from '@shared/blockchain-config';

interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: ethers.BrowserProvider | null;
}

export function useMultiChainWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    isConnected: false,
    isConnecting: false,
    provider: null,
  });

  const [currentChain, setCurrentChain] = useState<ChainConfig | null>(null);
  const [supportedChains] = useState(() => getEVMChains());

  // Initialize wallet connection
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet!');
      return;
    }

    try {
      setWalletState((prev) => ({ ...prev, isConnecting: true }));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const chain = getChainById(chainId);

      if (chain) {
        setCurrentChain(chain);
      }

      const balance = await provider.getBalance(address);
      const balanceFormatted = ethers.formatEther(balance);

      setWalletState({
        address,
        chainId,
        balance: balanceFormatted,
        isConnected: true,
        isConnecting: false,
        provider,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, []);

  // Switch to a different chain
  const switchChain = useCallback(async (targetChain: ChainConfig) => {
    if (!window.ethereum || !walletState.provider) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Convert chain ID to hex
      const chainIdHex = `0x${targetChain.id.toString(16)}`;

      // Try to switch to the chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      setCurrentChain(targetChain);
    } catch (error: any) {
      // Chain not added to wallet, let's add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChain.id.toString(16)}`,
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: [targetChain.rpcUrl.replace('${ALCHEMY_API_KEY}', import.meta.env.VITE_ALCHEMY_API_KEY || '')],
                blockExplorerUrls: [targetChain.explorerUrl],
              },
            ],
          });
          setCurrentChain(targetChain);
        } catch (addError) {
          console.error('Failed to add chain:', addError);
        }
      } else {
        console.error('Failed to switch chain:', error);
      }
    }
  }, [walletState.provider]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      chainId: null,
      balance: null,
      isConnected: false,
      isConnecting: false,
      provider: null,
    });
    setCurrentChain(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletState((prev) => ({
          ...prev,
          address: accounts[0],
        }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const chain = getChainById(chainId);
      
      if (chain) {
        setCurrentChain(chain);
        setWalletState((prev) => ({ ...prev, chainId }));
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnectWallet]);

  // Auto-reconnect on page load
  useEffect(() => {
    if (window.ethereum && !walletState.isConnected) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        })
        .catch(console.error);
    }
  }, [connectWallet, walletState.isConnected]);

  return {
    ...walletState,
    currentChain,
    supportedChains,
    allChains: Object.values(SUPPORTED_CHAINS),
    connectWallet,
    disconnectWallet,
    switchChain,
  };
}
