import { db as dbClient } from './storage';
import { subscriptionPlans, subscriptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface FeeStructure {
  tradingFee: number;
  paymentFee: number;
  marketplaceFee: number;
  nftLaunchpadFee: number;
  withdrawalFee: number;
  tier: string;
}

const DEFAULT_FEES: FeeStructure = {
  tradingFee: 0.30, // 0.30%
  paymentFee: 1.5,  // 1.5%
  marketplaceFee: 2.5, // 2.5%
  nftLaunchpadFee: 7.5, // 7.5%
  withdrawalFee: 0.1, // 0.1%
  tier: 'free'
};

export class FeeService {
  /**
   * Get fee structure for a user based on their active subscription
   */
  async getUserFees(walletAddress: string): Promise<FeeStructure> {
    if (!walletAddress) {
      return DEFAULT_FEES;
    }

    try {
      // Get user's active subscription
      const activeSubscription = await dbClient
        .select({
          plan: subscriptionPlans,
        })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            eq(subscriptions.customerWallet, walletAddress),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);

      if (!activeSubscription || activeSubscription.length === 0) {
        return DEFAULT_FEES;
      }

      const plan = activeSubscription[0].plan;
      const metadata = (plan.metadata || {}) as any;

      return {
        tradingFee: parseFloat(metadata.tradingFee || DEFAULT_FEES.tradingFee.toString()),
        paymentFee: parseFloat(metadata.paymentFee || DEFAULT_FEES.paymentFee.toString()),
        marketplaceFee: parseFloat(metadata.marketplaceFee || DEFAULT_FEES.marketplaceFee.toString()),
        nftLaunchpadFee: parseFloat(metadata.nftLaunchpadFee || DEFAULT_FEES.nftLaunchpadFee.toString()),
        withdrawalFee: parseFloat(metadata.withdrawalFee || DEFAULT_FEES.withdrawalFee.toString()),
        tier: metadata.tier || 'free'
      };
    } catch (error) {
      console.error('Error getting user fees:', error);
      return DEFAULT_FEES;
    }
  }

  /**
   * Calculate trading fee for a transaction
   */
  async calculateTradingFee(walletAddress: string, amount: number): Promise<number> {
    const fees = await this.getUserFees(walletAddress);
    return (amount * fees.tradingFee) / 100;
  }

  /**
   * Calculate payment processing fee
   */
  async calculatePaymentFee(walletAddress: string, amount: number): Promise<number> {
    const fees = await this.getUserFees(walletAddress);
    return (amount * fees.paymentFee) / 100;
  }

  /**
   * Calculate marketplace fee
   */
  async calculateMarketplaceFee(walletAddress: string, amount: number): Promise<number> {
    const fees = await this.getUserFees(walletAddress);
    return (amount * fees.marketplaceFee) / 100;
  }

  /**
   * Calculate NFT launchpad fee
   */
  async calculateLaunchpadFee(walletAddress: string, amount: number): Promise<number> {
    const fees = await this.getUserFees(walletAddress);
    return (amount * fees.nftLaunchpadFee) / 100;
  }

  /**
   * Calculate withdrawal fee
   */
  async calculateWithdrawalFee(walletAddress: string, amount: number): Promise<number> {
    const fees = await this.getUserFees(walletAddress);
    return (amount * fees.withdrawalFee) / 100;
  }

  /**
   * Get fee breakdown for display
   */
  async getFeeBreakdown(walletAddress: string, amount: number, feeType: 'trading' | 'payment' | 'marketplace' | 'launchpad' | 'withdrawal') {
    const fees = await this.getUserFees(walletAddress);
    let feePercentage = 0;
    let feeAmount = 0;

    switch (feeType) {
      case 'trading':
        feePercentage = fees.tradingFee;
        feeAmount = await this.calculateTradingFee(walletAddress, amount);
        break;
      case 'payment':
        feePercentage = fees.paymentFee;
        feeAmount = await this.calculatePaymentFee(walletAddress, amount);
        break;
      case 'marketplace':
        feePercentage = fees.marketplaceFee;
        feeAmount = await this.calculateMarketplaceFee(walletAddress, amount);
        break;
      case 'launchpad':
        feePercentage = fees.nftLaunchpadFee;
        feeAmount = await this.calculateLaunchpadFee(walletAddress, amount);
        break;
      case 'withdrawal':
        feePercentage = fees.withdrawalFee;
        feeAmount = await this.calculateWithdrawalFee(walletAddress, amount);
        break;
    }

    return {
      tier: fees.tier,
      feePercentage,
      feeAmount,
      netAmount: amount - feeAmount,
      totalAmount: amount,
      savingsVsFree: feeType === 'trading' 
        ? ((DEFAULT_FEES.tradingFee - feePercentage) / 100) * amount
        : ((DEFAULT_FEES.paymentFee - feePercentage) / 100) * amount
    };
  }
}

export const feeService = new FeeService();
