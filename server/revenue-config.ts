/**
 * REVENUE COLLECTION CONFIGURATION
 * 
 * This file centralizes all platform revenue collection points.
 * All fees, commissions, and platform earnings flow to these addresses.
 */

/**
 * Get platform fee wallet address
 * Priority: Environment variable > Database default > Hardcoded fallback
 */
export function getPlatformFeeWallet(): string {
  // Check environment first (allows easy override via Secrets)
  if (process.env.PLATFORM_FEE_WALLET) {
    return process.env.PLATFORM_FEE_WALLET;
  }
  
  // Fallback to merchant address from env
  if (process.env.MERCHANT_ADDRESS) {
    return process.env.MERCHANT_ADDRESS;
  }
  
  // Hardcoded fallback (platform payment address from DB)
  return '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';
}

/**
 * Revenue collection addresses for different features
 */
export const REVENUE_CONFIG = {
  // DEX Trading Fees (0.3% on all trades)
  dexFeeWallet: getPlatformFeeWallet(),
  dexFeeBasisPoints: 30, // 0.3%
  
  // CODEX Pay Merchant Fees (0.5% on all payments)
  codexPayFeePercentage: 0.50,
  codexPayFeeWallet: getPlatformFeeWallet(),
  
  // NFT Marketplace Commission (2% on all sales)
  nftCommissionPercentage: 2.0,
  nftCommissionWallet: getPlatformFeeWallet(),
  
  // Subscription Payments (100% to platform)
  subscriptionWallet: getPlatformFeeWallet(),
  
  // Trading Bot Fees (0.1% on executed trades)
  tradingBotFeePercentage: 0.1,
  tradingBotFeeWallet: getPlatformFeeWallet(),
  
  // Token Launchpad (7.5% platform fee)
  launchpadFeePercentage: 7.5,
  launchpadFeeWallet: getPlatformFeeWallet(),
  
  // Staking Pool Performance Fee (10% on rewards - industry standard)
  stakingPoolFeePercentage: 10.0,
  stakingPoolFeeWallet: getPlatformFeeWallet(),
  
  // Yield Farming (0% - users keep all yield, we earn from staking pool fees)
  yieldFarmingFeePercentage: 0,
  
  // Bridge Fees (0.1% on cross-chain transfers)
  bridgeFeePercentage: 0.1,
  bridgeFeeWallet: getPlatformFeeWallet(),
} as const;

/**
 * Calculate platform fee for a given amount and fee type
 */
export function calculatePlatformFee(
  amount: number,
  feeType: 'dex' | 'codexPay' | 'nft' | 'trading' | 'launchpad' | 'bridge' | 'staking'
): { feeAmount: number; netAmount: number; feePercentage: number } {
  let feePercentage = 0;
  
  switch (feeType) {
    case 'dex':
      feePercentage = REVENUE_CONFIG.dexFeeBasisPoints / 10000; // Convert basis points to percentage
      break;
    case 'codexPay':
      feePercentage = REVENUE_CONFIG.codexPayFeePercentage / 100;
      break;
    case 'nft':
      feePercentage = REVENUE_CONFIG.nftCommissionPercentage / 100;
      break;
    case 'trading':
      feePercentage = REVENUE_CONFIG.tradingBotFeePercentage / 100;
      break;
    case 'launchpad':
      feePercentage = REVENUE_CONFIG.launchpadFeePercentage / 100;
      break;
    case 'bridge':
      feePercentage = REVENUE_CONFIG.bridgeFeePercentage / 100;
      break;
    case 'staking':
      feePercentage = REVENUE_CONFIG.stakingPoolFeePercentage / 100;
      break;
  }
  
  const feeAmount = amount * feePercentage;
  const netAmount = amount - feeAmount;
  
  return {
    feeAmount,
    netAmount,
    feePercentage: feePercentage * 100, // Return as percentage for display
  };
}

/**
 * Get revenue wallet for a specific feature
 */
export function getRevenueWallet(feature: 'dex' | 'codexPay' | 'nft' | 'subscription' | 'trading' | 'launchpad' | 'bridge' | 'staking'): string {
  const wallets = {
    dex: REVENUE_CONFIG.dexFeeWallet,
    codexPay: REVENUE_CONFIG.codexPayFeeWallet,
    nft: REVENUE_CONFIG.nftCommissionWallet,
    subscription: REVENUE_CONFIG.subscriptionWallet,
    trading: REVENUE_CONFIG.tradingBotFeeWallet,
    launchpad: REVENUE_CONFIG.launchpadFeeWallet,
    bridge: REVENUE_CONFIG.bridgeFeeWallet,
    staking: REVENUE_CONFIG.stakingPoolFeeWallet,
  };
  
  return wallets[feature];
}

/**
 * Revenue tracking types
 */
export interface RevenueEvent {
  type: 'dex' | 'codexPay' | 'nft' | 'subscription' | 'trading' | 'launchpad' | 'bridge' | 'staking';
  amount: number;
  currency: string;
  feeAmount: number;
  netAmount: number;
  wallet: string;
  txHash?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Log revenue event (for analytics and tracking)
 */
export function logRevenueEvent(event: RevenueEvent): void {
  console.log(`💰 REVENUE COLLECTED:`, {
    type: event.type.toUpperCase(),
    amount: `$${event.amount.toFixed(2)}`,
    fee: `$${event.feeAmount.toFixed(2)}`,
    net: `$${event.netAmount.toFixed(2)}`,
    wallet: `${event.wallet.slice(0, 6)}...${event.wallet.slice(-4)}`,
    txHash: event.txHash ? `${event.txHash.slice(0, 10)}...` : 'N/A',
  });
}

/**
 * Daily revenue summary
 */
export interface DailyRevenue {
  date: string;
  dexFees: number;
  codexPayFees: number;
  nftCommissions: number;
  subscriptions: number;
  tradingFees: number;
  launchpadFees: number;
  bridgeFees: number;
  stakingFees: number;
  total: number;
}
