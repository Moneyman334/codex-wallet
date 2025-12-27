import rateLimit from "express-rate-limit";
import { db as dbClient } from "../storage";
import { subscriptions, subscriptionPlans, wallets } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * 🎯 TIERED RATE LIMITING SYSTEM
 * 
 * Implements subscription-based rate limiting with different quotas for each tier:
 * 
 * FREE TIER: Basic limits for casual users
 * ASCEND PASS: 2x limits for active users
 * EMPIRE PASS: 5x limits for power users
 * WHALE PASS: 10x limits for VIP users
 */

export interface RateLimitTier {
  tier: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstAllowance: number;
}

// Rate limit configurations by subscription tier
export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  FREE: {
    tier: "Free Tier",
    requestsPerMinute: 10,
    requestsPerHour: 100,
    burstAllowance: 15,
  },
  ASCEND: {
    tier: "Ascend Pass",
    requestsPerMinute: 20,
    requestsPerHour: 200,
    burstAllowance: 30,
  },
  EMPIRE: {
    tier: "Empire Pass",
    requestsPerMinute: 50,
    requestsPerHour: 500,
    burstAllowance: 75,
  },
  WHALE: {
    tier: "Whale Pass",
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    burstAllowance: 150,
  },
};

// Critical endpoint specific limits (more restrictive)
export const CRITICAL_ENDPOINT_LIMITS: Record<string, Record<string, number>> = {
  // Settlement/Withdrawal limits (per hour)
  SETTLEMENTS: {
    FREE: 5,
    ASCEND: 10,
    EMPIRE: 25,
    WHALE: 50,
  },
  // Staking operations (per hour)
  STAKING: {
    FREE: 10,
    ASCEND: 20,
    EMPIRE: 50,
    WHALE: 100,
  },
  // Trading operations (per minute)
  TRADING: {
    FREE: 5,
    ASCEND: 10,
    EMPIRE: 25,
    WHALE: 50,
  },
};

/**
 * Get user's subscription tier based on their active subscription
 */
export async function getUserTier(userId: string): Promise<string> {
  try {
    // Get user's wallets
    const userWallets = await dbClient
      .select({ address: wallets.address })
      .from(wallets)
      .where(eq(wallets.userId, userId));
    
    if (userWallets.length === 0) {
      return "FREE";
    }
    
    // Check if any wallet has an active subscription
    for (const wallet of userWallets) {
      const walletSubscriptions = await dbClient
        .select({
          planId: subscriptions.planId,
          status: subscriptions.status,
          planName: subscriptionPlans.name,
        })
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            sql`lower(${subscriptions.customerWallet}) = ${wallet.address.toLowerCase()}`,
            eq(subscriptions.status, "active")
          )
        )
        .limit(1);
      
      if (walletSubscriptions[0]) {
        // Map subscription plan to tier
        const planName = walletSubscriptions[0].planName || "";
        
        if (planName.includes("Whale")) return "WHALE";
        if (planName.includes("Empire")) return "EMPIRE";
        if (planName.includes("Ascend")) return "ASCEND";
      }
    }
    
    return "FREE";
  } catch (error) {
    console.error("Failed to get user tier:", error);
    return "FREE"; // Default to most restrictive
  }
}

/**
 * Create a tiered rate limiter for general API endpoints
 */
export function createTieredRateLimiter(endpoint: "general" | "settlements" | "staking" | "trading") {
  return rateLimit({
    windowMs: endpoint === "trading" ? 60 * 1000 : 60 * 60 * 1000, // 1 minute for trading, 1 hour for others
    max: async (req: any) => {
      try {
        // Get user from session
        const userId = req.session?.userId;
        
        if (!userId) {
          // Anonymous users get the most restrictive limits
          return endpoint === "general" ? 5 : 3;
        }
        
        const tier = await getUserTier(userId);
        
        // Return tier-specific limit
        if (endpoint === "general") {
          return RATE_LIMIT_TIERS[tier].requestsPerHour;
        } else if (endpoint === "trading") {
          return CRITICAL_ENDPOINT_LIMITS.TRADING[tier];
        } else {
          const endpointKey = endpoint.toUpperCase();
          return CRITICAL_ENDPOINT_LIMITS[endpointKey as keyof typeof CRITICAL_ENDPOINT_LIMITS]?.[tier] || 5;
        }
      } catch (error) {
        console.error("Rate limit calculation error:", error);
        return 5; // Most restrictive default
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: async (req: any) => {
      const userId = req.session?.userId;
      const tier = userId ? await getUserTier(userId) : "FREE";
      
      return {
        error: "Rate limit exceeded",
        tier,
        message: `You have exceeded your ${RATE_LIMIT_TIERS[tier]?.tier || "Free Tier"} rate limit. Upgrade your subscription for higher limits.`,
        upgradeUrl: "/empire-pass",
      };
    },
    // Use user ID as key (unauthenticated users share 'anonymous' bucket)
    keyGenerator: (req: any) => {
      return req.session?.userId || "anonymous";
    },
    // Count ALL requests (don't skip anything - strict rate limiting)
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
}

/**
 * Get rate limit status for a user
 */
export async function getRateLimitStatus(userId: string) {
  const tier = await getUserTier(userId);
  const tierConfig = RATE_LIMIT_TIERS[tier];
  
  return {
    tier,
    limits: {
      general: {
        perMinute: tierConfig.requestsPerMinute,
        perHour: tierConfig.requestsPerHour,
      },
      settlements: {
        perHour: CRITICAL_ENDPOINT_LIMITS.SETTLEMENTS[tier],
      },
      staking: {
        perHour: CRITICAL_ENDPOINT_LIMITS.STAKING[tier],
      },
      trading: {
        perMinute: CRITICAL_ENDPOINT_LIMITS.TRADING[tier],
      },
      casino: {
        perHour: CRITICAL_ENDPOINT_LIMITS.CASINO[tier],
      },
    },
    upgradeAvailable: tier !== "WHALE",
  };
}
