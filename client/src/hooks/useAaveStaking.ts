import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { AAVE_V3_MARKETS, AAVE_POOL_ABI, AAVE_DATA_PROVIDER_ABI, WETH_ADDRESS } from '@/lib/blockchain/aave-config';
import { useState, useEffect } from 'react';

export function useAaveStaking() {
  const { address } = useAccount();
  const chainId = useChainId();
  const market = AAVE_V3_MARKETS[chainId];
  const wethAddress = WETH_ADDRESS[chainId];

  // Get user's staked balance and earnings
  const { data: userData, refetch: refetchUserData } = useReadContract({
    address: market?.poolDataProvider,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getUserReserveData',
    args: wethAddress && address ? [wethAddress, address] : undefined,
    query: {
      enabled: !!market && !!wethAddress && !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Get reserve data for APY calculation
  const { data: reserveData } = useReadContract({
    address: market?.poolDataProvider,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getReserveData',
    args: wethAddress ? [wethAddress] : undefined,
    query: {
      enabled: !!market && !!wethAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Get user's total account data
  const { data: accountData } = useReadContract({
    address: market?.poolAddress,
    abi: AAVE_POOL_ABI,
    functionName: 'getUserAccountData',
    args: address ? [address] : undefined,
    query: {
      enabled: !!market && !!address,
      refetchInterval: 10000,
    },
  });

  // Write contract hooks
  const { writeContract: writeStake, data: stakeHash, isPending: isStaking } = useWriteContract();
  const { writeContract: writeWithdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();

  // Transaction confirmations
  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Calculate APY from liquidity rate (Aave returns ray units: 1e27)
  const apy = reserveData && reserveData[5] 
    ? Number(reserveData[5]) / 1e25 // Convert ray to percentage
    : 0;

  // Parse user data
  const stakedBalance = userData && userData[0] ? formatEther(userData[0]) : '0';
  const liquidityRate = userData && userData[6] ? Number(userData[6]) / 1e25 : 0;

  // Stake ETH into Aave
  const stake = async (amount: string) => {
    if (!market || !wethAddress || !address) {
      throw new Error('Market not configured or wallet not connected');
    }

    try {
      await writeStake({
        address: market.wethGateway,
        abi: [{
          inputs: [
            { name: 'pool', type: 'address' },
            { name: 'onBehalfOf', type: 'address' },
            { name: 'referralCode', type: 'uint16' },
          ],
          name: 'depositETH',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        }],
        functionName: 'depositETH',
        args: [market.poolAddress, address, 0],
        value: parseEther(amount),
      });
    } catch (error) {
      console.error('Stake error:', error);
      throw error;
    }
  };

  // Withdraw ETH from Aave
  const withdraw = async (amount: string) => {
    if (!market || !wethAddress || !address) {
      throw new Error('Market not configured or wallet not connected');
    }

    try {
      await writeWithdraw({
        address: market.wethGateway,
        abi: [{
          inputs: [
            { name: 'pool', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'to', type: 'address' },
          ],
          name: 'withdrawETH',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        }],
        functionName: 'withdrawETH',
        args: [market.poolAddress, parseEther(amount), address],
      });
    } catch (error) {
      console.error('Withdraw error:', error);
      throw error;
    }
  };

  // Refetch data after successful transactions
  useEffect(() => {
    if (isStakeSuccess || isWithdrawSuccess) {
      refetchUserData();
    }
  }, [isStakeSuccess, isWithdrawSuccess, refetchUserData]);

  return {
    // Balances
    stakedBalance,
    apy,
    liquidityRate,
    totalCollateral: accountData && accountData[0] ? formatEther(accountData[0]) : '0',
    healthFactor: accountData && accountData[5] ? Number(accountData[5]) / 1e18 : 0,
    
    // Actions
    stake,
    withdraw,
    
    // Loading states
    isStaking: isStaking || isStakeConfirming,
    isWithdrawing: isWithdrawing || isWithdrawConfirming,
    isStakeSuccess,
    isWithdrawSuccess,
    
    // Transaction hashes
    stakeHash,
    withdrawHash,
    
    // Market info
    marketName: market?.name || 'Unknown Network',
    isMarketAvailable: !!market,
  };
}
