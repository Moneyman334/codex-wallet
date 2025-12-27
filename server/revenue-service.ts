import { db as dbClient } from './storage';
import { 
  subscriptionBillings, 
  orders, 
  transactions,
  botTrades,
  marketplaceListings,
  affiliateReferrals,
  flashSales,
  platformRevenue
} from '@shared/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';
import { botFeeService } from './bot-fee-service';

interface RevenueBreakdown {
  subscriptions: number;
  tradingBotFees: number;
  tradingFees: number;
  paymentFees: number;
  marketplaceFees: number;
  nftLaunchpadFees: number;
  ecommerceSales: number;
  affiliatePayouts: number;
  flashSalesRevenue: number;
  stakingFees: number;
  totalRevenue: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

interface RevenueGrowth {
  current: number;
  previous: number;
  growthRate: number;
  growthAmount: number;
}

export class RevenueService {
  /**
   * Calculate total platform revenue for a period
   */
  async calculateTotalRevenue(startDate: Date, endDate: Date): Promise<RevenueBreakdown> {
    try {
      // 1. Subscription Revenue
      const subscriptionRevenue = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${subscriptionBillings.amount} AS NUMERIC)), 0)`
        })
        .from(subscriptionBillings)
        .where(
          and(
            eq(subscriptionBillings.status, 'paid'),
            gte(subscriptionBillings.paidAt, startDate),
            lte(subscriptionBillings.paidAt, endDate)
          )
        );

      // 2. Trading Bot Fees (Carry + Management)
      const botRevenue = await botFeeService.calculatePlatformBotRevenue(startDate, endDate);

      // 3. Trading Fees (from transactions)
      const tradingFees = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${transactions.fee} AS NUMERIC)), 0)`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'trade'),
            eq(transactions.status, 'completed'),
            gte(transactions.timestamp, startDate),
            lte(transactions.timestamp, endDate)
          )
        );

      // 4. Payment Processing Fees (from orders)
      const paymentFees = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${orders.platformFee} AS NUMERIC)), 0)`
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, 'paid'),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );

      // 5. Marketplace Fees (from sold listings)
      const marketplaceFees = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${marketplaceListings.price} AS NUMERIC) * 0.025), 0)`
        })
        .from(marketplaceListings)
        .where(
          and(
            eq(marketplaceListings.status, 'sold'),
            gte(marketplaceListings.updatedAt, startDate),
            lte(marketplaceListings.updatedAt, endDate)
          )
        );

      // 6. NFT Launchpad Fees (estimated 7.5% of NFT sales from orders)
      const nftLaunchpadFees = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC) * 0.075), 0)`
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, 'paid'),
            sql`${orders.metadata}->>'isNFTLaunch' = 'true'`,
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );

      // 7. E-commerce Sales (total order value)
      const ecommerceSales = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, 'paid'),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );

      // 8. Affiliate Payouts (commission we keep)
      const affiliatePayouts = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${affiliateReferrals.commissionAmount} AS NUMERIC)), 0)`
        })
        .from(affiliateReferrals)
        .where(
          and(
            eq(affiliateReferrals.status, 'completed'),
            gte(affiliateReferrals.createdAt, startDate),
            lte(affiliateReferrals.createdAt, endDate)
          )
        );

      // 9. Staking Pool Performance Fees (10% of rewards)
      const stakingFees = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${platformRevenue.feeAmount} AS NUMERIC)), 0)`
        })
        .from(platformRevenue)
        .where(
          and(
            eq(platformRevenue.revenueType, 'staking'),
            gte(platformRevenue.createdAt, startDate),
            lte(platformRevenue.createdAt, endDate)
          )
        );

      const subscriptionTotal = parseFloat(subscriptionRevenue[0]?.total || '0');
      const tradingFeesTotal = parseFloat(tradingFees[0]?.total || '0');
      const paymentFeesTotal = parseFloat(paymentFees[0]?.total || '0');
      const marketplaceFeesTotal = parseFloat(marketplaceFees[0]?.total || '0');
      const nftLaunchpadFeesTotal = parseFloat(nftLaunchpadFees[0]?.total || '0');
      const ecommerceSalesTotal = parseFloat(ecommerceSales[0]?.total || '0');
      const affiliatePayoutsTotal = parseFloat(affiliatePayouts[0]?.total || '0');
      const stakingFeesTotal = parseFloat(stakingFees[0]?.total || '0');

      return {
        subscriptions: subscriptionTotal,
        tradingBotFees: botRevenue.totalBotRevenue,
        tradingFees: tradingFeesTotal,
        paymentFees: paymentFeesTotal,
        marketplaceFees: marketplaceFeesTotal,
        nftLaunchpadFees: nftLaunchpadFeesTotal,
        ecommerceSales: ecommerceSalesTotal,
        affiliatePayouts: affiliatePayoutsTotal,
        flashSalesRevenue: 0,
        stakingFees: stakingFeesTotal,
        totalRevenue: 
          subscriptionTotal + 
          botRevenue.totalBotRevenue + 
          tradingFeesTotal + 
          paymentFeesTotal + 
          marketplaceFeesTotal + 
          nftLaunchpadFeesTotal + 
          ecommerceSalesTotal +
          stakingFeesTotal,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      return {
        subscriptions: 0,
        tradingBotFees: 0,
        tradingFees: 0,
        paymentFees: 0,
        marketplaceFees: 0,
        nftLaunchpadFees: 0,
        ecommerceSales: 0,
        affiliatePayouts: 0,
        flashSalesRevenue: 0,
        stakingFees: 0,
        totalRevenue: 0,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };
    }
  }

  /**
   * Calculate revenue growth compared to previous period
   */
  async calculateRevenueGrowth(currentStart: Date, currentEnd: Date): Promise<RevenueGrowth> {
    const currentRevenue = await this.calculateTotalRevenue(currentStart, currentEnd);
    
    // Calculate previous period (same duration)
    const periodDuration = currentEnd.getTime() - currentStart.getTime();
    const previousEnd = new Date(currentStart.getTime());
    const previousStart = new Date(currentStart.getTime() - periodDuration);
    
    const previousRevenue = await this.calculateTotalRevenue(previousStart, previousEnd);
    
    const growthAmount = currentRevenue.totalRevenue - previousRevenue.totalRevenue;
    const growthRate = previousRevenue.totalRevenue > 0
      ? (growthAmount / previousRevenue.totalRevenue) * 100
      : 0;

    return {
      current: currentRevenue.totalRevenue,
      previous: previousRevenue.totalRevenue,
      growthRate,
      growthAmount
    };
  }

  /**
   * Get revenue projections for the next 90 days
   */
  async getRevenueProjections(): Promise<any> {
    // Get last 30 days revenue
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    const last30Days = await this.calculateTotalRevenue(thirtyDaysAgo, now);
    const dailyAverage = last30Days.totalRevenue / 30;
    
    // Project next 90 days
    const projected30Days = dailyAverage * 30;
    const projected60Days = dailyAverage * 60;
    const projected90Days = dailyAverage * 90;
    
    return {
      dailyAverage,
      projections: {
        month1: projected30Days,
        month2: projected60Days,
        month3: projected90Days
      },
      breakdown: {
        subscriptions: (last30Days.subscriptions / 30) * 90,
        tradingBotFees: (last30Days.tradingBotFees / 30) * 90,
        tradingFees: (last30Days.tradingFees / 30) * 90,
        paymentFees: (last30Days.paymentFees / 30) * 90,
        marketplaceFees: (last30Days.marketplaceFees / 30) * 90,
        nftLaunchpadFees: (last30Days.nftLaunchpadFees / 30) * 90,
        ecommerceSales: (last30Days.ecommerceSales / 30) * 90
      }
    };
  }

  /**
   * Get top revenue streams
   */
  async getTopRevenueStreams(startDate: Date, endDate: Date) {
    const revenue = await this.calculateTotalRevenue(startDate, endDate);
    
    const streams = [
      { name: 'E-commerce Sales', value: revenue.ecommerceSales, percentage: 0 },
      { name: 'Subscriptions', value: revenue.subscriptions, percentage: 0 },
      { name: 'Trading Bot Fees', value: revenue.tradingBotFees, percentage: 0 },
      { name: 'Payment Fees', value: revenue.paymentFees, percentage: 0 },
      { name: 'Marketplace Fees', value: revenue.marketplaceFees, percentage: 0 },
      { name: 'NFT Launchpad', value: revenue.nftLaunchpadFees, percentage: 0 },
      { name: 'Trading Fees', value: revenue.tradingFees, percentage: 0 },
    ];

    // Calculate percentages
    streams.forEach(stream => {
      stream.percentage = revenue.totalRevenue > 0 
        ? (stream.value / revenue.totalRevenue) * 100 
        : 0;
    });

    // Sort by value descending
    return streams.sort((a, b) => b.value - a.value);
  }
}

export const revenueService = new RevenueService();
