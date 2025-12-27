/**
 * DEMO MODE CONFIGURATION
 * 
 * This file controls the demo/testnet mode for ALL gambling features.
 * Real money gambling is DISABLED until proper gaming license is obtained.
 * 
 * Revenue-generating features (CODEX Pay, NFT Marketplace, Trading) remain FULLY FUNCTIONAL.
 */

export const DEMO_MODE = {
  // Demo mode status
  enabled: true,
  
  // Play money credits
  initialCredits: 50, // $50 USD worth of play money on signup
  dailyBonus: 10, // $10 daily login bonus
  referralBonus: 10, // $10 for referrer and referee
  
  // Entertainment features (demo only)
  games: {
    enabled: true,
    playMoneyOnly: true,
    maxBet: 100, // Max $100 play money per bet
    realMoneyEnabled: false, // Will be enabled after license approval
  },
  
  // Revenue features (fully functional)
  revenue: {
    codexPay: {
      enabled: true,
      realMoney: true, // CODEX Pay processes REAL payments
      feePercentage: 0.5, // 0.5% fee (vs Stripe's 2.9%)
    },
    nftMarketplace: {
      enabled: true,
      realMoney: true, // NFT sales use real crypto
      commissionPercentage: 2, // 2% commission
    },
    trading: {
      enabled: true,
      realMoney: true, // Real crypto trading
      feePercentage: 0.1, // 0.1% trading fee
    },
    subscriptions: {
      enabled: true,
      realMoney: true, // Real subscription payments
      tiers: {
        free: { price: 0, features: ['basic'] },
        ascend: { price: 29.99, features: ['reduced_fees', 'priority_support'] },
        empire: { price: 79.99, features: ['ai_trading', 'copy_trading', 'premium'] },
        whale: { price: 299, features: ['institutional', 'white_glove'] },
      },
    },
  },
  
  // Messaging
  banners: {
    games: '🎮 DEMO MODE - Playing with virtual credits. Real money coming soon after licensing!',
    homepage: '🚀 Platform LIVE! CODEX Pay, NFT Marketplace & Trading fully functional. Entertainment features in demo mode.',
    gamePlay: '💰 Win up to $1,000 in demo credits! Convert to real value through our NFT/Trading features.',
  },
  
  // License application status
  licensing: {
    status: 'in_progress', // Options: 'not_started', 'in_progress', 'approved'
    jurisdiction: 'Curaçao',
    expectedApproval: '2026-Q2',
    waitlistEnabled: true, // Collect emails for real money launch
  },
};

/**
 * Get user's play money balance
 */
export function getPlayMoneyBalance(userId: string): number {
  const stored = localStorage.getItem(`play_money_${userId}`);
  if (!stored) {
    // First time user - give initial credits
    setPlayMoneyBalance(userId, DEMO_MODE.initialCredits);
    return DEMO_MODE.initialCredits;
  }
  return parseFloat(stored);
}

/**
 * Set user's play money balance
 */
export function setPlayMoneyBalance(userId: string, amount: number): void {
  localStorage.setItem(`play_money_${userId}`, amount.toString());
}

/**
 * Add play money to user's balance
 */
export function addPlayMoney(userId: string, amount: number): number {
  const current = getPlayMoneyBalance(userId);
  const newBalance = current + amount;
  setPlayMoneyBalance(userId, newBalance);
  return newBalance;
}

/**
 * Deduct play money from user's balance
 */
export function deductPlayMoney(userId: string, amount: number): boolean {
  const current = getPlayMoneyBalance(userId);
  if (current < amount) {
    return false; // Insufficient balance
  }
  setPlayMoneyBalance(userId, current - amount);
  return true;
}

/**
 * Check if user claimed daily bonus today
 */
export function canClaimDailyBonus(userId: string): boolean {
  const lastClaim = localStorage.getItem(`daily_bonus_${userId}`);
  if (!lastClaim) return true;
  
  const lastClaimDate = new Date(lastClaim);
  const today = new Date();
  return lastClaimDate.toDateString() !== today.toDateString();
}

/**
 * Claim daily bonus
 */
export function claimDailyBonus(userId: string): number {
  if (!canClaimDailyBonus(userId)) return 0;
  
  localStorage.setItem(`daily_bonus_${userId}`, new Date().toISOString());
  return addPlayMoney(userId, DEMO_MODE.dailyBonus);
}

/**
 * Get referral code for user
 */
export function getReferralCode(userId: string): string {
  return btoa(userId).substring(0, 8).toUpperCase();
}

/**
 * Process referral (give both users bonus)
 */
export function processReferral(referrerId: string, newUserId: string): void {
  // Give referrer bonus
  addPlayMoney(referrerId, DEMO_MODE.referralBonus);
  
  // Give new user bonus
  addPlayMoney(newUserId, DEMO_MODE.referralBonus);
  
  // Track referral
  const referrals = JSON.parse(localStorage.getItem(`referrals_${referrerId}`) || '[]');
  referrals.push({ userId: newUserId, date: new Date().toISOString(), bonus: DEMO_MODE.referralBonus });
  localStorage.setItem(`referrals_${referrerId}`, JSON.stringify(referrals));
}

/**
 * Check if real money feature is enabled
 */
export function isRealMoneyEnabled(feature: 'games' | 'codexPay' | 'nft' | 'trading' | 'subscriptions'): boolean {
  switch (feature) {
    case 'games':
      return !DEMO_MODE.games.playMoneyOnly && DEMO_MODE.games.realMoneyEnabled;
    case 'codexPay':
      return DEMO_MODE.revenue.codexPay.realMoney;
    case 'nft':
      return DEMO_MODE.revenue.nftMarketplace.realMoney;
    case 'trading':
      return DEMO_MODE.revenue.trading.realMoney;
    case 'subscriptions':
      return DEMO_MODE.revenue.subscriptions.realMoney;
    default:
      return false;
  }
}

/**
 * Get demo mode banner for specific page
 */
export function getDemoBanner(page: 'games' | 'homepage' | 'gamePlay'): string {
  return DEMO_MODE.banners[page];
}
