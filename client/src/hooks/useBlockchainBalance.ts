import { useAccount, useBalance, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { WETH_ADDRESS } from '@/lib/blockchain/aave-config';

export function useBlockchainBalance() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wethAddress = WETH_ADDRESS[chainId];

  // Get native ETH balance
  const { data: ethBalance, refetch: refetchEth, isLoading: isLoadingEth } = useBalance({
    address,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Get WETH balance
  const { data: wethBalance, refetch: refetchWeth, isLoading: isLoadingWeth } = useBalance({
    address,
    token: wethAddress,
    query: {
      enabled: isConnected && !!address && !!wethAddress,
      refetchInterval: 10000,
    },
  });

  const refetchBalances = () => {
    refetchEth();
    refetchWeth();
  };

  return {
    // ETH balance
    ethBalance: ethBalance ? formatEther(ethBalance.value) : '0',
    ethFormatted: ethBalance ? ethBalance.formatted : '0',
    ethSymbol: ethBalance?.symbol || 'ETH',
    
    // WETH balance
    wethBalance: wethBalance ? formatEther(wethBalance.value) : '0',
    wethFormatted: wethBalance ? wethBalance.formatted : '0',
    
    // Loading states
    isLoading: isLoadingEth || isLoadingWeth,
    
    // Utilities
    refetchBalances,
    address,
    isConnected,
  };
}
