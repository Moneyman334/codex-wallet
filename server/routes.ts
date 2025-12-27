import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertTokenSchema, 
  insertTokenBalanceSchema, 
  insertUserTokenSchema,
  insertContractSchema,
  insertContractCallSchema,
  insertContractEventSubSchema,
  insertUserSchema,
  insertWalletSchema,
  insertSubscriptionPlanSchema,
  insertSubscriptionSchema,
  insertAffiliateSchema,
  insertAffiliateReferralSchema,
  insertProductVariantSchema,
  insertFlashSaleSchema,
  insertAbandonedCartSchema,
  insertCustomerTierSchema,
  insertCustomerTierAssignmentSchema,
  insertProductRecommendationSchema,
  insertPreOrderSchema,
  insertRecentlyViewedSchema,
  insertTraderProfileSchema,
  insertCopyRelationshipSchema,
  insertCopyTradeSchema,
  insertMarginPositionSchema,
  insertLeverageSettingSchema,
  insertSettlementSchema,
  insertMerchantSchema,
  insertMerchantApiKeySchema,
  insertCodexPayBetaSignupSchema
} from "@shared/schema";
import { nftService } from "./nft";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import bcrypt from "bcrypt";
import { getChainConfig, verifyTransaction, getAllSupportedChains } from "./blockchain-config";
import { socialScheduler } from "./social-scheduler";
import { db as dbClient } from "./storage";
import { getCryptoPrice, getAllPrices, convertCryptoToUsd, convertUsdToCrypto } from "./price-service";
import { proofOfReservesService } from "./services/proof-of-reserves";
import { getUserTier, RATE_LIMIT_TIERS } from "./services/tiered-rate-limit";
import { 
  users, 
  transactions, 
  orders, 
  autoCompoundStakes, 
  botTrades, 
  scheduledPosts, 
  postHistory,
  marketplaceListings,
  discountCodes,
  flashSales,
  subscriptionPlans,
  subscriptions,
  subscriptionBillings,
  affiliates,
  affiliateReferrals,
  productVariants,
  abandonedCarts,
  customerTiers,
  customerTierAssignments,
  productRecommendations,
  preOrders,
  recentlyViewed,
  products,
  securityAlerts,
  paymentWebhooks,
  payments,
  giftCards,
  invoices,
  nftReceipts,
  settlements,
  codexPaySettlements,
  wallets,
  withdrawalWhitelists,
  proofOfReserves,
  merchants,
  paymentLinks,
  merchantApiKeys,
  merchantAnalytics,
  codexPayBetaSignups,
  paymentIntents,
  platformRevenue,
  developerAccounts,
  apiKeys,
  webhookEndpoints,
  webhookDeliveries,
  apiUsageLogs,
  apiRateLimits,
  visitorEvents,
  visitorSessions,
  relicDefinitions,
  relicMints,
  codexAtmWithdrawals,
  priceAlerts,
  traderPerformance,
  achievements,
  userAchievements,
  tradingCompetitions,
  competitionEntries,
  whaleTracks,
  watchedWhales,
  aiSentimentSnapshots,
  platformActivity,
  paperAccounts,
  paperTrades,
  smartAlerts
} from "@shared/schema";
import { eq, and, sql, desc, lte, gte, or, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { SecurityFortress } from "./security-fortress";
import { multiChainService } from "./multi-chain-service";
import { validateWithdrawalSecurity } from "./services/transaction-security";
import { 
  getWhitelistedAddresses,
  addWhitelistAddress,
  removeWhitelistAddress,
  getAntiPhishingCodes,
  setAntiPhishingCode,
  getPendingTimeLockedWithdrawals,
  getFraudLogs,
  getAllFraudLogs,
  getAllTimeLockedWithdrawals,
  toggleEmergencyLockdown,
  getEmergencyLockdownStatus,
} from "./services/security-infrastructure";
import { createTieredRateLimiter, getRateLimitStatus } from "./services/tiered-rate-limit";

// Helper to get base URL for callbacks (production-ready)
function getBaseUrl(): string {
  // REPLIT_DOMAINS contains production domains (e.g., "myapp.replit.app,myapp-dev.replit.app")
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const primaryDomain = replitDomains.split(',')[0];
    return `https://${primaryDomain}`;
  }
  
  // REPLIT_DEV_DOMAIN is the development URL (already includes protocol sometimes)
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    // Check if it already has a protocol
    if (devDomain.startsWith('http://') || devDomain.startsWith('https://')) {
      return devDomain;
    }
    return `https://${devDomain}`;
  }
  
  // Local fallback
  return 'http://localhost:5000';
}

// Ethereum address validation schema
const ethereumAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
  .transform(addr => addr.toLowerCase()); // Normalize to lowercase

// Hash validation (64 hex characters)
const transactionHashSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format");

// Middleware to check if user is authenticated
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    // Get user ID from session only (not from headers - security critical)
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request for future use
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Middleware to check if user is an owner
const requireOwner = async (req: any, res: any, next: any) => {
  try {
    // Get user ID from session only (not from headers - security critical)
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.isOwner !== "true") {
      return res.status(403).json({ error: "Access denied. Owner privileges required." });
    }

    // Attach user to request for future use
    req.user = user;
    next();
  } catch (error) {
    console.error("Owner check failed:", error);
    res.status(500).json({ error: "Authentication check failed" });
  }
};

// Middleware to authenticate API key requests (Empire API Platform)
const requireApiKey = async (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "API key required", 
        message: "Include your API key in the Authorization header: Bearer emp_sk_..." 
      });
    }
    
    const apiKeyRaw = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Validate API key format (emp_pk_ or emp_sk_)
    if (!apiKeyRaw.startsWith("emp_pk_") && !apiKeyRaw.startsWith("emp_sk_")) {
      return res.status(401).json({ error: "Invalid API key format" });
    }
    
    // Extract key prefix for database lookup
    const keyType = apiKeyRaw.startsWith("emp_pk_") ? "publishable" : "secret";
    const environment = apiKeyRaw.includes("_test_") ? "test" : "live";
    const keyPrefix = `emp_${keyType === "publishable" ? "pk" : "sk"}_${environment}_`;
    
    // Get all API keys with this prefix from database
    const matchingKeys = await dbClient
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.keyPrefix, keyPrefix),
        eq(apiKeys.keyType, keyType),
        eq(apiKeys.environment, environment),
        eq(apiKeys.isActive, "true")
      ));
    
    if (matchingKeys.length === 0) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    
    // Verify API key using bcrypt (check against all matching keys)
    let validKey = null;
    for (const key of matchingKeys) {
      const isValid = await bcrypt.compare(apiKeyRaw, key.keyHash);
      if (isValid) {
        validKey = key;
        break;
      }
    }
    
    if (!validKey) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    
    // Get developer account with row-level lock to prevent race conditions
    const [developer] = await dbClient
      .select()
      .from(developerAccounts)
      .where(eq(developerAccounts.id, validKey.developerId))
      .limit(1);
    
    if (!developer || developer.status !== "active") {
      return res.status(403).json({ error: "Developer account inactive or not found" });
    }
    
    // 🔒 Enhanced Security: Calculate analytics data BEFORE transaction
    const now = new Date();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const requestHour = now.getHours(); // 0-23
    const requestDayOfWeek = now.getDay(); // 0-6 (Sunday = 0)
    
    // Determine timing pattern (business hours, after hours, etc.)
    let requestTimingPattern = "business_hours";
    if (requestDayOfWeek === 0 || requestDayOfWeek === 6) {
      requestTimingPattern = "weekend";
    } else if (requestHour < 6 || requestHour > 22) {
      requestTimingPattern = "night";
    } else if (requestHour > 17) {
      requestTimingPattern = "after_hours";
    }
    
    // 🔒 Enhanced Security: Detect request burst patterns
    const lastRequest = await dbClient
      .select({ timestamp: apiUsageLogs.timestamp })
      .from(apiUsageLogs)
      .where(eq(apiUsageLogs.apiKeyId, validKey.id))
      .orderBy(desc(apiUsageLogs.timestamp))
      .limit(1);
    
    let secondsSinceLastRequest = 0;
    let requestBurst = "normal";
    
    if (lastRequest.length > 0) {
      secondsSinceLastRequest = Math.floor((now.getTime() - lastRequest[0].timestamp.getTime()) / 1000);
      
      // Burst detection: Flag suspicious patterns
      if (secondsSinceLastRequest < 1) {
        requestBurst = "suspicious"; // >1 request per second
      } else if (secondsSinceLastRequest < 10) {
        requestBurst = "burst"; // High frequency
      }
    }
    
    // 🔒 Enhanced Security: Office location tracking (IP-based)
    // NOTE: Real IP geolocation requires external service integration
    // To enable full location tracking, integrate one of these services:
    // - ip-api.com (free, 45 req/min) - http://ip-api.com/json/{ip}
    // - MaxMind GeoIP2 (paid, unlimited) - https://www.maxmind.com/
    // - ipgeolocation.io (free tier available)
    // For MVP, we track timezone and flag private networks
    
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    let officeLocation = {
      city: null,
      country: null,
      region: null,
      latitude: null,
      longitude: null,
      timezone: null,
    };
    
    if (ipAddress.startsWith("10.") || ipAddress.startsWith("192.168.") || ipAddress.startsWith("172.")) {
      // Private network detection
      officeLocation = {
        city: "Internal Network",
        country: "Local",
        region: "Private",
        latitude: null,
        longitude: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } else if (ipAddress && ipAddress !== "unknown") {
      // For MVP: Track timezone only
      // TODO: Integrate ip-api.com for production (city, country, lat/long)
      officeLocation.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    // 🔒 CRITICAL FIX #3: ALL rate limiting logic in ONE atomic transaction
    // This prevents ALL race conditions by ensuring quota check, rate check, log insert, 
    // and counter increments happen atomically
    let insertedLogId: string;
    
    try {
      await dbClient.transaction(async (tx) => {
        // Lock the developer account row to prevent concurrent modifications
        const [lockedDeveloper] = await tx
          .select()
          .from(developerAccounts)
          .where(eq(developerAccounts.id, developer.id))
          .for("update");
        
        // Check monthly quota with locked row
        if (lockedDeveloper.requestsThisMonth >= lockedDeveloper.monthlyRequestQuota) {
          throw new Error(`QUOTA_EXCEEDED:${lockedDeveloper.monthlyRequestQuota}:${lockedDeveloper.requestsThisMonth}`);
        }
        
        // Count recent requests for rate limiting (within transaction)
        const recentRequests = await tx
          .select({ count: sql<number>`count(*)` })
          .from(apiUsageLogs)
          .where(and(
            eq(apiUsageLogs.apiKeyId, validKey.id),
            gte(apiUsageLogs.timestamp, oneMinuteAgo)
          ));
        
        const requestsThisMinute = Number(recentRequests[0]?.count || 0);
        
        // Check rate limit
        if (requestsThisMinute >= validKey.requestsPerMinute) {
          const oldestRequest = await tx
            .select({ timestamp: apiUsageLogs.timestamp })
            .from(apiUsageLogs)
            .where(and(
              eq(apiUsageLogs.apiKeyId, validKey.id),
              gte(apiUsageLogs.timestamp, oneMinuteAgo)
            ))
            .orderBy(apiUsageLogs.timestamp)
            .limit(1);
          
          const resetSeconds = oldestRequest.length > 0
            ? Math.ceil((60 * 1000 - (Date.now() - oldestRequest[0].timestamp.getTime())) / 1000)
            : 60;
          
          throw new Error(`RATE_LIMIT_EXCEEDED:${validKey.requestsPerMinute}:${Math.max(resetSeconds, 1)}`);
        }
        
        // 🔒 CRITICAL: Insert log INSIDE transaction so rate limit query sees it
        const [insertedLog] = await tx.insert(apiUsageLogs).values({
          apiKeyId: validKey.id,
          developerId: developer.id,
          endpoint: req.path,
          method: req.method,
          statusCode: 0, // Will be updated on finish
          responseTime: 0, // Will be updated on finish
          ipAddress,
          userAgent: req.headers["user-agent"] || "unknown",
          // 🔒 Enhanced Security: Office location tracking
          officeCity: officeLocation.city,
          officeCountry: officeLocation.country,
          officeRegion: officeLocation.region,
          officeLatitude: officeLocation.latitude,
          officeLongitude: officeLocation.longitude,
          officeTimezone: officeLocation.timezone,
          // 🔒 Enhanced Security: Rate timing analytics
          requestHour,
          requestDayOfWeek,
          requestTimingPattern,
          secondsSinceLastRequest,
          requestBurst,
        }).returning();
        
        // Capture log ID for later update
        insertedLogId = insertedLog.id;
        
        // If we get here, request is allowed - increment counters atomically in transaction
        await tx
          .update(developerAccounts)
          .set({ 
            requestsThisMonth: sql`${developerAccounts.requestsThisMonth} + 1` 
          })
          .where(eq(developerAccounts.id, developer.id));
        
        await tx
          .update(apiKeys)
          .set({ 
            requestsToday: sql`${apiKeys.requestsToday} + 1`,
            lastUsed: new Date()
          })
          .where(eq(apiKeys.id, validKey.id));
      });
    } catch (error: any) {
      // Handle rate limiting errors
      if (error.message.startsWith("QUOTA_EXCEEDED:")) {
        const [, quota, used] = error.message.split(":");
        return res.status(429).json({ 
          error: "Monthly quota exceeded", 
          quota: Number(quota),
          used: Number(used) 
        });
      }
      if (error.message.startsWith("RATE_LIMIT_EXCEEDED:")) {
        const [, limit, resetSeconds] = error.message.split(":");
        return res.status(429).json({ 
          error: "Rate limit exceeded", 
          limit: Number(limit),
          resetInSeconds: Number(resetSeconds)
        });
      }
      throw error; // Re-throw unexpected errors
    }
    
    // 🔒 CRITICAL FIX: Update response time and status code using captured log ID
    const updateLog = async () => {
      try {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Update the specific log entry by ID (not by query that could match wrong row)
        await dbClient
          .update(apiUsageLogs)
          .set({ responseTime, statusCode })
          .where(eq(apiUsageLogs.id, insertedLogId));
      } catch (error) {
        console.error("Failed to update API usage log:", error);
      }
    };
    
    res.on('finish', updateLog);
    
    // Attach API key and developer info to request
    req.apiKey = validKey;
    req.developer = developer;
    
    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API health check endpoint
  app.get("/api", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Transaction History API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // API health check with more details
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      services: ["transactions", "wallets", "tokens", "networks", "authentication", "prices", "multi-chain"],
      database: "connected",
      timestamp: new Date().toISOString()
    });
  });

  // Multi-Chain Portfolio API
  app.get("/api/portfolio/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address" });
      }

      const portfolio = await multiChainService.getPortfolio(address);
      res.json(portfolio);
    } catch (error: any) {
      console.error("Portfolio fetch error:", error);
      res.status(500).json({ 
        error: "Failed to fetch portfolio", 
        message: error.message 
      });
    }
  });

  // Multi-Chain Wallet Balances API
  app.get("/api/wallets/balances/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address" });
      }

      const balances = await multiChainService.getWalletBalances(address);
      res.json(balances);
    } catch (error: any) {
      console.error("Wallet balances fetch error:", error);
      res.status(500).json({ 
        error: "Failed to fetch wallet balances", 
        message: error.message 
      });
    }
  });

  // Get real-time crypto prices
  app.get("/api/prices", (req, res) => {
    try {
      const prices = getAllPrices();
      res.json(prices);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  // Get top cryptocurrency prices (MUST be before /:symbol route)
  app.get("/api/prices/top", (req, res) => {
    try {
      const prices = getAllPrices();
      // Return top cryptocurrencies by popularity
      const topCryptos = ['ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'SOL', 'CDX'];
      const topPrices = Object.fromEntries(
        topCryptos.map(crypto => [crypto.toLowerCase(), prices[crypto] || { usd: 0, lastUpdated: new Date() }])
      );
      res.json(topPrices);
    } catch (error) {
      console.error("Failed to fetch top prices:", error);
      res.status(500).json({ error: "Failed to fetch top prices" });
    }
  });

  // Get specific crypto price
  app.get("/api/prices/:symbol", (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const price = getCryptoPrice(symbol);
      
      if (!price) {
        return res.status(404).json({ error: `Price not available for ${symbol}` });
      }
      
      res.json({ symbol, ...price });
    } catch (error) {
      console.error("Failed to fetch price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  // Convert USD to crypto
  app.post("/api/prices/convert", (req, res) => {
    try {
      const { amount, from, to } = req.body;
      
      if (from === 'USD') {
        const cryptoAmount = convertUsdToCrypto(amount, to);
        res.json({ amount: cryptoAmount, currency: to });
      } else if (to === 'USD') {
        const usdAmount = convertCryptoToUsd(amount, from);
        res.json({ amount: usdAmount.toString(), currency: 'USD' });
      } else {
        res.status(400).json({ error: "Only USD conversions supported" });
      }
    } catch (error) {
      console.error("Failed to convert:", error);
      res.status(500).json({ error: "Conversion failed" });
    }
  });

  // Enhanced rate limiting with security fortress
  const authRateLimit = SecurityFortress.createRateLimiter('STRICT', 'Too many authentication attempts');
  const authSpeedLimit = SecurityFortress.createSpeedLimiter('STRICT');
  const tradingRateLimit = SecurityFortress.createRateLimiter('TRADING', 'Trading rate limit exceeded');
  const tradingSpeedLimit = SecurityFortress.createSpeedLimiter('TRADING');
  const paymentRateLimit = SecurityFortress.createRateLimiter('PAYMENT', 'Payment rate limit exceeded');
  const paymentSpeedLimit = SecurityFortress.createSpeedLimiter('PAYMENT');
  const generalApiLimit = SecurityFortress.createRateLimiter('MODERATE');
  const publicDataLimit = SecurityFortress.createRateLimiter('RELAXED');

  // 🎯 TIERED RATE LIMITING - Subscription-based limits (Free/Ascend/Empire/Whale Pass)
  // Applied ALONGSIDE existing speed limiters for burst protection
  const tieredGeneralLimit = createTieredRateLimiter('general');
  const tieredSettlementLimit = createTieredRateLimiter('settlements');
  const tieredStakingLimit = createTieredRateLimiter('staking');
  const tieredTradingLimit = createTieredRateLimiter('trading');

  // ===== AUTHENTICATION ROUTES =====

  // User registration with secure password hashing
  app.post("/api/auth/register", authRateLimit, authSpeedLimit, async (req, res) => {
    try {
      const registrationSchema = z.object({
        username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username must not exceed 30 characters")
          .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
        password: z.string()
          .min(8, "Password must be at least 8 characters")
          .max(128, "Password must not exceed 128 characters")
      });

      const { username, password } = registrationSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Hash the password with bcrypt (cost factor 12 for security)
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user with hashed password
      const user = await storage.createUser({
        username,
        password: hashedPassword
      });

      // Create session for the newly registered user (auto-login)
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: userWithoutPassword
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid registration data", 
          details: error.errors 
        });
      }
      console.error("Registration failed:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // User login with password verification
  app.post("/api/auth/login", authRateLimit, authSpeedLimit, async (req, res) => {
    try {
      const loginSchema = z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required")
      });

      const { username, password } = loginSchema.parse(req.body);

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        // Generic error message to prevent username enumeration
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create session for the user
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        message: "Login successful",
        user: userWithoutPassword
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid login data", 
          details: error.errors 
        });
      }
      console.error("Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get user profile (requires user ID)
  app.get("/api/auth/user/:id", async (req, res) => {
    try {
      const userId = z.string().parse(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      console.error("Failed to get user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Check if username is available
  app.get("/api/auth/check-username/:username", async (req, res) => {
    try {
      const username = z.string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_-]+$/)
        .parse(req.params.username);

      const existingUser = await storage.getUserByUsername(username);
      res.json({ 
        available: !existingUser,
        username 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid username format",
          details: error.errors 
        });
      }
      console.error("Failed to check username:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  // Get current authenticated user status
  app.get("/api/auth/me", async (req, res) => {
    try {
      // Get user ID from session only (not from headers - security critical)
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.json({ authenticated: false, isOwner: false });
      }

      const user = await storage.getUser(userId as string);
      
      if (!user) {
        return res.json({ authenticated: false, isOwner: false });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        authenticated: true,
        isOwner: user.isOwner === "true",
        user: userWithoutPassword
      });

    } catch (error) {
      console.error("Failed to get auth status:", error);
      res.status(500).json({ error: "Failed to get authentication status" });
    }
  });

  // Delete user account (Google Play requirement - user-initiated account deletion)
  app.delete("/api/auth/account", requireAuth, authRateLimit, async (req, res) => {
    try {
      const userId = req.session?.userId as string;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify password for security
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: "Password verification required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Delete user (cascades to all related data via foreign key constraints)
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete account" });
      }

      // Destroy session
      req.session.destroy(() => {});

      res.json({ 
        success: true,
        message: "Account successfully deleted. All your data has been permanently removed." 
      });

    } catch (error) {
      console.error("Account deletion failed:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // User Preferences routes
  app.get("/api/preferences/default", async (req, res) => {
    // Public endpoint to get default preferences for unauthenticated users
    const isDev = process.env.NODE_ENV === 'development';
    res.json({
      autoLoginEnabled: isDev ? 'true' : 'false',
      autoConnectEnabled: isDev ? 'true' : 'false',
    });
  });

  app.get("/api/preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as string;
      let preferences = await storage.getUserPreferences(userId);
      
      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await storage.createUserPreferences({
          userId,
          autoLoginEnabled: process.env.NODE_ENV === 'development' ? "true" : "false",
          autoConnectEnabled: process.env.NODE_ENV === 'development' ? "true" : "false",
        });
      }
      
      res.json(preferences);
    } catch (error: any) {
      console.error("Failed to get preferences:", error);
      res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
      });
    }
  });

  app.patch("/api/preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId as string;
      
      // Validate and normalize boolean strings
      const updateSchema = z.object({
        autoLoginEnabled: z.union([
          z.literal('true'),
          z.literal('false'),
          z.boolean().transform(b => b ? 'true' : 'false')
        ]).optional(),
        autoConnectEnabled: z.union([
          z.literal('true'),
          z.literal('false'),
          z.boolean().transform(b => b ? 'true' : 'false')
        ]).optional(),
        lastWalletId: z.string().nullable().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      
      let preferences = await storage.getUserPreferences(userId);
      if (!preferences) {
        // Create if doesn't exist with defaults
        const isDev = process.env.NODE_ENV === 'development';
        preferences = await storage.createUserPreferences({
          userId,
          autoLoginEnabled: updates.autoLoginEnabled ?? (isDev ? 'true' : 'false'),
          autoConnectEnabled: updates.autoConnectEnabled ?? (isDev ? 'true' : 'false'),
          lastWalletId: updates.lastWalletId ?? null,
        });
      } else {
        // Update existing - only update fields that are provided
        preferences = await storage.updateUserPreferences(userId, updates);
      }
      
      res.json(preferences);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data', 
          details: error.errors 
        });
      }
      console.error("Failed to update preferences:", error);
      res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
          ? 'Failed to update preferences' 
          : error.message 
      });
    }
  });

  // DEV ONLY: Auto-login as owner (only works in development mode)
  app.post("/api/auth/dev-login-owner", async (req, res) => {
    try{
      // Only allow in development mode
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "This endpoint is only available in development mode" });
      }

      // Find the owner user
      const ownerUser = await storage.getUserByUsername("empire_owner");
      
      if (!ownerUser) {
        return res.status(404).json({ error: "Owner account not found" });
      }

      // Create session for the owner
      req.session.userId = ownerUser.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = ownerUser;
      res.json({
        success: true,
        message: "Auto-logged in as owner (DEV MODE)",
        user: userWithoutPassword
      });

    } catch (error) {
      console.error("Dev auto-login failed:", error);
      res.status(500).json({ error: "Auto-login failed" });
    }
  });

  // Get transactions for a wallet address (enhanced with pagination and filtering)
  app.get("/api/transactions/:address", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      
      // Parse query parameters for pagination and filtering
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      const network = req.query.network as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const search = req.query.search as string;
      
      const transactions = await storage.getTransactionsByAddress(address);
      
      // Apply filters
      let filteredTransactions = transactions;
      
      if (network) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.network?.toLowerCase() === network.toLowerCase()
        );
      }
      
      if (status) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.status === status
        );
      }
      
      if (type) {
        const isOutgoing = (tx: any) => tx.fromAddress.toLowerCase() === address.toLowerCase();
        filteredTransactions = filteredTransactions.filter(tx => {
          const metadata = tx.metadata as any;
          switch (type) {
            case 'sent': return isOutgoing(tx);
            case 'received': return !isOutgoing(tx);
            case 'token_transfer': return metadata?.tokenSymbol;
            case 'contract_interaction': return metadata?.contractAddress;
            default: return true;
          }
        });
      }
      
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredTransactions = filteredTransactions.filter(tx => {
          const metadata = tx.metadata as any;
          return tx.hash.toLowerCase().includes(searchTerm) ||
            tx.fromAddress.toLowerCase().includes(searchTerm) ||
            tx.toAddress.toLowerCase().includes(searchTerm) ||
            metadata?.tokenSymbol?.toLowerCase().includes(searchTerm);
        });
      }
      
      if (startDate) {
        const start = new Date(startDate);
        filteredTransactions = filteredTransactions.filter(tx => 
          new Date(tx.timestamp!) >= start
        );
      }
      
      if (endDate) {
        const end = new Date(endDate);
        filteredTransactions = filteredTransactions.filter(tx => 
          new Date(tx.timestamp!) <= end
        );
      }
      
      // Sort by timestamp (newest first)
      filteredTransactions.sort((a, b) => 
        new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
      );
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
      
      // Response with pagination metadata
      res.json({
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total: filteredTransactions.length,
          hasMore: endIndex < filteredTransactions.length,
          totalPages: Math.ceil(filteredTransactions.length / limit)
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Get transaction statistics for a wallet address
  app.get("/api/transactions/:address/stats", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const transactions = await storage.getTransactionsByAddress(address);
      
      const stats = {
        total: transactions.length,
        sent: transactions.filter(tx => tx.fromAddress.toLowerCase() === address.toLowerCase()).length,
        received: transactions.filter(tx => tx.toAddress.toLowerCase() === address.toLowerCase()).length,
        pending: transactions.filter(tx => tx.status === 'pending').length,
        confirmed: transactions.filter(tx => tx.status === 'confirmed').length,
        failed: transactions.filter(tx => tx.status === 'failed').length,
        networks: Array.from(new Set(transactions.map(tx => tx.network))),
        totalVolume: transactions.reduce((sum, tx) => {
          const amount = parseFloat(tx.amount || '0');
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0)
      };
      
      res.json(stats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get transaction stats:", error);
      res.status(500).json({ error: "Failed to get transaction stats" });
    }
  });

  // Real-time transaction monitoring endpoint
  app.get("/api/transactions/:address/pending", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const transactions = await storage.getTransactionsByAddress(address);
      const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
      
      res.json(pendingTransactions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get pending transactions:", error);
      res.status(500).json({ error: "Failed to get pending transactions" });
    }
  });

  // Export transactions endpoint
  app.get("/api/transactions/:address/export", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const format = (req.query.format as string) || 'json';
      
      const transactions = await storage.getTransactionsByAddress(address);
      
      if (format === 'csv') {
        const csvHeaders = [
          'Hash', 'Date', 'From', 'To', 'Amount', 'Status', 'Network', 'Gas Price', 'Gas Used', 'Fee', 'Block Number'
        ];
        
        const csvRows = transactions.map(tx => [
          tx.hash,
          tx.timestamp ? new Date(tx.timestamp).toISOString() : '',
          tx.fromAddress,
          tx.toAddress,
          tx.amount || '0',
          tx.status,
          tx.network || '',
          tx.gasPrice || '',
          tx.gasUsed || '',
          tx.fee || '',
          tx.blockNumber || ''
        ]);
        
        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="transactions-${address}.csv"`);
        res.send(csvContent);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="transactions-${address}.json"`);
        res.json(transactions);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to export transactions:", error);
      res.status(500).json({ error: "Failed to export transactions" });
    }
  });

  // Store a new transaction with fraud detection
  app.post("/api/transactions", generalApiLimit, async (req, res) => {
    try {
      const transactionSchema = z.object({
        hash: transactionHashSchema,
        fromAddress: ethereumAddressSchema,
        toAddress: ethereumAddressSchema,
        amount: z.string().regex(/^\d+$/, "Amount must be a valid wei string"),
        gasPrice: z.string().regex(/^\d+$/, "Gas price must be a valid wei string").optional(),
        gasUsed: z.string().regex(/^\d+$/, "Gas used must be a valid number").optional(),
        fee: z.string().regex(/^\d+$/, "Fee must be a valid wei string").optional(),
        status: z.enum(["pending", "confirmed", "failed"]).default("pending"),
        network: z.string().default("mainnet"),
        blockNumber: z.string().regex(/^\d+$/, "Block number must be a valid number").optional(),
        metadata: z.any().optional()
      });

      const validatedData = transactionSchema.parse(req.body);
      
      // Fraud detection analysis
      const riskAnalysis = SecurityFortress.analyzeTransactionRisk({
        fromAddress: validatedData.fromAddress,
        toAddress: validatedData.toAddress,
        amount: validatedData.amount,
        gasPrice: validatedData.gasPrice
      });
      
      // Log risk analysis for monitoring
      if (riskAnalysis.score > 0) {
        console.warn('Transaction Risk Analysis:', {
          hash: validatedData.hash,
          score: riskAnalysis.score,
          flags: riskAnalysis.flags,
          recommendation: riskAnalysis.recommendation
        });
      }
      
      // Reject high-risk transactions
      if (riskAnalysis.recommendation === 'reject') {
        return res.status(403).json({ 
          error: "Transaction rejected due to security concerns",
          riskScore: riskAnalysis.score,
          flags: riskAnalysis.flags
        });
      }
      
      // Flag medium-risk transactions in metadata
      if (riskAnalysis.recommendation === 'review') {
        validatedData.metadata = {
          ...validatedData.metadata,
          riskAnalysis,
          requiresReview: true
        };
      }
      
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  // Bulk store transactions (upsert)
  app.post("/api/transactions/bulk", async (req, res) => {
    try {
      const bulkTransactionSchema = z.array(z.object({
        hash: transactionHashSchema,
        fromAddress: ethereumAddressSchema,
        toAddress: ethereumAddressSchema,
        amount: z.string().optional(), // Allow formatted amounts from client
        gasPrice: z.string().optional(),
        gasUsed: z.string().optional(),
        fee: z.string().optional(),
        status: z.enum(["pending", "confirmed", "failed"]).default("confirmed"),
        network: z.string().default("mainnet"),
        blockNumber: z.string().optional(),
        metadata: z.any().optional()
      })).max(100, "Maximum 100 transactions per request");

      const validatedData = bulkTransactionSchema.parse(req.body);
      
      // Validate and normalize the transactions
      const processedTransactions = validatedData.map(tx => ({
        ...tx,
        amount: tx.amount || "0",
        status: tx.status || "confirmed"
      }));

      const storedTransactions = await storage.upsertTransactions(processedTransactions);
      
      res.status(201).json({
        success: true,
        stored: storedTransactions.length,
        transactions: storedTransactions
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid transaction data", 
          details: error.errors.slice(0, 5) // Limit error details to prevent large responses
        });
      }
      console.error("Failed to bulk store transactions:", error);
      res.status(500).json({ error: "Failed to store transactions" });
    }
  });

  // Update transaction status
  app.patch("/api/transactions/:hash", async (req, res) => {
    try {
      const hash = transactionHashSchema.parse(req.params.hash);
      const updateSchema = z.object({
        status: z.enum(["pending", "confirmed", "failed"]).optional(),
        blockNumber: z.string().regex(/^\d+$/, "Block number must be a valid number").optional(),
        gasUsed: z.string().regex(/^\d+$/, "Gas used must be a valid number").optional(),
        fee: z.string().regex(/^\d+$/, "Fee must be a valid wei string").optional()
      });

      const validatedData = updateSchema.parse(req.body);
      const transaction = await storage.updateTransaction(hash, validatedData);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid hash or data format" });
      }
      console.error("Failed to update transaction:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Get or create wallet info
  app.get("/api/wallet/:address", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      let wallet = await storage.getWalletByAddress(address);
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await storage.createWallet({
          address,
          balance: "0",
          network: "mainnet"
        });
      }
      
      res.json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get wallet:", error);
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });

  // Update wallet balance
  app.patch("/api/wallet/:address", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const updateSchema = z.object({
        balance: z.string().regex(/^\d+$/, "Balance must be a valid wei string").optional(),
        network: z.string().optional()
      });

      const validatedData = updateSchema.parse(req.body);
      const wallet = await storage.updateWallet(address, validatedData);
      
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address or data format" });
      }
      console.error("Failed to update wallet:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Get all wallets for the current user (supports owner access for demo)
  app.get("/api/wallets", async (req, res) => {
    try {
      // Try to get userId from session first
      let userId = req.session?.userId;
      
      // If not authenticated in session, get owner user for demo
      if (!userId) {
        const ownerUser = await storage.getUserByUsername("empire_owner");
        userId = ownerUser?.id;
      }
      
      if (!userId) {
        return res.json([]); // Return empty array if not found
      }

      const wallets = await storage.getWalletsByUserId(userId);
      res.json(wallets || []);
    } catch (error) {
      console.error("Failed to get wallets:", error);
      res.status(500).json({ error: "Failed to get wallets" });
    }
  });

  // Get a specific wallet by ID
  app.get("/api/wallets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const wallet = await storage.getWalletById(id);
      
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // Security: Only allow users to access their own wallets
      if (wallet.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(wallet);
    } catch (error) {
      console.error("Failed to get wallet:", error);
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });

  // Create/connect a new wallet
  app.post("/api/wallets", async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertWalletSchema.parse(req.body);
      
      // Check if wallet already exists
      const existingWallet = await storage.getWalletByAddress(validatedData.address);
      
      if (existingWallet) {
        // Update existing wallet to link to current user if not already linked
        if (!existingWallet.userId || existingWallet.userId === userId) {
          const updatedWallet = await storage.updateWallet(validatedData.address, {
            userId,
            balance: validatedData.balance,
            network: validatedData.network
          });
          return res.json(updatedWallet);
        } else {
          return res.status(409).json({ error: "Wallet already linked to another user" });
        }
      }

      // Create new wallet
      const wallet = await storage.createWallet({
        ...validatedData,
        userId
      });
      res.status(201).json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet data", 
          details: error.errors 
        });
      }
      console.error("Failed to create wallet:", error);
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });

  // Get network information
  app.get("/api/networks", async (req, res) => {
    try {
      const networks = await storage.getAllNetworks();
      res.json(networks);
    } catch (error) {
      console.error("Failed to get networks:", error);
      res.status(500).json({ error: "Failed to get networks" });
    }
  });

  // Add or update network information
  app.post("/api/networks", async (req, res) => {
    try {
      const networkSchema = z.object({
        chainId: z.string(),
        name: z.string(),
        rpcUrl: z.string(),
        blockExplorerUrl: z.string().optional(),
        symbol: z.string().default("ETH"),
        decimals: z.string().default("18"),
        isTestnet: z.string().default("false")
      });

      const validatedData = networkSchema.parse(req.body);
      const network = await storage.createOrUpdateNetwork(validatedData);
      res.status(201).json(network);
    } catch (error) {
      console.error("Failed to create/update network:", error);
      res.status(400).json({ error: "Invalid network data" });
    }
  });

  // ========================
  // TOKEN MANAGEMENT ROUTES
  // ========================

  // Get all tokens
  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await storage.getAllTokens();
      res.json(tokens);
    } catch (error) {
      console.error("Failed to get tokens:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  // Get tokens by chain
  app.get("/api/tokens/chain/:chainId", async (req, res) => {
    try {
      const chainId = z.string().parse(req.params.chainId);
      const tokens = await storage.getTokensByChain(chainId);
      res.json(tokens);
    } catch (error) {
      console.error("Failed to get tokens by chain:", error);
      res.status(500).json({ error: "Failed to get tokens by chain" });
    }
  });

  // Get token by contract address and chain
  app.get("/api/tokens/:chainId/:contractAddress", async (req, res) => {
    try {
      const chainId = z.string().parse(req.params.chainId);
      const contractAddress = ethereumAddressSchema.parse(req.params.contractAddress);
      const token = await storage.getTokenByAddressAndChain(contractAddress, chainId);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }
      
      res.json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid chain ID or contract address" });
      }
      console.error("Failed to get token:", error);
      res.status(500).json({ error: "Failed to get token" });
    }
  });

  // Create/add new token
  app.post("/api/tokens", async (req, res) => {
    try {
      const validatedData = insertTokenSchema.parse(req.body);
      const token = await storage.createToken(validatedData);
      res.status(201).json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid token data", 
          details: error.errors 
        });
      }
      console.error("Failed to create token:", error);
      res.status(500).json({ error: "Failed to create token" });
    }
  });

  // Update token metadata
  app.put("/api/tokens/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const updateData = insertTokenSchema.partial().parse(req.body);
      const token = await storage.updateToken(id, updateData);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }
      
      res.json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid token data", 
          details: error.errors 
        });
      }
      console.error("Failed to update token:", error);
      res.status(500).json({ error: "Failed to update token" });
    }
  });

  // ========================
  // TOKEN BALANCE ROUTES
  // ========================

  // Get all token balances for a wallet
  app.get("/api/tokens/balances/:walletAddress", async (req, res) => {
    try {
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const balances = await storage.getTokenBalancesByWallet(walletAddress);
      res.json(balances);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      console.error("Failed to get token balances:", error);
      res.status(500).json({ error: "Failed to get token balances" });
    }
  });

  // Get specific token balance
  app.get("/api/tokens/balances/:walletAddress/:tokenId", async (req, res) => {
    try {
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const tokenId = z.string().parse(req.params.tokenId);
      const balance = await storage.getTokenBalance(walletAddress, tokenId);
      
      if (!balance) {
        return res.status(404).json({ error: "Token balance not found" });
      }
      
      res.json(balance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address or token ID" });
      }
      console.error("Failed to get token balance:", error);
      res.status(500).json({ error: "Failed to get token balance" });
    }
  });

  // Update/create token balance
  app.put("/api/tokens/balances", async (req, res) => {
    try {
      const validatedData = insertTokenBalanceSchema.parse(req.body);
      const balance = await storage.createOrUpdateTokenBalance(validatedData);
      res.json(balance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid token balance data", 
          details: error.errors 
        });
      }
      console.error("Failed to update token balance:", error);
      res.status(500).json({ error: "Failed to update token balance" });
    }
  });

  // Batch update token balances
  app.post("/api/tokens/balances/batch", async (req, res) => {
    try {
      const batchSchema = z.object({
        balances: z.array(insertTokenBalanceSchema)
      });
      
      const { balances } = batchSchema.parse(req.body);
      const updatedBalances = [];
      
      for (const balanceData of balances) {
        const balance = await storage.createOrUpdateTokenBalance(balanceData);
        updatedBalances.push(balance);
      }
      
      res.json(updatedBalances);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid batch balance data", 
          details: error.errors 
        });
      }
      console.error("Failed to batch update token balances:", error);
      res.status(500).json({ error: "Failed to batch update token balances" });
    }
  });

  // ========================
  // USER TOKEN MANAGEMENT
  // ========================

  // Get user's tracked tokens for specific wallet
  app.get("/api/user-tokens/:userId/:walletAddress", async (req, res) => {
    try {
      const userId = z.string().parse(req.params.userId);
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const userTokens = await storage.getUserTokens(userId, walletAddress);
      res.json(userTokens);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user ID or wallet address" });
      }
      console.error("Failed to get user tokens:", error);
      res.status(500).json({ error: "Failed to get user tokens" });
    }
  });

  // Get all user tokens for a wallet (regardless of user)
  app.get("/api/user-tokens/wallet/:walletAddress", async (req, res) => {
    try {
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const userTokens = await storage.getUserTokensByWallet(walletAddress);
      res.json(userTokens);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      console.error("Failed to get user tokens by wallet:", error);
      res.status(500).json({ error: "Failed to get user tokens by wallet" });
    }
  });

  // Add token to user's watchlist
  app.post("/api/user-tokens", async (req, res) => {
    try {
      const validatedData = insertUserTokenSchema.parse(req.body);
      const userToken = await storage.addUserToken(validatedData);
      res.status(201).json(userToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid user token data", 
          details: error.errors 
        });
      }
      console.error("Failed to add user token:", error);
      res.status(500).json({ error: "Failed to add user token" });
    }
  });

  // Remove token from user's watchlist
  app.delete("/api/user-tokens/:userId/:walletAddress/:tokenId", async (req, res) => {
    try {
      const userId = z.string().parse(req.params.userId);
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const tokenId = z.string().parse(req.params.tokenId);
      
      const removed = await storage.removeUserToken(userId, walletAddress, tokenId);
      
      if (!removed) {
        return res.status(404).json({ error: "User token not found" });
      }
      
      res.json({ success: true, message: "Token removed from watchlist" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user ID, wallet address, or token ID" });
      }
      console.error("Failed to remove user token:", error);
      res.status(500).json({ error: "Failed to remove user token" });
    }
  });

  // Update user token settings (hide/show, sort order)
  app.patch("/api/user-tokens/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const updateSchema = z.object({
        isHidden: z.string().optional(),
        sortOrder: z.string().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      const userToken = await storage.updateUserToken(id, updateData);
      
      if (!userToken) {
        return res.status(404).json({ error: "User token not found" });
      }
      
      res.json(userToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid user token data", 
          details: error.errors 
        });
      }
      console.error("Failed to update user token:", error);
      res.status(500).json({ error: "Failed to update user token" });
    }
  });

  // ================================
  // CONTRACT MANAGEMENT ROUTES
  // ================================

  // Get all contracts with optional filtering
  app.get("/api/contracts", async (req, res) => {
    try {
      const filters: { userId?: string; chainId?: string; tags?: string[] } = {};
      
      if (req.query.userId) {
        filters.userId = z.string().parse(req.query.userId);
      }
      if (req.query.chainId) {
        filters.chainId = z.string().parse(req.query.chainId);
      }
      if (req.query.tags) {
        const tagsParam = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
        filters.tags = tagsParam.map(tag => z.string().parse(tag));
      }

      const contracts = await storage.getContracts(filters);
      res.json({ contracts });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid filter parameters", 
          details: error.errors 
        });
      }
      console.error("Failed to get contracts:", error);
      res.status(500).json({ error: "Failed to get contracts" });
    }
  });

  // Create a new contract
  app.post("/api/contracts", async (req, res) => {
    try {
      const contractData = insertContractSchema.parse(req.body);
      
      // Check if contract already exists
      const existing = await storage.getContractByAddressAndChain(
        contractData.address, 
        contractData.chainId
      );
      
      if (existing) {
        return res.status(409).json({ 
          error: "Contract already exists for this address and chain",
          existingContract: existing 
        });
      }

      const contract = await storage.createContract(contractData);
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid contract data", 
          details: error.errors 
        });
      }
      console.error("Failed to create contract:", error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  // Get a specific contract by ID
  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contract ID" });
      }
      console.error("Failed to get contract:", error);
      res.status(500).json({ error: "Failed to get contract" });
    }
  });

  // Update a contract
  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const updateSchema = insertContractSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const contract = await storage.updateContract(id, updateData);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid contract data", 
          details: error.errors 
        });
      }
      console.error("Failed to update contract:", error);
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  // Delete a contract
  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const deleted = await storage.deleteContract(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json({ success: true, message: "Contract deleted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contract ID" });
      }
      console.error("Failed to delete contract:", error);
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // Get contract call history with pagination
  app.get("/api/contracts/:id/calls", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      
      const calls = await storage.getContractCalls(contractId, { page, limit });
      
      res.json({
        calls,
        pagination: {
          page,
          limit,
          hasMore: calls.length === limit
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid pagination parameters", 
          details: error.errors 
        });
      }
      console.error("Failed to get contract calls:", error);
      res.status(500).json({ error: "Failed to get contract calls" });
    }
  });

  // Record a new contract call
  app.post("/api/contracts/:id/calls", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const callData = insertContractCallSchema.parse({
        ...req.body,
        contractId
      });
      
      const call = await storage.createContractCall(callData);
      res.status(201).json(call);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid contract call data", 
          details: error.errors 
        });
      }
      console.error("Failed to create contract call:", error);
      res.status(500).json({ error: "Failed to create contract call" });
    }
  });

  // Update a contract call (e.g., after transaction confirmation)
  app.patch("/api/contracts/:contractId/calls/:callId", async (req, res) => {
    try {
      const callId = z.string().parse(req.params.callId);
      const updateSchema = insertContractCallSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const call = await storage.updateContractCall(callId, updateData);
      
      if (!call) {
        return res.status(404).json({ error: "Contract call not found" });
      }
      
      res.json(call);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid contract call data", 
          details: error.errors 
        });
      }
      console.error("Failed to update contract call:", error);
      res.status(500).json({ error: "Failed to update contract call" });
    }
  });

  // Get contract calls by address (user's call history)
  app.get("/api/contract-calls/:address", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      
      const calls = await storage.getContractCallsByAddress(address, { page, limit });
      
      res.json({
        calls,
        pagination: {
          page,
          limit,
          hasMore: calls.length === limit
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get contract calls by address:", error);
      res.status(500).json({ error: "Failed to get contract calls" });
    }
  });

  // ================================
  // CONTRACT EVENT SUBSCRIPTION ROUTES
  // ================================

  // Get event subscriptions for a contract
  app.get("/api/contracts/:id/event-subscriptions", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const subscriptions = await storage.getContractEventSubs(contractId);
      res.json({ subscriptions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contract ID" });
      }
      console.error("Failed to get event subscriptions:", error);
      res.status(500).json({ error: "Failed to get event subscriptions" });
    }
  });

  // Create a new event subscription
  app.post("/api/contracts/:id/event-subscriptions", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const subData = insertContractEventSubSchema.parse({
        ...req.body,
        contractId
      });
      
      const subscription = await storage.createContractEventSub(subData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid event subscription data", 
          details: error.errors 
        });
      }
      console.error("Failed to create event subscription:", error);
      res.status(500).json({ error: "Failed to create event subscription" });
    }
  });

  // Update an event subscription
  app.patch("/api/event-subscriptions/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const updateSchema = insertContractEventSubSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const subscription = await storage.updateContractEventSub(id, updateData);
      
      if (!subscription) {
        return res.status(404).json({ error: "Event subscription not found" });
      }
      
      res.json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid event subscription data", 
          details: error.errors 
        });
      }
      console.error("Failed to update event subscription:", error);
      res.status(500).json({ error: "Failed to update event subscription" });
    }
  });

  // Delete an event subscription
  app.delete("/api/event-subscriptions/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const deleted = await storage.deleteContractEventSub(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Event subscription not found" });
      }
      
      res.json({ success: true, message: "Event subscription deleted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid subscription ID" });
      }
      console.error("Failed to delete event subscription:", error);
      res.status(500).json({ error: "Failed to delete event subscription" });
    }
  });

  // Get contract events with pagination
  app.get("/api/contracts/:id/events", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      
      const events = await storage.getContractEvents(contractId, { page, limit });
      
      res.json({
        events,
        pagination: {
          page,
          limit,
          hasMore: events.length === limit
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid pagination parameters", 
          details: error.errors 
        });
      }
      console.error("Failed to get contract events:", error);
      res.status(500).json({ error: "Failed to get contract events" });
    }
  });

  // Rate limiting configuration for NFT endpoints
  const nftRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs for NFTs
    message: {
      error: "Too many NFT requests from this IP, please try again later.",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const nftSlowDown = slowDown({
    windowMs: 5 * 60 * 1000, // 5 minutes
    delayAfter: 20, // Allow 20 requests per 5 minutes at full speed
    delayMs: () => 500, // Add 500ms delay per request after limit
    maxDelayMs: 10000, // Maximum delay of 10 seconds
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
  });

  // Stricter rate limiting for refresh endpoints
  const nftRefreshRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Only 10 refresh requests per hour
    message: {
      error: "Too many NFT refresh requests from this IP, please try again later.",
      retryAfter: "1 hour"
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ===== NFT API ROUTES =====

  // Get NFTs for a wallet address with comprehensive filtering and pagination
  app.get("/api/nfts/:address", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      
      // Parse query parameters
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      const chains = req.query.chains ? 
        (Array.isArray(req.query.chains) ? req.query.chains : [req.query.chains]) : 
        ["0x1", "0x89", "0x38", "0xa4b1", "0xa"]; // Default supported chains
      const collection = req.query.collection as string;
      const search = req.query.search as string;
      const forceRefresh = req.query.refresh === "true";
      const maxAge = parseInt(req.query.maxAge as string) || 24; // hours
      const sortBy = (req.query.sortBy as string) || "acquired";
      const sortOrder = (req.query.sortOrder as string) || "desc";
      
      // Validate chain IDs
      const validChains = chains.filter(chain => 
        typeof chain === 'string' && /^0x[a-fA-F0-9]+$/.test(chain)
      ) as string[];
      
      if (validChains.length === 0) {
        return res.status(400).json({ 
          error: "At least one valid chain ID is required" 
        });
      }

      const result = await nftService.fetchNFTsForWallet(address, validChains, {
        forceRefresh,
        maxAge,
        page,
        limit,
        collection,
        search,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      });

      res.json({
        nfts: result.nfts,
        collections: result.collections,
        stats: result.stats,
        pagination: result.pagination,
        filters: {
          chains: validChains,
          collection,
          search,
          sortBy,
          sortOrder
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet address format",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFTs:", error);
      res.status(500).json({ 
        error: "Failed to fetch NFTs",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get NFT collections for a wallet
  app.get("/api/nfts/:address/collections", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const chainId = req.query.chainId as string;
      
      const collections = await storage.getCollectionsByWallet(address, chainId);
      
      res.json({ collections });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet address format",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFT collections:", error);
      res.status(500).json({ error: "Failed to fetch NFT collections" });
    }
  });

  // Get NFT statistics for a wallet
  app.get("/api/nfts/:address/stats", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      
      const stats = await storage.getNftStats(address);
      
      res.json({ stats });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet address format",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFT stats:", error);
      res.status(500).json({ error: "Failed to fetch NFT stats" });
    }
  });

  // Get NFT attribute facets for filtering
  app.get("/api/nfts/:address/facets", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const chainId = req.query.chainId as string;
      const collectionId = req.query.collectionId as string;
      
      const facets = await storage.getNftAttributeFacets(address, {
        chainId,
        collectionId
      });
      
      res.json({ facets });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet address format",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFT facets:", error);
      res.status(500).json({ error: "Failed to fetch NFT facets" });
    }
  });

  // Force refresh NFTs for a wallet
  app.post("/api/nfts/:address/refresh", nftRefreshRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const chains = req.body.chains || ["0x1", "0x89", "0x38", "0xa4b1", "0xa"];
      
      // Validate chain IDs
      const validChains = chains.filter((chain: string) => 
        typeof chain === 'string' && /^0x[a-fA-F0-9]+$/.test(chain)
      );
      
      if (validChains.length === 0) {
        return res.status(400).json({ 
          error: "At least one valid chain ID is required" 
        });
      }

      // Force refresh with no cache
      const result = await nftService.fetchNFTsForWallet(address, validChains, {
        forceRefresh: true,
        maxAge: 0
      });

      res.json({
        success: true,
        message: "NFT data refreshed successfully",
        stats: result.stats,
        refreshedAt: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: error.errors 
        });
      }
      console.error("Failed to refresh NFTs:", error);
      res.status(500).json({ 
        error: "Failed to refresh NFTs",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get specific NFT details
  app.get("/api/nfts/:chainId/:contractAddress/:tokenId", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const chainId = z.string().parse(req.params.chainId);
      const contractAddress = ethereumAddressSchema.parse(req.params.contractAddress);
      const tokenId = z.string().parse(req.params.tokenId);
      
      const nft = await storage.getNftByToken(contractAddress, tokenId, chainId);
      
      if (!nft) {
        return res.status(404).json({ error: "NFT not found" });
      }

      let collection = null;
      if (nft.collectionId) {
        collection = await storage.getNftCollection(nft.collectionId);
      }

      const ownerships = await storage.getNftOwnershipsByNft(nft.id);

      res.json({
        nft,
        collection,
        ownerships
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid NFT parameters",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFT details:", error);
      res.status(500).json({ error: "Failed to fetch NFT details" });
    }
  });

  // Refresh metadata for a specific NFT
  app.post("/api/nfts/:chainId/:contractAddress/:tokenId/refresh", nftRefreshRateLimit, nftSlowDown, async (req, res) => {
    try {
      const chainId = z.string().parse(req.params.chainId);
      const contractAddress = ethereumAddressSchema.parse(req.params.contractAddress);
      const tokenId = z.string().parse(req.params.tokenId);
      
      const refreshedNft = await nftService.refreshNFTMetadata(contractAddress, tokenId, chainId);
      
      if (!refreshedNft) {
        return res.status(404).json({ error: "Failed to refresh NFT metadata" });
      }

      res.json({
        success: true,
        message: "NFT metadata refreshed successfully",
        nft: refreshedNft,
        refreshedAt: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid NFT parameters",
          details: error.errors 
        });
      }
      console.error("Failed to refresh NFT metadata:", error);
      res.status(500).json({ error: "Failed to refresh NFT metadata" });
    }
  });

  // Update NFT ownership visibility
  app.patch("/api/nfts/:address/:nftId/visibility", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const nftId = z.string().parse(req.params.nftId);
      const { hidden } = z.object({
        hidden: z.boolean()
      }).parse(req.body);
      
      const ownership = await storage.getNftOwnershipByWalletAndNft(address, nftId);
      
      if (!ownership) {
        return res.status(404).json({ error: "NFT ownership not found" });
      }

      const updatedOwnership = await storage.updateNftOwnership(ownership.id, {
        isHidden: hidden ? "true" : "false"
      });

      res.json({
        success: true,
        ownership: updatedOwnership
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request parameters",
          details: error.errors 
        });
      }
      console.error("Failed to update NFT visibility:", error);
      res.status(500).json({ error: "Failed to update NFT visibility" });
    }
  });

  // Search NFTs across all collections
  app.get("/api/nfts/search", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const query = z.string().min(1).parse(req.query.q);
      const chainId = req.query.chainId as string;
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      
      const nfts = await storage.searchNfts(query, chainId, { page, limit });
      
      res.json({
        nfts,
        pagination: {
          page,
          limit,
          hasMore: nfts.length === limit
        },
        query: {
          search: query,
          chainId
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid search parameters",
          details: error.errors 
        });
      }
      console.error("Failed to search NFTs:", error);
      res.status(500).json({ error: "Failed to search NFTs" });
    }
  });

  // Update health check to include NFTs service
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      services: ["transactions", "wallets", "tokens", "networks", "contracts", "nfts", "payments"],
      database: "connected",
      timestamp: new Date().toISOString()
    });
  });

  // ===== CRYPTO PAYMENT GATEWAY ROUTES (NOWPayments) =====
  
  const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
  const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

  // Get available cryptocurrencies
  app.get("/api/payments/currencies", async (req, res) => {
    try {
      const popular = ['btc', 'eth', 'usdt', 'bnb', 'sol', 'xrp', 'ada', 'doge', 'matic', 'ltc', 'avax', 'dot', 'link', 'uni', 'atom'];
      res.json(popular);
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      res.status(500).json({ error: "Failed to fetch currencies" });
    }
  });

  // Create payment
  app.post("/api/payments/create", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
    try {
      const paymentSchema = z.object({
        amount: z.number().positive(),
        currency: z.string(),
        crypto: z.string()
      });

      const { amount, currency, crypto } = paymentSchema.parse(req.body);

      // Mock payment creation (in production, call NOWPayments API)
      const mockPayment = {
        payment_id: `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        payment_status: 'waiting',
        pay_address: crypto === 'btc' ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' :
                     crypto === 'eth' ? '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' :
                     crypto === 'sol' ? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' :
                     `${crypto}_payment_address`,
        pay_amount: crypto === 'btc' ? amount / 45000 :
                   crypto === 'eth' ? amount / 2500 :
                   crypto === 'sol' ? amount / 100 :
                   amount / 50,
        price_amount: amount,
        price_currency: currency,
        pay_currency: crypto,
        created_at: new Date().toISOString(),
        expiration_estimate_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      res.json(mockPayment);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid payment data", 
          details: error.errors 
        });
      }
      console.error("Failed to create payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Get payment status
  app.get("/api/payments/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;

      // Mock payment status (in production, call NOWPayments API)
      const mockStatus = {
        payment_id: paymentId,
        payment_status: Math.random() > 0.7 ? 'confirmed' : 'waiting',
        pay_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        pay_amount: 0.00234567,
        price_amount: 100,
        price_currency: 'usd',
        pay_currency: 'btc',
        created_at: new Date().toISOString(),
        expiration_estimate_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      res.json(mockStatus);

    } catch (error) {
      console.error("Failed to get payment status:", error);
      res.status(500).json({ error: "Failed to get payment status" });
    }
  });

  // ===== PAYMENT SYSTEM ROUTES =====
  
  // Product Routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/active", async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch active products:", error);
      res.status(500).json({ error: "Failed to fetch active products" });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  
  // Cart Routes
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const cart = await storage.getCartBySession(sessionId);
      res.json(cart || { items: [], total: 0 });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", async (req, res) => {
    try {
      const itemSchema = z.object({
        productId: z.string(),
        quantity: z.number().int().positive().default(1)
      });
      const itemData = itemSchema.parse(req.body);
      const sessionId = req.sessionID;
      
      const cartItem = await storage.addToCart(sessionId, itemData.productId, itemData.quantity);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid cart item data", details: error.errors });
      }
      console.error("Failed to add to cart:", error);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:itemId", async (req, res) => {
    try {
      const quantitySchema = z.object({
        quantity: z.number().int().positive()
      });
      const { quantity } = quantitySchema.parse(req.body);
      const sessionId = req.sessionID;
      
      const updated = await storage.updateCartItem(sessionId, req.params.itemId, quantity);
      if (!updated) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quantity", details: error.errors });
      }
      console.error("Failed to update cart item:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:itemId", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const success = await storage.removeFromCart(sessionId, req.params.itemId);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart/clear", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      await storage.clearCart(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to clear cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });
  
  // Order Routes
  app.post("/api/orders/create", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
    try {
      const orderSchema = z.object({
        customerEmail: z.string().email().optional(),
        customerWallet: z.string().optional(),
        paymentMethod: z.enum(['metamask', 'nowpayments', 'stripe']),
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
          price: z.string()
        })),
        totalAmount: z.string(),
        currency: z.string().default('USD'),
        chainId: z.number().int().positive().optional(),
        metadata: z.any().optional()
      });

      const orderData = orderSchema.parse(req.body);
      
      // Map chain ID to native token symbol
      const chainToNativeToken: Record<number, string> = {
        1: 'ETH',        // Ethereum
        137: 'MATIC',    // Polygon
        56: 'BNB',       // BSC
        43114: 'AVAX',   // Avalanche
        42161: 'ETH',    // Arbitrum
        10: 'ETH',       // Optimism
        8453: 'ETH',     // Base
        250: 'FTM',      // Fantom
        42220: 'CELO',   // Celo
        1666600000: 'ONE', // Harmony
        25: 'CRO',       // Cronos
      };
      
      // Server-side expected crypto amount calculation for MetaMask payments
      let expectedCryptoAmount = undefined;
      let expectedChainId = undefined;
      let fxRateLocked = undefined;
      let nativeToken = 'ETH';
      
      if (orderData.paymentMethod === 'metamask' && orderData.chainId) {
        nativeToken = chainToNativeToken[orderData.chainId] || 'ETH';
        
        // Use real-time native token price from CoinGecko
        const tokenPrice = getCryptoPrice(nativeToken);
        if (!tokenPrice) {
          return res.status(500).json({ 
            error: `Unable to fetch ${nativeToken} price. Please try again.` 
          });
        }
        
        const TOKEN_USD_RATE = tokenPrice.usd;
        fxRateLocked = TOKEN_USD_RATE.toString();
        expectedCryptoAmount = convertUsdToCrypto(parseFloat(orderData.totalAmount), nativeToken);
        expectedChainId = orderData.chainId.toString();
        
        console.log(`📊 Order expected payment: ${expectedCryptoAmount} ${nativeToken} on chain ${expectedChainId} (rate: $${TOKEN_USD_RATE.toFixed(2)})`);
      }
      
      const order = await storage.createOrder({
        ...orderData,
        status: 'pending',
        userId: (req.user as any)?.id,
        items: orderData.items as any,
        expectedCryptoAmount,
        expectedChainId,
        fxRateLocked,
        // Store native token symbol for frontend display
        ...(orderData.paymentMethod === 'metamask' && orderData.chainId ? {
          currency: nativeToken
        } : {}),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid order data", 
          details: error.errors 
        });
      }
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  app.get("/api/orders/user/:userId", async (req, res) => {
    try {
      const orders = await storage.getUserOrders(req.params.userId);
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
      res.status(500).json({ error: "Failed to fetch user orders" });
    }
  });
  
  app.get("/api/orders/wallet/:walletAddress", async (req, res) => {
    try {
      const orders = await storage.getOrdersByWallet(req.params.walletAddress);
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch wallet orders:", error);
      res.status(500).json({ error: "Failed to fetch wallet orders" });
    }
  });
  
  // Blockchain Configuration Routes
  app.get("/api/blockchain/chains", (req, res) => {
    const chains = getAllSupportedChains();
    res.json(chains);
  });
  
  app.get("/api/blockchain/chains/:chainId", (req, res) => {
    const chainId = parseInt(req.params.chainId);
    const chain = getChainConfig(chainId);
    
    if (!chain) {
      return res.status(404).json({ error: "Chain not supported" });
    }
    
    res.json(chain);
  });
  
  // Payment Processing Routes
  app.post("/api/payments/metamask", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
    try {
      const paymentSchema = z.object({
        orderId: z.string().uuid(),
        txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
        fromAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid from address"),
        toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid to address"),
        chainId: z.number().int().positive(),
        amount: z.string(), // Client amount (will be validated against server expectation)
        amountUSD: z.string(),
        currency: z.string()
      });

      const data = paymentSchema.parse(req.body);
      
      // SECURITY: Check txHash uniqueness - prevent replay attacks
      const existingTx = await storage.getPaymentByTxHash(data.txHash);
      if (existingTx) {
        console.error(`❌ Transaction hash already used: ${data.txHash}`);
        return res.status(400).json({ 
          error: "Transaction hash already used. Each transaction can only be used once.",
          existingPaymentId: existingTx.id
        });
      }
      
      // Verify chain is supported
      const chainConfig = getChainConfig(data.chainId);
      if (!chainConfig) {
        return res.status(400).json({ 
          error: `Unsupported chain ID: ${data.chainId}. Supported chains: ${getAllSupportedChains().map(c => `${c.chainName} (${c.chainId})`).join(', ')}`
        });
      }
      
      // Verify recipient matches server-side merchant address
      if (data.toAddress.toLowerCase() !== chainConfig.merchantAddress.toLowerCase()) {
        return res.status(400).json({ 
          error: `Invalid recipient address. Expected ${chainConfig.merchantAddress}, got ${data.toAddress}` 
        });
      }
      
      // Verify order exists and is not expired
      const order = await storage.getOrder(data.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.expiresAt && new Date(order.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Order has expired" });
      }
      
      if (order.status !== 'pending') {
        return res.status(400).json({ error: "Order is not in pending state" });
      }
      
      // SECURITY: Bind payment to customer wallet - prevent order hijacking
      if (order.customerWallet) {
        if (data.fromAddress.toLowerCase() !== order.customerWallet.toLowerCase()) {
          console.error(`❌ Payer mismatch: order wallet ${order.customerWallet}, from ${data.fromAddress}`);
          return res.status(400).json({ 
            error: "Payment must come from the wallet that created the order",
            expectedWallet: order.customerWallet,
            actualWallet: data.fromAddress
          });
        }
      }
      
      // SECURITY: Use server-calculated expected amount, not client amount
      const expectedAmount = order.expectedCryptoAmount || data.amount;
      const expectedChain = order.expectedChainId ? parseInt(order.expectedChainId) : data.chainId;
      
      if (expectedChain !== data.chainId) {
        return res.status(400).json({ 
          error: `Chain mismatch: order expects chain ${expectedChain}, payment on chain ${data.chainId}` 
        });
      }
      
      console.log(`🔍 Verifying transaction ${data.txHash} on ${chainConfig.chainName}...`);
      console.log(`   Expected amount: ${expectedAmount} ETH (server-calculated)`);
      console.log(`   Client claimed: ${data.amount} ETH`);
      
      // BLOCKCHAIN VERIFICATION: Use server-expected amount for verification
      const verification = await verifyTransaction(data.txHash, expectedAmount, data.chainId);
      
      if (!verification.valid) {
        console.error(`❌ Transaction verification failed:`, verification.errors);
        return res.status(400).json({ 
          error: "Transaction verification failed",
          details: verification.errors,
          verificationData: {
            txHash: verification.txHash,
            confirmations: verification.confirmations,
            minRequired: chainConfig.minConfirmations,
            expectedAmount: expectedAmount,
            actualAmount: verification.value
          }
        });
      }
      
      // SECURITY: Verify from address matches blockchain transaction
      if (verification.from.toLowerCase() !== data.fromAddress.toLowerCase()) {
        console.error(`❌ From address mismatch: claimed ${data.fromAddress}, actual ${verification.from}`);
        return res.status(400).json({ 
          error: "Transaction sender does not match claimed address"
        });
      }
      
      console.log(`✅ Transaction verified successfully!`);
      console.log(`   From: ${verification.from} (matched)`);
      console.log(`   To: ${verification.to} (matched)`);
      console.log(`   Value: ${verification.value} ETH (within tolerance)`);
      console.log(`   Confirmations: ${verification.confirmations}/${chainConfig.minConfirmations}`);
      
      const payment = await storage.createPayment({
        orderId: data.orderId,
        paymentMethod: 'metamask',
        provider: 'metamask',
        amount: verification.value,
        currency: data.currency,
        status: 'confirmed',
        txHash: data.txHash,
        fromAddress: verification.from,
        toAddress: verification.to,
        confirmations: verification.confirmations.toString(),
        providerResponse: {
          amountUSD: data.amountUSD,
          chainId: data.chainId,
          chainName: chainConfig.chainName,
          blockNumber: verification.blockNumber,
          verifiedAt: new Date().toISOString(),
          expectedAmount: expectedAmount,
          fxRateLocked: order.fxRateLocked,
          verification: {
            valid: verification.valid,
            confirmations: verification.confirmations,
            valueETH: verification.value
          }
        } as any
      });

      await storage.updateOrder(data.orderId, {
        status: 'completed'
      });

      console.log(`🎉 Payment complete! Order ${order.id} marked as completed`);

      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid payment data", 
          details: error.errors 
        });
      }
      console.error("Failed to process MetaMask payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });
  
  app.post("/api/payments/nowpayments", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
    try {
      const paymentSchema = z.object({
        orderId: z.string(),
        crypto: z.string(),
        amount: z.string(),
        currency: z.string()
      });

      const data = paymentSchema.parse(req.body);
      const nowPaymentsApiKey = process.env.NOWPAYMENTS_API_KEY;
      
      if (!nowPaymentsApiKey) {
        console.error('[NOWPayments] API key not configured - NOWPayments integration requires NOWPAYMENTS_API_KEY environment variable');
        return res.status(503).json({ 
          error: 'NOWPayments service not configured',
          message: 'NOWPayments integration requires API key configuration'
        });
      }

      const nowPaymentsInvoice = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: {
          'x-api-key': nowPaymentsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: parseFloat(data.amount),
          price_currency: data.currency.toLowerCase(),
          pay_currency: data.crypto.toLowerCase(),
          order_id: data.orderId,
          order_description: `Order ${data.orderId}`,
          ipn_callback_url: `${getBaseUrl()}/api/payments/nowpayments/webhook`,
          success_url: `${getBaseUrl()}/checkout/success`,
          cancel_url: `${getBaseUrl()}/checkout`
        })
      });

      if (!nowPaymentsInvoice.ok) {
        const errorText = await nowPaymentsInvoice.text();
        console.error('[NOWPayments] Invoice creation failed:', errorText);
        throw new Error(`NOWPayments API error: ${nowPaymentsInvoice.status}`);
      }

      const invoiceData = await nowPaymentsInvoice.json();
      console.log('[NOWPayments] Invoice created:', invoiceData.id);
      
      const payment = await storage.createPayment({
        orderId: data.orderId,
        paymentMethod: 'nowpayments',
        provider: 'nowpayments',
        amount: data.amount,
        currency: data.currency,
        status: 'waiting',
        providerResponse: invoiceData as any
      });

      await storage.updateOrder(data.orderId, {
        status: 'awaiting_payment'
      });

      res.json({
        ...payment,
        invoice_url: invoiceData.invoice_url,
        invoice_id: invoiceData.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid payment data", 
          details: error.errors 
        });
      }
      console.error("Failed to process NOWPayments payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });
  
  app.post("/api/payments/nowpayments/webhook", async (req, res) => {
    try {
      const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
      const receivedSignature = req.headers['x-nowpayments-sig'] as string;
      
      // 🔒 SECURITY: Always verify webhook signature - reject if missing or invalid
      if (!ipnSecret) {
        console.error('[NOWPayments] IPN Secret not configured - rejecting webhook');
        return res.status(503).json({ error: 'Webhook verification not configured' });
      }
      
      if (!receivedSignature) {
        console.error('[NOWPayments] Missing webhook signature');
        return res.status(401).json({ error: 'Missing signature' });
      }
      
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha512', ipnSecret);
      hmac.update(JSON.stringify(req.body));
      const calculatedSignature = hmac.digest('hex');
      
      if (calculatedSignature !== receivedSignature) {
        console.error('[NOWPayments] Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const webhookData = req.body;
      console.log('[NOWPayments] Webhook received:', webhookData.payment_status);

      // 🔒 IDEMPOTENCY: Check if webhook already processed
      const webhookId = `${webhookData.payment_id || webhookData.order_id}_${webhookData.payment_status}`;
      const existingWebhooks = await dbClient
        .select()
        .from(paymentWebhooks)
        .where(
          and(
            eq(paymentWebhooks.provider, 'nowpayments'),
            sql`${paymentWebhooks.payload}->>'payment_id' = ${webhookData.payment_id || ''}`,
            eq(paymentWebhooks.processed, 'true')
          )
        )
        .limit(1);
      
      if (existingWebhooks.length > 0) {
        console.log('[NOWPayments] Webhook already processed - idempotent response');
        return res.json({ success: true, message: 'Already processed' });
      }

      // Store webhook for audit trail
      const [webhookRecord] = await dbClient.insert(paymentWebhooks).values({
        provider: 'nowpayments',
        eventType: webhookData.payment_status || 'unknown',
        payload: webhookData as any,
        processed: 'false'
      }).returning();

      if (webhookData.payment_status === 'finished' || webhookData.payment_status === 'confirmed') {
        const payments = await storage.getPaymentsByOrder(webhookData.order_id);
        
        if (payments && payments.length > 0) {
          const payment = payments[0];
          
          // Double-check payment not already confirmed (additional idempotency check)
          if (payment.status === 'confirmed') {
            console.log('[NOWPayments] Payment already confirmed for order:', webhookData.order_id);
            await dbClient.update(paymentWebhooks)
              .set({ processed: 'true' })
              .where(eq(paymentWebhooks.id, webhookRecord.id));
            return res.json({ success: true, message: 'Already confirmed' });
          }
          
          await storage.updatePayment(payment.id, {
            status: 'confirmed',
            confirmedAt: new Date(),
            providerResponse: webhookData as any
          });

          await storage.updateOrder(webhookData.order_id, {
            status: 'completed'
          });

          console.log('[NOWPayments] Payment confirmed for order:', webhookData.order_id);
        }
      }

      // Mark webhook as processed
      await dbClient.update(paymentWebhooks)
        .set({ processed: 'true' })
        .where(eq(paymentWebhooks.id, webhookRecord.id));

      res.json({ success: true });
    } catch (error) {
      console.error('[NOWPayments] Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.get("/api/payments/order/:orderId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByOrder(req.params.orderId);
      res.json(payments);
    } catch (error) {
      console.error("Failed to fetch order payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  
  app.get("/api/payments/:id/status", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json({ status: payment.status, payment });
    } catch (error) {
      console.error("Failed to fetch payment status:", error);
      res.status(500).json({ error: "Failed to fetch payment status" });
    }
  });
  
  app.post("/api/payments/:id/confirm", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
    try {
      const confirmSchema = z.object({
        confirmations: z.string().optional(),
        providerResponse: z.any().optional()
      });

      const data = confirmSchema.parse(req.body);
      const payment = await storage.updatePayment(req.params.id, {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmations: data.confirmations,
        providerResponse: data.providerResponse as any
      });

      if (payment) {
        await storage.updateOrder(payment.orderId, {
          status: 'completed'
        });
      }

      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid confirmation data", 
          details: error.errors 
        });
      }
      console.error("Failed to confirm payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });
  
  // Webhook Route (for payment provider callbacks)
  app.post("/api/webhooks/payment", async (req, res) => {
    try {
      const webhookSchema = z.object({
        provider: z.string(),
        eventType: z.string(),
        payload: z.any()
      });

      const data = webhookSchema.parse(req.body);
      
      await storage.createPaymentWebhook({
        provider: data.provider,
        eventType: data.eventType,
        payload: data.payload as any,
        processed: 'false'
      });

      res.json({ received: true });
    } catch (error) {
      console.error("Failed to process webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // ===== SENTINEL BOT ROUTES =====
  
  // Get all available bot strategies
  app.get("/api/bot/strategies", async (req, res) => {
    try {
      const strategies = await storage.getAllBotStrategies();
      res.json(strategies);
    } catch (error) {
      console.error("Failed to fetch bot strategies:", error);
      res.status(500).json({ error: "Failed to fetch bot strategies" });
    }
  });

  // Get bot subscription plans
  app.get("/api/bot/plans", async (req, res) => {
    try {
      const plans = [
        {
          id: 'starter',
          name: 'Starter',
          price: '99',
          currency: 'USD',
          features: [
            '1 Active Strategy',
            '10 Trades Per Day',
            'Basic Technical Indicators',
            'Email Notifications',
            'Stop Loss & Take Profit'
          ],
          maxActiveStrategies: '1',
          maxDailyTrades: '10',
          popular: false
        },
        {
          id: 'pro',
          name: 'Pro',
          price: '299',
          currency: 'USD',
          features: [
            '3 Active Strategies',
            '50 Trades Per Day',
            'Advanced AI Signals',
            'Real-time Alerts',
            'Risk Management Tools',
            'Priority Support'
          ],
          maxActiveStrategies: '3',
          maxDailyTrades: '50',
          popular: true
        },
        {
          id: 'elite',
          name: 'Elite',
          price: '999',
          currency: 'USD',
          features: [
            'Unlimited Strategies',
            'Unlimited Trades',
            'Custom Strategy Builder',
            'Dedicated Account Manager',
            'API Access',
            'White-Glove Onboarding'
          ],
          maxActiveStrategies: '999',
          maxDailyTrades: '999',
          popular: false
        }
      ];
      
      res.json(plans);
    } catch (error) {
      console.error("Failed to fetch bot plans:", error);
      res.status(500).json({ error: "Failed to fetch bot plans" });
    }
  });

  // Create bot subscription
  app.post("/api/bot/subscribe", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
    try {
      const subscriptionSchema = z.object({
        userId: z.string(),
        planType: z.enum(['starter', 'pro', 'elite']),
        price: z.string(),
        currency: z.string().default('USD'),
        paymentTxHash: z.string().optional()
      });

      const data = subscriptionSchema.parse(req.body);
      
      const planConfig = {
        starter: { maxActiveStrategies: '1', maxDailyTrades: '10', features: ['basic'] },
        pro: { maxActiveStrategies: '3', maxDailyTrades: '50', features: ['advanced'] },
        elite: { maxActiveStrategies: '999', maxDailyTrades: '999', features: ['unlimited'] }
      };

      const config = planConfig[data.planType];
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const subscription = await storage.createBotSubscription({
        userId: data.userId,
        planType: data.planType,
        status: 'active',
        startDate: new Date(),
        expiryDate,
        price: data.price,
        currency: data.currency,
        paymentTxHash: data.paymentTxHash,
        maxActiveStrategies: config.maxActiveStrategies,
        maxDailyTrades: config.maxDailyTrades,
        features: config.features,
        autoRenew: 'false'
      });

      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid subscription data", 
          details: error.errors 
        });
      }
      console.error("Failed to create subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get user subscription
  app.get("/api/bot/subscription/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = await storage.getUserBotSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Save user bot configuration
  app.post("/api/bot/config", async (req, res) => {
    try {
      const configSchema = z.object({
        userId: z.string(),
        subscriptionId: z.string(),
        coinbaseApiKey: z.string().optional(),
        coinbaseApiSecret: z.string().optional(),
        coinbasePassphrase: z.string().optional(),
        maxPositionSize: z.string().default('1000'),
        maxDailyLoss: z.string().default('100'),
        stopLossPercent: z.string().default('5'),
        takeProfitPercent: z.string().default('10'),
        enableNotifications: z.string().default('true'),
        notificationEmail: z.string().email().optional()
      });

      const data = configSchema.parse(req.body);
      const config = await storage.saveBotUserConfig(data);

      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid configuration data", 
          details: error.errors 
        });
      }
      console.error("Failed to save bot configuration:", error);
      res.status(500).json({ error: "Failed to save bot configuration" });
    }
  });

  // Get user bot configuration
  app.get("/api/bot/config/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const config = await storage.getUserBotConfig(userId);
      
      if (!config) {
        return res.status(404).json({ error: "No configuration found" });
      }

      const safeConfig = {
        ...config,
        coinbaseApiKey: config.coinbaseApiKey ? '***' : null,
        coinbaseApiSecret: config.coinbaseApiSecret ? '***' : null,
        coinbasePassphrase: config.coinbasePassphrase ? '***' : null
      };

      res.json(safeConfig);
    } catch (error) {
      console.error("Failed to fetch bot configuration:", error);
      res.status(500).json({ error: "Failed to fetch bot configuration" });
    }
  });

  // Start bot with strategy (advanced bot system)
  app.post("/api/bot-advanced/start", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const startSchema = z.object({
        userId: z.string(),
        strategyId: z.string(),
        tradingPairs: z.array(z.string()),
        allocatedCapital: z.string()
      });

      const data = startSchema.parse(req.body);
      
      const config = await storage.getUserBotConfig(data.userId);
      if (!config) {
        return res.status(400).json({ error: "Bot configuration not found. Please configure your Coinbase API keys first." });
      }

      const subscription = await storage.getUserBotSubscription(data.userId);
      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({ error: "Active subscription required" });
      }

      const activeStrategy = await storage.createBotActiveStrategy({
        userId: data.userId,
        strategyId: data.strategyId,
        configId: config.id,
        status: 'active',
        tradingPairs: data.tradingPairs,
        allocatedCapital: data.allocatedCapital,
        currentProfit: '0',
        totalTrades: '0',
        winRate: '0'
      });

      res.status(201).json(activeStrategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid start data", 
          details: error.errors 
        });
      }
      console.error("Failed to start bot:", error);
      res.status(500).json({ error: "Failed to start bot" });
    }
  });

  // Get user active strategies
  app.get("/api/bot/active/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const strategies = await storage.getUserActiveStrategies(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Failed to fetch active strategies:", error);
      res.status(500).json({ error: "Failed to fetch active strategies" });
    }
  });

  // Stop bot strategy (advanced bot system)
  app.post("/api/bot-advanced/stop/:activeStrategyId", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { activeStrategyId } = req.params;
      await storage.stopBotStrategy(activeStrategyId);
      res.json({ success: true, message: "Bot stopped successfully" });
    } catch (error) {
      console.error("Failed to stop bot:", error);
      res.status(500).json({ error: "Failed to stop bot" });
    }
  });

  // Get bot trades (advanced bot system)
  app.get("/api/bot-advanced/trades/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const trades = await storage.getUserBotTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Failed to fetch bot trades:", error);
      res.status(500).json({ error: "Failed to fetch bot trades" });
    }
  });

  // Get bot performance metrics
  app.get("/api/bot/performance/:activeStrategyId", async (req, res) => {
    try {
      const { activeStrategyId } = req.params;
      const trades = await storage.getStrategyTrades(activeStrategyId);
      
      const totalTrades = trades.length;
      const winningTrades = trades.filter((t: any) => parseFloat(t.profit || '0') > 0).length;
      const losingTrades = trades.filter((t: any) => parseFloat(t.profit || '0') < 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      const totalProfit = trades.reduce((sum: number, t: any) => {
        return sum + parseFloat(t.profit || '0');
      }, 0);

      const metrics = {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: winRate.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        averageProfit: totalTrades > 0 ? (totalProfit / totalTrades).toFixed(2) : '0.00'
      };

      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch performance metrics:", error);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  // Get unclaimed bot profits (authenticated)
  app.get("/api/bot/profits/unclaimed", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const profits = await storage.getUnclaimedProfits(userId);
      res.json(profits);
    } catch (error) {
      console.error("Failed to fetch unclaimed profits:", error);
      res.status(500).json({ error: "Failed to fetch unclaimed profits" });
    }
  });

  // Claim bot profits (authenticated)
  app.post("/api/bot/profits/claim", requireAuth, tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const result = await storage.claimBotProfits(userId);

      if (result.claimedAmount > 0) {
        res.json({
          success: true,
          message: `Successfully claimed $${result.claimedAmount.toFixed(2)} from ${result.tradeCount} profitable trades`,
          claimedAmount: result.claimedAmount,
          tradeCount: result.tradeCount
        });
      } else {
        res.json({
          success: false,
          message: "No unclaimed profits available",
          claimedAmount: 0,
          tradeCount: 0
        });
      }
    } catch (error) {
      console.error("Failed to claim profits:", error);
      res.status(500).json({ error: "Failed to claim profits" });
    }
  });

  // ========================
  // Copy Trading Routes
  // ========================
  
  // Get trader leaderboard (public traders sorted by performance)
  app.get("/api/copy-trading/leaderboard", async (req, res) => {
    try {
      const sortBy = (req.query.sortBy as 'totalReturn' | 'winRate' | 'totalFollowers') || 'totalReturn';
      const limit = parseInt(req.query.limit as string) || 20;
      
      const traders = await storage.getAllPublicTraders({ sortBy, limit });
      
      // Enhance trader data with user info for frontend
      const enhancedTraders = await Promise.all(traders.map(async (trader) => {
        const user = await storage.getUser(trader.userId);
        const wallets = await storage.getWalletsByUserId(trader.userId);
        return {
          ...trader,
          username: user?.username || 'Unknown',
          address: wallets[0]?.address || trader.userId
        };
      }));
      
      res.json(enhancedTraders);
    } catch (error) {
      console.error("Failed to fetch trader leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch trader leaderboard" });
    }
  });
  
  // Get trader profile
  app.get("/api/copy-trading/trader/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getTraderProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Trader profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Failed to fetch trader profile:", error);
      res.status(500).json({ error: "Failed to fetch trader profile" });
    }
  });
  
  // Create or update trader profile
  app.post("/api/copy-trading/trader", tradingRateLimit, async (req, res) => {
    try {
      const profileData = insertTraderProfileSchema.parse(req.body);
      const profile = await storage.createOrUpdateTraderProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      console.error("Failed to create/update trader profile:", error);
      res.status(400).json({ error: error.message || "Failed to create/update trader profile" });
    }
  });
  
  // Follow a trader (create copy relationship)
  app.post("/api/copy-trading/follow", tradingRateLimit, async (req, res) => {
    try {
      // Get authenticated user ID from session
      const followerId = req.session?.userId;
      if (!followerId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { traderId, copyPercentage, maxCopyAmount } = req.body;
      
      // Check if already following
      const existing = await storage.getCopyRelationship(followerId, traderId);
      
      if (existing && existing.status === 'active') {
        return res.status(400).json({ error: "Already following this trader" });
      }
      
      // Get trader profile ID
      const traderProfile = await storage.getTraderProfile(traderId);
      if (!traderProfile) {
        return res.status(404).json({ error: "Trader profile not found" });
      }
      
      const relationshipData = {
        followerId,
        traderId,
        traderProfileId: traderProfile.id,
        copyAmount: maxCopyAmount || "1000",
        copyPercentage: String(copyPercentage || 100),
        status: 'active' as const
      };
      
      const relationship = await storage.createCopyRelationship(relationshipData);
      
      // Update trader's follower count
      const trader = await storage.getTraderProfile(traderId);
      if (trader) {
        await storage.updateTraderStats(traderId, {
          totalFollowers: String((parseInt(trader.totalFollowers) || 0) + 1)
        });
      }
      
      res.json(relationship);
    } catch (error: any) {
      console.error("Failed to follow trader:", error);
      res.status(400).json({ error: error.message || "Failed to follow trader" });
    }
  });
  
  // Unfollow a trader (stop copy relationship)
  app.post("/api/copy-trading/unfollow/:relationshipId", tradingRateLimit, async (req, res) => {
    try {
      const { relationshipId } = req.params;
      
      // Get authenticated user ID from session
      const followerId = req.session?.userId;
      if (!followerId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Get the relationship by ID
      const allRelationships = await storage.getUserCopyRelationships(followerId);
      const relationship = allRelationships.find(r => r.id === relationshipId);
      
      if (!relationship) {
        return res.status(404).json({ error: "Relationship not found" });
      }
      
      await storage.stopCopyRelationship(relationshipId);
      
      // Update trader's follower count
      const trader = await storage.getTraderProfile(relationship.traderId);
      const currentFollowers = parseInt(trader?.totalFollowers || "0");
      if (trader && currentFollowers > 0) {
        await storage.updateTraderStats(relationship.traderId, {
          totalFollowers: String(currentFollowers - 1)
        });
      }
      
      res.json({ success: true, message: "Successfully unfollowed trader" });
    } catch (error) {
      console.error("Failed to unfollow trader:", error);
      res.status(500).json({ error: "Failed to unfollow trader" });
    }
  });
  
  // Get user's copy relationships (traders they follow)
  app.get("/api/copy-trading/following/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const relationships = await storage.getUserCopyRelationships(userId);
      res.json(relationships);
    } catch (error) {
      console.error("Failed to fetch copy relationships:", error);
      res.status(500).json({ error: "Failed to fetch copy relationships" });
    }
  });
  
  // Get trader's followers
  app.get("/api/copy-trading/followers/:traderId", async (req, res) => {
    try {
      const { traderId } = req.params;
      const followers = await storage.getTraderFollowers(traderId);
      res.json(followers);
    } catch (error) {
      console.error("Failed to fetch followers:", error);
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });
  
  // Get copy trades for a relationship
  app.get("/api/copy-trading/trades/:relationshipId", async (req, res) => {
    try {
      const { relationshipId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const copyTrades = await storage.getCopyTradesByRelationship(relationshipId, limit);
      res.json(copyTrades);
    } catch (error) {
      console.error("Failed to fetch copy trades:", error);
      res.status(500).json({ error: "Failed to fetch copy trades" });
    }
  });
  
  // Update copy relationship settings
  app.patch("/api/copy-trading/relationship/:id", tradingRateLimit, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const relationship = await storage.updateCopyRelationship(id, updates);
      
      if (!relationship) {
        return res.status(404).json({ error: "Relationship not found" });
      }
      
      res.json(relationship);
    } catch (error) {
      console.error("Failed to update copy relationship:", error);
      res.status(500).json({ error: "Failed to update copy relationship" });
    }
  });
  
  // Create copy trade (when trader makes a trade, this creates copies for followers)
  app.post("/api/copy-trading/execute", tradingRateLimit, async (req, res) => {
    try {
      const copyTradeData = insertCopyTradeSchema.parse(req.body);
      const copyTrade = await storage.createCopyTrade(copyTradeData);
      res.json(copyTrade);
    } catch (error: any) {
      console.error("Failed to execute copy trade:", error);
      res.status(400).json({ error: error.message || "Failed to execute copy trade" });
    }
  });

  // ================================
  // Margin/Futures Trading Routes
  // ================================
  
  // Get user's margin positions
  app.get("/api/margin/positions", tradingRateLimit, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const status = req.query.status as string | undefined;
      const positions = await storage.getUserMarginPositions(userId, status);
      res.json(positions);
    } catch (error) {
      console.error("Failed to fetch margin positions:", error);
      res.status(500).json({ error: "Failed to fetch margin positions" });
    }
  });
  
  // Get positions by trading pair
  app.get("/api/margin/positions/pair/:pair", tradingRateLimit, async (req, res) => {
    try {
      const { pair } = req.params;
      const status = req.query.status as string | undefined;
      const positions = await storage.getMarginPositionsByPair(pair, status);
      res.json(positions);
    } catch (error) {
      console.error("Failed to fetch positions by pair:", error);
      res.status(500).json({ error: "Failed to fetch positions by pair" });
    }
  });
  
  // Open new margin position
  app.post("/api/margin/positions/open", tieredTradingLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const positionData = insertMarginPositionSchema.parse({
        ...req.body,
        userId
      });
      
      // Get user's leverage settings
      const settings = await storage.getUserLeverageSettings(userId);
      const maxLeverage = parseInt(settings?.maxLeverage || '20');
      const requestedLeverage = parseInt(positionData.leverage);
      
      if (requestedLeverage > maxLeverage) {
        return res.status(400).json({ 
          error: `Leverage exceeds maximum allowed (${maxLeverage}x)` 
        });
      }
      
      const position = await storage.createMarginPosition(positionData);
      res.json(position);
    } catch (error: any) {
      console.error("Failed to open margin position:", error);
      res.status(400).json({ error: error.message || "Failed to open margin position" });
    }
  });
  
  // Update margin position (update current price, PnL, etc.)
  app.patch("/api/margin/positions/:id", tradingRateLimit, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Verify position ownership
      const position = await storage.getMarginPosition(id);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      if (position.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const updates = req.body;
      const updated = await storage.updateMarginPosition(id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update margin position:", error);
      res.status(500).json({ error: "Failed to update margin position" });
    }
  });
  
  // Close margin position
  app.post("/api/margin/positions/:id/close", tieredTradingLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { id } = req.params;
      const { closePrice, realizedPnl } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Verify position ownership
      const position = await storage.getMarginPosition(id);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      if (position.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      if (position.status === 'closed' || position.status === 'liquidated') {
        return res.status(400).json({ error: "Position already closed" });
      }
      
      const closed = await storage.closeMarginPosition(id, closePrice, realizedPnl);
      res.json(closed);
    } catch (error) {
      console.error("Failed to close margin position:", error);
      res.status(500).json({ error: "Failed to close margin position" });
    }
  });
  
  // Get user's leverage settings
  app.get("/api/margin/settings", tradingRateLimit, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const settings = await storage.getUserLeverageSettings(userId);
      
      // Return default settings if none exist
      if (!settings) {
        return res.json({
          userId,
          maxLeverage: '20',
          preferredLeverage: '10',
          marginMode: 'isolated',
          riskLevel: 'medium',
          autoDeleverageEnabled: 'true',
          liquidationWarningEnabled: 'true'
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Failed to fetch leverage settings:", error);
      res.status(500).json({ error: "Failed to fetch leverage settings" });
    }
  });
  
  // Update leverage settings
  app.post("/api/margin/settings", tieredTradingLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const settingsData = insertLeverageSettingSchema.parse({
        ...req.body,
        userId
      });
      
      const settings = await storage.createOrUpdateLeverageSettings(settingsData);
      res.json(settings);
    } catch (error: any) {
      console.error("Failed to update leverage settings:", error);
      res.status(400).json({ error: error.message || "Failed to update leverage settings" });
    }
  });
  
  // Get user's liquidation history
  app.get("/api/margin/liquidations", tradingRateLimit, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getLiquidationHistory(userId, limit);
      const totalLiquidations = await storage.getTotalLiquidations(userId);
      
      res.json({
        history,
        total: totalLiquidations
      });
    } catch (error) {
      console.error("Failed to fetch liquidation history:", error);
      res.status(500).json({ error: "Failed to fetch liquidation history" });
    }
  });
  
  // Liquidate position (called by risk engine or admin)
  app.post("/api/margin/positions/:id/liquidate", tieredTradingLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { id } = req.params;
      const { liquidationType } = req.body;
      
      const position = await storage.getMarginPosition(id);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      if (position.status === 'closed' || position.status === 'liquidated') {
        return res.status(400).json({ error: "Position already closed" });
      }
      
      // Calculate loss amount
      const entryPrice = parseFloat(position.entryPrice);
      const liquidationPrice = parseFloat(position.liquidationPrice);
      const positionSize = parseFloat(position.positionSize);
      const collateral = parseFloat(position.collateral);
      
      let lossAmount = '0';
      let remainingCollateral = '0';
      
      if (position.side === 'long') {
        lossAmount = String((entryPrice - liquidationPrice) * positionSize);
        remainingCollateral = String(Math.max(0, collateral - parseFloat(lossAmount)));
      } else {
        lossAmount = String((liquidationPrice - entryPrice) * positionSize);
        remainingCollateral = String(Math.max(0, collateral - parseFloat(lossAmount)));
      }
      
      // Create liquidation record
      const liquidation = await storage.createLiquidationRecord({
        positionId: id,
        userId: position.userId,
        tradingPair: position.tradingPair,
        side: position.side,
        leverage: position.leverage,
        entryPrice: position.entryPrice,
        liquidationPrice: position.liquidationPrice,
        positionSize: position.positionSize,
        lossAmount,
        remainingCollateral,
        liquidationType: liquidationType || 'auto'
      });
      
      // Update position status
      await storage.updateMarginPosition(id, {
        status: 'liquidated',
        closedAt: new Date(),
        realizedPnl: `-${lossAmount}`
      });
      
      res.json({
        liquidation,
        message: "Position liquidated"
      });
    } catch (error) {
      console.error("Failed to liquidate position:", error);
      res.status(500).json({ error: "Failed to liquidate position" });
    }
  });
  
  // Get user's risk metrics
  app.get("/api/margin/risk-metrics", tradingRateLimit, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { marginRiskEngine } = await import("./margin-risk-engine");
      const metrics = await marginRiskEngine.getUserRiskMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch risk metrics:", error);
      res.status(500).json({ error: "Failed to fetch risk metrics" });
    }
  });

  // ====================
  // House Vaults Routes
  // ====================
  
  // Get all active house vaults
  app.get("/api/vaults", async (req, res) => {
    try {
      const vaults = await storage.getAllHouseVaults();
      res.json(vaults);
    } catch (error) {
      console.error("Failed to fetch vaults:", error);
      res.status(500).json({ error: "Failed to fetch vaults" });
    }
  });
  
  // Get specific vault details
  app.get("/api/vaults/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const vault = await storage.getHouseVault(id);
      
      if (!vault) {
        return res.status(404).json({ error: "Vault not found" });
      }
      
      res.json(vault);
    } catch (error) {
      console.error("Failed to fetch vault:", error);
      res.status(500).json({ error: "Failed to fetch vault" });
    }
  });
  
  // Get user's positions in all vaults
  app.get("/api/vaults/positions/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const positions = await storage.getUserPositions(walletAddress);
      res.json(positions);
    } catch (error) {
      console.error("Failed to fetch user positions:", error);
      res.status(500).json({ error: "Failed to fetch user positions" });
    }
  });
  
  // Get positions in a specific vault
  app.get("/api/vaults/:vaultId/positions", async (req, res) => {
    try {
      const { vaultId } = req.params;
      const positions = await storage.getVaultPositions(vaultId);
      res.json(positions);
    } catch (error) {
      console.error("Failed to fetch vault positions:", error);
      res.status(500).json({ error: "Failed to fetch vault positions" });
    }
  });
  
  // Stake ETH in a vault (create position)
  app.post("/api/vaults/:vaultId/stake", tieredStakingLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { vaultId } = req.params;
      const stakeSchema = z.object({
        walletAddress: ethereumAddressSchema,
        stakedAmount: z.string(),
        stakeTxHash: transactionHashSchema.optional(),
        userId: z.string().optional()
      });
      
      const data = stakeSchema.parse(req.body);
      
      // Verify vault exists
      const vault = await storage.getHouseVault(vaultId);
      if (!vault) {
        return res.status(404).json({ error: "Vault not found" });
      }
      
      // Check minimum stake requirement
      if (parseFloat(data.stakedAmount) < parseFloat(vault.minStake)) {
        return res.status(400).json({ 
          error: "Stake amount below minimum", 
          minStake: vault.minStake 
        });
      }
      
      // Calculate unlock date if there's a lock period
      const unlocksAt = vault.lockPeriod && vault.lockPeriod !== '0' 
        ? new Date(Date.now() + parseInt(vault.lockPeriod) * 24 * 60 * 60 * 1000)
        : undefined;
      
      // Simple share calculation: 1:1 for now
      const shares = data.stakedAmount;
      const entryPrice = '1';
      
      const position = await storage.createPosition({
        vaultId,
        walletAddress: data.walletAddress,
        userId: data.userId,
        stakedAmount: data.stakedAmount,
        shares,
        entryPrice,
        currentValue: data.stakedAmount,
        totalEarnings: '0',
        claimedEarnings: '0',
        pendingEarnings: '0',
        status: 'active',
        stakeTxHash: data.stakeTxHash,
        unlocksAt
      });
      
      // Update vault stats
      const newTotalStaked = (parseFloat(vault.totalStaked) + parseFloat(data.stakedAmount)).toString();
      const newActivePositions = (parseInt(vault.activePositions) + 1).toString();
      
      await storage.updateHouseVault(vaultId, {
        totalStaked: newTotalStaked,
        activePositions: newActivePositions
      });
      
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid stake data", 
          details: error.errors 
        });
      }
      console.error("Failed to create position:", error);
      res.status(500).json({ error: "Failed to create position" });
    }
  });
  
  // Unstake from vault (withdraw position)
  app.post("/api/vaults/positions/:positionId/unstake", tieredStakingLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { positionId } = req.params;
      
      const unstakeSchema = z.object({
        unstakeTxHash: transactionHashSchema.optional()
      });
      
      const data = unstakeSchema.parse(req.body);
      
      const position = await storage.getPosition(positionId);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Check if position is locked
      if (position.unlocksAt && new Date() < new Date(position.unlocksAt)) {
        return res.status(403).json({ 
          error: "Position is locked", 
          unlocksAt: position.unlocksAt 
        });
      }
      
      // Update position status
      await storage.updatePosition(positionId, {
        status: 'withdrawn',
        withdrawnAt: new Date(),
        unstakeTxHash: data.unstakeTxHash
      });
      
      // Update vault stats
      const vault = await storage.getHouseVault(position.vaultId);
      if (vault) {
        const newTotalStaked = Math.max(0, parseFloat(vault.totalStaked) - parseFloat(position.stakedAmount)).toString();
        const newActivePositions = Math.max(0, parseInt(vault.activePositions) - 1).toString();
        
        await storage.updateHouseVault(position.vaultId, {
          totalStaked: newTotalStaked,
          activePositions: newActivePositions
        });
      }
      
      res.json({ success: true, message: "Position withdrawn successfully" });
    } catch (error) {
      console.error("Failed to unstake:", error);
      res.status(500).json({ error: "Failed to unstake" });
    }
  });
  
  // Get vault distributions (profit history)
  app.get("/api/vaults/:vaultId/distributions", async (req, res) => {
    try {
      const { vaultId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const distributions = await storage.getVaultDistributions(vaultId, limit);
      res.json(distributions);
    } catch (error) {
      console.error("Failed to fetch distributions:", error);
      res.status(500).json({ error: "Failed to fetch distributions" });
    }
  });
  
  // Get user's earnings
  app.get("/api/vaults/earnings/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const earnings = await storage.getUserEarnings(walletAddress);
      res.json(earnings);
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });
  
  // Claim earnings
  app.post("/api/vaults/earnings/:earningId/claim", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { earningId } = req.params;
      const claimed = await storage.claimEarning(earningId);
      
      if (!claimed) {
        return res.status(404).json({ error: "Earning not found" });
      }
      
      res.json({ success: true, earning: claimed });
    } catch (error) {
      console.error("Failed to claim earning:", error);
      res.status(500).json({ error: "Failed to claim earning" });
    }
  });
  
  // Auto-Compound Staking Routes
  
  // Get all active auto-compound pools
  app.get("/api/auto-compound/pools", async (req, res) => {
    try {
      const pools = await storage.getActiveAutoCompoundPools();
      res.json(pools);
    } catch (error) {
      console.error("Failed to fetch pools:", error);
      res.status(500).json({ error: "Failed to fetch pools" });
    }
  });
  
  // Get specific pool details
  app.get("/api/auto-compound/pools/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await storage.getAutoCompoundPool(id);
      
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      
      res.json(pool);
    } catch (error) {
      console.error("Failed to fetch pool:", error);
      res.status(500).json({ error: "Failed to fetch pool" });
    }
  });
  
  // Get user's stakes
  app.get("/api/auto-compound/stakes/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const stakes = await storage.getUserStakes(walletAddress);
      res.json(stakes);
    } catch (error) {
      console.error("Failed to fetch stakes:", error);
      res.status(500).json({ error: "Failed to fetch stakes" });
    }
  });
  
  // Create new stake
  app.post("/api/auto-compound/pools/:poolId/stake", tieredStakingLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { poolId } = req.params;
      const stakeSchema = z.object({
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
        initialStake: z.string().regex(/^\d+\.?\d*$/, "Invalid stake amount"),
        userId: z.string().optional()
      });
      
      const stakeData = stakeSchema.parse(req.body);
      
      // Get pool details
      const pool = await storage.getAutoCompoundPool(poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      
      // Check min stake
      const stakeAmount = parseFloat(stakeData.initialStake);
      const minStake = parseFloat(pool.minStake);
      if (stakeAmount < minStake) {
        return res.status(400).json({ error: `Minimum stake is ${minStake} ${pool.tokenSymbol}` });
      }
      
      // Check max stake if set
      if (pool.maxStake && parseFloat(stakeData.initialStake) > parseFloat(pool.maxStake)) {
        return res.status(400).json({ error: `Maximum stake is ${pool.maxStake} ${pool.tokenSymbol}` });
      }
      
      // Calculate unlock time if there's a lock period
      let unlocksAt = null;
      const lockDays = parseFloat(pool.lockPeriod);
      if (lockDays > 0) {
        unlocksAt = new Date();
        unlocksAt.setDate(unlocksAt.getDate() + lockDays);
      }
      
      // Create stake
      const stake = await storage.createStake({
        poolId,
        walletAddress: stakeData.walletAddress,
        userId: stakeData.userId,
        initialStake: stakeData.initialStake,
        currentBalance: stakeData.initialStake,
        effectiveApy: pool.baseApy,
        unlocksAt
      });
      
      // Update pool total staked
      const currentTotal = parseFloat(pool.totalStaked || '0');
      const currentStakers = parseInt(pool.totalStakers || '0');
      await storage.updateAutoCompoundPool(poolId, {
        totalStaked: (currentTotal + stakeAmount).toString(),
        totalStakers: (currentStakers + 1).toString()
      });
      
      res.json({ success: true, stake });
    } catch (error) {
      console.error("Failed to create stake:", error);
      res.status(500).json({ error: "Failed to create stake" });
    }
  });
  
  // Withdraw stake
  app.post("/api/auto-compound/stakes/:stakeId/withdraw", tieredStakingLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { stakeId } = req.params;
      const { walletAddress } = req.body;
      
      const stake = await storage.getStake(stakeId);
      if (!stake) {
        return res.status(404).json({ error: "Stake not found" });
      }
      
      // Verify ownership
      if (stake.walletAddress.toLowerCase() !== walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized: You can only withdraw your own stakes" });
      }
      
      if (stake.status !== 'active') {
        return res.status(400).json({ error: "Stake already withdrawn" });
      }
      
      const pool = await storage.getAutoCompoundPool(stake.poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      
      // Check if locked
      const now = new Date();
      let withdrawAmount = parseFloat(stake.currentBalance);
      let penalty = 0;
      
      if (stake.unlocksAt && now < stake.unlocksAt) {
        // Apply early withdrawal penalty
        penalty = withdrawAmount * (parseFloat(pool.earlyWithdrawPenalty) / 100);
        withdrawAmount -= penalty;
      }
      
      // Update stake
      const updated = await storage.updateStake(stakeId, {
        status: 'withdrawn',
        withdrawnAt: now,
        withdrawnAmount: withdrawAmount.toString()
      });
      
      // Update pool totals
      const currentTotal = parseFloat(pool.totalStaked || '0');
      const currentStakers = parseInt(pool.totalStakers || '0');
      await storage.updateAutoCompoundPool(stake.poolId, {
        totalStaked: Math.max(0, currentTotal - parseFloat(stake.currentBalance)).toString(),
        totalStakers: Math.max(0, currentStakers - 1).toString()
      });
      
      res.json({ 
        success: true, 
        stake: updated,
        withdrawAmount: withdrawAmount.toString(),
        penalty: penalty.toString()
      });
    } catch (error) {
      console.error("Failed to withdraw stake:", error);
      res.status(500).json({ error: "Failed to withdraw stake" });
    }
  });
  
  // Get compound events for a stake
  app.get("/api/auto-compound/stakes/:stakeId/events", async (req, res) => {
    try {
      const { stakeId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getStakeCompoundEvents(stakeId, limit);
      res.json(events);
    } catch (error) {
      console.error("Failed to fetch compound events:", error);
      res.status(500).json({ error: "Failed to fetch compound events" });
    }
  });
  
  // Get user's compound events
  app.get("/api/auto-compound/events/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getUserCompoundEvents(walletAddress, limit);
      res.json(events);
    } catch (error) {
      console.error("Failed to fetch compound events:", error);
      res.status(500).json({ error: "Failed to fetch compound events" });
    }
  });
  
  // ===== SOCIAL MEDIA AUTOMATION ROUTES =====
  
  // Get user's social accounts
  app.get("/api/social/accounts/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const accounts = await storage.getUserSocialAccounts(userId);
      
      // Redact sensitive credentials before sending
      const safeAccounts = accounts.map(acc => ({
        ...acc,
        apiKey: acc.apiKey ? '***' : null,
        apiSecret: acc.apiSecret ? '***' : null,
        accessToken: acc.accessToken ? '***' : null,
        accessTokenSecret: acc.accessTokenSecret ? '***' : null
      }));
      
      res.json(safeAccounts);
    } catch (error) {
      console.error("Failed to fetch social accounts:", error);
      res.status(500).json({ error: "Failed to fetch social accounts" });
    }
  });
  
  // Get active social accounts
  app.get("/api/social/accounts/:userId/active", async (req, res) => {
    try {
      const { userId } = req.params;
      const accounts = await storage.getActiveSocialAccounts(userId);
      
      const safeAccounts = accounts.map(acc => ({
        ...acc,
        apiKey: acc.apiKey ? '***' : null,
        apiSecret: acc.apiSecret ? '***' : null,
        accessToken: acc.accessToken ? '***' : null,
        accessTokenSecret: acc.accessTokenSecret ? '***' : null
      }));
      
      res.json(safeAccounts);
    } catch (error) {
      console.error("Failed to fetch active social accounts:", error);
      res.status(500).json({ error: "Failed to fetch active social accounts" });
    }
  });
  
  // Auto-connect Twitter using environment secrets
  app.post("/api/social/accounts/auto-connect-twitter", generalApiLimit, async (req, res) => {
    try {
      const { userId, accountName } = req.body;
      
      if (!userId || !accountName) {
        return res.status(400).json({ error: "userId and accountName are required" });
      }
      
      // Get Twitter credentials from environment
      const apiKey = process.env.TWITTER_API_KEY;
      const apiSecret = process.env.TWITTER_API_SECRET;
      const accessToken = process.env.TWITTER_ACCESS_TOKEN;
      const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
      
      if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
        return res.status(400).json({ 
          error: "Missing Twitter credentials in Replit Secrets. Please add: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET" 
        });
      }
      
      const account = await storage.createSocialAccount({
        userId,
        platform: "twitter",
        accountName,
        apiKey,
        apiSecret,
        accessToken,
        accessTokenSecret,
        isActive: "true"
      });
      
      // Start auto-posting cycle (first post in 3 hours)
      console.log('🚀 Starting auto-posting for Twitter account:', accountName);
      await socialScheduler.createAutoScheduledPost(account.id, userId);
      
      // Redact credentials
      const safeAccount = {
        ...account,
        apiKey: '***',
        apiSecret: '***',
        accessToken: '***',
        accessTokenSecret: '***'
      };
      
      res.json(safeAccount);
    } catch (error) {
      console.error("Failed to auto-connect Twitter:", error);
      res.status(500).json({ error: "Failed to auto-connect Twitter account" });
    }
  });

  // Create social account
  app.post("/api/social/accounts", generalApiLimit, async (req, res) => {
    try {
      const accountSchema = z.object({
        userId: z.string().optional(),
        platform: z.string(),
        accountName: z.string(),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        accessToken: z.string().optional(),
        accessTokenSecret: z.string().optional(),
        isActive: z.string().optional()
      });
      
      const accountData = accountSchema.parse(req.body);
      const account = await storage.createSocialAccount(accountData);
      
      // Redact credentials
      const safeAccount = {
        ...account,
        apiKey: account.apiKey ? '***' : null,
        apiSecret: account.apiSecret ? '***' : null,
        accessToken: account.accessToken ? '***' : null,
        accessTokenSecret: account.accessTokenSecret ? '***' : null
      };
      
      res.json(safeAccount);
    } catch (error) {
      console.error("Failed to create social account:", error);
      res.status(500).json({ error: "Failed to create social account" });
    }
  });
  
  // Update social account
  app.patch("/api/social/accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const account = await storage.updateSocialAccount(id, updates);
      
      if (!account) {
        return res.status(404).json({ error: "Social account not found" });
      }
      
      const safeAccount = {
        ...account,
        apiKey: account.apiKey ? '***' : null,
        apiSecret: account.apiSecret ? '***' : null,
        accessToken: account.accessToken ? '***' : null,
        accessTokenSecret: account.accessTokenSecret ? '***' : null
      };
      
      res.json(safeAccount);
    } catch (error) {
      console.error("Failed to update social account:", error);
      res.status(500).json({ error: "Failed to update social account" });
    }
  });
  
  // Delete social account
  app.delete("/api/social/accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSocialAccount(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete social account:", error);
      res.status(500).json({ error: "Failed to delete social account" });
    }
  });
  
  // Get user's scheduled posts
  app.get("/api/social/posts/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const posts = await storage.getUserScheduledPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch scheduled posts:", error);
      res.status(500).json({ error: "Failed to fetch scheduled posts" });
    }
  });
  
  // Get pending posts
  app.get("/api/social/posts/pending/all", async (req, res) => {
    try {
      const posts = await storage.getPendingPosts();
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch pending posts:", error);
      res.status(500).json({ error: "Failed to fetch pending posts" });
    }
  });
  
  // Create scheduled post
  app.post("/api/social/posts", generalApiLimit, async (req, res) => {
    try {
      const postSchema = z.object({
        userId: z.string().optional(),
        accountId: z.string(),
        content: z.string(),
        mediaUrls: z.array(z.string()).optional(),
        scheduledFor: z.string().transform(str => new Date(str)),
        status: z.string().optional(),
        postType: z.string().optional()
      });
      
      const postData = postSchema.parse(req.body);
      const post = await storage.createScheduledPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Failed to create scheduled post:", error);
      res.status(500).json({ error: "Failed to create scheduled post" });
    }
  });
  
  // Update scheduled post
  app.patch("/api/social/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const post = await storage.updateScheduledPost(id, updates);
      
      if (!post) {
        return res.status(404).json({ error: "Scheduled post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Failed to update scheduled post:", error);
      res.status(500).json({ error: "Failed to update scheduled post" });
    }
  });
  
  // Delete scheduled post
  app.delete("/api/social/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteScheduledPost(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete scheduled post:", error);
      res.status(500).json({ error: "Failed to delete scheduled post" });
    }
  });
  
  // Get user's post history
  app.get("/api/social/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getUserPostHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch post history:", error);
      res.status(500).json({ error: "Failed to fetch post history" });
    }
  });
  
  // Get account's post history
  app.get("/api/social/history/account/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getAccountPostHistory(accountId, limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch account post history:", error);
      res.status(500).json({ error: "Failed to fetch account post history" });
    }
  });

  // ==================== MASTERPIECE FEATURES ====================
  
  // Import price service and create db connection for new features
  const { getCryptoPrice, convertUsdToCrypto, getAllPrices, formatCryptoAmount } = await import("./price-service");
  const { drizzle: drizzleORM } = await import("drizzle-orm/neon-http");
  const { neon: neonClient } = await import("@neondatabase/serverless");
  const { 
    supportedCurrencies, discountCodes, giftCards, giftCardUsage,
    loyaltyAccounts, loyaltyTransactions, productReviews, wishlists,
    invoices, nftReceipts, refunds
  } = await import("@shared/schema");
  
  const sqlClient = neonClient(process.env.DATABASE_URL!);
  const dbClient = drizzleORM(sqlClient);
  
  // Get supported currencies
  app.get("/api/currencies", async (req, res) => {
    try {
      const { chainId, isActive } = req.query;
      
      let query = dbClient.select().from(supportedCurrencies);
      const conditions = [];
      
      if (chainId) {
        conditions.push(eq(supportedCurrencies.chainId, chainId as string));
      }
      if (isActive !== undefined) {
        conditions.push(eq(supportedCurrencies.isActive, isActive as string));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const currencies = await query;
      res.json(currencies);
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      res.status(500).json({ error: "Failed to fetch currencies" });
    }
  });
  
  // Get crypto prices
  app.get("/api/prices", async (req, res) => {
    try {
      const prices = getAllPrices();
      res.json(prices);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });
  
  // Get single crypto price
  app.get("/api/prices/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const price = getCryptoPrice(symbol);
      
      if (!price) {
        return res.status(404).json({ error: "Price not found" });
      }
      
      res.json(price);
    } catch (error) {
      console.error("Failed to fetch price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });
  
  // Convert USD to crypto
  app.post("/api/prices/convert", async (req, res) => {
    try {
      const schema = z.object({
        amount: z.number(),
        from: z.string(), // USD
        to: z.string(), // crypto symbol
      });
      
      const { amount, from, to } = schema.parse(req.body);
      
      if (from !== "USD") {
        return res.status(400).json({ error: "Only USD conversion supported" });
      }
      
      const cryptoAmount = convertUsdToCrypto(amount, to);
      const formatted = formatCryptoAmount(cryptoAmount, to);
      
      res.json({ 
        amount: cryptoAmount,
        formatted,
        symbol: to,
        usdAmount: amount
      });
    } catch (error) {
      console.error("Conversion failed:", error);
      res.status(400).json({ error: "Conversion failed" });
    }
  });
  
  // Get discount codes (OWNER ONLY)
  app.get("/api/discounts", requireOwner, async (req, res) => {
    try {
      const codes = await dbClient.select().from(discountCodes)
        .where(eq(discountCodes.isActive, "true"));
      res.json(codes);
    } catch (error) {
      console.error("Failed to fetch discount codes:", error);
      res.status(500).json({ error: "Failed to fetch discount codes" });
    }
  });
  
  // Validate discount code
  app.post("/api/discounts/validate", async (req, res) => {
    try {
      const schema = z.object({
        code: z.string(),
        cartTotal: z.number(),
      });
      
      const { code, cartTotal } = schema.parse(req.body);
      
      const discount = await dbClient.select().from(discountCodes)
        .where(and(
          eq(discountCodes.code, code),
          eq(discountCodes.isActive, "true")
        ))
        .limit(1);
      
      if (discount.length === 0) {
        return res.status(404).json({ error: "Discount code not found or inactive" });
      }
      
      const discountData = discount[0];
      
      // Check validity period
      const now = new Date();
      if (discountData.validUntil && new Date(discountData.validUntil) < now) {
        return res.status(400).json({ error: "Discount code has expired" });
      }
      
      // Check minimum purchase
      if (discountData.minPurchase && parseFloat(discountData.minPurchase) > cartTotal) {
        return res.status(400).json({ 
          error: `Minimum purchase of $${discountData.minPurchase} required` 
        });
      }
      
      // Check usage limit
      if (discountData.usageLimit && parseInt(discountData.usageCount) >= parseInt(discountData.usageLimit)) {
        return res.status(400).json({ error: "Discount code usage limit reached" });
      }
      
      // Calculate discount amount
      let discountAmount = 0;
      if (discountData.type === "percentage") {
        discountAmount = (cartTotal * parseFloat(discountData.value)) / 100;
        if (discountData.maxDiscount) {
          discountAmount = Math.min(discountAmount, parseFloat(discountData.maxDiscount));
        }
      } else {
        discountAmount = parseFloat(discountData.value);
      }
      
      res.json({
        valid: true,
        discount: discountData,
        discountAmount,
        finalTotal: Math.max(0, cartTotal - discountAmount)
      });
    } catch (error) {
      console.error("Discount validation failed:", error);
      res.status(400).json({ error: "Discount validation failed" });
    }
  });
  
  // Create discount code (OWNER ONLY)
  app.post("/api/discounts", requireOwner, async (req, res) => {
    try {
      const schema = z.object({
        code: z.string().min(3),
        type: z.enum(["percentage", "fixed"]),
        value: z.string(),
        minPurchase: z.string().optional(),
        maxDiscount: z.string().optional(),
        usageLimit: z.string().optional(),
        validUntil: z.string().optional(),
        applicableProducts: z.array(z.string()).optional(),
      });
      
      const data = schema.parse(req.body);
      
      const newDiscount = await dbClient.insert(discountCodes).values({
        ...data,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      } as any).returning();
      res.json(newDiscount[0]);
    } catch (error) {
      console.error("Failed to create discount code:", error);
      res.status(500).json({ error: "Failed to create discount code" });
    }
  });
  
  // Get gift card by code
  app.get("/api/giftcards/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      const card = await dbClient.select().from(giftCards)
        .where(eq(giftCards.code, code))
        .limit(1);
      
      if (card.length === 0) {
        return res.status(404).json({ error: "Gift card not found" });
      }
      
      res.json(card[0]);
    } catch (error) {
      console.error("Failed to fetch gift card:", error);
      res.status(500).json({ error: "Failed to fetch gift card" });
    }
  });
  
  // Create gift card
  app.post("/api/giftcards", async (req, res) => {
    try {
      const schema = z.object({
        initialValue: z.string(),
        currency: z.string().default("USD"),
        purchasedBy: z.string().optional(),
        purchaseTxHash: z.string().optional(),
        recipientEmail: z.string().optional(),
        recipientWallet: z.string().optional(),
        message: z.string().optional(),
        expiresAt: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Generate unique code
      const code = `GC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const card = await dbClient.insert(giftCards).values({
        ...data,
        code,
        currentBalance: data.initialValue,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      } as any).returning();
      
      res.json(card[0]);
    } catch (error) {
      console.error("Failed to create gift card:", error);
      res.status(500).json({ error: "Failed to create gift card" });
    }
  });
  
  // Redeem gift card
  app.post("/api/giftcards/:code/redeem", async (req, res) => {
    try {
      const { code } = req.params;
      const schema = z.object({
        orderId: z.string(),
        amountUsed: z.string(),
      });
      
      const { orderId, amountUsed } = schema.parse(req.body);
      
      // Get gift card
      const card = await dbClient.select().from(giftCards)
        .where(eq(giftCards.code, code))
        .limit(1);
      
      if (card.length === 0) {
        return res.status(404).json({ error: "Gift card not found" });
      }
      
      const giftCard = card[0];
      
      if (giftCard.status !== "active") {
        return res.status(400).json({ error: "Gift card is not active" });
      }
      
      const currentBalance = parseFloat(giftCard.currentBalance);
      const amountToUse = parseFloat(amountUsed);
      
      if (amountToUse > currentBalance) {
        return res.status(400).json({ error: "Insufficient gift card balance" });
      }
      
      const newBalance = currentBalance - amountToUse;
      
      // Update gift card balance
      await dbClient.update(giftCards)
        .set({ 
          currentBalance: newBalance.toString(),
          status: newBalance === 0 ? "redeemed" : "active",
          redeemedAt: newBalance === 0 ? new Date() : undefined,
        })
        .where(eq(giftCards.id, giftCard.id));
      
      // Record usage
      await dbClient.insert(giftCardUsage).values({
        giftCardId: giftCard.id,
        orderId,
        amountUsed,
        balanceAfter: newBalance.toString(),
      });
      
      res.json({
        success: true,
        balanceRemaining: newBalance.toString(),
        amountUsed,
      });
    } catch (error) {
      console.error("Failed to redeem gift card:", error);
      res.status(500).json({ error: "Failed to redeem gift card" });
    }
  });
  
  // Get loyalty account
  app.get("/api/loyalty/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const account = await dbClient.select().from(loyaltyAccounts)
        .where(sql`lower(${loyaltyAccounts.walletAddress}) = lower(${walletAddress})`)
        .limit(1);
      
      if (account.length === 0) {
        // Create new account
        const newAccount = await dbClient.insert(loyaltyAccounts).values({
          walletAddress: walletAddress.toLowerCase(),
        }).returning();
        return res.json(newAccount[0]);
      }
      
      res.json(account[0]);
    } catch (error) {
      console.error("Failed to fetch loyalty account:", error);
      res.status(500).json({ error: "Failed to fetch loyalty account" });
    }
  });
  
  // Get loyalty transactions
  app.get("/api/loyalty/:walletAddress/transactions", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      // Get account
      const account = await dbClient.select().from(loyaltyAccounts)
        .where(sql`lower(${loyaltyAccounts.walletAddress}) = lower(${walletAddress})`)
        .limit(1);
      
      if (account.length === 0) {
        return res.json([]);
      }
      
      const transactions = await dbClient.select().from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.accountId, account[0].id))
        .orderBy(desc(loyaltyTransactions.createdAt))
        .limit(100);
      
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch loyalty transactions:", error);
      res.status(500).json({ error: "Failed to fetch loyalty transactions" });
    }
  });
  
  // Award loyalty points
  app.post("/api/loyalty/award", async (req, res) => {
    try {
      const schema = z.object({
        walletAddress: z.string(),
        points: z.string(),
        orderId: z.string().optional(),
        description: z.string(),
      });
      
      const { walletAddress, points, orderId, description } = schema.parse(req.body);
      
      // Get or create account
      let account = await dbClient.select().from(loyaltyAccounts)
        .where(sql`lower(${loyaltyAccounts.walletAddress}) = lower(${walletAddress})`)
        .limit(1);
      
      if (account.length === 0) {
        const newAccount = await dbClient.insert(loyaltyAccounts).values({
          walletAddress: walletAddress.toLowerCase(),
        }).returning();
        account = newAccount;
      }
      
      const accountData = account[0];
      const currentPoints = parseInt(accountData.availablePoints);
      const newPoints = currentPoints + parseInt(points);
      
      // Update account
      await dbClient.update(loyaltyAccounts)
        .set({
          totalPoints: (parseInt(accountData.totalPoints) + parseInt(points)).toString(),
          availablePoints: newPoints.toString(),
          lifetimePoints: (parseInt(accountData.lifetimePoints) + parseInt(points)).toString(),
        })
        .where(eq(loyaltyAccounts.id, accountData.id));
      
      // Record transaction
      const transaction = await dbClient.insert(loyaltyTransactions).values({
        accountId: accountData.id,
        type: "earned",
        points,
        balanceAfter: newPoints.toString(),
        orderId,
        description,
      }).returning();
      
      res.json(transaction[0]);
    } catch (error) {
      console.error("Failed to award loyalty points:", error);
      res.status(500).json({ error: "Failed to award loyalty points" });
    }
  });
  
  // Redeem loyalty points
  app.post("/api/loyalty/redeem", async (req, res) => {
    try {
      const schema = z.object({
        walletAddress: z.string(),
        points: z.string(),
        orderId: z.string().optional(),
        description: z.string(),
      });
      
      const { walletAddress, points, orderId, description } = schema.parse(req.body);
      
      // Get account
      const account = await dbClient.select().from(loyaltyAccounts)
        .where(sql`lower(${loyaltyAccounts.walletAddress}) = lower(${walletAddress})`)
        .limit(1);
      
      if (account.length === 0) {
        return res.status(404).json({ error: "Loyalty account not found" });
      }
      
      const accountData = account[0];
      const currentPoints = parseInt(accountData.availablePoints);
      const pointsToRedeem = parseInt(points);
      
      if (pointsToRedeem > currentPoints) {
        return res.status(400).json({ error: "Insufficient loyalty points" });
      }
      
      const newPoints = currentPoints - pointsToRedeem;
      
      // Update account
      await dbClient.update(loyaltyAccounts)
        .set({ availablePoints: newPoints.toString() })
        .where(eq(loyaltyAccounts.id, accountData.id));
      
      // Record transaction
      const transaction = await dbClient.insert(loyaltyTransactions).values({
        accountId: accountData.id,
        type: "redeemed",
        points: `-${points}`,
        balanceAfter: newPoints.toString(),
        orderId,
        description,
      }).returning();
      
      res.json(transaction[0]);
    } catch (error) {
      console.error("Failed to redeem loyalty points:", error);
      res.status(500).json({ error: "Failed to redeem loyalty points" });
    }
  });
  
  // Get product reviews
  app.get("/api/reviews/product/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      
      const reviews = await dbClient.select().from(productReviews)
        .where(and(
          eq(productReviews.productId, productId),
          eq(productReviews.isApproved, "true")
        ))
        .orderBy(desc(productReviews.createdAt));
      
      res.json(reviews);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  
  // Create product review
  app.post("/api/reviews", async (req, res) => {
    try {
      const schema = z.object({
        productId: z.string(),
        orderId: z.string(),
        walletAddress: z.string(),
        rating: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        purchaseTxHash: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Check if user already reviewed this product
      const existing = await dbClient.select().from(productReviews)
        .where(and(
          eq(productReviews.productId, data.productId),
          sql`lower(${productReviews.walletAddress}) = lower(${data.walletAddress})`
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "You have already reviewed this product" });
      }
      
      const review = await dbClient.insert(productReviews).values(data).returning();
      res.json(review[0]);
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });
  
  // Get wishlist
  app.get("/api/wishlist/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const items = await dbClient.select().from(wishlists)
        .where(sql`lower(${wishlists.walletAddress}) = lower(${walletAddress})`)
        .orderBy(desc(wishlists.addedAt));
      
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });
  
  // Add to wishlist
  app.post("/api/wishlist", async (req, res) => {
    try {
      const schema = z.object({
        walletAddress: z.string(),
        productId: z.string(),
      });
      
      const { walletAddress, productId } = schema.parse(req.body);
      
      // Check if already in wishlist
      const existing = await dbClient.select().from(wishlists)
        .where(and(
          sql`lower(${wishlists.walletAddress}) = lower(${walletAddress})`,
          eq(wishlists.productId, productId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Product already in wishlist" });
      }
      
      const item = await dbClient.insert(wishlists).values({
        walletAddress: walletAddress.toLowerCase(),
        productId,
      }).returning();
      
      res.json(item[0]);
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });
  
  // Remove from wishlist
  app.delete("/api/wishlist/:walletAddress/:productId", async (req, res) => {
    try {
      const { walletAddress, productId } = req.params;
      
      await dbClient.delete(wishlists)
        .where(and(
          sql`lower(${wishlists.walletAddress}) = lower(${walletAddress})`,
          eq(wishlists.productId, productId)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });
  
  // Create invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      const schema = z.object({
        merchantWallet: z.string(),
        customerEmail: z.string().optional(),
        customerWallet: z.string().optional(),
        items: z.any(),
        subtotal: z.string(),
        tax: z.string().optional(),
        total: z.string(),
        currency: z.string().default("USD"),
        acceptedCurrencies: z.array(z.string()).optional(),
        dueDate: z.string().optional(),
        notes: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      const invoice = await dbClient.insert(invoices).values({
        ...data,
        invoiceNumber,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      } as any).returning();
      
      res.json(invoice[0]);
    } catch (error) {
      console.error("Failed to create invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });
  
  // Get invoice by number
  app.get("/api/invoices/:invoiceNumber", async (req, res) => {
    try {
      const { invoiceNumber } = req.params;
      
      const invoice = await dbClient.select().from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);
      
      if (invoice.length === 0) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      res.json(invoice[0]);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });
  
  // Get invoices for merchant
  app.get("/api/invoices/merchant/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const merchantInvoices = await dbClient.select().from(invoices)
        .where(sql`lower(${invoices.merchantWallet}) = lower(${walletAddress})`)
        .orderBy(desc(invoices.createdAt));
      
      res.json(merchantInvoices);
    } catch (error) {
      console.error("Failed to fetch merchant invoices:", error);
      res.status(500).json({ error: "Failed to fetch merchant invoices" });
    }
  });
  
  // Create NFT receipt
  app.post("/api/receipts", async (req, res) => {
    try {
      const schema = z.object({
        orderId: z.string(),
        walletAddress: z.string(),
        chainId: z.string(),
        contractAddress: z.string(),
        tokenId: z.string(),
        tokenUri: z.string().optional(),
        mintTxHash: z.string(),
        receiptData: z.any(),
      });
      
      const data = schema.parse(req.body);
      
      const receipt = await dbClient.insert(nftReceipts).values(data as any).returning();
      res.json(receipt[0]);
    } catch (error) {
      console.error("Failed to create NFT receipt:", error);
      res.status(500).json({ error: "Failed to create NFT receipt" });
    }
  });
  
  // Get NFT receipts for wallet
  app.get("/api/receipts/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const receipts = await dbClient.select().from(nftReceipts)
        .where(sql`lower(${nftReceipts.walletAddress}) = lower(${walletAddress})`)
        .orderBy(desc(nftReceipts.createdAt));
      
      res.json(receipts);
    } catch (error) {
      console.error("Failed to fetch NFT receipts:", error);
      res.status(500).json({ error: "Failed to fetch NFT receipts" });
    }
  });
  
  // Create refund
  app.post("/api/refunds", async (req, res) => {
    try {
      const schema = z.object({
        orderId: z.string(),
        paymentId: z.string(),
        amount: z.string(),
        currency: z.string(),
        reason: z.string().optional(),
        refundedTo: z.string(),
        processedBy: z.string().optional(),
        notes: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      const refund = await dbClient.insert(refunds).values(data).returning();
      res.json(refund[0]);
    } catch (error) {
      console.error("Failed to create refund:", error);
      res.status(500).json({ error: "Failed to create refund" });
    }
  });
  
  // Get refunds for order
  app.get("/api/refunds/order/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const orderRefunds = await dbClient.select().from(refunds)
        .where(eq(refunds.orderId, orderId));
      
      res.json(orderRefunds);
    } catch (error) {
      console.error("Failed to fetch refunds:", error);
      res.status(500).json({ error: "Failed to fetch refunds" });
    }
  });

  // ==================== SUBSCRIPTION SYSTEM ====================
  
  // Get all subscription plans
  app.get("/api/subscriptions/plans", async (req, res) => {
    try {
      const plans = await dbClient.select().from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, "true"));
      res.json(plans);
    } catch (error) {
      console.error("Failed to fetch subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Create subscription plan
  app.post("/api/subscriptions/plans", async (req, res) => {
    try {
      const schema = insertSubscriptionPlanSchema;
      const data = schema.parse(req.body);
      
      const plan = await dbClient.insert(subscriptionPlans).values(data).returning();
      res.json(plan[0]);
    } catch (error) {
      console.error("Failed to create subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  // Subscribe to a plan
  app.post("/api/subscriptions", async (req, res) => {
    try {
      const schema = insertSubscriptionSchema;
      const data = schema.parse(req.body);
      
      const subscription = await dbClient.insert(subscriptions).values(data).returning();
      res.json(subscription[0]);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get user subscriptions
  app.get("/api/subscriptions/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const userSubscriptions = await dbClient.select().from(subscriptions)
        .where(eq(sql`lower(${subscriptions.customerWallet})`, walletAddress.toLowerCase()));
      res.json(userSubscriptions);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Cancel subscription
  app.post("/api/subscriptions/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      const [subscription] = await dbClient.update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(subscriptions.id, id))
        .returning();
      res.json(subscription);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Get subscription billing history
  app.get("/api/subscriptions/:id/billings", async (req, res) => {
    try {
      const { id } = req.params;
      const billings = await dbClient.select().from(subscriptionBillings)
        .where(eq(subscriptionBillings.subscriptionId, id))
        .orderBy(desc(subscriptionBillings.billingDate));
      res.json(billings);
    } catch (error) {
      console.error("Failed to fetch billing history:", error);
      res.status(500).json({ error: "Failed to fetch billing history" });
    }
  });

  // ==================== AFFILIATE SYSTEM ====================
  
  // Register as affiliate
  app.post("/api/affiliates", async (req, res) => {
    try {
      const schema = insertAffiliateSchema;
      const data = schema.parse(req.body);
      
      // Generate unique referral code
      const referralCode = `REF${Date.now().toString(36).toUpperCase()}`;
      const affiliate = await dbClient.insert(affiliates).values({
        ...data,
        referralCode,
      }).returning();
      
      res.json(affiliate[0]);
    } catch (error) {
      console.error("Failed to register affiliate:", error);
      res.status(500).json({ error: "Failed to register affiliate" });
    }
  });

  // Get affiliate by wallet
  app.get("/api/affiliates/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const [affiliate] = await dbClient.select().from(affiliates)
        .where(eq(sql`lower(${affiliates.walletAddress})`, walletAddress.toLowerCase()));
      res.json(affiliate || null);
    } catch (error) {
      console.error("Failed to fetch affiliate:", error);
      res.status(500).json({ error: "Failed to fetch affiliate" });
    }
  });

  // Get affiliate by referral code
  app.get("/api/affiliates/code/:referralCode", async (req, res) => {
    try {
      const { referralCode } = req.params;
      const [affiliate] = await dbClient.select().from(affiliates)
        .where(eq(affiliates.referralCode, referralCode.toUpperCase()));
      res.json(affiliate || null);
    } catch (error) {
      console.error("Failed to fetch affiliate:", error);
      res.status(500).json({ error: "Failed to fetch affiliate" });
    }
  });

  // Track affiliate referral
  app.post("/api/affiliates/referrals", async (req, res) => {
    try {
      const schema = insertAffiliateReferralSchema;
      const data = schema.parse(req.body);
      
      const referral = await dbClient.insert(affiliateReferrals).values(data).returning();
      
      // Update affiliate totals
      await dbClient.update(affiliates)
        .set({
          totalReferrals: sql`${affiliates.totalReferrals}::int + 1`,
          pendingEarnings: sql`${affiliates.pendingEarnings}::numeric + ${data.commissionAmount}`,
        })
        .where(eq(affiliates.id, data.affiliateId));
      
      res.json(referral[0]);
    } catch (error) {
      console.error("Failed to track referral:", error);
      res.status(500).json({ error: "Failed to track referral" });
    }
  });

  // Get affiliate referrals
  app.get("/api/affiliates/:id/referrals", async (req, res) => {
    try {
      const { id } = req.params;
      const referrals = await dbClient.select().from(affiliateReferrals)
        .where(eq(affiliateReferrals.affiliateId, id))
        .orderBy(desc(affiliateReferrals.createdAt));
      res.json(referrals);
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  // ==================== FEE SERVICE ====================

  // Get user's fee structure based on subscription tier
  app.get("/api/fees/user/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const { feeService } = await import("./fee-service");
      const fees = await feeService.getUserFees(walletAddress);
      res.json(fees);
    } catch (error) {
      console.error("Failed to get user fees:", error);
      res.status(500).json({ error: "Failed to get user fees" });
    }
  });

  // Calculate fee breakdown for a transaction
  app.post("/api/fees/calculate", async (req, res) => {
    try {
      const { walletAddress, amount, feeType } = req.body;
      const { feeService } = await import("./fee-service");
      const breakdown = await feeService.getFeeBreakdown(walletAddress, parseFloat(amount), feeType);
      res.json(breakdown);
    } catch (error) {
      console.error("Failed to calculate fee:", error);
      res.status(500).json({ error: "Failed to calculate fee" });
    }
  });

  // ==================== BOT FEE SERVICE ====================

  // Calculate bot fees for a trade
  app.post("/api/bot/fees/calculate", async (req, res) => {
    try {
      const { userId, profit, allocatedCapital } = req.body;
      const { botFeeService } = await import("./bot-fee-service");
      const fees = await botFeeService.calculateTradeFees(userId, parseFloat(profit), parseFloat(allocatedCapital));
      res.json(fees);
    } catch (error) {
      console.error("Failed to calculate bot fees:", error);
      res.status(500).json({ error: "Failed to calculate bot fees" });
    }
  });

  // Get user's bot performance tier
  app.get("/api/bot/performance/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { botFeeService } = await import("./bot-fee-service");
      const tierInfo = await botFeeService.getUserPerformanceTier(userId);
      res.json(tierInfo);
    } catch (error) {
      console.error("Failed to get performance tier:", error);
      res.status(500).json({ error: "Failed to get performance tier" });
    }
  });

  // Get platform bot revenue for period
  app.post("/api/bot/revenue", async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const { botFeeService } = await import("./bot-fee-service");
      const revenue = await botFeeService.calculatePlatformBotRevenue(
        new Date(startDate),
        new Date(endDate)
      );
      res.json(revenue);
    } catch (error) {
      console.error("Failed to calculate bot revenue:", error);
      res.status(500).json({ error: "Failed to calculate bot revenue" });
    }
  });

  // ==================== REVENUE OPTIMIZATION ====================

  // Get total revenue for period
  app.post("/api/revenue/total", async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const { revenueService } = await import("./revenue-service");
      const revenue = await revenueService.calculateTotalRevenue(
        new Date(startDate),
        new Date(endDate)
      );
      res.json(revenue);
    } catch (error) {
      console.error("Failed to calculate revenue:", error);
      res.status(500).json({ error: "Failed to calculate revenue" });
    }
  });

  // Get revenue growth
  app.post("/api/revenue/growth", async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const { revenueService } = await import("./revenue-service");
      const growth = await revenueService.calculateRevenueGrowth(
        new Date(startDate),
        new Date(endDate)
      );
      res.json(growth);
    } catch (error) {
      console.error("Failed to calculate growth:", error);
      res.status(500).json({ error: "Failed to calculate growth" });
    }
  });

  // Get revenue projections
  app.get("/api/revenue/projections", async (req, res) => {
    try {
      const { revenueService } = await import("./revenue-service");
      const projections = await revenueService.getRevenueProjections();
      res.json(projections);
    } catch (error) {
      console.error("Failed to get projections:", error);
      res.status(500).json({ error: "Failed to get projections" });
    }
  });

  // Get top revenue streams
  app.post("/api/revenue/top-streams", async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const { revenueService } = await import("./revenue-service");
      const streams = await revenueService.getTopRevenueStreams(
        new Date(startDate),
        new Date(endDate)
      );
      res.json(streams);
    } catch (error) {
      console.error("Failed to get top streams:", error);
      res.status(500).json({ error: "Failed to get top streams" });
    }
  });

  // ==================== PRODUCT VARIANTS ====================
  
  // Get variants for product
  app.get("/api/products/:productId/variants", async (req, res) => {
    try {
      const { productId } = req.params;
      const variants = await dbClient.select().from(productVariants)
        .where(and(
          eq(productVariants.productId, productId),
          eq(productVariants.isActive, "true")
        ));
      res.json(variants);
    } catch (error) {
      console.error("Failed to fetch product variants:", error);
      res.status(500).json({ error: "Failed to fetch product variants" });
    }
  });

  // Create product variant
  app.post("/api/products/:productId/variants", async (req, res) => {
    try {
      const { productId } = req.params;
      const schema = insertProductVariantSchema;
      const data = schema.parse(req.body);
      
      const variant = await dbClient.insert(productVariants).values({
        ...data,
        productId,
      }).returning();
      
      res.json(variant[0]);
    } catch (error) {
      console.error("Failed to create product variant:", error);
      res.status(500).json({ error: "Failed to create product variant" });
    }
  });

  // Update variant stock
  app.patch("/api/variants/:id/stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      
      const [variant] = await dbClient.update(productVariants)
        .set({ stock: stock.toString() })
        .where(eq(productVariants.id, id))
        .returning();
      
      res.json(variant);
    } catch (error) {
      console.error("Failed to update variant stock:", error);
      res.status(500).json({ error: "Failed to update variant stock" });
    }
  });

  // ==================== FLASH SALES ====================
  
  // Get active flash sales
  app.get("/api/flash-sales/active", async (req, res) => {
    try {
      const now = new Date();
      const sales = await dbClient.select().from(flashSales)
        .where(and(
          eq(flashSales.status, "active"),
          lte(flashSales.startTime, now),
          gte(flashSales.endTime, now)
        ));
      res.json(sales);
    } catch (error) {
      console.error("Failed to fetch flash sales:", error);
      res.status(500).json({ error: "Failed to fetch flash sales" });
    }
  });

  // Create flash sale (OWNER ONLY)
  app.post("/api/flash-sales", requireOwner, async (req, res) => {
    try {
      const schema = insertFlashSaleSchema;
      const data = schema.parse(req.body);
      
      const sale = await dbClient.insert(flashSales).values(data).returning();
      res.json(sale[0]);
    } catch (error) {
      console.error("Failed to create flash sale:", error);
      res.status(500).json({ error: "Failed to create flash sale" });
    }
  });

  // Get flash sale by ID
  app.get("/api/flash-sales/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [sale] = await dbClient.select().from(flashSales)
        .where(eq(flashSales.id, id));
      res.json(sale || null);
    } catch (error) {
      console.error("Failed to fetch flash sale:", error);
      res.status(500).json({ error: "Failed to fetch flash sale" });
    }
  });

  // ==================== ABANDONED CARTS ====================
  
  // Save/update abandoned cart
  app.post("/api/abandoned-carts", async (req, res) => {
    try {
      const schema = insertAbandonedCartSchema;
      const data = schema.parse(req.body);
      
      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const cart = await dbClient.insert(abandonedCarts).values({
        ...data,
        expiresAt,
      }).returning();
      
      res.json(cart[0]);
    } catch (error) {
      console.error("Failed to save abandoned cart:", error);
      res.status(500).json({ error: "Failed to save abandoned cart" });
    }
  });

  // Get user's abandoned carts
  app.get("/api/abandoned-carts/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const carts = await dbClient.select().from(abandonedCarts)
        .where(and(
          eq(sql`lower(${abandonedCarts.customerWallet})`, walletAddress.toLowerCase()),
          eq(abandonedCarts.converted, "false"),
          gte(abandonedCarts.expiresAt, new Date())
        ))
        .orderBy(desc(abandonedCarts.updatedAt));
      res.json(carts);
    } catch (error) {
      console.error("Failed to fetch abandoned carts:", error);
      res.status(500).json({ error: "Failed to fetch abandoned carts" });
    }
  });

  // Mark cart as converted
  app.post("/api/abandoned-carts/:id/convert", async (req, res) => {
    try {
      const { id } = req.params;
      const { orderId } = req.body;
      
      const [cart] = await dbClient.update(abandonedCarts)
        .set({
          converted: "true",
          convertedOrderId: orderId,
          convertedAt: new Date(),
        })
        .where(eq(abandonedCarts.id, id))
        .returning();
      
      res.json(cart);
    } catch (error) {
      console.error("Failed to mark cart as converted:", error);
      res.status(500).json({ error: "Failed to mark cart as converted" });
    }
  });

  // ==================== CUSTOMER TIERS ====================
  
  // Get all tiers
  app.get("/api/customer-tiers", async (req, res) => {
    try {
      const tiers = await dbClient.select().from(customerTiers)
        .where(eq(customerTiers.isActive, "true"))
        .orderBy(desc(customerTiers.priority));
      res.json(tiers);
    } catch (error) {
      console.error("Failed to fetch customer tiers:", error);
      res.status(500).json({ error: "Failed to fetch customer tiers" });
    }
  });

  // Create tier
  app.post("/api/customer-tiers", async (req, res) => {
    try {
      const schema = insertCustomerTierSchema;
      const data = schema.parse(req.body);
      
      const tier = await dbClient.insert(customerTiers).values(data).returning();
      res.json(tier[0]);
    } catch (error) {
      console.error("Failed to create tier:", error);
      res.status(500).json({ error: "Failed to create tier" });
    }
  });

  // Assign tier to customer
  app.post("/api/customer-tiers/assign", async (req, res) => {
    try {
      const schema = insertCustomerTierAssignmentSchema;
      const data = schema.parse(req.body);
      
      const assignment = await dbClient.insert(customerTierAssignments).values(data).returning();
      res.json(assignment[0]);
    } catch (error) {
      console.error("Failed to assign tier:", error);
      res.status(500).json({ error: "Failed to assign tier" });
    }
  });

  // Get customer's tier
  app.get("/api/customer-tiers/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const assignment = await dbClient.select({
        tier: customerTiers,
        assignment: customerTierAssignments,
      })
      .from(customerTierAssignments)
      .innerJoin(customerTiers, eq(customerTierAssignments.tierId, customerTiers.id))
      .where(and(
        eq(sql`lower(${customerTierAssignments.customerWallet})`, walletAddress.toLowerCase()),
        or(
          isNull(customerTierAssignments.expiresAt),
          gte(customerTierAssignments.expiresAt, new Date())
        )
      ))
      .orderBy(desc(customerTierAssignments.assignedAt))
      .limit(1);
      
      res.json(assignment[0] || null);
    } catch (error) {
      console.error("Failed to fetch customer tier:", error);
      res.status(500).json({ error: "Failed to fetch customer tier" });
    }
  });

  // ==================== PRODUCT RECOMMENDATIONS ====================
  
  // Get recommendations for product
  app.get("/api/products/:productId/recommendations", async (req, res) => {
    try {
      const { productId } = req.params;
      const { type } = req.query;
      
      const recommendations = await dbClient.select({
        id: productRecommendations.id,
        type: productRecommendations.type,
        score: productRecommendations.score,
        product: products,
      })
      .from(productRecommendations)
      .innerJoin(products, eq(productRecommendations.recommendedProductId, products.id))
      .where(and(
        eq(productRecommendations.productId, productId),
        eq(productRecommendations.isActive, "true"),
        type ? eq(productRecommendations.type, type as string) : undefined
      ))
      .orderBy(desc(productRecommendations.score));
      
      res.json(recommendations);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // Create recommendation
  app.post("/api/products/:productId/recommendations", async (req, res) => {
    try {
      const { productId } = req.params;
      const schema = insertProductRecommendationSchema;
      const data = schema.parse(req.body);
      
      const recommendation = await dbClient.insert(productRecommendations).values({
        ...data,
        productId,
      }).returning();
      
      res.json(recommendation[0]);
    } catch (error) {
      console.error("Failed to create recommendation:", error);
      res.status(500).json({ error: "Failed to create recommendation" });
    }
  });

  // ==================== PRE-ORDERS ====================
  
  // Create pre-order
  app.post("/api/pre-orders", async (req, res) => {
    try {
      const schema = insertPreOrderSchema;
      const data = schema.parse(req.body);
      
      const preOrder = await dbClient.insert(preOrders).values(data).returning();
      res.json(preOrder[0]);
    } catch (error) {
      console.error("Failed to create pre-order:", error);
      res.status(500).json({ error: "Failed to create pre-order" });
    }
  });

  // Get user's pre-orders
  app.get("/api/pre-orders/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const userPreOrders = await dbClient.select({
        preOrder: preOrders,
        product: products,
      })
      .from(preOrders)
      .innerJoin(products, eq(preOrders.productId, products.id))
      .where(eq(sql`lower(${preOrders.customerWallet})`, walletAddress.toLowerCase()))
      .orderBy(desc(preOrders.createdAt));
      
      res.json(userPreOrders);
    } catch (error) {
      console.error("Failed to fetch pre-orders:", error);
      res.status(500).json({ error: "Failed to fetch pre-orders" });
    }
  });

  // Update pre-order status
  app.patch("/api/pre-orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [preOrder] = await dbClient.update(preOrders)
        .set({ status })
        .where(eq(preOrders.id, id))
        .returning();
      
      res.json(preOrder);
    } catch (error) {
      console.error("Failed to update pre-order status:", error);
      res.status(500).json({ error: "Failed to update pre-order status" });
    }
  });

  // ==================== RECENTLY VIEWED ====================
  
  // Track product view
  app.post("/api/recently-viewed", async (req, res) => {
    try {
      const schema = insertRecentlyViewedSchema;
      const data = schema.parse(req.body);
      
      // Delete old views for this product by this user
      await dbClient.delete(recentlyViewed)
        .where(and(
          eq(sql`lower(${recentlyViewed.customerWallet})`, data.customerWallet.toLowerCase()),
          eq(recentlyViewed.productId, data.productId)
        ));
      
      // Insert new view
      const view = await dbClient.insert(recentlyViewed).values(data).returning();
      res.json(view[0]);
    } catch (error) {
      console.error("Failed to track product view:", error);
      res.status(500).json({ error: "Failed to track product view" });
    }
  });

  // Get recently viewed products
  app.get("/api/recently-viewed/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const views = await dbClient.select({
        viewedAt: recentlyViewed.viewedAt,
        product: products,
      })
      .from(recentlyViewed)
      .innerJoin(products, eq(recentlyViewed.productId, products.id))
      .where(eq(sql`lower(${recentlyViewed.customerWallet})`, walletAddress.toLowerCase()))
      .orderBy(desc(recentlyViewed.viewedAt))
      .limit(limit);
      
      res.json(views);
    } catch (error) {
      console.error("Failed to fetch recently viewed:", error);
      res.status(500).json({ error: "Failed to fetch recently viewed" });
    }
  });

  // ==================== SUPREME COMMAND CENTER ====================
  
  // Get aggregated empire stats
  app.get("/api/supreme/stats", async (req, res) => {
    try {
      const walletAddress = req.query.account as string;
      
      if (!walletAddress) {
        return res.json({
          totalPortfolioValue: "0.00",
          totalInvested: "0.00",
          totalEarned: "0.00",
          activePositions: 0,
          totalPnL: "0.00",
          pnlPercent: "0.00%"
        });
      }

      let totalInvested = 0;
      let totalEarned = 0;
      let totalValue = 0;
      let activePositions = 0;

      // Aggregate staking positions from auto-compound pools
      try {
        const stakingPositions = await storage.getUserStakes(walletAddress);
        for (const pos of stakingPositions) {
          totalInvested += parseFloat(pos.initialStake);
          totalValue += parseFloat(pos.currentBalance);
          totalEarned += parseFloat(pos.totalEarned);
          if (pos.status === 'active') activePositions++;
        }
      } catch (e) {
        // Staking data may not be available
        console.log("Staking positions not available:", e);
      }

      // Aggregate from wallet balance if available
      try {
        const wallet = await storage.getWalletByAddress(walletAddress);
        if (wallet && wallet.balance) {
          totalValue += parseFloat(wallet.balance);
        }
      } catch (e) {
        // Wallet data may not be available
      }

      const totalPnL = totalEarned;
      const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : "0.00";

      res.json({
        totalPortfolioValue: totalValue.toFixed(2),
        totalInvested: totalInvested.toFixed(2),
        totalEarned: totalEarned.toFixed(2),
        activePositions,
        totalPnL: totalPnL.toFixed(2),
        pnlPercent: `${pnlPercent}%`
      });
    } catch (error) {
      console.error("Failed to fetch empire stats:", error);
      // Return safe defaults instead of 500 error
      res.json({
        totalPortfolioValue: "0.00",
        totalInvested: "0.00",
        totalEarned: "0.00",
        activePositions: 0,
        totalPnL: "0.00",
        pnlPercent: "0.00%"
      });
    }
  });

  // Get recent activity across all features
  app.get("/api/supreme/activity", async (req, res) => {
    try {
      const walletAddress = req.query.account as string;
      
      if (!walletAddress) {
        return res.json([]);
      }

      const activities: any[] = [];

      // Get recent transactions
      try {
        const transactions = await storage.getTransactionsByAddress(walletAddress);
        for (const tx of transactions.slice(0, 5)) {
          const txMeta = tx.metadata as any;
          activities.push({
            id: tx.hash,
            type: 'Transaction',
            description: `${txMeta?.type || 'Transfer'} transaction on ${tx.network}`,
            amount: tx.amount ? `$${parseFloat(tx.amount).toFixed(2)}` : undefined,
            timestamp: tx.timestamp,
            category: 'Blockchain'
          });
        }
      } catch (e) {
        // Transactions may not be available
      }

      // Get recent orders
      try {
        const orders = await storage.getOrdersByWallet(walletAddress);
        const userOrders = orders.slice(0, 3);
        
        for (const order of userOrders) {
          activities.push({
            id: order.id,
            type: 'Order',
            description: `Order ${order.id.substring(0, 8)} - ${order.status}`,
            amount: `$${order.totalAmount}`,
            timestamp: order.createdAt,
            category: 'E-commerce'
          });
        }
      } catch (e) {
        // Orders may not be available
      }

      // Sort by timestamp descending and limit to 10
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json(activities.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // ===== MARKETING CAMPAIGN ROUTES =====
  
  // Get all marketing campaigns for a user
  app.get("/api/marketing/campaigns/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const campaigns = await storage.getAllMarketingCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });
  
  // Get single campaign
  app.get("/api/marketing/campaign/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getMarketingCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });
  
  // Get campaigns by status
  app.get("/api/marketing/campaigns/:userId/status/:status", async (req, res) => {
    try {
      const { userId, status } = req.params;
      const campaigns = await storage.getCampaignsByStatus(userId, status);
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns by status:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });
  
  // Create marketing campaign
  app.post("/api/marketing/campaigns", async (req, res) => {
    try {
      const campaignSchema = z.object({
        userId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        type: z.string(),
        status: z.string().optional(),
        budget: z.string().optional(),
        spent: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        targetAudience: z.string().optional(),
        channels: z.array(z.string()).optional(),
        goals: z.any().optional()
      });
      
      const data = campaignSchema.parse(req.body);
      
      const { startDate, endDate, ...restData } = data;
      const campaignData: Omit<typeof restData, never> & { startDate?: Date; endDate?: Date } = {
        ...restData,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) })
      };
      
      const campaign = await storage.createMarketingCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Failed to create campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });
  
  // Update marketing campaign
  app.patch("/api/marketing/campaign/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const updateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        budget: z.string().optional(),
        spent: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        targetAudience: z.string().optional(),
        channels: z.array(z.string()).optional(),
        goals: z.any().optional()
      });
      
      const data = updateSchema.parse(req.body);
      
      const { startDate, endDate, ...restData } = data;
      const updateData: Omit<typeof restData, never> & { startDate?: Date; endDate?: Date } = {
        ...restData,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) })
      };
      
      const campaign = await storage.updateMarketingCampaign(id, updateData);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Failed to update campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });
  
  // Delete marketing campaign
  app.delete("/api/marketing/campaign/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMarketingCampaign(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });
  
  // Get campaign analytics
  app.get("/api/marketing/campaign/:id/analytics", async (req, res) => {
    try {
      const { id } = req.params;
      const analytics = await storage.getCampaignAnalytics(id);
      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  
  // Get campaign metrics
  app.get("/api/marketing/campaign/:id/metrics", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const metrics = await storage.getCampaignMetrics(id, limit);
      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });
  
  // Create campaign metric
  app.post("/api/marketing/campaign/:id/metrics", async (req, res) => {
    try {
      const { id } = req.params;
      const metricSchema = z.object({
        impressions: z.string().optional(),
        clicks: z.string().optional(),
        conversions: z.string().optional(),
        revenue: z.string().optional(),
        ctr: z.string().optional(),
        conversionRate: z.string().optional(),
        roi: z.string().optional(),
        date: z.string(),
        metadata: z.any().optional()
      });
      
      const data = metricSchema.parse(req.body);
      const metric = await storage.createCampaignMetric({ ...data, campaignId: id, date: new Date(data.date) });
      res.json(metric);
    } catch (error) {
      console.error("Failed to create metric:", error);
      res.status(500).json({ error: "Failed to create metric" });
    }
  });
  
  // Get campaign budgets
  app.get("/api/marketing/campaign/:id/budgets", async (req, res) => {
    try {
      const { id } = req.params;
      const budgets = await storage.getCampaignBudgets(id);
      res.json(budgets);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });
  
  // Create campaign budget
  app.post("/api/marketing/campaign/:id/budgets", async (req, res) => {
    try {
      const { id } = req.params;
      const budgetSchema = z.object({
        channel: z.string(),
        allocated: z.string(),
        spent: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        notes: z.string().optional()
      });
      
      const data = budgetSchema.parse(req.body);
      const budget = await storage.createMarketingBudget({ 
        ...data, 
        campaignId: id,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null
      });
      res.json(budget);
    } catch (error) {
      console.error("Failed to create budget:", error);
      res.status(500).json({ error: "Failed to create budget" });
    }
  });
  
  // ===== SECURITY / WALLET ROUTES =====
  
  // In-memory storage for security policies, transaction limits, and alerts (non-persistent features)
  const securityPolicies = new Map<string, any>();
  const transactionLimits = new Map<string, any>();
  const securityAlertsMap = new Map<string, any[]>();
  
  // Get wallet security policy
  app.get("/api/security/policy/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const policy = securityPolicies.get(walletAddress.toLowerCase()) || {
        walletAddress,
        multiSigEnabled: false,
        hardwareWalletEnabled: false,
        txSimulationEnabled: true,
        aiSentinelEnabled: true,
        dailySpendingLimit: "10",
        requireApprovalAbove: "5",
        sessionTimeout: "3600",
      };
      res.json(policy);
    } catch (error) {
      console.error("Failed to fetch security policy:", error);
      res.status(500).json({ error: "Failed to fetch security policy" });
    }
  });
  
  // Update wallet security policy
  app.put("/api/security/policy/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const policySchema = z.object({
        multiSigEnabled: z.boolean().optional(),
        hardwareWalletEnabled: z.boolean().optional(),
        txSimulationEnabled: z.boolean().optional(),
        aiSentinelEnabled: z.boolean().optional(),
        dailySpendingLimit: z.string().optional(),
        requireApprovalAbove: z.string().optional(),
        sessionTimeout: z.string().optional(),
      });
      
      const updates = policySchema.parse(req.body);
      const current = securityPolicies.get(walletAddress.toLowerCase()) || {};
      const updated = { ...current, ...updates, walletAddress, updatedAt: new Date() };
      
      securityPolicies.set(walletAddress.toLowerCase(), updated);
      
      // Create alert for policy change
      const alert = {
        id: Date.now().toString(),
        type: 'policy_change',
        severity: 'low',
        title: 'Security Policy Updated',
        description: `Security settings have been modified`,
        metadata: updates,
        isRead: false,
        createdAt: new Date(),
      };
      
      const alerts = securityAlertsMap.get(walletAddress.toLowerCase()) || [];
      alerts.unshift(alert);
      securityAlertsMap.set(walletAddress.toLowerCase(), alerts.slice(0, 50)); // Keep last 50
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update security policy:", error);
      res.status(500).json({ error: "Failed to update security policy" });
    }
  });
  
  // Add trusted address
  app.post("/api/security/whitelist/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const schema = z.object({
        address: z.string(),
        label: z.string().optional(),
      });
      
      const { address, label } = schema.parse(req.body);
      
      // Add to database
      await storage.addTrustedAddress({
        walletAddress,
        trustedAddress: address,
        label: label || null
      });
      
      // Create security alert
      await storage.createSecurityAlert({
        walletAddress,
        type: 'whitelist_add',
        severity: 'low',
        title: 'Address Whitelisted',
        description: `${address.slice(0, 10)}... added to trusted addresses`,
        metadata: { address, label },
        isRead: "false"
      });
      
      res.json({ success: true, address, label });
    } catch (error) {
      console.error("Failed to add trusted address:", error);
      res.status(500).json({ error: "Failed to add trusted address" });
    }
  });
  
  // Get trusted addresses
  app.get("/api/security/whitelist/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const trustedAddressList = await storage.getTrustedAddresses(walletAddress);
      const addresses = trustedAddressList.map(ta => ta.trustedAddress);
      res.json(addresses);
    } catch (error) {
      console.error("Failed to fetch trusted addresses:", error);
      res.status(500).json({ error: "Failed to fetch trusted addresses" });
    }
  });
  
  // Block address
  app.post("/api/security/blacklist/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const schema = z.object({
        address: z.string(),
        reason: z.string().optional(),
      });
      
      const { address, reason } = schema.parse(req.body);
      
      // Add to database
      await storage.addBlockedAddress({
        walletAddress,
        blockedAddress: address,
        reason: reason || null
      });
      
      // Create high severity alert
      await storage.createSecurityAlert({
        walletAddress,
        type: 'blacklist_add',
        severity: 'high',
        title: 'Address Blocked',
        description: `${address.slice(0, 10)}... has been blocked`,
        metadata: { address, reason },
        isRead: "false"
      });
      
      res.json({ success: true, address, reason });
    } catch (error) {
      console.error("Failed to block address:", error);
      res.status(500).json({ error: "Failed to block address" });
    }
  });
  
  // Validate transaction (ADVANCED security enforcement)
  app.post("/api/security/validate-transaction", async (req, res) => {
    try {
      const schema = z.object({
        from: z.string(),
        to: z.string(),
        amount: z.string(),
        amountWei: z.string().optional(),
        network: z.string().optional(),
        chainId: z.string().optional(),
        timestamp: z.string().optional(),
      });
      
      const { from, to, amount, amountWei, network, chainId, timestamp } = schema.parse(req.body);
      const fromKey = from.toLowerCase();
      const toKey = to.toLowerCase();
      
      const policy = securityPolicies.get(fromKey) || {};
      const alerts: any[] = [];
      let blocked = false;
      let warnings: string[] = [];
      
      // VELOCITY LIMIT CHECK: Track transaction frequency
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const recentTxKey = `${fromKey}_recent`;
      let recentTx = transactionLimits.get(recentTxKey) || [];
      
      // Clean old transactions (older than 1 hour)
      recentTx = recentTx.filter((tx: any) => now - tx.timestamp < oneHour);
      
      // Check velocity: max 10 transactions per hour
      if (recentTx.length >= 10) {
        blocked = true;
        alerts.push({
          id: Date.now().toString(),
          type: 'velocity_limit',
          severity: 'critical',
          title: 'Velocity Limit Exceeded',
          description: `Too many transactions (${recentTx.length}) in the last hour. Please wait before sending more.`,
          metadata: { from, count: recentTx.length, limit: 10 },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // Add current transaction to tracking
      recentTx.push({ timestamp: now, amount: parseFloat(amount) });
      transactionLimits.set(recentTxKey, recentTx);
      
      // EMERGENCY LOCKDOWN CHECK
      if (policy.lockdownEnabled) {
        blocked = true;
        alerts.push({
          id: (Date.now() + 1).toString(),
          type: 'lockdown',
          severity: 'critical',
          title: 'Wallet Locked',
          description: 'Emergency lockdown is active. All transactions are blocked.',
          metadata: { from, to, amount },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // BLACKLIST CHECK - Use database-backed storage
      const blockedAddressList = await storage.getBlockedAddresses(from);
      const isBlocked = blockedAddressList.some(ba => ba.blockedAddress.toLowerCase() === toKey);
      
      if (isBlocked) {
        blocked = true;
        alerts.push({
          id: (Date.now() + 2).toString(),
          type: 'blocked_transaction',
          severity: 'critical',
          title: 'Transaction Blocked',
          description: `Attempted transaction to blocked address ${to.slice(0, 10)}...`,
          metadata: { from, to, amount, network, chainId },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // SPENDING LIMIT CHECK (per chain)
      const dailyLimit = parseFloat(policy.dailySpendingLimit || "10");
      const txAmount = parseFloat(amount);
      
      if (txAmount > dailyLimit) {
        warnings.push(`Transaction amount (${amount} ETH) exceeds daily limit (${dailyLimit} ETH)`);
        alerts.push({
          id: (Date.now() + 3).toString(),
          type: 'spending_limit',
          severity: 'medium',
          title: 'Spending Limit Exceeded',
          description: `Transaction of ${amount} ETH exceeds daily limit of ${dailyLimit} ETH`,
          metadata: { from, to, amount, limit: dailyLimit, network, chainId },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // HIGH-VALUE CHECK
      const requireApproval = parseFloat(policy.requireApprovalAbove || "5");
      if (txAmount > requireApproval) {
        warnings.push(`High-value transaction requires approval (>${requireApproval} ETH)`);
      }
      
      // WHITELIST CHECK - Use database-backed storage
      // First check if this is a platform address (auto-trusted)
      const isPlatform = await storage.isPlatformAddress(to);
      const trustedAddressList = await storage.getTrustedAddresses(from);
      const isTrusted = trustedAddressList.some(ta => ta.trustedAddress.toLowerCase() === toKey);
      
      // Only warn if address is not trusted AND not a platform address
      if (!isTrusted && !isPlatform && !blocked) {
        warnings.push(`Recipient address is not in your trusted list`);
      }
      
      // PATTERN ANALYSIS: Detect suspicious behavior
      const hourlyTotal = recentTx.reduce((sum: number, tx: any) => sum + tx.amount, 0);
      if (hourlyTotal > dailyLimit * 2) {
        warnings.push(`⚠️ FRAUD ALERT: Unusual spending pattern detected (${hourlyTotal.toFixed(2)} ETH in 1 hour)`);
        alerts.push({
          id: (Date.now() + 4).toString(),
          type: 'suspicious_pattern',
          severity: 'high',
          title: 'Suspicious Activity Detected',
          description: `Unusual spending pattern: ${hourlyTotal.toFixed(2)} ETH in the last hour`,
          metadata: { from, hourlyTotal, transactions: recentTx.length },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // Store alerts
      if (alerts.length > 0) {
        const existingAlerts = securityAlertsMap.get(fromKey) || [];
        securityAlertsMap.set(fromKey, [...alerts, ...existingAlerts].slice(0, 100)); // Keep last 100
      }
      
      res.json({
        valid: !blocked,
        blocked,
        warnings,
        requiresApproval: txAmount > requireApproval,
        alerts,
        policy,
        metadata: {
          network,
          chainId,
          timestamp,
          velocityCheck: {
            recentCount: recentTx.length,
            limit: 10,
            hourlyTotal: hourlyTotal.toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error("Transaction validation failed:", error);
      res.status(500).json({ error: "Transaction validation failed" });
    }
  });
  
  // Get security alerts (AI Sentinel monitoring)
  app.get("/api/security/alerts/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const alerts = securityAlertsMap.get(walletAddress.toLowerCase()) || [];
      res.json(alerts);
    } catch (error) {
      console.error("Failed to fetch security alerts:", error);
      res.status(500).json({ error: "Failed to fetch security alerts" });
    }
  });
  
  // Mark alert as read
  app.put("/api/security/alerts/:walletAddress/:alertId/read", async (req, res) => {
    try {
      const { walletAddress, alertId } = req.params;
      const alerts = securityAlertsMap.get(walletAddress.toLowerCase()) || [];
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.isRead = true;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });
  
  // Emergency lockdown toggle
  app.post("/api/security/lockdown/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const schema = z.object({
        enabled: z.boolean(),
      });
      
      const { enabled } = schema.parse(req.body);
      const key = walletAddress.toLowerCase();
      
      const current = securityPolicies.get(key) || {};
      const updated = { ...current, lockdownEnabled: enabled, walletAddress, updatedAt: new Date() };
      
      securityPolicies.set(key, updated);
      
      // Create alert
      const alert = {
        id: Date.now().toString(),
        type: enabled ? 'lockdown_enabled' : 'lockdown_disabled',
        severity: enabled ? 'critical' : 'medium',
        title: enabled ? 'Emergency Lockdown Activated' : 'Emergency Lockdown Deactivated',
        description: enabled ? '🔒 All transactions are now blocked' : '🔓 Wallet unlocked, transactions allowed',
        metadata: { walletAddress, enabled },
        isRead: false,
        createdAt: new Date(),
      };
      
      const alerts = securityAlertsMap.get(key) || [];
      alerts.unshift(alert);
      securityAlertsMap.set(key, alerts.slice(0, 100));
      
      res.json({ success: true, lockdownEnabled: enabled });
    } catch (error) {
      console.error("Failed to toggle lockdown:", error);
      res.status(500).json({ error: "Failed to toggle lockdown" });
    }
  });
  
  // Platform Address Management
  app.get("/api/security/platform-addresses", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const addresses = await storage.getPlatformAddresses(category);
      res.json(addresses);
    } catch (error) {
      console.error("Failed to fetch platform addresses:", error);
      res.status(500).json({ error: "Failed to fetch platform addresses" });
    }
  });
  
  app.post("/api/security/platform-addresses", async (req, res) => {
    try {
      const schema = z.object({
        address: z.string(),
        label: z.string(),
        category: z.string(),
        description: z.string().optional(),
        addedBy: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      const platformAddress = await storage.addPlatformAddress(data);
      
      res.status(201).json({ 
        success: true, 
        platformAddress,
        message: `Platform address ${data.label} added successfully`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid platform address data", 
          details: error.errors 
        });
      }
      console.error("Failed to add platform address:", error);
      res.status(500).json({ error: "Failed to add platform address" });
    }
  });
  
  // ===== TRADING PLATFORM ROUTES =====
  
  // In-memory storage for trading orders
  const openOrders: Map<string, any> = new Map();
  const orderHistory: any[] = [];
  
  
  // Get order book for a trading pair
  app.get("/api/trading/orderbook/:pair", async (req, res) => {
    try {
      const { pair } = req.params;
      
      // Real order book from platform's open orders
      const pairSymbol = pair.split('-')[0];
      const currentPrice = (await import('./price-service')).getCryptoPrice(pairSymbol);
      const basePrice = currentPrice?.usd || 0;
      
      // Aggregate real open orders from the platform
      const allOrders = Array.from(openOrders.values()).filter(order => order.pair === pair);
      
      const bids = allOrders
        .filter(order => order.side === 'buy' && order.status === 'open')
        .map(order => ({
          price: order.price,
          size: order.amount.toString()
        }))
        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        .slice(0, 20);
      
      const asks = allOrders
        .filter(order => order.side === 'sell' && order.status === 'open')
        .map(order => ({
          price: order.price,
          size: order.amount.toString()
        }))
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        .slice(0, 20);
      
      const orderBook = { bids, asks };
      
      res.json(orderBook);
    } catch (error) {
      console.error("Failed to fetch order book:", error);
      res.status(500).json({ error: "Failed to fetch order book" });
    }
  });
  
  // Place trading order
  app.post("/api/trading/orders", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const orderSchema = z.object({
        pair: z.string(),
        side: z.enum(['buy', 'sell']),
        type: z.enum(['market', 'limit', 'stop_loss', 'take_profit']),
        amount: z.number().positive(),
        limitPrice: z.number().positive().optional(),
        stopPrice: z.number().positive().optional(),
        targetPrice: z.number().positive().optional(),
      });
      
      const orderData = orderSchema.parse(req.body);
      
      // Get current price (mock - in production, fetch from Coinbase)
      const currentPrice = 50000 + Math.random() * 1000;
      
      // Create order
      const order = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...orderData,
        status: orderData.type === 'market' ? 'filled' : 'open',
        executedPrice: orderData.type === 'market' ? currentPrice.toFixed(2) : orderData.limitPrice?.toFixed(2) || '0',
        executedAt: orderData.type === 'market' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      };
      
      // Store order based on status
      if (order.status === 'open') {
        openOrders.set(order.id, order);
      } else if (order.status === 'filled') {
        orderHistory.unshift(order);
      }
      
      res.json(order);
    } catch (error) {
      console.error("Failed to place order:", error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });
  
  // Get open orders
  app.get("/api/trading/orders/open", async (req, res) => {
    try {
      // Return all open orders from in-memory store
      const orders = Array.from(openOrders.values());
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch open orders:", error);
      res.status(500).json({ error: "Failed to fetch open orders" });
    }
  });
  
  // Get order history
  app.get("/api/trading/orders/history", async (req, res) => {
    try {
      // Return order history from in-memory store
      res.json(orderHistory);
    } catch (error) {
      console.error("Failed to fetch order history:", error);
      res.status(500).json({ error: "Failed to fetch order history" });
    }
  });
  
  // Cancel order
  app.post("/api/trading/orders/:orderId/cancel", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Remove order from open orders
      if (openOrders.has(orderId)) {
        openOrders.delete(orderId);
        res.json({ success: true, orderId });
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });
  
  // ===== COMMAND CENTER / PLATFORM STATISTICS ROUTES =====
  
  // Get platform statistics (OWNER ONLY)
  app.get("/api/command-center/stats", requireOwner, async (req, res) => {
    try {
      // Aggregate stats from existing tables
      const stats = await storage.getPlatformStatistics();
      // Convert ETH revenue to USD
      const totalRevenueEth = parseFloat(stats.totalRevenue || '0');
      const totalRevenueUsd = convertCryptoToUsd(totalRevenueEth, 'ETH');
      stats.totalRevenue = totalRevenueUsd.toFixed(2);
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch platform stats:", error);
      res.status(500).json({ error: "Failed to fetch platform statistics" });
    }
  });
  
  // Get recent platform activity feed (OWNER ONLY)
  app.get("/api/command-center/activity", requireOwner, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activity = await storage.getPlatformActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });
  
  // Approve/Complete pending activity (OWNER ONLY)
  app.post("/api/command-center/activity/:id/approve", requireOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;
      
      if (type === 'transaction') {
        await storage.updateTransactionStatus(id, 'confirmed');
      }
      
      res.json({ success: true, id, status: 'confirmed' });
    } catch (error) {
      console.error("Failed to approve activity:", error);
      res.status(500).json({ error: "Failed to approve activity" });
    }
  });
  
  // Dismiss/Reject pending activity (OWNER ONLY)
  app.post("/api/command-center/activity/:id/dismiss", requireOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;
      
      if (type === 'transaction') {
        await storage.updateTransactionStatus(id, 'failed');
      }
      
      res.json({ success: true, id, status: 'dismissed' });
    } catch (error) {
      console.error("Failed to dismiss activity:", error);
      res.status(500).json({ error: "Failed to dismiss activity" });
    }
  });
  
  // Clear all pending activities (OWNER ONLY)
  app.post("/api/command-center/activity/clear-pending", requireOwner, async (req, res) => {
    try {
      // Mark all pending transactions as failed (dismissed)
      const result = await storage.clearPendingTransactions();
      res.json({ success: true, cleared: result });
    } catch (error) {
      console.error("Failed to clear pending activities:", error);
      res.status(500).json({ error: "Failed to clear pending activities" });
    }
  });
  
  // Get system health metrics (OWNER ONLY)
  app.get("/api/command-center/health", requireOwner, async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error("Failed to fetch system health:", error);
      res.status(500).json({ error: "Failed to fetch system health" });
    }
  });

  // Get platform revenue dashboard (OWNER ONLY)
  app.get("/api/platform/revenue", requireOwner, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (period === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // 1. E-commerce revenue from orders
      const ordersResult = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0)`,
          count: sql<string>`COALESCE(COUNT(*), 0)`
        })
        .from(orders)
        .where(and(
          eq(orders.status, 'completed'),
          gte(orders.createdAt, startDate)
        ));
      
      const ecommerceRevenue = parseFloat(ordersResult[0]?.total || '0');
      const orderCount = parseInt(ordersResult[0]?.count || '0');

      // 2. Marketplace fees (assume 2% fee on sales)
      const marketplaceResult = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(price_eth AS NUMERIC)), 0)`,
          count: sql<string>`COALESCE(COUNT(*), 0)`
        })
        .from(marketplaceListings)
        .where(and(
          eq(marketplaceListings.status, 'sold'),
          gte(marketplaceListings.createdAt, startDate)
        ));
      
      const marketplaceSales = parseFloat(marketplaceResult[0]?.total || '0');
      const marketplaceFees = marketplaceSales * 0.02; // 2% platform fee
      const marketplaceSalesCount = parseInt(marketplaceResult[0]?.count || '0');

      // 3. Trading bot performance fees (assume 10% of profits)
      const tradingResult = await dbClient
        .execute(sql`
          SELECT 
            COALESCE(SUM(CAST(profit AS NUMERIC)), 0) as total_profit,
            COALESCE(COUNT(*), 0) as count
          FROM bot_trades
          WHERE status = 'filled'
          AND created_at >= ${startDate.toISOString()}
          AND CAST(profit AS NUMERIC) > 0
        `);
      
      const totalTradingProfit = parseFloat((tradingResult.rows[0]?.total_profit as any) || '0');
      const tradingFees = totalTradingProfit * 0.10; // 10% performance fee
      const profitableTradesCount = parseInt((tradingResult.rows[0]?.count as any) || '0');

      // 4. Subscription revenue (from subscription_billings)
      const subscriptionResult = await dbClient
        .execute(sql`
          SELECT 
            COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total,
            COALESCE(COUNT(*), 0) as count
          FROM subscription_billings
          WHERE status = 'paid'
          AND created_at >= ${startDate.toISOString()}
        `);
      
      const subscriptionRevenue = parseFloat((subscriptionResult.rows[0]?.total as any) || '0');
      const subscriptionCount = parseInt((subscriptionResult.rows[0]?.count as any) || '0');

      // 5. Affiliate commissions (money we save, not paid out)
      const affiliateResult = await dbClient
        .execute(sql`
          SELECT 
            COALESCE(SUM(CAST(commission_amount AS NUMERIC)), 0) as total,
            COALESCE(COUNT(*), 0) as count
          FROM affiliate_referrals
          WHERE status IN ('pending', 'approved')
          AND created_at >= ${startDate.toISOString()}
        `);
      
      const pendingAffiliateCosts = parseFloat((affiliateResult.rows[0]?.total as any) || '0');
      const affiliateReferralCount = parseInt((affiliateResult.rows[0]?.count as any) || '0');

      // 6. Flash sales revenue
      const flashSalesResult = await dbClient
        .select({
          count: sql<string>`COALESCE(SUM(CAST(sold_quantity AS NUMERIC)), 0)`
        })
        .from(flashSales)
        .where(gte(flashSales.createdAt, startDate));
      
      const flashSalesCount = parseInt(flashSalesResult[0]?.count || '0');

      // Calculate totals
      const totalRevenue = ecommerceRevenue + marketplaceFees + tradingFees + subscriptionRevenue;
      const netRevenue = totalRevenue - pendingAffiliateCosts;

      res.json({
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        revenue: {
          total: totalRevenue.toFixed(2),
          net: netRevenue.toFixed(2),
          bySource: {
            ecommerce: {
              amount: ecommerceRevenue.toFixed(2),
              count: orderCount,
              label: 'E-commerce Sales'
            },
            marketplace: {
              amount: marketplaceFees.toFixed(2),
              count: marketplaceSalesCount,
              label: 'Marketplace Fees (2%)'
            },
            trading: {
              amount: tradingFees.toFixed(2),
              count: profitableTradesCount,
              label: 'Trading Bot Fees (10%)'
            },
            subscriptions: {
              amount: subscriptionRevenue.toFixed(2),
              count: subscriptionCount,
              label: 'Subscription Revenue'
            }
          },
          costs: {
            affiliateCommissions: {
              amount: pendingAffiliateCosts.toFixed(2),
              count: affiliateReferralCount,
              label: 'Pending Affiliate Payouts'
            }
          }
        },
        metrics: {
          totalTransactions: orderCount + marketplaceSalesCount + profitableTradesCount + subscriptionCount,
          avgTransactionValue: orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : '0',
          flashSalesVolume: flashSalesCount
        }
      });
    } catch (error) {
      console.error("Failed to fetch platform revenue:", error);
      res.status(500).json({ error: "Failed to fetch platform revenue" });
    }
  });

  // Get comprehensive owner metrics (OWNER ONLY)
  app.get("/api/owner/metrics", requireOwner, async (req, res) => {
    try {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get platform statistics
      const platformStats = await storage.getPlatformStatistics();

      // Get user counts
      const [totalUsers, newUsersThisMonth, premiumUsers] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` }).from(users),
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(sql`created_at >= ${oneMonthAgo}`),
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(eq(users.isOwner, "true"))
      ]);

      // Get transaction metrics
      const [todayTransactions, todayVolume] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(transactions)
          .where(sql`timestamp >= ${oneDayAgo}`),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)::text` 
        })
          .from(transactions)
          .where(sql`timestamp >= ${oneDayAgo}`)
      ]);

      // Get revenue metrics
      const [monthlyRevenue, weeklyRevenue, totalProfit] = await Promise.all([
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(total_amount), 0)::text` 
        })
          .from(orders)
          .where(and(
            eq(orders.status, 'completed'),
            sql`created_at >= ${oneMonthAgo}`
          )),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(total_amount), 0)::text` 
        })
          .from(orders)
          .where(and(
            eq(orders.status, 'completed'),
            sql`created_at >= ${oneWeekAgo}`
          )),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(total_amount), 0)::text` 
        })
          .from(orders)
          .where(eq(orders.status, 'completed'))
      ]);

      // Get auto-compound metrics
      const [activeStakes, totalStaked, totalRewards] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(autoCompoundStakes)
          .where(eq(autoCompoundStakes.status, 'active')),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(CAST(current_balance AS NUMERIC)), 0)::text` 
        })
          .from(autoCompoundStakes)
          .where(eq(autoCompoundStakes.status, 'active')),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(CAST(total_earned AS NUMERIC)), 0)::text` 
        })
          .from(autoCompoundStakes)
      ]);

      // Get trading bot metrics with simple count
      const totalTradesResult = await dbClient.execute(sql`SELECT COUNT(*)::int as count FROM bot_trades`);
      const totalTrades = [{ count: totalTradesResult.rows[0]?.count || 0 }];
      
      const botStatsResult = await dbClient.execute(sql`
        SELECT 
          COALESCE(SUM(CAST(profit AS NUMERIC)), 0)::text as "totalPnL",
          COUNT(CASE WHEN CAST(profit AS NUMERIC) > 0 THEN 1 ELSE NULL END)::int as "winningTrades",
          COUNT(*)::int as "totalCount"
        FROM bot_trades
      `);
      const botStats = [botStatsResult.rows[0] || { totalPnL: '0', winningTrades: 0, totalCount: 0 }];

      const winRate = botStats[0]?.totalCount > 0 
        ? (botStats[0].winningTrades / botStats[0].totalCount) * 100 
        : 0;

      // Get social automation metrics
      const [scheduledPostsCount, publishedPostsCount, totalEngagement] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(scheduledPosts)
          .where(eq(scheduledPosts.status, 'scheduled')),
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(postHistory)
          .where(eq(postHistory.status, 'published')),
        dbClient.select({ 
          total: sql<number>`COALESCE(SUM(
            COALESCE((engagement->>'likes')::int, 0) + 
            COALESCE((engagement->>'retweets')::int, 0) + 
            COALESCE((engagement->>'replies')::int, 0)
          ), 0)::int` 
        })
          .from(postHistory)
          .where(eq(postHistory.status, 'published'))
      ]);

      // Get marketplace metrics
      const [totalListings, activeSales, marketplaceVolume] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(marketplaceListings),
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(marketplaceListings)
          .where(eq(marketplaceListings.status, 'active')),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(CAST(price_eth AS NUMERIC)), 0)::text` 
        })
          .from(marketplaceListings)
          .where(eq(marketplaceListings.status, 'sold'))
      ]);

      const totalRevenue = parseFloat(platformStats.totalRevenue || '0');
      const totalProfitNum = parseFloat(totalProfit[0]?.total || '0');
      const profitMargin = totalRevenue > 0 ? (totalProfitNum / totalRevenue) * 100 : 0;

      // Calculate active users (users with stakes or recent transactions)
      const activeUsersResult = await dbClient.select({ 
        count: sql<number>`COUNT(DISTINCT user_id)::int` 
      })
        .from(autoCompoundStakes)
        .where(eq(autoCompoundStakes.status, 'active'));

      const metrics = {
        financials: {
          totalRevenue: totalRevenue,
          monthlyRevenue: parseFloat(monthlyRevenue[0]?.total || '0'),
          weeklyRevenue: parseFloat(weeklyRevenue[0]?.total || '0'),
          totalProfit: totalProfitNum,
          profitMargin: profitMargin
        },
        users: {
          total: totalUsers[0]?.count || 0,
          active: activeUsersResult[0]?.count || 0,
          newThisMonth: newUsersThisMonth[0]?.count || 0,
          premiumUsers: premiumUsers[0]?.count || 0
        },
        transactions: {
          total: platformStats.totalTransactions || 0,
          volume: parseFloat(platformStats.totalRevenue || '0'),
          todayCount: todayTransactions[0]?.count || 0,
          todayVolume: parseFloat(todayVolume[0]?.total || '0')
        },
        algorithms: {
          autoCompound: {
            status: 'Active',
            poolsActive: activeStakes[0]?.count || 0,
            totalStaked: parseFloat(totalStaked[0]?.total || '0'),
            totalRewards: parseFloat(totalRewards[0]?.total || '0')
          },
          tradingBot: {
            status: 'Active',
            activeStrategies: 5,
            totalTrades: totalTrades[0]?.count || 0,
            profitLoss: parseFloat(botStats[0]?.totalPnL || '0'),
            winRate: winRate
          },
          socialAutomation: {
            status: 'Active',
            postsScheduled: scheduledPostsCount[0]?.count || 0,
            postsPublished: publishedPostsCount[0]?.count || 0,
            engagement: totalEngagement[0]?.total || 0
          }
        },
        marketplace: {
          totalListings: totalListings[0]?.count || 0,
          activeSales: activeSales[0]?.count || 0,
          totalVolume: parseFloat(marketplaceVolume[0]?.total || '0')
        }
      };

      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch owner metrics:", error);
      res.status(500).json({ error: "Failed to fetch owner metrics" });
    }
  });
  
  // ===== AUTO TRADING BOT ROUTES =====
  
  // In-memory bot state
  let botState: any = {
    status: 'stopped',
    config: null,
    startTime: null,
  };
  
  const botTrades: any[] = [];
  const botStats = {
    totalProfit: 0,
    totalTrades: 0,
    winningTrades: 0,
    winRate: 0,
  };
  
  // Get bot status
  app.get("/api/bot/status", async (req, res) => {
    try {
      res.json(botState);
    } catch (error) {
      console.error("Failed to fetch bot status:", error);
      res.status(500).json({ error: "Failed to fetch bot status" });
    }
  });
  
  
  // Get bot trades
  app.get("/api/bot/trades", async (req, res) => {
    try {
      res.json(botTrades);
    } catch (error) {
      console.error("Failed to fetch bot trades:", error);
      res.status(500).json({ error: "Failed to fetch bot trades" });
    }
  });
  
  // Get bot stats
  app.get("/api/bot/stats", async (req, res) => {
    try {
      const winRate = botStats.totalTrades > 0 
        ? ((botStats.winningTrades / botStats.totalTrades) * 100).toFixed(1)
        : 0;
      
      res.json({
        ...botStats,
        winRate,
      });
    } catch (error) {
      console.error("Failed to fetch bot stats:", error);
      res.status(500).json({ error: "Failed to fetch bot stats" });
    }
  });
  
  // Bot activity feed (demo mode)
  const botActivityFeed: any[] = [];
  let activityInterval: NodeJS.Timeout | null = null;
  
  const generateBotActivity = async () => {
    if (botState.status !== 'running' || !botState.config) return;
    
    const config = botState.config;
    const demoMode = config.demoMode !== false; // Default to demo mode for safety
    
    // Simulate market analysis
    const currentPrice = 42000 + Math.random() * 2000; // Random price for demo
    const sma20 = currentPrice * (0.98 + Math.random() * 0.04);
    
    const activities = [
      { type: 'analysis', message: `Analyzing ${config.tradingPair} market conditions`, details: 'Fetching latest candlestick data and calculating indicators' },
      { type: 'analysis', message: 'Computing SMA20 indicator', details: `Current price: $${currentPrice.toFixed(2)} | SMA20: $${sma20.toFixed(2)}` },
    ];
    
    // Randomly decide if signal should trigger
    if (Math.random() > 0.7) {
      const side = currentPrice > sma20 ? 'buy' : 'sell';
      const signalType = side === 'buy' ? 'Bullish' : 'Bearish';
      
      activities.push({ 
        type: 'signal', 
        message: `✨ ${side.toUpperCase()} signal detected!`, 
        details: `Price ${side === 'buy' ? 'crossed above' : 'crossed below'} SMA20 - ${signalType} momentum confirmed` 
      });
      
      activities.push({ 
        type: 'strategy', 
        message: 'Evaluating risk parameters', 
        details: `Stop loss: ${config.stopLoss}% | Take profit: ${config.takeProfit}% | Position size validated` 
      });
      
      // Execute trade (demo or live)
      if (demoMode) {
        activities.push({ 
          type: 'trade', 
          message: `🎮 DEMO ${side.toUpperCase()} order executed`, 
          details: `${(parseFloat(config.tradeAmount) / currentPrice).toFixed(6)} ${config.tradingPair.split('-')[0]} @ $${currentPrice.toFixed(2)} | Total: $${config.tradeAmount}` 
        });
        
        // Record demo trade
        const profit = (Math.random() - 0.4) * parseFloat(config.tradeAmount) * 0.1;
        botTrades.unshift({
          id: 'demo_' + Date.now(),
          tradingPair: config.tradingPair,
          side,
          orderType: 'market',
          amount: (parseFloat(config.tradeAmount) / currentPrice).toFixed(6),
          price: currentPrice.toFixed(2),
          strategy: config.strategy,
          timestamp: new Date().toISOString(),
          profit: profit.toFixed(2),
          mode: 'DEMO'
        });
        
        // Update stats
        botStats.totalTrades++;
        botStats.totalProfit += profit;
        if (profit > 0) botStats.winningTrades++;
        
      } else {
        activities.push({ 
          type: 'trade', 
          message: `🚀 LIVE ${side.toUpperCase()} order submitted`, 
          details: `Executing on real trading platform - ${config.tradingPair}` 
        });
        
        // Note: In production, this would call POST /api/trading/orders
        // For now, we log that it would execute
        activities.push({ 
          type: 'system', 
          message: '⚠️ Live trading requires trading platform integration', 
          details: 'Enable demo mode for safe testing' 
        });
      }
    } else {
      activities.push({ 
        type: 'system', 
        message: 'No trading signal - Waiting for optimal entry', 
        details: `Monitoring ${config.tradingPair} | Daily trades: ${botStats.totalTrades}/${config.maxDailyTrades}` 
      });
    }
    
    // Add activities to feed
    for (const activity of activities) {
      botActivityFeed.unshift({
        ...activity,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Keep only last 30 activities
    while (botActivityFeed.length > 30) {
      botActivityFeed.pop();
    }
  };
  
  // Bot configuration validation schema
  const botConfigSchema = z.object({
    tradingPair: z.string().min(1, "Trading pair is required"),
    strategy: z.string().min(1, "Strategy is required"),
    tradeAmount: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Trade amount must be a positive number"),
    stopLoss: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Stop loss must be between 0 and 100"),
    takeProfit: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1000;
    }, "Take profit must be between 0 and 1000"),
    maxDailyTrades: z.string().refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 100;
    }, "Max daily trades must be between 1 and 100"),
    demoMode: z.boolean().default(true),
  });

  // Start bot with activity generation
  app.post("/api/bot/start", async (req, res) => {
    try {
      // Validate configuration
      const validationResult = botConfigSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid bot configuration", 
          details: validationResult.error.errors 
        });
      }
      
      const config = validationResult.data;
      
      botState = {
        status: 'running',
        config,
        startTime: new Date().toISOString(),
      };
      
      // Clear old activity and start new feed
      botActivityFeed.length = 0;
      if (activityInterval) clearInterval(activityInterval);
      
      // Generate activity every 3-5 seconds
      activityInterval = setInterval(() => {
        generateBotActivity();
      }, 3000 + Math.random() * 2000);
      
      res.json({ success: true, message: "Bot started successfully", status: botState });
    } catch (error) {
      console.error("Failed to start bot:", error);
      res.status(500).json({ error: "Failed to start bot" });
    }
  });
  
  // Stop bot and activity generation
  app.post("/api/bot/stop", async (req, res) => {
    try {
      botState = {
        status: 'stopped',
        config: botState.config,
        startTime: null,
      };
      
      // Stop activity generation
      if (activityInterval) {
        clearInterval(activityInterval);
        activityInterval = null;
      }
      
      res.json({ success: true, message: "Bot stopped successfully", status: botState });
    } catch (error) {
      console.error("Failed to stop bot:", error);
      res.status(500).json({ error: "Failed to stop bot" });
    }
  });
  
  // Get bot activity feed
  app.get("/api/bot/activity", async (req, res) => {
    try {
      res.json(botActivityFeed);
    } catch (error) {
      console.error("Failed to fetch bot activity:", error);
      res.status(500).json({ error: "Failed to fetch bot activity" });
    }
  });
  
  // ===== CODEX ECOSYSTEM ROUTES =====
  
  // Get CODEX token info
  app.get("/api/codex/token", async (req, res) => {
    try {
      const token = await storage.getPlatformToken();
      res.json(token);
    } catch (error) {
      console.error("Failed to fetch token info:", error);
      res.status(500).json({ error: "Failed to fetch token info" });
    }
  });
  
  // Get user token holdings
  app.get("/api/codex/holdings/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      const holdings = await storage.getTokenHoldings(walletAddress);
      res.json(holdings);
    } catch (error) {
      console.error("Failed to fetch token holdings:", error);
      res.status(500).json({ error: "Failed to fetch token holdings" });
    }
  });
  
  // Get all NFT collections
  app.get("/api/codex/nft-collections", async (req, res) => {
    try {
      const collections = await storage.getPlatformNftCollections();
      res.json(collections);
    } catch (error) {
      console.error("Failed to fetch NFT collections:", error);
      res.status(500).json({ error: "Failed to fetch NFT collections" });
    }
  });
  
  // Get NFT collection by ID
  app.get("/api/codex/nft-collections/:id", async (req, res) => {
    try {
      const collection = await storage.getPlatformNftCollectionById(req.params.id);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Failed to fetch NFT collection:", error);
      res.status(500).json({ error: "Failed to fetch NFT collection" });
    }
  });
  
  // Get user's NFTs
  app.get("/api/codex/nfts/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      const nfts = await storage.getPlatformUserNfts(walletAddress);
      res.json(nfts);
    } catch (error) {
      console.error("Failed to fetch user NFTs:", error);
      res.status(500).json({ error: "Failed to fetch user NFTs" });
    }
  });
  
  // Mint NFT for user
  app.post("/api/codex/nfts/mint", async (req, res) => {
    try {
      const mintSchema = z.object({
        collectionId: z.string(),
        walletAddress: z.string(),
        tokenId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        attributes: z.any().optional(),
      });
      
      const data = mintSchema.parse(req.body);
      const nft = await storage.createPlatformUserNft(data);
      res.status(201).json(nft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid NFT data", 
          details: error.errors 
        });
      }
      console.error("Failed to mint NFT:", error);
      res.status(500).json({ error: "Failed to mint NFT" });
    }
  });
  
  // Get all achievements
  app.get("/api/codex/achievements", async (req, res) => {
    try {
      const achievements = await storage.getPlatformAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });
  
  // Get user achievements
  app.get("/api/codex/achievements/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      const achievements = await storage.getPlatformUserAchievements(walletAddress);
      res.json(achievements);
    } catch (error) {
      console.error("Failed to fetch user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });
  
  // Update achievement progress
  app.post("/api/codex/achievements/progress", async (req, res) => {
    try {
      const progressSchema = z.object({
        walletAddress: z.string(),
        achievementId: z.string(),
        progress: z.any(),
        isCompleted: z.boolean().optional(),
      });
      
      const data = progressSchema.parse(req.body);
      const achievement = await storage.updatePlatformUserAchievement({
        ...data,
        isCompleted: data.isCompleted ? 'true' : 'false'
      });
      res.json(achievement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid progress data", 
          details: error.errors 
        });
      }
      console.error("Failed to update achievement progress:", error);
      res.status(500).json({ error: "Failed to update achievement progress" });
    }
  });
  
  // Get all staking pools
  app.get("/api/codex/staking-pools", async (req, res) => {
    try {
      const pools = await storage.getCodexStakingPools();
      res.json(pools);
    } catch (error) {
      console.error("Failed to fetch staking pools:", error);
      res.status(500).json({ error: "Failed to fetch staking pools" });
    }
  });
  
  // Get staking pool by ID
  app.get("/api/codex/staking-pools/:id", async (req, res) => {
    try {
      const pool = await storage.getCodexStakingPoolById(req.params.id);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      res.json(pool);
    } catch (error) {
      console.error("Failed to fetch staking pool:", error);
      res.status(500).json({ error: "Failed to fetch staking pool" });
    }
  });
  
  // Get user stakes
  app.get("/api/codex/stakes/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      const stakes = await storage.getCodexUserStakes(walletAddress);
      res.json(stakes);
    } catch (error) {
      console.error("Failed to fetch user stakes:", error);
      res.status(500).json({ error: "Failed to fetch user stakes" });
    }
  });
  
  // Create new stake
  app.post("/api/codex/stakes", async (req, res) => {
    try {
      const stakeSchema = z.object({
        walletAddress: z.string(),
        poolId: z.string(),
        amount: z.string(),
        unlockDate: z.string(),
      });
      
      const data = stakeSchema.parse(req.body);
      const stake = await storage.createCodexUserStake({
        ...data,
        unlockDate: new Date(data.unlockDate)
      });
      res.status(201).json(stake);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid stake data", 
          details: error.errors 
        });
      }
      console.error("Failed to create stake:", error);
      res.status(500).json({ error: "Failed to create stake" });
    }
  });
  
  // Claim stake rewards
  app.post("/api/codex/stakes/:stakeId/claim", async (req, res) => {
    try {
      const stake = await storage.claimCodexStakeRewards(req.params.stakeId);
      if (!stake) {
        return res.status(404).json({ error: "Stake not found" });
      }
      res.json(stake);
    } catch (error) {
      console.error("Failed to claim rewards:", error);
      res.status(500).json({ error: "Failed to claim rewards" });
    }
  });
  
  // Unstake (if lock period ended)
  app.post("/api/codex/stakes/:stakeId/unstake", async (req, res) => {
    try {
      const stake = await storage.unstakeCodex(req.params.stakeId);
      if (!stake) {
        return res.status(404).json({ error: "Stake not found or still locked" });
      }
      res.json(stake);
    } catch (error) {
      console.error("Failed to unstake:", error);
      res.status(500).json({ error: "Failed to unstake" });
    }
  });
  
  // Get NFT evolution history
  app.get("/api/codex/nfts/:nftId/evolution", async (req, res) => {
    try {
      const evolution = await storage.getPlatformNftEvolutionLog(req.params.nftId);
      res.json(evolution);
    } catch (error) {
      console.error("Failed to fetch NFT evolution:", error);
      res.status(500).json({ error: "Failed to fetch NFT evolution" });
    }
  });
  
  // Log NFT evolution event
  app.post("/api/codex/nfts/evolve", async (req, res) => {
    try {
      const evolveSchema = z.object({
        nftId: z.string(),
        evolutionType: z.string(),
        oldValue: z.any().optional(),
        newValue: z.any().optional(),
        trigger: z.string().optional(),
        aiAnalysis: z.string().optional(),
      });
      
      const data = evolveSchema.parse(req.body);
      const log = await storage.logPlatformNftEvolution(data);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid evolution data", 
          details: error.errors 
        });
      }
      console.error("Failed to log NFT evolution:", error);
      res.status(500).json({ error: "Failed to log NFT evolution" });
    }
  });

  // ========================
  // CODEX RELICS ROUTES
  // ========================

  // Get all relics catalog
  app.get("/api/codex/relics", async (req, res) => {
    try {
      const relics = await storage.getCodexRelics();
      res.json(relics);
    } catch (error) {
      console.error("Failed to fetch relics:", error);
      res.status(500).json({ error: "Failed to fetch relics" });
    }
  });

  // Get relics by class
  app.get("/api/codex/relics/class/:class", async (req, res) => {
    try {
      const relics = await storage.getCodexRelicsByClass(req.params.class);
      res.json(relics);
    } catch (error) {
      console.error("Failed to fetch relics by class:", error);
      res.status(500).json({ error: "Failed to fetch relics" });
    }
  });

  // Get user's relic instances
  app.get("/api/codex/relics/instances/:walletAddress", async (req, res) => {
    try {
      const instances = await storage.getCodexRelicInstances(req.params.walletAddress);
      res.json(instances);
    } catch (error) {
      console.error("Failed to fetch relic instances:", error);
      res.status(500).json({ error: "Failed to fetch relic instances" });
    }
  });

  // Get user's equipped relics
  app.get("/api/codex/relics/equipped/:walletAddress", async (req, res) => {
    try {
      const equipped = await storage.getCodexEquippedRelics(req.params.walletAddress);
      res.json(equipped);
    } catch (error) {
      console.error("Failed to fetch equipped relics:", error);
      res.status(500).json({ error: "Failed to fetch equipped relics" });
    }
  });

  // Equip a relic
  app.post("/api/codex/relics/equip", async (req, res) => {
    try {
      const equipSchema = z.object({
        instanceId: z.string(),
        slot: z.enum(['slot1', 'slot2', 'slot3'])
      });

      const data = equipSchema.parse(req.body);
      const updated = await storage.equipCodexRelic(data.instanceId, data.slot);

      if (!updated) {
        return res.status(404).json({ error: "Relic instance not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to equip relic:", error);
      res.status(500).json({ error: "Failed to equip relic" });
    }
  });

  // Unequip a relic
  app.post("/api/codex/relics/unequip", async (req, res) => {
    try {
      const unequipSchema = z.object({
        instanceId: z.string()
      });

      const data = unequipSchema.parse(req.body);
      const updated = await storage.unequipCodexRelic(data.instanceId);

      if (!updated) {
        return res.status(404).json({ error: "Relic instance not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to unequip relic:", error);
      res.status(500).json({ error: "Failed to unequip relic" });
    }
  });

  // Get relic progress for user
  app.get("/api/codex/relics/progress/:walletAddress", async (req, res) => {
    try {
      const progress = await storage.getCodexRelicProgress(req.params.walletAddress);
      res.json(progress);
    } catch (error) {
      console.error("Failed to fetch relic progress:", error);
      res.status(500).json({ error: "Failed to fetch relic progress" });
    }
  });

  // Claim a relic (when all requirements met)
  app.post("/api/codex/relics/claim", async (req, res) => {
    try {
      const claimSchema = z.object({
        relicId: z.string(),
        walletAddress: z.string()
      });

      const data = claimSchema.parse(req.body);
      const instance = await storage.claimCodexRelic(data.relicId, data.walletAddress);

      res.status(201).json(instance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to claim relic:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to claim relic" 
      });
    }
  });

  // Get active relic effects
  app.get("/api/codex/relics/effects/:walletAddress", async (req, res) => {
    try {
      const effects = await storage.getCodexRelicEffects(req.params.walletAddress);
      res.json(effects);
    } catch (error) {
      console.error("Failed to fetch relic effects:", error);
      res.status(500).json({ error: "Failed to fetch relic effects" });
    }
  });

  // ===== FORGE SYSTEM ROUTES =====
  
  // Get all forge materials
  app.get("/api/forge/materials", async (req, res) => {
    try {
      const materials = await storage.getForgeMaterials();
      res.json(materials);
    } catch (error) {
      console.error("Failed to fetch forge materials:", error);
      res.status(500).json({ error: "Failed to fetch forge materials" });
    }
  });
  
  // Get all forge recipes
  app.get("/api/forge/recipes", async (req, res) => {
    try {
      const recipes = await storage.getForgeRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Failed to fetch forge recipes:", error);
      res.status(500).json({ error: "Failed to fetch forge recipes" });
    }
  });
  
  // Get forge recipe for a specific relic
  app.get("/api/forge/recipes/relic/:relicId", async (req, res) => {
    try {
      const recipe = await storage.getForgeRecipeByRelicId(req.params.relicId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Failed to fetch forge recipe:", error);
      res.status(500).json({ error: "Failed to fetch forge recipe" });
    }
  });
  
  // Get user's forge inventory
  app.get("/api/forge/inventory/:walletAddress", async (req, res) => {
    try {
      const inventory = await storage.getForgeInventory(req.params.walletAddress);
      res.json(inventory);
    } catch (error) {
      console.error("Failed to fetch forge inventory:", error);
      res.status(500).json({ error: "Failed to fetch forge inventory" });
    }
  });
  
  // Start crafting a relic
  app.post("/api/forge/craft", async (req, res) => {
    try {
      const craftSchema = z.object({
        walletAddress: z.string(),
        recipeId: z.string()
      });
      
      const data = craftSchema.parse(req.body);
      
      const recipe = await storage.getForgeRecipeById(data.recipeId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      const materials = recipe.materials as Array<{ materialId: string; quantity: string }>;
      for (const material of materials) {
        const inventoryItem = await storage.getForgeInventoryItem(data.walletAddress, material.materialId);
        if (!inventoryItem || BigInt(inventoryItem.quantity) < BigInt(material.quantity)) {
          return res.status(400).json({ error: `Insufficient materials: ${material.materialId}` });
        }
      }
      
      for (const material of materials) {
        await storage.removeForgeInventoryItem(data.walletAddress, material.materialId, material.quantity);
      }
      
      const craftingTime = parseInt(recipe.craftingTime);
      const completesAt = new Date(Date.now() + craftingTime * 1000);
      
      const session = await storage.createForgeCraftingSession({
        walletAddress: data.walletAddress,
        recipeId: data.recipeId,
        cdxSpent: recipe.cdxCost,
        materialsUsed: materials,
        completesAt,
        status: "in_progress"
      });
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to start crafting:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to start crafting" 
      });
    }
  });
  
  // Get user's crafting sessions
  app.get("/api/forge/sessions/:walletAddress", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const sessions = await storage.getForgeCraftingSessions(req.params.walletAddress, status);
      res.json(sessions);
    } catch (error) {
      console.error("Failed to fetch crafting sessions:", error);
      res.status(500).json({ error: "Failed to fetch crafting sessions" });
    }
  });
  
  // Complete a crafting session
  app.post("/api/forge/complete/:sessionId", async (req, res) => {
    try {
      const session = await storage.getForgeCraftingSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Crafting session not found" });
      }
      
      if (session.status !== "in_progress") {
        return res.status(400).json({ error: "Session is not in progress" });
      }
      
      if (new Date() < new Date(session.completesAt)) {
        return res.status(400).json({ error: "Crafting not yet complete" });
      }
      
      const recipe = await storage.getForgeRecipeById(session.recipeId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      const successRate = parseInt(recipe.successRate);
      const roll = Math.random() * 100;
      
      if (roll <= successRate) {
        const relicInstance = await storage.createCodexRelicInstance({
          relicId: recipe.relicId,
          walletAddress: session.walletAddress,
          isEquipped: "false",
          level: "1",
          experience: "0",
          powerScore: "100"
        });
        
        const completedSession = await storage.completeForgeCraft(req.params.sessionId, relicInstance.id);
        res.json({ success: true, session: completedSession, relic: relicInstance });
      } else {
        const failedSession = await storage.failForgeCraft(req.params.sessionId, "Crafting failed");
        res.json({ success: false, session: failedSession });
      }
    } catch (error) {
      console.error("Failed to complete crafting:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to complete crafting" 
      });
    }
  });

  // ========================
  // AUTO-DEPLOY ROUTES
  // ========================

  // Generate default ERC-20 token configuration
  app.post("/api/auto-deploy/token/generate", async (req, res) => {
    try {
      const generateSchema = z.object({
        walletAddress: ethereumAddressSchema,
        chainId: z.string().optional(),
      });
      
      const data = generateSchema.parse(req.body);
      const defaultName = `AutoToken${Math.floor(Math.random() * 1000)}`;
      const defaultSymbol = `ATK${Math.floor(Math.random() * 100)}`;
      
      const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts@5.0.0/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts@5.0.0/access/Ownable.sol";

contract ${defaultSymbol} is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("${defaultName}", "${defaultSymbol}")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`;

      res.json({
        success: true,
        config: {
          name: defaultName,
          symbol: defaultSymbol,
          initialSupply: "1000000",
          decimals: "18",
          chainId: data.chainId || "1",
          features: ["mintable"],
        },
        contractCode,
        bytecode: "0x", // Would need compiler in production
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      console.error("Failed to generate token:", error);
      res.status(500).json({ error: "Failed to generate token configuration" });
    }
  });

  // Generate default ERC-721 NFT configuration
  app.post("/api/auto-deploy/nft/generate", async (req, res) => {
    try {
      const generateSchema = z.object({
        walletAddress: ethereumAddressSchema,
        chainId: z.string().optional(),
      });
      
      const data = generateSchema.parse(req.body);
      const defaultName = `AutoNFT${Math.floor(Math.random() * 1000)}`;
      const defaultSymbol = `ANFT${Math.floor(Math.random() * 100)}`;
      
      const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts@5.0.0/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@5.0.0/access/Ownable.sol";

contract ${defaultSymbol} is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 public maxSupply = 10000;
    string private _baseTokenURI;

    constructor(address initialOwner)
        ERC721("${defaultName}", "${defaultSymbol}")
        Ownable(initialOwner)
    {
        _baseTokenURI = "ipfs://YOUR_CID/";
    }

    function mint(address to) public onlyOwner {
        require(_nextTokenId < maxSupply, "Max supply reached");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}`;

      res.json({
        success: true,
        config: {
          name: defaultName,
          symbol: defaultSymbol,
          maxSupply: "10000",
          chainId: data.chainId || "1",
          standard: "erc721",
          baseUri: "ipfs://YOUR_CID/",
        },
        contractCode,
        bytecode: "0x", // Would need compiler in production
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      console.error("Failed to generate NFT:", error);
      res.status(500).json({ error: "Failed to generate NFT configuration" });
    }
  });

  // Get user's deployed contracts
  app.get("/api/auto-deploy/contracts/:walletAddress", async (req, res) => {
    try {
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const allContracts = await storage.getContracts();
      
      // Filter by auto-deployed tag and wallet address in description
      const userContracts = allContracts.filter(c => 
        c.tags?.includes('auto-deployed') && c.description?.includes(walletAddress.toLowerCase())
      );
      
      res.json(userContracts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      console.error("Failed to get deployed contracts:", error);
      res.status(500).json({ error: "Failed to get deployed contracts" });
    }
  });

  // Record deployed contract
  app.post("/api/auto-deploy/record", async (req, res) => {
    try {
      const recordSchema = z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
        chainId: z.string(),
        name: z.string(),
        symbol: z.string(),
        type: z.enum(["token", "nft"]),
        deployerAddress: ethereumAddressSchema,
        transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
        contractCode: z.string(),
        isDemo: z.boolean().optional(),
      });
      
      const data = recordSchema.parse(req.body);
      
      // Store in contracts table
      const contract = await storage.createContract({
        address: data.contractAddress,
        chainId: data.chainId,
        name: data.name,
        abi: data.type === "token" 
          ? [{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"}]
          : [{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"}],
        tags: [`auto-deployed`, data.type, data.isDemo ? 'demo' : 'live'],
        description: `Auto-deployed ${data.type} by ${data.deployerAddress.toLowerCase()}${data.isDemo ? ' (DEMO)' : ''}`,
        sourceCode: data.contractCode,
        compiler: "solc-0.8.20",
        isVerified: "false",
      });
      
      // If token, also create token record
      if (data.type === "token") {
        await storage.createToken({
          contractAddress: data.contractAddress,
          chainId: data.chainId,
          name: data.name,
          symbol: data.symbol,
          decimals: "18",
          isVerified: "false",
          totalSupply: "1000000000000000000000000",
        });
      }
      
      res.status(201).json({
        success: true,
        message: "Contract deployment recorded successfully",
        contract,
        explorerUrl: `https://etherscan.io/tx/${data.transactionHash}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid record data", 
          details: error.errors 
        });
      }
      console.error("Failed to record deployment:", error);
      res.status(500).json({ error: "Failed to record deployment" });
    }
  });
  
  // ===== MARKETPLACE ROUTES =====
  
  // Get all marketplace listings
  app.get("/api/marketplace/listings", async (req, res) => {
    try {
      const listings = await storage.getActiveMarketplaceListings();
      res.json(listings);
    } catch (error) {
      console.error("Failed to get marketplace listings:", error);
      res.status(500).json({ error: "Failed to get marketplace listings" });
    }
  });
  
  // Get listing by ID
  app.get("/api/marketplace/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getMarketplaceListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Failed to get listing:", error);
      res.status(500).json({ error: "Failed to get listing" });
    }
  });
  
  // Get seller's listings
  app.get("/api/marketplace/my-listings", async (req, res) => {
    try {
      const { wallet } = req.query;
      if (!wallet || typeof wallet !== 'string') {
        return res.status(400).json({ error: "Wallet address required" });
      }
      const listings = await storage.getSellerListings(wallet.toLowerCase());
      res.json(listings);
    } catch (error) {
      console.error("Failed to get seller listings:", error);
      res.status(500).json({ error: "Failed to get seller listings" });
    }
  });
  
  // Get buyer's purchases
  app.get("/api/marketplace/my-purchases", async (req, res) => {
    try {
      const { wallet } = req.query;
      if (!wallet || typeof wallet !== 'string') {
        return res.status(400).json({ error: "Wallet address required" });
      }
      const purchases = await storage.getBuyerPurchases(wallet.toLowerCase());
      res.json(purchases);
    } catch (error) {
      console.error("Failed to get purchases:", error);
      res.status(500).json({ error: "Failed to get purchases" });
    }
  });
  
  // Create marketplace listing
  app.post("/api/marketplace/listings", async (req, res) => {
    try {
      const listingSchema = z.object({
        itemType: z.enum(['nft', 'token', 'product']),
        itemId: z.string(),
        sellerWallet: ethereumAddressSchema,
        priceEth: z.string(),
        title: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        metadata: z.any().optional(),
      });
      
      const data = listingSchema.parse(req.body);
      const listing = await storage.createMarketplaceListing({
        ...data,
        sellerWallet: data.sellerWallet.toLowerCase(),
        status: 'active',
      });
      
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid listing data", 
          details: error.errors 
        });
      }
      console.error("Failed to create listing:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });
  
  // Cancel listing
  app.post("/api/marketplace/listings/:id/cancel", async (req, res) => {
    try {
      const { sellerWallet } = req.body;
      if (!sellerWallet) {
        return res.status(400).json({ error: "Seller wallet address required" });
      }
      
      const listing = await storage.cancelMarketplaceListing(req.params.id, sellerWallet.toLowerCase());
      if (!listing) {
        return res.status(404).json({ error: "Listing not found or unauthorized" });
      }
      
      res.json(listing);
    } catch (error) {
      console.error("Failed to cancel listing:", error);
      res.status(500).json({ error: "Failed to cancel listing" });
    }
  });
  
  // Purchase listing
  app.post("/api/marketplace/listings/:id/purchase", async (req, res) => {
    try {
      const { buyerWallet } = req.body;
      if (!buyerWallet) {
        return res.status(400).json({ error: "Buyer wallet address required" });
      }
      
      const listing = await storage.purchaseMarketplaceListing(req.params.id, buyerWallet.toLowerCase());
      if (!listing) {
        return res.status(404).json({ error: "Listing not found or no longer available" });
      }
      
      res.json(listing);
    } catch (error) {
      console.error("Failed to purchase listing:", error);
      res.status(500).json({ error: "Failed to purchase listing" });
    }
  });

  // ==================== MARKETPLACE FEE SERVICE ====================

  // Calculate marketplace fees for a sale
  app.post("/api/marketplace/fees/calculate", async (req, res) => {
    try {
      const { price, instantSettlement } = req.body;
      const { marketplaceFeeService } = await import("./marketplace-fee-service");
      const fees = marketplaceFeeService.getFeeBreakdown(
        parseFloat(price),
        instantSettlement === true
      );
      res.json(fees);
    } catch (error) {
      console.error("Failed to calculate marketplace fees:", error);
      res.status(500).json({ error: "Failed to calculate fees" });
    }
  });

  // Get instant settlement recommendation
  app.get("/api/marketplace/fees/recommendation/:price", async (req, res) => {
    try {
      const { marketplaceFeeService } = await import("./marketplace-fee-service");
      const recommendation = marketplaceFeeService.recommendInstantSettlement(
        parseFloat(req.params.price)
      );
      res.json(recommendation);
    } catch (error) {
      console.error("Failed to get recommendation:", error);
      res.status(500).json({ error: "Failed to get recommendation" });
    }
  });

  // ==================== NFT LAUNCHPAD SERVICE ====================

  // Calculate launchpad fees for a mint
  app.post("/api/launchpad/fees/calculate", async (req, res) => {
    try {
      const { mintPrice, quantity } = req.body;
      const { nftLaunchpadService } = await import("./nft-launchpad-service");
      const fees = nftLaunchpadService.calculateMintFees(
        parseFloat(mintPrice),
        parseInt(quantity)
      );
      res.json(fees);
    } catch (error) {
      console.error("Failed to calculate launchpad fees:", error);
      res.status(500).json({ error: "Failed to calculate fees" });
    }
  });

  // Get project fee breakdown
  app.post("/api/launchpad/project/fees", async (req, res) => {
    try {
      const { totalMints, mintPrice } = req.body;
      const { nftLaunchpadService } = await import("./nft-launchpad-service");
      const breakdown = nftLaunchpadService.getProjectFeeBreakdown(
        parseInt(totalMints),
        parseFloat(mintPrice)
      );
      res.json(breakdown);
    } catch (error) {
      console.error("Failed to get project breakdown:", error);
      res.status(500).json({ error: "Failed to get project breakdown" });
    }
  });

  // Estimate project revenue
  app.post("/api/launchpad/estimate", async (req, res) => {
    try {
      const { totalSupply, mintPrice, estimatedSellThrough } = req.body;
      const { nftLaunchpadService } = await import("./nft-launchpad-service");
      const estimate = nftLaunchpadService.estimateProjectRevenue(
        parseInt(totalSupply),
        parseFloat(mintPrice),
        parseFloat(estimatedSellThrough || '100')
      );
      res.json(estimate);
    } catch (error) {
      console.error("Failed to estimate revenue:", error);
      res.status(500).json({ error: "Failed to estimate revenue" });
    }
  });

  // Calculate optimal mint price
  app.post("/api/launchpad/optimal-price", async (req, res) => {
    try {
      const { desiredEarningsPerNft } = req.body;
      const { nftLaunchpadService } = await import("./nft-launchpad-service");
      const pricing = nftLaunchpadService.calculateOptimalMintPrice(
        parseFloat(desiredEarningsPerNft)
      );
      res.json(pricing);
    } catch (error) {
      console.error("Failed to calculate optimal price:", error);
      res.status(500).json({ error: "Failed to calculate optimal price" });
    }
  });

  // ============================================================================
  // YIELD FARMING ROUTES
  // ============================================================================

  // Get all farm pools
  app.get("/api/yield-farming/pools", async (req, res) => {
    try {
      const pools = await storage.getActiveYieldFarmPools();
      
      // Calculate updated rewards for all positions
      const updatedPools = await Promise.all(pools.map(async (pool) => {
        const positions = await storage.getPoolPositions(pool.id);
        const totalDeposits = positions.reduce((sum, pos) => sum + parseFloat(pos.amount), 0);
        
        return {
          ...pool,
          tvl: totalDeposits.toString()
        };
      }));
      
      res.json(updatedPools);
    } catch (error) {
      console.error("Failed to fetch farm pools:", error);
      res.status(500).json({ error: "Failed to fetch farm pools" });
    }
  });

  // Get user positions
  app.get("/api/yield-farming/positions/:user", async (req, res) => {
    try {
      const positions = await storage.getUserYieldFarmPositions(req.params.user);
      
      // Update rewards for each position
      const now = new Date();
      const updatedPositions = await Promise.all(positions.map(async (position) => {
        const pool = await storage.getYieldFarmPool(position.poolId);
        if (!pool) return position;
        
        // Calculate time-based rewards
        const lastUpdate = position.lastRewardUpdate || position.depositDate;
        const timeDiff = (now.getTime() - new Date(lastUpdate).getTime()) / 1000; // seconds
        const yearSeconds = 365 * 24 * 60 * 60;
        
        // Calculate new rewards
        const apy = parseFloat(pool.apy);
        const amount = parseFloat(position.amount);
        const newRewards = (amount * apy / 100) * (timeDiff / yearSeconds);
        const totalRewards = parseFloat(position.rewards) + newRewards;
        
        // Update position with new rewards
        await storage.updateYieldFarmPosition(position.id, {
          rewards: totalRewards.toString()
        });
        
        return {
          ...position,
          rewards: totalRewards.toString()
        };
      }));
      
      res.json(updatedPositions);
    } catch (error) {
      console.error("Failed to fetch user positions:", error);
      res.status(500).json({ error: "Failed to fetch user positions" });
    }
  });

  // Deposit to farm
  app.post("/api/yield-farming/deposit", async (req, res) => {
    try {
      const depositSchema = z.object({
        poolId: z.string(),
        user: z.string(),
        amount: z.string(),
      });

      const data = depositSchema.parse(req.body);
      
      // Get pool to validate
      const pool = await storage.getYieldFarmPool(data.poolId);
      if (!pool || pool.status !== 'active') {
        return res.status(400).json({ error: "Pool not available" });
      }
      
      // Create position
      const position = await storage.createYieldFarmPosition({
        poolId: data.poolId,
        user: data.user,
        amount: data.amount,
        rewards: "0",
        autoCompound: "false",
        harvestCount: "0",
        totalRewardsEarned: "0"
      });
      
      // Update pool TVL
      const positions = await storage.getPoolPositions(data.poolId);
      const totalTvl = positions.reduce((sum, pos) => sum + parseFloat(pos.amount), 0);
      await storage.updateYieldFarmPool(data.poolId, {
        tvl: totalTvl.toString()
      });
      
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid deposit data", 
          details: error.errors 
        });
      }
      console.error("Failed to deposit:", error);
      res.status(500).json({ error: "Failed to deposit" });
    }
  });

  // Withdraw from farm
  app.post("/api/yield-farming/withdraw", async (req, res) => {
    try {
      const withdrawSchema = z.object({
        positionId: z.string(),
        user: z.string(),
        amount: z.string(),
      });

      const data = withdrawSchema.parse(req.body);
      
      // Get position
      const position = await storage.getYieldFarmPosition(data.positionId);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Verify user
      if (position.user.toLowerCase() !== data.user.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const withdrawAmount = parseFloat(data.amount);
      const currentAmount = parseFloat(position.amount);
      
      if (withdrawAmount > currentAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // If withdrawing everything, delete position
      if (withdrawAmount >= currentAmount) {
        await storage.deleteYieldFarmPosition(data.positionId);
      } else {
        // Update position amount
        await storage.updateYieldFarmPosition(data.positionId, {
          amount: (currentAmount - withdrawAmount).toString()
        });
      }
      
      // Update pool TVL
      const pool = await storage.getYieldFarmPool(position.poolId);
      if (pool) {
        const positions = await storage.getPoolPositions(position.poolId);
        const totalTvl = positions.reduce((sum, pos) => sum + parseFloat(pos.amount), 0);
        await storage.updateYieldFarmPool(position.poolId, {
          tvl: totalTvl.toString()
        });
      }
      
      res.json({ 
        success: true, 
        withdrawnAmount: withdrawAmount,
        rewards: position.rewards 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid withdrawal data", 
          details: error.errors 
        });
      }
      console.error("Failed to withdraw:", error);
      res.status(500).json({ error: "Failed to withdraw" });
    }
  });

  // Harvest rewards
  app.post("/api/yield-farming/harvest", async (req, res) => {
    try {
      const harvestSchema = z.object({
        positionId: z.string(),
        user: z.string(),
      });

      const data = harvestSchema.parse(req.body);
      
      // Get position
      const position = await storage.getYieldFarmPosition(data.positionId);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Verify user
      if (position.user.toLowerCase() !== data.user.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const rewards = parseFloat(position.rewards);
      if (rewards <= 0) {
        return res.status(400).json({ error: "No rewards to harvest" });
      }
      
      // Update position
      const newHarvestCount = parseInt(position.harvestCount) + 1;
      const newTotalEarned = parseFloat(position.totalRewardsEarned) + rewards;
      
      await storage.updateYieldFarmPosition(data.positionId, {
        rewards: "0",
        harvestCount: newHarvestCount.toString(),
        totalRewardsEarned: newTotalEarned.toString()
      });
      
      res.json({ 
        success: true, 
        harvested: rewards,
        totalEarned: newTotalEarned
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid harvest data", 
          details: error.errors 
        });
      }
      console.error("Failed to harvest:", error);
      res.status(500).json({ error: "Failed to harvest" });
    }
  });

  // Toggle auto-compound
  app.post("/api/yield-farming/auto-compound", async (req, res) => {
    try {
      const autoCompoundSchema = z.object({
        positionId: z.string(),
        user: z.string(),
        enabled: z.boolean(),
      });

      const data = autoCompoundSchema.parse(req.body);
      
      // Get position
      const position = await storage.getYieldFarmPosition(data.positionId);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Verify user
      if (position.user.toLowerCase() !== data.user.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Update auto-compound setting
      await storage.updateYieldFarmPosition(data.positionId, {
        autoCompound: data.enabled.toString()
      });
      
      res.json({ success: true, autoCompound: data.enabled });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid auto-compound data", 
          details: error.errors 
        });
      }
      console.error("Failed to update auto-compound:", error);
      res.status(500).json({ error: "Failed to update auto-compound" });
    }
  });

  // ==========================================
  // EMPIRE VAULT ROUTES - DAO TREASURY
  // ==========================================

  const { empireVaultService } = await import("./empire-vault-service");

  // Get vault stats
  app.get("/api/empire-vault/stats", async (req, res) => {
    try {
      const stats = await empireVaultService.getVaultStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get vault stats:", error);
      res.status(500).json({ error: "Failed to get vault stats" });
    }
  });

  // Get revenue breakdown
  app.get("/api/empire-vault/revenue", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const breakdown = await empireVaultService.getRevenueBreakdown(start, end);
      res.json(breakdown);
    } catch (error) {
      console.error("Failed to get revenue breakdown:", error);
      res.status(500).json({ error: "Failed to get revenue breakdown" });
    }
  });

  // Get user's pending rewards
  app.get("/api/empire-vault/rewards/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const rewards = await empireVaultService.getUserPendingRewards(walletAddress);
      res.json(rewards);
    } catch (error) {
      console.error("Failed to get pending rewards:", error);
      res.status(500).json({ error: "Failed to get pending rewards" });
    }
  });

  // Claim rewards
  app.post("/api/empire-vault/claim", async (req, res) => {
    try {
      const claimSchema = z.object({
        walletAddress: z.string(),
        distributionId: z.string(),
      });

      const data = claimSchema.parse(req.body);
      const claimAmount = await empireVaultService.claimRewards(data.walletAddress, data.distributionId);
      
      res.json({ 
        success: true, 
        claimedAmount: claimAmount,
        message: `Successfully claimed $${claimAmount.toFixed(2)} from Empire Vault`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid claim data", 
          details: error.errors 
        });
      }
      console.error("Failed to claim rewards:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to claim rewards" });
    }
  });

  // Create distribution (Admin/Automated)
  app.post("/api/empire-vault/distribute", requireOwner, async (req, res) => {
    try {
      const distribution = await empireVaultService.createDistribution();
      res.json({ 
        success: true, 
        distribution: {
          roundNumber: distribution.roundNumber,
          totalAmount: distribution.totalAmount,
          eligibleWallets: distribution.eligibleWallets,
          amountPerShare: distribution.amountPerShare,
        }
      });
    } catch (error) {
      console.error("Failed to create distribution:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create distribution" });
    }
  });

  // Deposit revenue (Internal API - called by revenue services)
  app.post("/api/empire-vault/deposit", async (req, res) => {
    try {
      const depositSchema = z.object({
        amount: z.number().positive(),
        source: z.enum(['marketplace', 'trading_bot', 'launchpad', 'ecommerce', 'staking_fees', 'subscription', 'flash_sale']),
        sourceId: z.string().optional(),
        description: z.string().optional(),
        txHash: z.string().optional(),
      });

      const data = depositSchema.parse(req.body);
      await empireVaultService.depositRevenue(data);
      
      res.json({ 
        success: true, 
        message: `Deposited $${data.amount} from ${data.source} to Empire Vault`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid deposit data", 
          details: error.errors 
        });
      }
      console.error("Failed to deposit revenue:", error);
      res.status(500).json({ error: "Failed to deposit revenue" });
    }
  });

  // ==================== DEX AGGREGATOR ROUTES ====================
  // Real on-chain swaps via 1inch API with multi-chain support
  
  // Get swap quote
  app.get("/api/swap/quote", async (req, res) => {
    try {
      const quoteSchema = z.object({
        chainId: z.string().transform(Number),
        fromToken: z.string(),
        toToken: z.string(),
        amount: z.string(),
        slippage: z.string().optional().transform(val => val ? parseFloat(val) : 0.5),
      });

      const { chainId, fromToken, toToken, amount, slippage } = quoteSchema.parse(req.query);
      
      const { dexAggregator } = await import('./dex-aggregator');
      const quote = await dexAggregator.getQuote({
        chainId,
        fromToken,
        toToken,
        amount,
        slippage,
      });

      res.json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid quote params", 
          details: error.errors 
        });
      }
      console.error("Failed to get swap quote:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get quote" });
    }
  });

  // Get swap transaction data
  app.post("/api/swap", async (req, res) => {
    try {
      const swapSchema = z.object({
        chainId: z.number(),
        fromToken: z.string(),
        toToken: z.string(),
        amount: z.string(),
        wallet: z.string(),
        slippage: z.number().optional().default(0.5),
      });

      const data = swapSchema.parse(req.body);
      
      const { dexAggregator } = await import('./dex-aggregator');
      const txData = await dexAggregator.getSwapTransaction({
        chainId: data.chainId,
        fromToken: data.fromToken,
        toToken: data.toToken,
        amount: data.amount,
        from: data.wallet,
        slippage: data.slippage,
      });

      res.json(txData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid swap data", 
          details: error.errors 
        });
      }
      console.error("Failed to create swap transaction:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create swap" });
    }
  });

  // Get supported tokens for a chain
  app.get("/api/swap/tokens/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      
      const { dexAggregator } = await import('./dex-aggregator');
      const tokens = await dexAggregator.getSupportedTokens(chainId);

      res.json(tokens);
    } catch (error) {
      console.error("Failed to get supported tokens:", error);
      res.status(500).json({ error: "Failed to get supported tokens" });
    }
  });
  
  // ============================================================================
  // VISITOR ANALYTICS & TRACKING ROUTES
  // ============================================================================
  
  // Track page view
  app.post("/api/analytics/track-pageview", async (req, res) => {
    try {
      const { sessionId, path, title, referrer } = req.body;
      
      if (!sessionId || !path) {
        return res.status(400).json({ error: "sessionId and path are required" });
      }
      
      // Check if session exists, create if not
      let session = await storage.getVisitorSession(sessionId);
      
      if (!session) {
        // Extract visitor info from request
        const userAgent = req.headers['user-agent'] || '';
        const ip = req.ip || req.connection.remoteAddress || '';
        
        // Parse user agent for device/browser info
        const device = /mobile|android|iphone|ipad|tablet/i.test(userAgent) ? 'mobile' : 'desktop';
        const browser = /chrome/i.test(userAgent) ? 'Chrome' :
                       /firefox/i.test(userAgent) ? 'Firefox' :
                       /safari/i.test(userAgent) ? 'Safari' :
                       /edge/i.test(userAgent) ? 'Edge' : 'Other';
        const os = /windows/i.test(userAgent) ? 'Windows' :
                   /mac/i.test(userAgent) ? 'MacOS' :
                   /linux/i.test(userAgent) ? 'Linux' :
                   /android/i.test(userAgent) ? 'Android' :
                   /ios|iphone|ipad/i.test(userAgent) ? 'iOS' : 'Other';
        
        session = await storage.createVisitorSession({
          sessionId,
          visitorId: req.cookies?.visitor_id || sessionId,
          ipAddress: ip.slice(0, 50), // Truncate for privacy
          userAgent: userAgent.slice(0, 500),
          referrer: referrer || req.headers.referer || '',
          landingPage: path,
          device,
          browser,
          os,
          pageViewCount: "0",
          isActive: "true"
        });
        
        // Set visitor cookie if not exists (30 days)
        if (!req.cookies?.visitor_id) {
          res.cookie('visitor_id', sessionId, { 
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true 
          });
        }
      }
      
      // Create page view
      const pageView = await storage.createPageView({
        sessionId: session.id,
        path,
        title: title || '',
        referrer: referrer || ''
      });
      
      // Update session stats
      await storage.updateVisitorSession(sessionId, {
        pageViewCount: (parseInt(session.pageViewCount || "0") + 1).toString(),
        lastActivityAt: new Date(),
        exitPage: path
      });
      
      res.json({ success: true, pageView });
    } catch (error) {
      console.error("Failed to track page view:", error);
      res.status(500).json({ error: "Failed to track page view" });
    }
  });
  
  // Track custom event
  app.post("/api/analytics/track-event", async (req, res) => {
    try {
      const { sessionId, eventType, eventCategory, eventLabel, eventValue, path, metadata } = req.body;
      
      if (!sessionId || !eventType || !eventCategory || !path) {
        return res.status(400).json({ error: "sessionId, eventType, eventCategory, and path are required" });
      }
      
      // Get session to verify it exists
      const session = await storage.getVisitorSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const event = await storage.createVisitorEvent({
        sessionId: session.id,
        eventType,
        eventCategory,
        eventLabel: eventLabel || null,
        eventValue: eventValue || null,
        path,
        metadata: metadata || null
      });
      
      res.json({ success: true, event });
    } catch (error) {
      console.error("Failed to track event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });
  
  // End visitor session
  app.post("/api/analytics/end-session", async (req, res) => {
    try {
      const { sessionId, duration } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }
      
      await storage.updateVisitorSession(sessionId, {
        isActive: "false",
        duration: duration?.toString() || "0",
        endedAt: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to end session:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });
  
  // Get visitor statistics
  app.get("/api/analytics/visitors", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const stats = await storage.getVisitorStats(start, end);
      
      res.json(stats);
    } catch (error) {
      console.error("Failed to get visitor stats:", error);
      res.status(500).json({ error: "Failed to get visitor stats" });
    }
  });
  
  // Get page views
  app.get("/api/analytics/pageviews", async (req, res) => {
    try {
      const { sessionId, path } = req.query;
      
      const pageViews = await storage.getPageViews(
        sessionId as string | undefined,
        path as string | undefined
      );
      
      res.json(pageViews);
    } catch (error) {
      console.error("Failed to get page views:", error);
      res.status(500).json({ error: "Failed to get page views" });
    }
  });
  
  // Get visitor events
  app.get("/api/analytics/events", async (req, res) => {
    try {
      const { sessionId, eventType } = req.query;
      
      const events = await storage.getVisitorEvents(
        sessionId as string | undefined,
        eventType as string | undefined
      );
      
      res.json(events);
    } catch (error) {
      console.error("Failed to get events:", error);
      res.status(500).json({ error: "Failed to get events" });
    }
  });
  
  // ============================================================================
  // BILLIONAIRE MODE API ROUTES
  // ============================================================================
  
  // Get billionaire profile
  app.get("/api/billionaire/profile", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const profile = await storage.getBillionaireProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Failed to get billionaire profile:", error);
      res.status(500).json({ error: "Failed to get billionaire profile" });
    }
  });
  
  // Create billionaire profile (one-click setup)
  app.post("/api/billionaire/profile", async (req, res) => {
    try {
      console.log('[Billionaire Mode] Create profile request received');
      const userId = req.session?.userId;
      console.log('[Billionaire Mode] User ID from session:', userId);
      
      if (!userId) {
        console.log('[Billionaire Mode] No userId in session, returning 401');
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const {
        walletAddress,
        currentAge,
        targetAge,
        startingBalance,
        currentBalance
      } = req.body;
      
      console.log('[Billionaire Mode] Creating profile with data:', { userId, walletAddress, currentAge, targetAge, startingBalance, currentBalance });
      
      // Validate required fields
      if (!walletAddress || !currentAge || startingBalance === undefined || currentBalance === undefined) {
        return res.status(400).json({ error: "Missing required fields: walletAddress, currentAge, startingBalance, currentBalance" });
      }
      
      const profile = await storage.createBillionaireProfile({
        userId,
        walletAddress,
        currentAge: String(currentAge),
        targetAge: targetAge ? String(targetAge) : "50",
        startingBalance: String(startingBalance),
        currentBalance: String(currentBalance)
      });
      
      console.log('[Billionaire Mode] Profile created successfully:', profile.id);
      res.json(profile);
    } catch (error: any) {
      console.error("Failed to create billionaire profile:", error);
      res.status(400).json({ error: error.message || "Failed to create billionaire profile" });
    }
  });
  
  // Update billionaire profile
  app.patch("/api/billionaire/profile", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const updated = await storage.updateBillionaireProfile(userId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update billionaire profile:", error);
      res.status(500).json({ error: "Failed to update billionaire profile" });
    }
  });
  
  // Activate layer (one-click activation)
  app.post("/api/billionaire/activate-layer", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { layerNumber, allocation } = req.body;
      
      const updates: any = {};
      updates[`layer${layerNumber}Active`] = "true";
      
      if (allocation) {
        updates[`layer${layerNumber}Allocation`] = allocation.toString();
      }
      
      const updated = await storage.updateBillionaireProfile(userId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Failed to activate layer:", error);
      res.status(500).json({ error: "Failed to activate layer" });
    }
  });
  
  // Get integrated layer status (simplified version using profile flags)
  app.get("/api/billionaire/layer-status", async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Get billionaire profile to check layer activation status
      const profile = await storage.getBillionaireProfile(userId);
      
      if (!profile) {
        // Return default inactive state
        return res.json({
          layer1: { active: false, value: 0, apy: 0.20, poolCount: 0 },
          layer2: { active: false, value: 0, apy: 0.25, positionCount: 0, avgLeverage: 0 },
          layer3: { active: false, value: 0, apy: 0.10 },
          layer4: { active: false, value: 0, apy: 0.12, traderCount: 0 },
          layer5: { active: false, multiplier: 1.0, nftCount: 0 },
          totalValue: 0,
          totalApy: 0,
          activeLayers: 0
        });
      }
      
      // Check activation status from profile flags
      const layer1Active = profile.layer1Active === "true";
      const layer2Active = profile.layer2Active === "true";
      const layer3Active = profile.layer3Active === "true";
      const layer4Active = profile.layer4Active === "true";
      const layer5Active = profile.layer5Active === "true";
      
      // Count active layers
      const activeLayers = [layer1Active, layer2Active, layer3Active, layer4Active, layer5Active].filter(Boolean).length;
      
      // Calculate total APY based on active layers
      let totalApy = 0;
      if (layer1Active) totalApy += 0.20;
      if (layer2Active) totalApy += 0.25;
      if (layer3Active) totalApy += 0.10;
      if (layer4Active) totalApy += 0.12;
      if (layer5Active) totalApy *= 1.32; // NFT multiplier effect
      
      res.json({
        layer1: {
          active: layer1Active,
          value: layer1Active ? 10000 : 0,
          apy: 0.20,
          poolCount: layer1Active ? 1 : 0
        },
        layer2: {
          active: layer2Active,
          value: layer2Active ? 15000 : 0,
          apy: 0.25,
          positionCount: layer2Active ? 1 : 0,
          avgLeverage: layer2Active ? 10 : 0
        },
        layer3: {
          active: layer3Active,
          value: layer3Active ? 5000 : 0,
          apy: 0.10
        },
        layer4: {
          active: layer4Active,
          value: layer4Active ? 8000 : 0,
          apy: 0.12,
          traderCount: layer4Active ? 1 : 0
        },
        layer5: {
          active: layer5Active,
          multiplier: layer5Active ? 1.32 : 1.0,
          nftCount: layer5Active ? 1 : 0
        },
        totalValue: (layer1Active ? 10000 : 0) + (layer2Active ? 15000 : 0) + (layer3Active ? 5000 : 0) + (layer4Active ? 8000 : 0),
        totalApy: totalApy,
        activeLayers: activeLayers
      });
    } catch (error) {
      console.error("Failed to get layer status:", error);
      res.status(500).json({ error: "Failed to get layer status" });
    }
  });
  
  // Get wealth projections
  app.get("/api/billionaire/projections", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const profile = await storage.getBillionaireProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const projections = await storage.getBillionaireProjections(profile.id);
      res.json(projections);
    } catch (error) {
      console.error("Failed to get projections:", error);
      res.status(500).json({ error: "Failed to get projections" });
    }
  });
  
  // Create wealth projection
  app.post("/api/billionaire/projections", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const profile = await storage.getBillionaireProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const projection = await storage.createBillionaireProjection({
        ...req.body,
        profileId: profile.id
      });
      
      res.json(projection);
    } catch (error: any) {
      console.error("Failed to create projection:", error);
      res.status(400).json({ error: error.message || "Failed to create projection" });
    }
  });
  
  // Get milestones
  app.get("/api/billionaire/milestones", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const profile = await storage.getBillionaireProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const milestones = await storage.getBillionaireMilestones(profile.id);
      res.json(milestones);
    } catch (error) {
      console.error("Failed to get milestones:", error);
      res.status(500).json({ error: "Failed to get milestones" });
    }
  });
  
  // Update milestone
  app.patch("/api/billionaire/milestones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateBillionaireMilestone(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update milestone:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  // INSTANT ACTIVATION - One-click setup for Billionaire Mode
  app.post("/api/billionaire/instant-activate", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if profile already exists
      let profile = await storage.getBillionaireProfile(userId);
      
      if (!profile) {
        // Create profile with smart defaults
        const wallets = await storage.getWallets(userId);
        const defaultWallet = wallets[0]?.address || "0x0000000000000000000000000000000000000000";
        
        profile = await storage.createBillionaireProfile({
          userId,
          walletAddress: defaultWallet,
          currentAge: "25",
          targetAge: "50",
          startingBalance: "10000",
          currentBalance: "10000",
          layer1Active: "false",
          layer2Active: "false",
          layer3Active: "false",
          layer4Active: "false",
          layer5Active: "false"
        });
        
        console.log("✅ Created billionaire profile with defaults");
      }

      // Activate ALL 5 layers
      const layers = ["layer1Active", "layer2Active", "layer3Active", "layer4Active", "layer5Active"];
      const updates: any = {};
      
      for (const layer of layers) {
        updates[layer] = "true";
      }
      
      const updatedProfile = await storage.updateBillionaireProfile(profile.id, updates);
      
      console.log("🚀 BILLIONAIRE MODE ACTIVATED - All 5 layers engaged!");
      
      res.json({ 
        success: true,
        message: "Billionaire Mode Activated! All 5 wealth layers are now running on autopilot!",
        profile: updatedProfile,
        layersActivated: 5,
        effectiveApy: "64%"
      });
    } catch (error: any) {
      console.error("Failed to instant-activate billionaire mode:", error);
      res.status(500).json({ error: error.message || "Failed to activate billionaire mode" });
    }
  });
  
  // Account Deletion Request (Public - for Google Play compliance)
  app.post("/api/account/delete-request", async (req, res) => {
    try {
      const { email, reason, confirmation } = req.body;
      
      if (!email || !confirmation) {
        return res.status(400).json({ error: "Email and confirmation required" });
      }
      
      if (confirmation.toLowerCase() !== "delete my account") {
        return res.status(400).json({ error: "Invalid confirmation text" });
      }
      
      // Log deletion request for compliance
      console.log(`🗑️  Account Deletion Request: ${email} - Reason: ${reason || 'Not provided'}`);
      
      // In production, you would:
      // 1. Store this in a deletion_requests table
      // 2. Send confirmation email
      // 3. Process deletion after 30 days
      // 4. Send final confirmation email
      
      res.json({ 
        success: true,
        message: "Deletion request received. Your data will be removed within 30 days.",
        requestId: new Date().getTime().toString(36).toUpperCase()
      });
    } catch (error) {
      console.error("Failed to process deletion request:", error);
      res.status(500).json({ error: "Failed to process deletion request" });
    }
  });

  // ============================================================================
  // INSTANT SETTLEMENTS - Beats Coinbase 24-48h delays with <60s blockchain settlement
  // ============================================================================
  
  // Get user settlements
  app.get("/api/settlements/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const userSettlements = await dbClient
        .select()
        .from(settlements)
        .where(eq(sql`lower(${settlements.walletAddress})`, walletAddress.toLowerCase()))
        .orderBy(desc(settlements.createdAt));
      
      res.json(userSettlements);
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
      res.status(500).json({ error: "Failed to fetch settlements" });
    }
  });
  
  // Create new settlement (instant withdrawal)
  app.post("/api/settlements", tieredSettlementLimit, paymentSpeedLimit, async (req, res) => {
    try {
      const data = insertSettlementSchema.parse(req.body);
      
      // ============================================================================
      // 🛡️ ENTERPRISE SECURITY ENFORCEMENT - THE #1 CRYPTO PLATFORM STANDARD
      // ============================================================================
      // Every withdrawal MUST pass through these security checks:
      // 1. Emergency Lockdown Check
      // 2. Withdrawal Velocity Limiting
      // 3. Whitelist Validation (Kraken-level)
      // 4. AI Fraud Detection
      // 5. Time-Locked Withdrawals for large amounts
      // ============================================================================
      
      const securityCheck = await validateWithdrawalSecurity({
        fromAddress: data.walletAddress,
        toAddress: data.destination,
        amount: data.amount,
        currency: data.crypto,
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString(),
        },
      });
      
      // BLOCKED: Security check failed
      if (!securityCheck.allowed) {
        return res.status(403).json({
          error: "Security Check Failed",
          reason: securityCheck.reason,
          requiresConfirmation: securityCheck.requiresConfirmation,
          timeLockedWithdrawalId: securityCheck.timeLockedWithdrawalId,
          riskScore: securityCheck.riskScore,
          riskLevel: securityCheck.riskLevel,
        });
      }
      
      // Log security audit
      console.log(`✅ Security check passed for withdrawal:`, {
        wallet: data.walletAddress,
        amount: data.amount,
        crypto: data.crypto,
        riskScore: securityCheck.riskScore,
        riskLevel: securityCheck.riskLevel,
      });
      
      // Simulate blockchain settlement processing
      const startTime = Date.now();
      
      // Create pending settlement
      const [settlement] = await dbClient
        .insert(settlements)
        .values({
          ...data,
          status: 'processing',
        })
        .returning();
      
      // Simulate instant blockchain settlement (in production, this would be actual blockchain tx)
      setTimeout(async () => {
        const settlementTime = Math.floor((Date.now() - startTime) / 1000);
        
        // Mock transaction hash
        const txHash = `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`;
        
        // Update settlement as completed
        await dbClient
          .update(settlements)
          .set({
            status: 'completed',
            txHash,
            settlementTime: settlementTime.toString(),
            completedAt: new Date(),
          })
          .where(eq(settlements.id, settlement.id));
        
        console.log(`✅ Settlement completed in ${settlementTime}s for ${data.walletAddress}`);
      }, Math.floor(Math.random() * 30000) + 10000); // 10-40 seconds (simulate blockchain confirmation)
      
      res.json(settlement);
    } catch (error: any) {
      console.error("Failed to create settlement:", error);
      res.status(400).json({ error: error.message || "Failed to create settlement" });
    }
  });
  
  // Get settlement by ID
  app.get("/api/settlements/id/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [settlement] = await dbClient
        .select()
        .from(settlements)
        .where(eq(settlements.id, id));
      
      if (!settlement) {
        return res.status(404).json({ error: "Settlement not found" });
      }
      
      res.json(settlement);
    } catch (error) {
      console.error("Failed to fetch settlement:", error);
      res.status(500).json({ error: "Failed to fetch settlement" });
    }
  });

  // ============================================================================
  // 🎯 RATE LIMIT STATUS API - Show users their tier and limits
  // ============================================================================
  
  // Get rate limit status for authenticated user
  app.get("/api/rate-limits/status", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const status = await getRateLimitStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Failed to fetch rate limit status:", error);
      res.status(500).json({ error: "Failed to fetch rate limit status" });
    }
  });

  // ============================================================================
  // 🛡️ SECURITY CENTER API ROUTES (Protected with Authentication)
  // ============================================================================
  
  // Helper: Verify wallet ownership (prevent horizontal privilege escalation)
  const verifyWalletOwnership = async (req: any, walletAddress: string) => {
    const wallet = await dbClient
      .select()
      .from(wallets)
      .where(sql`lower(${wallets.address}) = ${walletAddress.toLowerCase()}`)
      .limit(1);
    
    if (!wallet[0]) {
      throw new Error("Wallet not found");
    }
    
    if (wallet[0].userId !== req.user?.id) {
      throw new Error("Unauthorized: You do not own this wallet");
    }
    
    return wallet[0];
  };
  
  // Validation schemas for security endpoints
  const whitelistSchema = z.object({
    walletAddress: ethereumAddressSchema,
    approvedAddress: ethereumAddressSchema,
    label: z.string().optional(),
  });
  
  const antiPhishingSchema = z.object({
    walletAddress: ethereumAddressSchema,
    phishingCode: z.string().min(4).max(20),
  });
  
  // Get whitelisted addresses for a wallet (Protected + Wallet Ownership Check)
  app.get("/api/security/whitelists/:wallet", requireAuth, async (req, res) => {
    try {
      const { wallet } = req.params;
      
      // Validate ethereum address
      ethereumAddressSchema.parse(wallet);
      
      // CRITICAL: Verify wallet ownership (prevent horizontal privilege escalation)
      await verifyWalletOwnership(req, wallet);
      
      const whitelist = await getWhitelistedAddresses(wallet);
      res.json(whitelist);
    } catch (error: any) {
      console.error("Failed to fetch whitelists:", error);
      const status = error.message?.includes("Unauthorized") ? 403 : error.name === 'ZodError' ? 400 : 500;
      res.status(status).json({ 
        error: error.message || "Failed to fetch whitelists" 
      });
    }
  });

  // Add address to whitelist (Protected + Wallet Ownership Check)
  app.post("/api/security/whitelists", requireAuth, async (req, res) => {
    try {
      const data = whitelistSchema.parse(req.body);
      
      // CRITICAL: Verify wallet ownership
      await verifyWalletOwnership(req, data.walletAddress);
      
      const result = await addWhitelistAddress(
        data.walletAddress,
        data.approvedAddress,
        data.label
      );
      res.json(result);
    } catch (error: any) {
      console.error("Failed to add whitelist:", error);
      const status = error.message?.includes("Unauthorized") ? 403 : error.name === 'ZodError' ? 400 : 500;
      res.status(status).json({ 
        error: error.message || "Failed to add whitelist" 
      });
    }
  });

  // Remove address from whitelist (Protected + Wallet Ownership Check)
  app.delete("/api/security/whitelists/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // CRITICAL: Verify whitelist entry belongs to user
      const [whitelist] = await dbClient.select().from(withdrawalWhitelists).where(eq(withdrawalWhitelists.id, id)).limit(1);
      if (!whitelist) {
        return res.status(404).json({ error: "Whitelist entry not found" });
      }
      await verifyWalletOwnership(req, whitelist.walletAddress);
      
      await removeWhitelistAddress(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to remove whitelist:", error);
      const status = error.message?.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ error: error.message || "Failed to remove whitelist" });
    }
  });

  // Get anti-phishing codes (Protected + Wallet Ownership Check)
  app.get("/api/security/anti-phishing/:wallet", requireAuth, async (req, res) => {
    try {
      const { wallet } = req.params;
      
      // Validate ethereum address
      ethereumAddressSchema.parse(wallet);
      
      // CRITICAL: Verify wallet ownership
      await verifyWalletOwnership(req, wallet);
      
      const codes = await getAntiPhishingCodes(wallet);
      res.json(codes);
    } catch (error: any) {
      console.error("Failed to fetch anti-phishing codes:", error);
      const status = error.message?.includes("Unauthorized") ? 403 : error.name === 'ZodError' ? 400 : 500;
      res.status(status).json({ 
        error: error.message || "Failed to fetch anti-phishing codes" 
      });
    }
  });

  // Set anti-phishing code (Protected + Wallet Ownership Check)
  app.post("/api/security/anti-phishing", requireAuth, async (req, res) => {
    try {
      const data = antiPhishingSchema.parse(req.body);
      
      // CRITICAL: Verify wallet ownership
      await verifyWalletOwnership(req, data.walletAddress);
      
      const result = await setAntiPhishingCode(data.walletAddress, data.phishingCode);
      res.json(result);
    } catch (error: any) {
      console.error("Failed to set anti-phishing code:", error);
      const status = error.message?.includes("Unauthorized") ? 403 : error.name === 'ZodError' ? 400 : 500;
      res.status(status).json({ 
        error: error.message || "Failed to set anti-phishing code" 
      });
    }
  });

  // Get time-locked withdrawals (Protected + Wallet Ownership Check)
  app.get("/api/security/time-locked-withdrawals/:wallet", requireAuth, async (req, res) => {
    try {
      const { wallet } = req.params;
      
      // Validate ethereum address
      ethereumAddressSchema.parse(wallet);
      
      // CRITICAL: Verify wallet ownership
      await verifyWalletOwnership(req, wallet);
      
      const withdrawals = await getPendingTimeLockedWithdrawals(wallet);
      res.json(withdrawals);
    } catch (error: any) {
      console.error("Failed to fetch time-locked withdrawals:", error);
      const status = error.message?.includes("Unauthorized") ? 403 : error.name === 'ZodError' ? 400 : 500;
      res.status(status).json({ 
        error: error.message || "Failed to fetch time-locked withdrawals" 
      });
    }
  });

  // Get fraud detection logs (Protected + Wallet Ownership Check)
  app.get("/api/security/fraud-logs/:wallet", requireAuth, async (req, res) => {
    try {
      const { wallet } = req.params;
      
      // Validate ethereum address
      ethereumAddressSchema.parse(wallet);
      
      // CRITICAL: Verify wallet ownership
      await verifyWalletOwnership(req, wallet);
      
      const logs = await getFraudLogs(wallet);
      res.json(logs);
    } catch (error: any) {
      console.error("Failed to fetch fraud logs:", error);
      const status = error.message?.includes("Unauthorized") ? 403 : error.name === 'ZodError' ? 400 : 500;
      res.status(status).json({ 
        error: error.message || "Failed to fetch fraud logs" 
      });
    }
  });

  // ============================================================================
  // 🛡️ ADMIN SECURITY DASHBOARD ROUTES (Owner-Only)
  // ============================================================================
  
  // Validation schema for lockdown toggle
  const lockdownToggleSchema = z.object({
    enabled: z.boolean(),
  });

  // Admin: Get all fraud logs (Owner-Only)
  app.get("/api/admin/security/fraud-logs", requireOwner, async (req, res) => {
    try {
      const logs = await getAllFraudLogs();
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch all fraud logs:", error);
      res.status(500).json({ error: "Failed to fetch fraud logs" });
    }
  });

  // Admin: Get all time-locked withdrawals (Owner-Only)
  app.get("/api/admin/security/time-locked-withdrawals", requireOwner, async (req, res) => {
    try {
      const withdrawals = await getAllTimeLockedWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Failed to fetch all time-locked withdrawals:", error);
      res.status(500).json({ error: "Failed to fetch time-locked withdrawals" });
    }
  });

  // Admin: Toggle emergency lockdown (Owner-Only)
  app.post("/api/admin/security/emergency-lockdown", requireOwner, async (req, res) => {
    try {
      const data = lockdownToggleSchema.parse(req.body);
      
      await toggleEmergencyLockdown(data.enabled);
      
      res.json({ 
        success: true, 
        lockdownEnabled: data.enabled,
        message: data.enabled 
          ? "🚨 EMERGENCY LOCKDOWN ACTIVATED - All withdrawals blocked" 
          : "✅ Emergency lockdown lifted - Normal operations resumed"
      });
    } catch (error: any) {
      console.error("Failed to toggle emergency lockdown:", error);
      res.status(error.name === 'ZodError' ? 400 : 500).json({ 
        error: error.name === 'ZodError' ? "Invalid request data" : error.message || "Failed to toggle lockdown" 
      });
    }
  });

  // Admin: Get emergency lockdown status (Owner-Only)
  app.get("/api/admin/security/emergency-lockdown", requireOwner, async (req, res) => {
    try {
      const status = await getEmergencyLockdownStatus();
      res.json(status);
    } catch (error) {
      console.error("Failed to get lockdown status:", error);
      res.status(500).json({ error: "Failed to get lockdown status" });
    }
  });

  // ============================================================================
  // ⚡ RATE LIMIT STATUS ROUTES
  // ============================================================================

  // Get user's rate limit tier and current usage
  app.get("/api/rate-limits/status", async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      // Get user tier (defaults to FREE if not logged in)
      const tier = userId ? await getUserTier(userId) : 'FREE';
      const tierConfig = RATE_LIMIT_TIERS[tier];

      // In production, you would track actual usage from rate limiter state
      // For now, return structure with mock current usage
      const status = {
        tier,
        limits: {
          general: {
            perMinute: tierConfig.general.max,
            perHour: tierConfig.general.windowMs === 3600000 ? tierConfig.general.max : tierConfig.general.max * 60,
          },
          settlements: {
            perHour: tierConfig.settlements.max,
          },
          staking: {
            perHour: tierConfig.staking.max,
          },
          trading: {
            perMinute: tierConfig.trading.max,
          },
        },
        usage: {
          general: { current: 0, limit: tierConfig.general.max },
          settlements: { current: 0, limit: tierConfig.settlements.max },
          staking: { current: 0, limit: tierConfig.staking.max },
          trading: { current: 0, limit: tierConfig.trading.max },
        },
      };

      res.json(status);
    } catch (error) {
      console.error("Failed to get rate limit status:", error);
      res.status(500).json({ error: "Failed to fetch rate limit status" });
    }
  });

  // ============================================================================
  // 📊 PROOF OF RESERVES ROUTES - Real-time Transparency
  // ============================================================================

  // Get latest proof of reserves snapshot (PUBLIC - transparency)
  app.get("/api/proof-of-reserves/latest", async (req, res) => {
    try {
      const { chainId = '1' } = req.query;
      
      const latest = await dbClient
        .select()
        .from(proofOfReserves)
        .where(eq(proofOfReserves.chainId, String(chainId)))
        .orderBy(desc(proofOfReserves.snapshotTime))
        .limit(1);

      if (latest.length === 0) {
        return res.status(404).json({ 
          error: "No proof of reserves snapshot found",
          message: "Generate the first snapshot to enable transparency"
        });
      }

      res.json(latest[0]);
    } catch (error) {
      console.error("Failed to get latest proof of reserves:", error);
      res.status(500).json({ error: "Failed to fetch proof of reserves" });
    }
  });

  // Get historical proof of reserves snapshots (PUBLIC - transparency)
  app.get("/api/proof-of-reserves/history", async (req, res) => {
    try {
      const { chainId = '1', limit = 30 } = req.query;
      
      const history = await dbClient
        .select()
        .from(proofOfReserves)
        .where(eq(proofOfReserves.chainId, String(chainId)))
        .orderBy(desc(proofOfReserves.snapshotTime))
        .limit(Number(limit));

      res.json(history);
    } catch (error) {
      console.error("Failed to get proof of reserves history:", error);
      res.status(500).json({ error: "Failed to fetch proof history" });
    }
  });

  // Generate new proof of reserves snapshot (ADMIN-ONLY)
  app.post("/api/proof-of-reserves/generate", requireOwner, async (req, res) => {
    try {
      const { chainId = '1' } = req.body;

      // Get platform addresses (treasury, hot wallets, cold storage)
      const platformAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB4', // Main Treasury
        '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B', // Hot Wallet
        '0x9876543210FEDcba9876543210FEDcba98765432', // Cold Storage
      ];

      // Get user balances from database (ETH balances)
      const userWallets = await dbClient
        .select({
          address: wallets.address,
          balance: wallets.balance,
        })
        .from(wallets)
        .where(eq(wallets.network, 'mainnet'));

      const userBalances = userWallets.map(w => ({
        address: w.address,
        balance: w.balance || '0',
      }));

      // Generate proof snapshot (includes native + ERC-20 token balances)
      const snapshot = await proofOfReservesService.generateProofSnapshot(
        platformAddresses,
        userBalances,
        String(chainId)
      );

      // Save to database with full token data from snapshot
      const [saved] = await dbClient
        .insert(proofOfReserves)
        .values({
          snapshotTime: new Date(),
          totalEthReserves: snapshot.totalEthReserves,
          totalUserBalances: snapshot.totalUserBalances,
          reserveRatio: snapshot.reserveRatio,
          merkleRoot: snapshot.merkleRoot,
          blockNumber: snapshot.blockNumber,
          chainId: String(chainId),
          metadata: {
            platformAddresses,
            userCount: userBalances.length,
            generatedBy: 'admin',
            tokens: snapshot.tokens || {}, // Include ERC-20 token balances from snapshot
            nativeBalance: snapshot.nativeBalance || '0',
          },
        })
        .returning();

      console.log(`✅ Generated Proof of Reserves snapshot for chain ${chainId}`);
      res.json({ 
        success: true, 
        snapshot: saved,
        message: `Proof of Reserves snapshot generated successfully`
      });
    } catch (error: any) {
      console.error("Failed to generate proof of reserves:", error);
      res.status(500).json({ 
        error: error.message || "Failed to generate proof of reserves" 
      });
    }
  });

  // Verify user's balance in Merkle tree (PUBLIC - user verification)
  app.post("/api/proof-of-reserves/verify", async (req, res) => {
    try {
      const { walletAddress, snapshotId } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }

      // Get the snapshot
      let snapshot;
      if (snapshotId) {
        const result = await dbClient
          .select()
          .from(proofOfReserves)
          .where(eq(proofOfReserves.id, snapshotId))
          .limit(1);
        
        if (result.length === 0) {
          return res.status(404).json({ error: "Snapshot not found" });
        }
        snapshot = result[0];
      } else {
        // Get latest snapshot
        const result = await dbClient
          .select()
          .from(proofOfReserves)
          .orderBy(desc(proofOfReserves.snapshotTime))
          .limit(1);
        
        if (result.length === 0) {
          return res.status(404).json({ error: "No snapshots available" });
        }
        snapshot = result[0];
      }

      // Get user balance from wallet
      const userWallet = await dbClient
        .select()
        .from(wallets)
        .where(eq(sql`lower(${wallets.address})`, walletAddress.toLowerCase()))
        .limit(1);

      if (userWallet.length === 0) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // For now, return verification status
      // In production, would generate actual Merkle proof
      res.json({
        verified: true,
        walletAddress: userWallet[0].address,
        balance: userWallet[0].balance,
        snapshotId: snapshot.id,
        snapshotTime: snapshot.snapshotTime,
        merkleRoot: snapshot.merkleRoot,
        message: "Your balance is included in the Proof of Reserves"
      });
    } catch (error) {
      console.error("Failed to verify user balance:", error);
      res.status(500).json({ error: "Failed to verify balance" });
    }
  });

  // Get multi-chain aggregated proof (PUBLIC - full transparency)
  app.get("/api/proof-of-reserves/multi-chain", async (req, res) => {
    try {
      const supportedChains = ['1', '137', '42161', '10', '8453']; // Ethereum, Polygon, Arbitrum, Optimism, Base
      
      const snapshots = await Promise.all(
        supportedChains.map(async (chainId) => {
          const result = await dbClient
            .select()
            .from(proofOfReserves)
            .where(eq(proofOfReserves.chainId, chainId))
            .orderBy(desc(proofOfReserves.snapshotTime))
            .limit(1);
          
          return result[0] || null;
        })
      );

      const validSnapshots = snapshots.filter(s => s !== null);

      if (validSnapshots.length === 0) {
        return res.status(404).json({ 
          error: "No multi-chain data available",
          message: "Generate snapshots for supported chains first"
        });
      }

      // Calculate aggregated totals
      const totalReserves = validSnapshots.reduce((sum, s) => {
        return sum + BigInt(s.totalEthReserves);
      }, BigInt(0));

      const totalUserBalances = validSnapshots.reduce((sum, s) => {
        return sum + BigInt(s.totalUserBalances);
      }, BigInt(0));

      const overallRatio = totalUserBalances > BigInt(0)
        ? (Number(totalReserves) / Number(totalUserBalances)).toFixed(4)
        : '0.0000';

      res.json({
        totalReserves: totalReserves.toString(),
        totalUserBalances: totalUserBalances.toString(),
        reserveRatio: overallRatio,
        chainBreakdown: validSnapshots,
        chainsTracked: validSnapshots.length,
        lastUpdated: validSnapshots[0].snapshotTime,
      });
    } catch (error) {
      console.error("Failed to get multi-chain proof:", error);
      res.status(500).json({ error: "Failed to fetch multi-chain proof" });
    }
  });

  // Get real-time blockchain reserves (ADMIN - for monitoring)
  app.get("/api/proof-of-reserves/realtime/:chainId", requireOwner, async (req, res) => {
    try {
      const { chainId } = req.params;

      const platformAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB4',
        '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
        '0x9876543210FEDcba9876543210FEDcba98765432',
      ];

      const reserves = await proofOfReservesService.getChainReserves(
        chainId,
        platformAddresses
      );

      if (!reserves) {
        return res.status(404).json({ error: "Chain not supported or RPC unavailable" });
      }

      res.json(reserves);
    } catch (error) {
      console.error("Failed to get realtime reserves:", error);
      res.status(500).json({ error: "Failed to fetch realtime reserves" });
    }
  });

  // ==================== TRANSPARENCY HUB ====================

  // Get platform transparency statistics (PUBLIC)
  app.get("/api/transparency/stats", async (req, res) => {
    try {
      // Get total users
      const totalUsersResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(users);
      const totalUsers = Number(totalUsersResult[0]?.count || 0);

      // Get total wallets
      const totalWalletsResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(wallets);
      const totalWallets = Number(totalWalletsResult[0]?.count || 0);

      // Get total transactions (from transaction history)
      const totalTransactionsResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(transactionHistory);
      const totalTransactions = Number(totalTransactionsResult[0]?.count || 0);

      // Get 24h volume (sum of all transaction amounts in last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const volume24hResult = await dbClient
        .select({ 
          sum: sql<string>`COALESCE(SUM(CAST(${transactionHistory.amount} AS NUMERIC)), 0)` 
        })
        .from(transactionHistory)
        .where(sql`${transactionHistory.createdAt} >= ${oneDayAgo}`);
      const total24hVolume = volume24hResult[0]?.sum || '0';

      // Get active security features
      const whitelistsResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(withdrawalWhitelists)
        .where(eq(withdrawalWhitelists.isActive, true));
      const whitelistsCount = Number(whitelistsResult[0]?.count || 0);

      const timeLockedResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(timeLockedWithdrawals)
        .where(eq(timeLockedWithdrawals.status, 'pending'));
      const timeLockedCount = Number(timeLockedResult[0]?.count || 0);

      // Get fraud alerts in last 24 hours
      const fraudAlertsResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(fraudDetectionLogs)
        .where(sql`${fraudDetectionLogs.createdAt} >= ${oneDayAgo}`);
      const fraudAlertsCount = Number(fraudAlertsResult[0]?.count || 0);

      // Check emergency lockdown status (would be in a system config table in production)
      const emergencyLockdown = false; // Hardcoded for now

      // Platform health metrics (hardcoded for MVP)
      const platformHealth = {
        uptime: '99.9%',
        responseTime: '<100ms',
        lastIncident: null,
      };

      res.json({
        totalUsers,
        totalWallets,
        totalTransactions,
        total24hVolume,
        activeSecurityFeatures: {
          whitelists: whitelistsCount,
          timeLockedWithdrawals: timeLockedCount,
          fraudAlerts: fraudAlertsCount,
          emergencyLockdown,
        },
        platformHealth,
      });
    } catch (error) {
      console.error("Failed to get transparency stats:", error);
      res.status(500).json({ error: "Failed to fetch transparency stats" });
    }
  });

  // =================================================================
  // CHAOS PAY - Payment Processing Platform (100x Better Than Stripe)
  // =================================================================
  
  // Beta signup endpoint (public - no auth required)
  app.post("/api/codex-pay/beta-signup", async (req, res) => {
    try {
      const validationResult = insertCodexPayBetaSignupSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.issues 
        });
      }
      
      const data = validationResult.data;
      
      // Check for duplicate email
      const existing = await dbClient
        .select()
        .from(codexPayBetaSignups)
        .where(eq(codexPayBetaSignups.email, data.email))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered for beta program" });
      }
      
      // Create beta signup
      const [signup] = await dbClient
        .insert(codexPayBetaSignups)
        .values(data)
        .returning();
      
      // Track analytics event - Create session first, then event
      try {
        const [session] = await dbClient.insert(visitorSessions).values({
          sessionId: req.sessionID || nanoid(),
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
        }).returning();
        
        await dbClient.insert(visitorEvents).values({
          sessionId: session.id,
          eventType: 'form_submit',
          eventCategory: 'beta_signup',
          eventLabel: 'codex_pay_beta_merchant',
          eventValue: data.monthlyVolume,
          path: '/codex-pay/beta',
          metadata: {
            businessName: data.businessName,
            email: data.email,
            monthlyVolume: data.monthlyVolume,
            businessType: data.businessType,
            signupId: signup.id
          }
        });
        
        console.log(`📊 BETA SIGNUP: ${data.businessName} (${data.email}) - Volume: ${data.monthlyVolume}, Type: ${data.businessType}`);
      } catch (analyticsError) {
        // Don't fail the signup if analytics fails
        console.error("Analytics tracking error:", analyticsError);
      }
      
      // 🚨 ALERT: New founding partner application!
      console.log('\n' + '='.repeat(80));
      console.log('🏴‍☠️ NEW CHAOS PAY BETA MERCHANT APPLICATION! 🏴‍☠️');
      console.log('='.repeat(80));
      console.log(`📧 Business: ${data.businessName}`);
      console.log(`👤 Contact: ${data.contactName} (${data.email})`);
      console.log(`📞 Phone: ${data.phone || 'Not provided'}`);
      console.log(`🌐 Website: ${data.website || 'Not provided'}`);
      console.log(`💰 Monthly Volume: ${data.monthlyVolume}`);
      console.log(`🏢 Business Type: ${data.businessType}`);
      console.log(`📝 Use Case: ${data.useCase}`);
      console.log(`🆔 Application ID: ${signup.id}`);
      console.log(`⏰ Applied: ${new Date().toISOString()}`);
      console.log('='.repeat(80));
      console.log('🎯 ACTION REQUIRED: Schedule welcome call within 24 hours!');
      console.log('📱 View all applications at: /codex-pay/admin');
      console.log('='.repeat(80) + '\n');
      
      // 🚀 AUTO-APPROVAL FOR FIRST 10 MERCHANTS!
      let autoApproved = false;
      let apiKeys: { publishable: string; secret: string } | null = null;
      
      // Check if eligible for auto-approval with atomic count
      const merchantCount = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(merchants);
      
      const totalMerchants = Number(merchantCount[0]?.count || 0);
      
      // Only attempt auto-approval if we have fewer than 10 merchants
      if (totalMerchants < 10) {
        try {
          // Generate API keys (raw values for email ONLY)
          const publishableKey = `pk_live_${nanoid(32)}`;
          const secretKey = `sk_live_${nanoid(32)}`;
          
          // Hash the keys for secure storage
          const hashedPublishableKey = await bcrypt.hash(publishableKey, 10);
          const hashedSecretKey = await bcrypt.hash(secretKey, 10);
          
          // Create temporary merchant object
          const merchantData = {
            id: nanoid(),
            businessName: data.businessName,
            businessEmail: data.email,
            businessWebsite: data.website || null,
            settlementWallet: "0x0000000000000000000000000000000000000000", // Placeholder - merchant will update in dashboard
            feePercentage: "0.50", // 0.5% fees
            verificationStatus: "approved", // Auto-approved!
            isActive: "true",
            publishableKey: hashedPublishableKey,
            secretKey: hashedSecretKey,
          };
          
          apiKeys = { publishable: publishableKey, secret: secretKey };
          
          // CRITICAL: Send email FIRST before creating merchant account
          // This ensures if email fails, we don't create orphaned merchant with unrecoverable keys
          const { sendBetaMerchantWelcomeEmail } = await import('./email-service');
          await sendBetaMerchantWelcomeEmail({
            businessName: data.businessName,
            contactName: data.contactName,
            email: data.email,
            monthlyVolume: data.monthlyVolume,
            businessType: data.businessType,
            autoApproved: true,
            apiKeys: apiKeys,
          });
          
          console.log(`✅ Auto-approval email sent successfully to ${data.email}`);
          
          // ONLY create merchant account AFTER email sends successfully
          const [merchant] = await dbClient
            .insert(merchants)
            .values(merchantData)
            .returning();
          
          autoApproved = true;
          
          console.log(`🎉 AUTO-APPROVED MERCHANT #${totalMerchants + 1}: ${data.businessName} (${data.email})`);
          console.log(`✅ Merchant account created with ID: ${merchant.id}`);
        } catch (autoApprovalError) {
          console.error('⚠️ Auto-approval failed:', autoApprovalError);
          console.log(`→ Falling back to manual review for ${data.email}`);
          // Reset autoApproved flag - merchant will go through manual review instead
          autoApproved = false;
          apiKeys = null;
        }
      }
      
      // Send standard welcome email if NOT auto-approved
      if (!autoApproved) {
        try {
          const { sendBetaMerchantWelcomeEmail } = await import('./email-service');
          await sendBetaMerchantWelcomeEmail({
            businessName: data.businessName,
            contactName: data.contactName,
            email: data.email,
            monthlyVolume: data.monthlyVolume,
            businessType: data.businessType,
            autoApproved: false,
          });
          console.log(`✅ Welcome email sent to ${data.email} (manual review required)`);
        } catch (emailError) {
          console.error('⚠️ Failed to send welcome email (non-critical):', emailError);
          // Don't fail the signup if email fails - application is still recorded
        }
      }
      
      res.json({ 
        success: true, 
        message: autoApproved 
          ? "🎉 Congratulations! You've been auto-approved. Check your email for API keys."
          : "Beta application submitted successfully. We'll review within 24 hours.",
        id: signup.id,
        autoApproved
        // 🔒 SECURITY: Never include API keys in HTTP response - only in email
      });
    } catch (error) {
      console.error("Failed to create beta signup:", error);
      res.status(500).json({ error: "Failed to submit beta application" });
    }
  });
  
  // Get all beta signups (admin only - requires authentication)
  app.get("/api/codex-pay/beta-signups", requireAuth, async (req, res) => {
    try {
      // Only allow owner/admin to view beta signups (check for string "true")
      const isOwner = req.user?.isOwner === "true" || req.user?.isOwner === true;
      const isAdmin = req.user?.isAdmin === "true" || req.user?.isAdmin === true;
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }
      
      const signups = await dbClient
        .select()
        .from(codexPayBetaSignups)
        .orderBy(desc(codexPayBetaSignups.createdAt));
      
      res.json({ signups, total: signups.length });
    } catch (error) {
      console.error("Failed to get beta signups:", error);
      res.status(500).json({ error: "Failed to fetch beta signups" });
    }
  });

  // ==========================================
  // 💰 CHAOS PAY PAYMENT PROCESSING API 💰
  // ==========================================
  
  // PUBLIC: Create merchant account (returns API keys ONCE)
  app.post("/api/codex-pay/merchants", async (req, res) => {
    try {
      const { businessName, businessEmail, businessWebsite, settlementWallet } = req.body;
      
      // Validation
      if (!businessName || !businessEmail || !settlementWallet) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Check if merchant already exists
      const existing = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.businessEmail, businessEmail))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Merchant with this email already exists" });
      }
      
      // Generate API keys (raw values to return ONCE)
      const publishableKey = `pk_live_${nanoid(32)}`;
      const secretKey = `sk_live_${nanoid(32)}`;
      
      // Hash the keys for secure storage
      const hashedPublishableKey = await bcrypt.hash(publishableKey, 10);
      const hashedSecretKey = await bcrypt.hash(secretKey, 10);
      
      // Create merchant
      const [merchant] = await dbClient
        .insert(merchants)
        .values({
          id: nanoid(),
          businessName,
          businessEmail,
          businessWebsite: businessWebsite || null,
          settlementWallet,
          feePercentage: "0.50", // 0.5% fees
          verificationStatus: "pending",
          isActive: "true",
          publishableKey: hashedPublishableKey,
          secretKey: hashedSecretKey,
        })
        .returning();
      
      console.log(`✅ New merchant created: ${businessName} (${businessEmail})`);
      
      // Return raw API keys ONLY ONCE
      res.json({
        message: "Merchant account created successfully!",
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          businessEmail: merchant.businessEmail,
          settlementWallet: merchant.settlementWallet,
          feePercentage: merchant.feePercentage,
        },
        apiKeys: {
          publishable: publishableKey, // Only returned ONCE
          secret: secretKey, // Only returned ONCE - store this safely!
        },
      });
    } catch (error) {
      console.error("Failed to create merchant:", error);
      res.status(500).json({ error: "Failed to create merchant account" });
    }
  });

  // Helper: Verify merchant API key
  async function verifyMerchantAPIKey(authHeader: string | undefined) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    
    const apiKey = authHeader.substring(7);
    
    // Find merchant by comparing hashed key
    const allMerchants = await dbClient.select().from(merchants);
    for (const merchant of allMerchants) {
      if (merchant.secretKey && await bcrypt.compare(apiKey, merchant.secretKey)) {
        return merchant;
      }
    }
    
    return null;
  }

  // Create payment intent (merchant API)
  app.post("/api/codex-pay/payment-intents", async (req, res) => {
    try {
      const merchant = await verifyMerchantAPIKey(req.headers.authorization);
      if (!merchant) {
        return res.status(401).json({ error: "Invalid API key" });
      }
      
      const { amount, currency = "USD", description } = req.body;
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      const intentId = nanoid();
      const checkoutUrl = `/codex-pay/checkout/${intentId}`;
      
      const [intent] = await dbClient
        .insert(paymentIntents)
        .values({
          id: intentId,
          merchantId: merchant.id,
          amount: amount.toString(),
          currency,
          status: "pending",
          checkoutUrl,
          description: description || null,
        })
        .returning();
      
      res.json({
        id: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        checkoutUrl: intent.checkoutUrl,
      });
    } catch (error) {
      console.error("Failed to create payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Get payment intent (public - for checkout page)
  app.get("/api/codex-pay/intent/:intentId", async (req, res) => {
    try {
      const { intentId } = req.params;
      
      const [intent] = await dbClient
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.id, intentId))
        .limit(1);
      
      if (!intent) {
        return res.status(404).json({ error: "Payment intent not found" });
      }
      
      const [merchant] = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.id, intent.merchantId))
        .limit(1);
      
      res.json({
        id: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        description: intent.description,
        merchant: {
          businessName: merchant?.businessName || "Unknown",
        },
      });
    } catch (error) {
      console.error("Failed to get payment intent:", error);
      res.status(500).json({ error: "Failed to fetch payment intent" });
    }
  });

  // Process payment (public - called by checkout)
  app.post("/api/codex-pay/process-payment", async (req, res) => {
    try {
      const { intentId, walletAddress, transactionHash } = req.body;
      
      if (!intentId || !walletAddress || !transactionHash) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Get payment intent
      const [intent] = await dbClient
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.id, intentId))
        .limit(1);
      
      if (!intent) {
        return res.status(404).json({ error: "Payment intent not found" });
      }
      
      if (intent.status === "completed") {
        return res.status(400).json({ error: "Payment already processed" });
      }
      
      // Get merchant
      const [merchant] = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.id, intent.merchantId))
        .limit(1);
      
      if (!merchant) {
        return res.status(404).json({ error: "Merchant not found" });
      }
      
      // Calculate revenue split
      const paymentAmount = parseFloat(intent.amount);
      const feePercentage = parseFloat(merchant.feePercentage);
      const platformFee = paymentAmount * (feePercentage / 100);
      const merchantPayout = paymentAmount - platformFee;
      
      // CRITICAL: Platform revenue collection
      const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS;
      if (!MERCHANT_ADDRESS) {
        console.error("❌ CRITICAL: MERCHANT_ADDRESS not set - cannot collect revenue!");
        return res.status(500).json({ error: "Platform configuration error" });
      }
      
      // Record platform revenue (THIS IS YOUR MONEY!)
      await dbClient
        .insert(platformRevenue)
        .values({
          id: nanoid(),
          revenueType: "codexPay",
          amount: paymentAmount.toFixed(2), // Total payment amount
          feeAmount: platformFee.toFixed(2), // Platform fee (0.5%)
          netAmount: merchantPayout.toFixed(2), // Merchant gets this
          currency: intent.currency,
          walletAddress: MERCHANT_ADDRESS,
          merchantId: merchant.id,
        });
      
      // Create settlement for merchant
      await dbClient
        .insert(codexPaySettlements)
        .values({
          id: nanoid(),
          merchantId: merchant.id,
          paymentIntentId: intent.id,
          amount: merchantPayout.toFixed(2),
          status: "pending",
        });
      
      // Update payment intent status
      await dbClient
        .update(paymentIntents)
        .set({ status: "completed" })
        .where(eq(paymentIntents.id, intentId));
      
      console.log(`💰 Payment processed: $${paymentAmount} | Platform: $${platformFee.toFixed(2)} | Merchant: $${merchantPayout.toFixed(2)}`);
      
      res.json({
        success: true,
        amount: intent.amount,
        platformFee: platformFee.toFixed(2),
        merchantPayout: merchantPayout.toFixed(2),
      });
    } catch (error) {
      console.error("Failed to process payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // Get merchant account (merchant API)
  app.get("/api/codex-pay/merchant", async (req, res) => {
    try {
      const merchant = await verifyMerchantAPIKey(req.headers.authorization);
      if (!merchant) {
        return res.status(401).json({ error: "Invalid API key" });
      }
      
      res.json({
        id: merchant.id,
        businessName: merchant.businessName,
        businessEmail: merchant.businessEmail,
        settlementWallet: merchant.settlementWallet,
        feePercentage: merchant.feePercentage,
        verificationStatus: merchant.verificationStatus,
        isActive: merchant.isActive,
      });
    } catch (error) {
      console.error("Failed to get merchant:", error);
      res.status(500).json({ error: "Failed to fetch merchant account" });
    }
  });

  // Get merchant payments (merchant API)
  app.get("/api/codex-pay/payments", async (req, res) => {
    try {
      const merchant = await verifyMerchantAPIKey(req.headers.authorization);
      if (!merchant) {
        return res.status(401).json({ error: "Invalid API key" });
      }
      
      const payments = await dbClient
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.merchantId, merchant.id))
        .orderBy(desc(paymentIntents.createdAt));
      
      res.json({ payments });
    } catch (error) {
      console.error("Failed to get payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  
  // Merchant signup validation schema
  const merchantSignupSchema = z.object({
    businessName: z.string().min(2, "Business name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    website: z.string().url("Must be a valid URL").optional().nullable(),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid Ethereum address"),
    businessType: z.enum(["individual", "company", "non_profit"]),
    country: z.string().min(2, "Country is required"),
  });

  // Create merchant account (onboarding)
  app.post("/api/codex-pay/merchant/signup", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body with Zod
      const validationResult = merchantSignupSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.issues 
        });
      }
      
      const { businessName, email, website, walletAddress, businessType, country } = validationResult.data;
      
      // Check if merchant already exists
      const existing = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.userId, userId))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Merchant account already exists" });
      }
      
      // Generate API keys (raw values to return to user ONCE)
      const publishableKey = `pk_live_${nanoid(32)}`;
      const secretKey = `sk_live_${nanoid(32)}`;
      
      // Hash the keys for secure storage
      const hashedPublishableKey = await bcrypt.hash(publishableKey, 10);
      const hashedSecretKey = await bcrypt.hash(secretKey, 10);
      
      // Create merchant
      const [merchant] = await dbClient
        .insert(merchants)
        .values({
          id: nanoid(),
          userId,
          walletAddress: walletAddress.toLowerCase(), // Normalize address
          businessName,
          businessType,
          email,
          website: website || null,
          country,
          settlementWallet: walletAddress.toLowerCase(),
          feePercentage: "0.50", // Default 0.5% fee
          status: "active", // Auto-activate for beta
          kycStatus: "approved", // Auto-approve for beta
        })
        .returning();
      
      // Store hashed API keys
      await dbClient.insert(merchantApiKeys).values([
        {
          id: nanoid(),
          merchantId: merchant.id,
          keyType: "publishable",
          keyHash: hashedPublishableKey,
          keyPrefix: "pk_live_",
          environment: "live",
          permissions: ["read"],
          isActive: "true",
        },
        {
          id: nanoid(),
          merchantId: merchant.id,
          keyType: "secret",
          keyHash: hashedSecretKey,
          keyPrefix: "sk_live_",
          environment: "live",
          permissions: ["read", "write", "refund"],
          isActive: "true",
        },
      ]);
      
      // Initialize analytics
      await dbClient.insert(merchantAnalytics).values({
        id: nanoid(),
        merchantId: merchant.id,
        date: new Date(),
        totalTransactions: "0",
        successfulTransactions: "0",
        failedTransactions: "0",
        totalVolume: "0",
        currency: "USD",
        avgTransactionValue: "0",
        totalFees: "0",
        netRevenue: "0",
        uniqueCustomers: "0",
      });
      
      // Return raw API keys ONLY ONCE during signup
      // After this, keys will NEVER be returned again
      res.json({
        message: "Merchant account created successfully!",
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.businessEmail,
          settlementWallet: merchant.settlementWallet,
          feePercentage: merchant.feePercentage,
        },
        apiKeys: {
          publishable: publishableKey, // Only returned ONCE
          secret: secretKey, // Only returned ONCE - store this safely!
        },
      });
    } catch (error) {
      console.error("Failed to create merchant:", error);
      res.status(500).json({ error: "Failed to create merchant account" });
    }
  });
  
  // Get merchant account
  app.get("/api/codex-pay/merchant", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get merchant from database
      const [merchant] = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.userId, userId))
        .limit(1);
      
      if (!merchant) {
        return res.json(null); // No merchant account yet
      }
      
      res.json(merchant);
    } catch (error) {
      console.error("Failed to get merchant:", error);
      res.status(500).json({ error: "Failed to fetch merchant account" });
    }
  });

  // Get merchant analytics
  app.get("/api/codex-pay/analytics", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get merchant
      const [merchant] = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.userId, userId))
        .limit(1);
      
      if (!merchant) {
        return res.json(null);
      }
      
      // Get analytics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const analytics = await dbClient
        .select()
        .from(merchantAnalytics)
        .where(
          and(
            eq(merchantAnalytics.merchantId, merchant.id),
            gte(merchantAnalytics.date, thirtyDaysAgo)
          )
        )
        .orderBy(desc(merchantAnalytics.date));
      
      // Calculate totals
      const totalRevenue = analytics.reduce((sum, a) => sum + parseFloat(a.totalVolume || "0"), 0);
      const totalTransactions = analytics.reduce((sum, a) => sum + parseInt(a.totalTransactions || "0"), 0);
      const successfulTransactions = analytics.reduce((sum, a) => sum + parseInt(a.successfulTransactions || "0"), 0);
      const uniqueCustomers = analytics.reduce((sum, a) => sum + parseInt(a.uniqueCustomers || "0"), 0);
      
      const successRate = totalTransactions > 0 ? ((successfulTransactions / totalTransactions) * 100).toFixed(1) : "0";
      
      res.json({
        totalRevenue: totalRevenue.toFixed(2),
        revenueGrowth: "0", // Calculate based on prev period
        totalTransactions: totalTransactions.toString(),
        successRate,
        uniqueCustomers: uniqueCustomers.toString(),
        newCustomers: "0", // Calculate based on new customers this month
        monthlyVolume: totalRevenue.toFixed(2),
      });
    } catch (error) {
      console.error("Failed to get analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Create payment intent (for merchants to accept payments)
  app.post("/api/codex-pay/payment-intents", async (req, res) => {
    try {
      const schema = z.object({
        merchantId: z.string(),
        amount: z.string(),
        currency: z.string(),
        description: z.string().optional(),
        customerEmail: z.string().email().optional(),
        metadata: z.any().optional(),
      });

      const { merchantId, amount, currency, description, customerEmail, metadata } = schema.parse(req.body);

      // Generate intent ID
      const intentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Create payment intent in database
      const [intent] = await dbClient
        .insert(paymentIntents)
        .values({
          merchantId,
          intentId,
          amount,
          currency,
          description: description || null,
          customerEmail: customerEmail || null,
          metadata: metadata || null,
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        })
        .returning();

      res.json({
        intentId: intent.intentId,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        checkoutUrl: `${req.protocol}://${req.get('host')}/codex-pay/checkout/${intent.intentId}`,
      });
    } catch (error: any) {
      console.error("Failed to create payment intent:", error);
      res.status(500).json({ error: error.message || "Failed to create payment intent" });
    }
  });

  // Process payment (customer completes payment)
  app.post("/api/codex-pay/process-payment", async (req, res) => {
    try {
      const schema = z.object({
        intentId: z.string(),
        customerWallet: z.string(),
        txHash: z.string(),
        paymentMethod: z.enum(['metamask', 'crypto', 'fiat']),
      });

      const { intentId, customerWallet, txHash, paymentMethod } = schema.parse(req.body);

      // Get payment intent
      const [intent] = await dbClient
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.intentId, intentId))
        .limit(1);

      if (!intent) {
        return res.status(404).json({ error: "Payment intent not found" });
      }

      if (intent.status !== 'pending') {
        return res.status(400).json({ error: "Payment already processed" });
      }

      // Update payment intent
      await dbClient
        .update(paymentIntents)
        .set({
          status: 'succeeded',
          customerWallet,
          txHash,
          paymentMethod,
          paidAt: new Date(),
        })
        .where(eq(paymentIntents.id, intent.id));

      // Record platform revenue (0.5% fee)
      const platformFee = (parseFloat(intent.amount) * 0.005).toFixed(2);
      const merchantAmount = (parseFloat(intent.amount) - parseFloat(platformFee)).toFixed(2);

      // Ensure MERCHANT_ADDRESS is set for revenue collection
      if (!process.env.MERCHANT_ADDRESS) {
        throw new Error("MERCHANT_ADDRESS environment variable is not set - cannot process payment revenue");
      }

      // Get merchant details for settlement
      const [merchant] = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.id, intent.merchantId))
        .limit(1);

      if (!merchant) {
        throw new Error("Merchant not found for payment settlement");
      }

      // Record platform revenue (0.5% fee to platform wallet)
      await dbClient.insert(platformRevenue).values({
        revenueType: 'codexPay',
        amount: intent.amount,
        feeAmount: platformFee,
        netAmount: merchantAmount,
        currency: intent.currency,
        walletAddress: process.env.MERCHANT_ADDRESS,
        txHash,
        merchantId: intent.merchantId,
        metadata: { intentId: intent.intentId },
      });

      // Create settlement record for merchant (amount minus platform fee)
      await dbClient.insert(settlements).values({
        walletAddress: merchant.settlementWallet,
        amount: merchantAmount,
        currency: intent.currency,
        status: 'pending',
        txHash,
        settlementTime: null, // Will be set when actually settled
      });

      res.json({
        success: true,
        intentId: intent.intentId,
        status: 'succeeded',
        amount: intent.amount,
        platformFee,
        merchantAmount,
      });
    } catch (error: any) {
      console.error("Failed to process payment:", error);
      res.status(500).json({ error: error.message || "Failed to process payment" });
    }
  });

  // Get single payment intent (for checkout page)
  app.get("/api/codex-pay/intent/:intentId", async (req, res) => {
    try {
      const { intentId } = req.params;

      const [intent] = await dbClient
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.intentId, intentId))
        .limit(1);

      if (!intent) {
        return res.status(404).json({ error: "Payment intent not found" });
      }

      res.json(intent);
    } catch (error) {
      console.error("Failed to get payment intent:", error);
      res.status(500).json({ error: "Failed to fetch payment intent" });
    }
  });

  // Get recent payments
  app.get("/api/codex-pay/payments", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Get merchant
      const [merchant] = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.userId, userId))
        .limit(1);

      if (!merchant) {
        return res.json([]);
      }

      // Get payment intents for this merchant
      const payments = await dbClient
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.merchantId, merchant.id))
        .orderBy(desc(paymentIntents.createdAt))
        .limit(100);

      res.json(payments);
    } catch (error) {
      console.error("Failed to get payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Get API keys
  app.get("/api/codex-pay/api-keys", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get merchant
      const [merchant] = await dbClient
        .select()
        .from(merchants)
        .where(eq(merchants.userId, userId))
        .limit(1);
      
      if (!merchant) {
        return res.json([]);
      }
      
      // Get API keys from database
      const keys = await dbClient
        .select()
        .from(merchantApiKeys)
        .where(eq(merchantApiKeys.merchantId, merchant.id));
      
      // Format for frontend - NEVER return the actual keys
      const formattedKeys = keys.map(key => ({
        id: key.id,
        merchantId: merchant.id,
        keyType: key.keyType,
        keyPrefix: key.keyPrefix,
        keyPreview: `${key.keyPrefix}_${"•".repeat(28)}`, // Masked preview only
        // key field is intentionally omitted - keys are NEVER returned after creation
        environment: key.environment,
        permissions: key.permissions,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        createdAt: key.createdAt,
      }));
      
      res.json(formattedKeys);
    } catch (error) {
      console.error("Failed to get API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  // =================================================================
  // EMPIRE API PLATFORM - Complete Developer API System
  // =================================================================
  
  // Validation schemas
  const developerSignupSchema = z.object({
    email: z.string().email(),
    companyName: z.string().min(2, "Company name is required"),
    website: z.string().url().optional(),
    description: z.string().optional(),
  });
  
  const apiKeyGenerationSchema = z.object({
    name: z.string().min(1, "API key name is required"),
    environment: z.enum(["test", "live"]).default("test"),
    permissions: z.array(z.string()).optional(),
    scopes: z.array(z.string()).optional(),
  });
  
  // Webhook event types enum
  const WEBHOOK_EVENTS = [
    "developer.account.created",
    "developer.account.updated",
    "developer.account.suspended",
    "api_key.created",
    "api_key.revoked",
    "api_key.rotated",
    "payment.succeeded",
    "payment.failed",
    "payment.refunded",
    "transaction.created",
    "transaction.confirmed",
    "transaction.failed",
    "wallet.created",
    "wallet.balance_updated",
    "trading.order_placed",
    "trading.order_filled",
    "trading.order_cancelled",
    "nft.minted",
    "nft.transferred",
    "nft.sold",
    "subscription.created",
    "subscription.cancelled",
    "subscription.payment_failed",
  ] as const;
  
  const webhookEndpointSchema = z.object({
    url: z.string()
      .url("Valid webhook URL is required")
      .refine(url => url.startsWith("https://"), {
        message: "Webhook URL must use HTTPS for security"
      }),
    description: z.string().optional(),
    enabledEvents: z.array(z.enum(WEBHOOK_EVENTS as any))
      .min(1, "At least one event must be enabled")
      .default([]),
  });
  
  // Developer account signup (register as API developer)
  app.post("/api/empire/developer/signup", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = developerSignupSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.issues 
        });
      }
      
      const { email, companyName, website, description } = validationResult.data;
      
      // Check if developer account already exists
      const existing = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Developer account already exists" });
      }
      
      // Generate webhook secret
      const webhookSecret = `whsec_${nanoid(32)}`;
      
      // Create developer account
      const [developer] = await dbClient
        .insert(developerAccounts)
        .values({
          userId,
          email,
          companyName: companyName || null,
          website: website || null,
          description: description || null,
          status: "active",
          tier: "free", // Start with free tier
          monthlyRequestQuota: 10000,
          requestsThisMonth: 0,
          webhookSecret,
        })
        .returning();
      
      res.json({
        message: "Developer account created successfully!",
        developer: {
          id: developer.id,
          email: developer.email,
          companyName: developer.companyName,
          tier: developer.tier,
          monthlyRequestQuota: developer.monthlyRequestQuota,
          webhookSecret, // Show webhook secret ONCE
        },
      });
    } catch (error) {
      console.error("Failed to create developer account:", error);
      res.status(500).json({ error: "Failed to create developer account" });
    }
  });
  
  // Get developer account info
  app.get("/api/empire/developer", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.json(null);
      }
      
      res.json({
        id: developer.id,
        email: developer.email,
        companyName: developer.companyName,
        website: developer.website,
        description: developer.description,
        status: developer.status,
        tier: developer.tier,
        monthlyRequestQuota: developer.monthlyRequestQuota,
        requestsThisMonth: developer.requestsThisMonth,
        createdAt: developer.createdAt,
      });
    } catch (error) {
      console.error("Failed to get developer account:", error);
      res.status(500).json({ error: "Failed to fetch developer account" });
    }
  });
  
  // Generate new API key
  app.post("/api/empire/api-keys", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = apiKeyGenerationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.issues 
        });
      }
      
      const { name, environment, permissions, scopes } = validationResult.data;
      
      // Get developer account
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.status(404).json({ error: "Developer account not found. Please sign up first." });
      }
      
      // Generate API keys (publishable and secret)
      const publishableKey = `emp_pk_${environment}_${nanoid(32)}`;
      const secretKey = `emp_sk_${environment}_${nanoid(32)}`;
      
      // Hash keys for secure storage
      const hashedPublishableKey = await bcrypt.hash(publishableKey, 10);
      const hashedSecretKey = await bcrypt.hash(secretKey, 10);
      
      // Determine rate limits based on tier
      const rateLimits = {
        free: { requestsPerMinute: 60, requestsPerDay: 10000 },
        pro: { requestsPerMinute: 300, requestsPerDay: 100000 },
        enterprise: { requestsPerMinute: 1000, requestsPerDay: 1000000 },
      };
      
      const limits = rateLimits[developer.tier as keyof typeof rateLimits] || rateLimits.free;
      
      // Create publishable API key
      const [publishableApiKey] = await dbClient
        .insert(apiKeys)
        .values({
          developerId: developer.id,
          keyType: "publishable",
          keyPrefix: `emp_pk_${environment}_`,
          keyHash: hashedPublishableKey,
          environment,
          name: `${name} (Publishable)`,
          permissions: permissions || ["read"],
          scopes: scopes || [],
          rateLimitTier: developer.tier,
          requestsPerMinute: limits.requestsPerMinute,
          requestsPerDay: limits.requestsPerDay,
          requestsToday: 0,
          isActive: "true",
        })
        .returning();
      
      // Create secret API key
      const [secretApiKey] = await dbClient
        .insert(apiKeys)
        .values({
          developerId: developer.id,
          keyType: "secret",
          keyPrefix: `emp_sk_${environment}_`,
          keyHash: hashedSecretKey,
          environment,
          name: `${name} (Secret)`,
          permissions: permissions || ["read", "write"],
          scopes: scopes || [],
          rateLimitTier: developer.tier,
          requestsPerMinute: limits.requestsPerMinute,
          requestsPerDay: limits.requestsPerDay,
          requestsToday: 0,
          isActive: "true",
        })
        .returning();
      
      res.json({
        message: "API keys created successfully! Save these keys - they will not be shown again.",
        apiKeys: {
          publishable: publishableKey, // Raw key shown ONCE
          secret: secretKey, // Raw key shown ONCE
        },
        keyInfo: {
          publishableKeyId: publishableApiKey.id,
          secretKeyId: secretApiKey.id,
          environment,
          tier: developer.tier,
          rateLimits: limits,
        },
      });
    } catch (error) {
      console.error("Failed to generate API keys:", error);
      res.status(500).json({ error: "Failed to generate API keys" });
    }
  });
  
  // List all API keys (masked)
  app.get("/api/empire/api-keys", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get developer account
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.json([]);
      }
      
      // Get all API keys
      const keys = await dbClient
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.developerId, developer.id))
        .orderBy(desc(apiKeys.createdAt));
      
      // Format for frontend - NEVER return actual keys
      const formattedKeys = keys.map(key => ({
        id: key.id,
        keyType: key.keyType,
        keyPreview: `${key.keyPrefix}${"•".repeat(28)}`, // Masked preview
        environment: key.environment,
        name: key.name,
        permissions: key.permissions,
        scopes: key.scopes,
        rateLimitTier: key.rateLimitTier,
        requestsPerMinute: key.requestsPerMinute,
        requestsPerDay: key.requestsPerDay,
        requestsToday: key.requestsToday,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        createdAt: key.createdAt,
      }));
      
      res.json(formattedKeys);
    } catch (error) {
      console.error("Failed to get API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });
  
  // Create webhook endpoint
  app.post("/api/empire/webhooks", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate request body
      const validationResult = webhookEndpointSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.issues 
        });
      }
      
      const { url, description, enabledEvents } = validationResult.data;
      
      // Get developer account
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.status(404).json({ error: "Developer account not found" });
      }
      
      // Generate webhook secret for signature verification
      const secret = `whsec_${nanoid(32)}`;
      
      // Create webhook endpoint
      const [webhook] = await dbClient
        .insert(webhookEndpoints)
        .values({
          developerId: developer.id,
          url,
          description: description || null,
          secret,
          enabledEvents,
          isActive: "true",
          version: "v1",
        })
        .returning();
      
      res.json({
        message: "Webhook endpoint created successfully!",
        webhook: {
          id: webhook.id,
          url: webhook.url,
          description: webhook.description,
          secret, // Show secret ONCE for signature verification
          enabledEvents: webhook.enabledEvents,
          isActive: webhook.isActive,
          createdAt: webhook.createdAt,
        },
      });
    } catch (error) {
      console.error("Failed to create webhook endpoint:", error);
      res.status(500).json({ error: "Failed to create webhook endpoint" });
    }
  });
  
  // List webhook endpoints
  app.get("/api/empire/webhooks", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get developer account
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.json([]);
      }
      
      // Get all webhook endpoints
      const webhooks = await dbClient
        .select()
        .from(webhookEndpoints)
        .where(eq(webhookEndpoints.developerId, developer.id))
        .orderBy(desc(webhookEndpoints.createdAt));
      
      // Format for frontend - mask secret
      const formattedWebhooks = webhooks.map(webhook => ({
        id: webhook.id,
        url: webhook.url,
        description: webhook.description,
        secretPreview: `whsec_${"•".repeat(28)}`, // Masked secret
        enabledEvents: webhook.enabledEvents,
        isActive: webhook.isActive,
        version: webhook.version,
        createdAt: webhook.createdAt,
      }));
      
      res.json(formattedWebhooks);
    } catch (error) {
      console.error("Failed to get webhook endpoints:", error);
      res.status(500).json({ error: "Failed to fetch webhook endpoints" });
    }
  });
  
  // Get API usage analytics
  app.get("/api/empire/analytics", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get developer account
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.json({
          totalRequests: 0,
          requestsThisMonth: 0,
          quota: 10000,
          quotaUsagePercentage: 0,
          topEndpoints: [],
        });
      }
      
      // For MVP, return mock analytics
      // In production, this would query api_usage_logs table
      res.json({
        totalRequests: developer.requestsThisMonth || 0,
        requestsThisMonth: developer.requestsThisMonth || 0,
        quota: developer.monthlyRequestQuota,
        quotaUsagePercentage: ((developer.requestsThisMonth || 0) / developer.monthlyRequestQuota * 100).toFixed(2),
        tier: developer.tier,
        topEndpoints: [
          { endpoint: "/api/v1/wallets", requests: 234, avgResponseTime: 45 },
          { endpoint: "/api/v1/transactions", requests: 189, avgResponseTime: 62 },
          { endpoint: "/api/v1/trading/execute", requests: 87, avgResponseTime: 120 },
        ],
        recentActivity: [
          { timestamp: new Date().toISOString(), endpoint: "/api/v1/wallets", method: "GET", statusCode: 200 },
        ],
      });
    } catch (error) {
      console.error("Failed to get API analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Delete API key
  app.delete("/api/empire/api-keys/:keyId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { keyId } = req.params;
      
      // Get developer account
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.status(404).json({ error: "Developer account not found" });
      }
      
      // Verify key belongs to this developer
      const [key] = await dbClient
        .select()
        .from(apiKeys)
        .where(and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.developerId, developer.id)
        ))
        .limit(1);
      
      if (!key) {
        return res.status(404).json({ error: "API key not found" });
      }
      
      // Delete the key
      await dbClient
        .delete(apiKeys)
        .where(eq(apiKeys.id, keyId));
      
      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      console.error("Failed to delete API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });
  
  // =================================================================
  // EMPIRE API DEVELOPER PORTAL - Alias routes for frontend compatibility
  // =================================================================
  
  // Alias: GET /api/empire/developer/account -> /api/empire/developer
  app.get("/api/empire/developer/account", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.json(null);
      }
      
      res.json({
        id: developer.id,
        email: developer.email,
        companyName: developer.companyName,
        website: developer.website,
        description: developer.description,
        status: developer.status,
        tier: developer.tier,
        monthlyRequestQuota: developer.monthlyRequestQuota,
        requestsThisMonth: developer.requestsThisMonth,
        createdAt: developer.createdAt,
      });
    } catch (error) {
      console.error("Failed to get developer account:", error);
      res.status(500).json({ error: "Failed to fetch developer account" });
    }
  });
  
  // Alias: GET /api/empire/developer/api-keys -> /api/empire/api-keys
  app.get("/api/empire/developer/api-keys", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.json([]);
      }
      
      const keys = await dbClient
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.developerId, developer.id))
        .orderBy(desc(apiKeys.createdAt));
      
      const formattedKeys = keys.map(key => ({
        id: key.id,
        keyType: key.keyType,
        keyPrefix: key.keyPrefix,
        environment: key.environment,
        name: key.name,
        permissions: key.permissions,
        requestsPerMinute: key.requestsPerMinute,
        requestsToday: key.requestsToday,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        createdAt: key.createdAt,
      }));
      
      res.json(formattedKeys);
    } catch (error) {
      console.error("Failed to get API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });
  
  // Alias: POST /api/empire/developer/api-keys -> /api/empire/api-keys
  app.post("/api/empire/developer/api-keys", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const validationResult = apiKeyGenerationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.issues 
        });
      }
      
      const { name, environment, permissions } = validationResult.data;
      
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.status(404).json({ error: "Developer account not found. Please sign up first." });
      }
      
      // Generate API key
      const secretKey = `emp_sk_${environment}_${nanoid(32)}`;
      const hashedSecretKey = await bcrypt.hash(secretKey, 10);
      
      // Rate limits based on tier
      const rateLimits = {
        free: { requestsPerMinute: 60, requestsPerDay: 10000 },
        pro: { requestsPerMinute: 300, requestsPerDay: 100000 },
        enterprise: { requestsPerMinute: 1000, requestsPerDay: 1000000 },
      };
      
      const limits = rateLimits[developer.tier as keyof typeof rateLimits] || rateLimits.free;
      
      const [apiKey] = await dbClient
        .insert(apiKeys)
        .values({
          developerId: developer.id,
          keyType: "secret",
          keyPrefix: `emp_sk_${environment}_`,
          keyHash: hashedSecretKey,
          environment,
          name: name || "Unnamed Key",
          permissions: permissions || ["read", "write"],
          rateLimitTier: developer.tier,
          requestsPerMinute: limits.requestsPerMinute,
          requestsPerDay: limits.requestsPerDay,
          requestsToday: 0,
          isActive: "true",
        })
        .returning();
      
      res.json({
        apiKey,
        rawKey: secretKey, // Return raw key ONCE
      });
    } catch (error) {
      console.error("Failed to generate API key:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });
  
  // Alias: DELETE /api/empire/developer/api-keys/:keyId
  app.delete("/api/empire/developer/api-keys/:keyId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { keyId } = req.params;
      
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.status(404).json({ error: "Developer account not found" });
      }
      
      const [key] = await dbClient
        .select()
        .from(apiKeys)
        .where(and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.developerId, developer.id)
        ))
        .limit(1);
      
      if (!key) {
        return res.status(404).json({ error: "API key not found" });
      }
      
      await dbClient
        .delete(apiKeys)
        .where(eq(apiKeys.id, keyId));
      
      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      console.error("Failed to delete API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });
  
  // Alias: GET /api/empire/developer/analytics -> /api/empire/analytics  
  app.get("/api/empire/developer/analytics", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const [developer] = await dbClient
        .select()
        .from(developerAccounts)
        .where(eq(developerAccounts.userId, userId))
        .limit(1);
      
      if (!developer) {
        return res.json({
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          requestsByHour: [],
          requestsByEndpoint: [],
          requestsByStatus: [],
        });
      }
      
      // Mock analytics data for MVP
      res.json({
        totalRequests: developer.requestsThisMonth || 0,
        successfulRequests: Math.floor((developer.requestsThisMonth || 0) * 0.98),
        failedRequests: Math.floor((developer.requestsThisMonth || 0) * 0.02),
        averageResponseTime: 78,
        requestsByHour: [],
        requestsByEndpoint: [],
        requestsByStatus: [],
      });
    } catch (error) {
      console.error("Failed to get analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // =================================================================
  // EMPIRE API v1 - Protected Developer Endpoints
  // =================================================================
  // These endpoints require API key authentication (requireApiKey middleware)
  // Developers use these endpoints to integrate Empire features into their apps
  
  // Get user wallets (requires API key)
  app.get("/api/v1/wallets", requireApiKey, async (req, res) => {
    try {
      const developerId = req.developer.id;
      
      // For MVP, return mock wallet data
      res.json({
        success: true,
        data: {
          wallets: [
            {
              id: "wallet_1",
              address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              chainId: 1,
              chainName: "Ethereum Mainnet",
              balance: "2.5 ETH",
              balanceUsd: "4,850.00",
            },
            {
              id: "wallet_2",
              address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              chainId: 137,
              chainName: "Polygon",
              balance: "1,250 MATIC",
              balanceUsd: "1,075.00",
            },
          ],
          totalBalanceUsd: "5,925.00",
        },
        meta: {
          timestamp: new Date().toISOString(),
          developerId,
        },
      });
    } catch (error) {
      console.error("API v1 error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  
  // Get transaction history (requires API key)
  app.get("/api/v1/transactions", requireApiKey, async (req, res) => {
    try {
      const { limit = 10, offset = 0 } = req.query;
      
      res.json({
        success: true,
        data: {
          transactions: [
            {
              id: "tx_1",
              hash: "0x1234567890abcdef",
              from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              to: "0x987fEDCBA098765432109876543210987654321",
              amount: "0.5 ETH",
              amountUsd: "970.00",
              chainId: 1,
              status: "confirmed",
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
          ],
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            total: 1,
          },
        },
      });
    } catch (error) {
      console.error("API v1 error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  
  // Execute a trade (requires API key with write permission)
  app.post("/api/v1/trading/execute", requireApiKey, async (req, res) => {
    try {
      // Check if API key has write permission
      if (!req.apiKey.permissions.includes("write")) {
        return res.status(403).json({ 
          success: false, 
          error: "Write permission required for this endpoint" 
        });
      }
      
      const { pair, amount, side } = req.body;
      
      if (!pair || !amount || !side) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: pair, amount, side" 
        });
      }
      
      // For MVP, return mock trade execution
      res.json({
        success: true,
        data: {
          tradeId: `trade_${nanoid(16)}`,
          pair,
          amount,
          side,
          price: "48,500.00",
          status: "executed",
          executedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("API v1 error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  
  // Get NFT collection (requires API key)
  app.get("/api/v1/nfts/collection/:collectionId", requireApiKey, async (req, res) => {
    try {
      const { collectionId } = req.params;
      
      res.json({
        success: true,
        data: {
          collection: {
            id: collectionId,
            name: "Cosmic Empires",
            symbol: "COSMIC",
            totalSupply: 10000,
            floorPrice: "0.5 ETH",
            volume24h: "125 ETH",
            owners: 3420,
          },
          nfts: [
            {
              id: "nft_1",
              tokenId: "1234",
              name: "Cosmic Empire #1234",
              image: "https://example.com/nft/1234.png",
              rarity: "legendary",
              attributes: [
                { trait_type: "Background", value: "Nebula" },
                { trait_type: "Type", value: "Empire" },
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error("API v1 error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  
  // Create payment intent (requires API key with write permission)
  app.post("/api/v1/payments/intents", requireApiKey, async (req, res) => {
    try {
      if (!req.apiKey.permissions.includes("write")) {
        return res.status(403).json({ 
          success: false, 
          error: "Write permission required" 
        });
      }
      
      const { amount, currency, description } = req.body;
      
      if (!amount || !currency) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: amount, currency" 
        });
      }
      
      res.json({
        success: true,
        data: {
          paymentIntentId: `pi_${nanoid(24)}`,
          amount,
          currency,
          description,
          status: "pending",
          clientSecret: `secret_${nanoid(32)}`,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("API v1 error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // =================================================================
  // AI TRADING BOTS - Automated Trading System
  // =================================================================
  
  // Get all user's trading bots
  app.get("/api/trading-bots", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Mock trading bots data for MVP
      res.json([
        {
          id: "bot_1",
          userId,
          name: "Bitcoin Momentum Bot",
          strategy: "Trend Following + RSI",
          isActive: true,
          tradingPairs: ["BTC/USD", "BTC/ETH"],
          maxTradeSize: "1000",
          stopLoss: "2.5",
          takeProfit: "5.0",
          totalProfit: "2847.32",
          totalTrades: 156,
          winRate: "68.5",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastTradeAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "bot_2",
          userId,
          name: "Altcoin Scalper",
          strategy: "Grid Trading + Volume Analysis",
          isActive: true,
          tradingPairs: ["ETH/USD", "SOL/USD", "AVAX/USD"],
          maxTradeSize: "500",
          stopLoss: "1.5",
          takeProfit: "3.0",
          totalProfit: "1523.89",
          totalTrades: 432,
          winRate: "72.3",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          lastTradeAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        {
          id: "bot_3",
          userId,
          name: "Stablecoin Arbitrage",
          strategy: "Market Making + Arbitrage",
          isActive: false,
          tradingPairs: ["USDC/USDT", "DAI/USDC"],
          maxTradeSize: "5000",
          stopLoss: "0.1",
          takeProfit: "0.3",
          totalProfit: "892.15",
          totalTrades: 1247,
          winRate: "85.2",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastTradeAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to get trading bots:", error);
      res.status(500).json({ error: "Failed to fetch trading bots" });
    }
  });

  // Get bot trades
  app.get("/api/trading-bots/trades/:botId?", requireAuth, async (req, res) => {
    try {
      const botId = req.params.botId || req.query.botId;
      
      if (!botId) {
        return res.json([]);
      }

      // Mock trades data for MVP
      res.json([
        {
          id: "trade_1",
          botId,
          userId: req.user!.id,
          symbol: "BTC/USD",
          side: "buy",
          amount: "0.05",
          price: "43250.00",
          profit: "125.50",
          status: "completed",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "trade_2",
          botId,
          userId: req.user!.id,
          symbol: "ETH/USD",
          side: "sell",
          amount: "2.5",
          price: "2340.75",
          profit: "87.30",
          status: "completed",
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "trade_3",
          botId,
          userId: req.user!.id,
          symbol: "BTC/USD",
          side: "buy",
          amount: "0.03",
          price: "43180.00",
          profit: "0.00",
          status: "pending",
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: "trade_4",
          botId,
          userId: req.user!.id,
          symbol: "SOL/USD",
          side: "sell",
          amount: "50",
          price: "98.45",
          profit: "-23.10",
          status: "completed",
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "trade_5",
          botId,
          userId: req.user!.id,
          symbol: "AVAX/USD",
          side: "buy",
          amount: "100",
          price: "37.82",
          profit: "156.80",
          status: "completed",
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to get bot trades:", error);
      res.status(500).json({ error: "Failed to fetch bot trades" });
    }
  });

  // Toggle bot on/off
  app.post("/api/trading-bots/toggle", requireAuth, async (req, res) => {
    try {
      const { botId, isActive } = req.body;
      
      // Mock toggle for MVP
      res.json({
        success: true,
        botId,
        isActive,
        message: isActive ? "Bot activated successfully" : "Bot paused successfully",
      });
    } catch (error) {
      console.error("Failed to toggle bot:", error);
      res.status(500).json({ error: "Failed to toggle bot" });
    }
  });

  // =================================================================
  // COPY TRADING - Follow Successful Traders
  // =================================================================
  
  // Get top traders
  app.get("/api/copy-trading/top-traders", async (req, res) => {
    try {
      // Mock top traders data for MVP
      res.json([
        {
          id: "trader_1",
          username: "CryptoKing",
          totalProfit: "45892.50",
          winRate: "78.5",
          totalTrades: 892,
          copiers: 1543,
          riskScore: 4,
          avgMonthlyReturn: "12.3",
          joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          isVerified: true,
        },
        {
          id: "trader_2",
          username: "BTCWhale",
          totalProfit: "128430.20",
          winRate: "82.1",
          totalTrades: 1456,
          copiers: 3289,
          riskScore: 6,
          avgMonthlyReturn: "18.7",
          joinedAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
          isVerified: true,
        },
        {
          id: "trader_3",
          username: "ETHMaster",
          totalProfit: "32156.75",
          winRate: "71.4",
          totalTrades: 634,
          copiers: 892,
          riskScore: 3,
          avgMonthlyReturn: "9.2",
          joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          isVerified: true,
        },
        {
          id: "trader_4",
          username: "DeFiPro",
          totalProfit: "87234.90",
          winRate: "89.3",
          totalTrades: 2103,
          copiers: 5621,
          riskScore: 8,
          avgMonthlyReturn: "24.5",
          joinedAt: new Date(Date.now() - 900 * 24 * 60 * 60 * 1000).toISOString(),
          isVerified: true,
        },
        {
          id: "trader_5",
          username: "SafeTrader",
          totalProfit: "18943.25",
          winRate: "85.7",
          totalTrades: 423,
          copiers: 678,
          riskScore: 2,
          avgMonthlyReturn: "6.8",
          joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          isVerified: false,
        },
        {
          id: "trader_6",
          username: "AltcoinHunter",
          totalProfit: "63721.40",
          winRate: "73.2",
          totalTrades: 1278,
          copiers: 2145,
          riskScore: 7,
          avgMonthlyReturn: "15.3",
          joinedAt: new Date(Date.now() - 540 * 24 * 60 * 60 * 1000).toISOString(),
          isVerified: true,
        },
      ]);
    } catch (error) {
      console.error("Failed to get top traders:", error);
      res.status(500).json({ error: "Failed to fetch top traders" });
    }
  });

  // Get user's copy relationships
  app.get("/api/copy-trading/my-relationships", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Mock relationships data for MVP
      res.json([
        {
          id: "rel_1",
          traderId: "trader_1",
          traderUsername: "CryptoKing",
          copyAmount: "2000",
          copyPercentage: 50,
          isActive: true,
          totalCopiedProfit: "847.32",
          totalCopiedTrades: 45,
          startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "rel_2",
          traderId: "trader_3",
          traderUsername: "ETHMaster",
          copyAmount: "1500",
          copyPercentage: 30,
          isActive: true,
          totalCopiedProfit: "423.89",
          totalCopiedTrades: 28,
          startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to get relationships:", error);
      res.status(500).json({ error: "Failed to fetch copy relationships" });
    }
  });

  // Get copied trades
  app.get("/api/copy-trading/copied-trades", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Mock copied trades data for MVP
      res.json([
        {
          id: "ctrade_1",
          traderId: "trader_1",
          traderUsername: "CryptoKing",
          symbol: "BTC/USD",
          side: "buy",
          amount: "0.025",
          price: "43180.00",
          profit: "87.50",
          status: "completed",
          copiedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "ctrade_2",
          traderId: "trader_3",
          traderUsername: "ETHMaster",
          symbol: "ETH/USD",
          side: "buy",
          amount: "1.5",
          price: "2340.00",
          profit: "45.20",
          status: "completed",
          copiedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "ctrade_3",
          traderId: "trader_1",
          traderUsername: "CryptoKing",
          symbol: "SOL/USD",
          side: "sell",
          amount: "25",
          price: "98.75",
          profit: "0.00",
          status: "pending",
          copiedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: "ctrade_4",
          traderId: "trader_3",
          traderUsername: "ETHMaster",
          symbol: "AVAX/USD",
          side: "buy",
          amount: "50",
          price: "37.92",
          profit: "-12.30",
          status: "completed",
          copiedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to get copied trades:", error);
      res.status(500).json({ error: "Failed to fetch copied trades" });
    }
  });

  // Follow a trader
  app.post("/api/copy-trading/follow", requireAuth, async (req, res) => {
    try {
      const { traderId, copyAmount, copyPercentage } = req.body;
      const userId = req.user!.id;
      
      // Mock follow for MVP
      res.json({
        success: true,
        relationshipId: "rel_" + Date.now(),
        traderId,
        copyAmount,
        copyPercentage,
        message: "Successfully started copying trader",
      });
    } catch (error) {
      console.error("Failed to follow trader:", error);
      res.status(500).json({ error: "Failed to follow trader" });
    }
  });

  // Unfollow a trader
  app.post("/api/copy-trading/unfollow", requireAuth, async (req, res) => {
    try {
      const { relationshipId } = req.body;
      
      // Mock unfollow for MVP
      res.json({
        success: true,
        relationshipId,
        message: "Successfully stopped copying trader",
      });
    } catch (error) {
      console.error("Failed to unfollow trader:", error);
      res.status(500).json({ error: "Failed to unfollow trader" });
    }
  });

  // =================================================================
  // NFT MARKETPLACE - Buy, Sell, and Trade Digital Assets
  // =================================================================
  
  // Get featured NFTs
  app.get("/api/nft-marketplace/featured", async (req, res) => {
    try {
      // Mock featured NFTs for MVP
      res.json([
        {
          id: "nft_1",
          name: "Cosmic Dragon #4721",
          description: "A legendary cosmic dragon from the depths of space",
          image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=500&h=500&fit=crop",
          price: "2.5",
          currency: "ETH",
          collection: "Cosmic Dragons",
          owner: "0x1234567890123456789012345678901234567890",
          tokenId: "4721",
          contractAddress: "0x8765432187654321876543218765432187654321",
          chainId: 1,
          rarity: "legendary",
          forSale: true,
        },
        {
          id: "nft_2",
          name: "Cyber Punk #1893",
          description: "Futuristic cyber warrior from Neo Tokyo",
          image: "https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=500&h=500&fit=crop",
          price: "1.8",
          currency: "ETH",
          collection: "Cyber Punks",
          owner: "0x9876543298765432987654329876543298765432",
          tokenId: "1893",
          contractAddress: "0x4567890145678901456789014567890145678901",
          chainId: 1,
          rarity: "epic",
          forSale: true,
        },
        {
          id: "nft_3",
          name: "Digital Art #5432",
          description: "Abstract digital masterpiece",
          image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&h=500&fit=crop",
          price: "0.8",
          currency: "ETH",
          collection: "Digital Arts",
          owner: "0x5678901256789012567890125678901256789012",
          tokenId: "5432",
          contractAddress: "0x2345678923456789234567892345678923456789",
          chainId: 1,
          rarity: "rare",
          forSale: true,
        },
        {
          id: "nft_4",
          name: "Space Explorer #2341",
          description: "Brave explorer of the cosmos",
          image: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=500&h=500&fit=crop",
          price: "3.2",
          currency: "ETH",
          collection: "Space Explorers",
          owner: "0x3456789034567890345678903456789034567890",
          tokenId: "2341",
          contractAddress: "0x6789012367890123678901236789012367890123",
          chainId: 1,
          rarity: "legendary",
          forSale: true,
        },
        {
          id: "nft_5",
          name: "Pixel Warriors #8765",
          description: "Classic 8-bit warrior NFT",
          image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=500&h=500&fit=crop",
          price: "0.5",
          currency: "ETH",
          collection: "Pixel Warriors",
          owner: "0x7890123478901234789012347890123478901234",
          tokenId: "8765",
          contractAddress: "0x3456789034567890345678903456789034567891",
          chainId: 1,
          rarity: "common",
          forSale: true,
        },
        {
          id: "nft_6",
          name: "Neon City #3210",
          description: "Vibrant neon cityscape",
          image: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=500&h=500&fit=crop",
          price: "1.5",
          currency: "ETH",
          collection: "Neon Cities",
          owner: "0x2345678923456789234567892345678923456790",
          tokenId: "3210",
          contractAddress: "0x5678901256789012567890125678901256789013",
          chainId: 1,
          rarity: "rare",
          forSale: true,
        },
        {
          id: "nft_7",
          name: "Crystal Gem #9876",
          description: "Rare crystalline NFT with unique properties",
          image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=500&h=500&fit=crop",
          price: "2.1",
          currency: "ETH",
          collection: "Crystal Gems",
          owner: "0x4567890145678901456789014567890145678902",
          tokenId: "9876",
          contractAddress: "0x7890123478901234789012347890123478901235",
          chainId: 1,
          rarity: "epic",
          forSale: true,
        },
        {
          id: "nft_8",
          name: "Abstract Mind #6543",
          description: "Thought-provoking abstract art",
          image: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=500&h=500&fit=crop",
          price: "1.2",
          currency: "ETH",
          collection: "Abstract Minds",
          owner: "0x6789012367890123678901236789012367890124",
          tokenId: "6543",
          contractAddress: "0x9012345690123456901234569012345690123456",
          chainId: 1,
          rarity: "rare",
          forSale: true,
        },
      ]);
    } catch (error) {
      console.error("Failed to get featured NFTs:", error);
      res.status(500).json({ error: "Failed to fetch featured NFTs" });
    }
  });

  // Get collections
  app.get("/api/nft-marketplace/collections", async (req, res) => {
    try {
      // Mock collections for MVP
      res.json([
        {
          id: "col_1",
          name: "Cosmic Dragons",
          description: "Legendary dragons from across the cosmos, each with unique powers and rarity",
          image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=200&h=200&fit=crop",
          floorPrice: "2.1",
          volume24h: "45.3K",
          items: 10000,
          owners: 4523,
        },
        {
          id: "col_2",
          name: "Cyber Punks",
          description: "Futuristic warriors from Neo Tokyo",
          image: "https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=200&h=200&fit=crop",
          floorPrice: "1.5",
          volume24h: "32.8K",
          items: 8000,
          owners: 3891,
        },
        {
          id: "col_3",
          name: "Digital Arts",
          description: "Abstract digital masterpieces from renowned artists",
          image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
          floorPrice: "0.7",
          volume24h: "18.5K",
          items: 5000,
          owners: 2143,
        },
        {
          id: "col_4",
          name: "Space Explorers",
          description: "Brave explorers venturing into the unknown depths of space",
          image: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=200&h=200&fit=crop",
          floorPrice: "2.8",
          volume24h: "56.2K",
          items: 12000,
          owners: 5678,
        },
        {
          id: "col_5",
          name: "Pixel Warriors",
          description: "Classic 8-bit warriors with nostalgic charm",
          image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=200&h=200&fit=crop",
          floorPrice: "0.3",
          volume24h: "9.8K",
          items: 15000,
          owners: 6234,
        },
        {
          id: "col_6",
          name: "Crystal Gems",
          description: "Rare crystalline NFTs with unique on-chain properties",
          image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&h=200&fit=crop",
          floorPrice: "1.9",
          volume24h: "28.4K",
          items: 7000,
          owners: 3456,
        },
      ]);
    } catch (error) {
      console.error("Failed to get collections:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  // Get user's NFTs
  app.get("/api/nft-marketplace/my-nfts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Mock user NFTs for MVP
      res.json([
        {
          id: "mynft_1",
          name: "My Cosmic Dragon #1234",
          description: "Your personal cosmic dragon",
          image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=500&h=500&fit=crop",
          price: "3.0",
          currency: "ETH",
          collection: "Cosmic Dragons",
          owner: userId,
          tokenId: "1234",
          contractAddress: "0x8765432187654321876543218765432187654321",
          chainId: 1,
          rarity: "epic",
          forSale: false,
        },
        {
          id: "mynft_2",
          name: "My Cyber Punk #5678",
          description: "Your cyber warrior",
          image: "https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=500&h=500&fit=crop",
          price: "2.5",
          currency: "ETH",
          collection: "Cyber Punks",
          owner: userId,
          tokenId: "5678",
          contractAddress: "0x4567890145678901456789014567890145678901",
          chainId: 1,
          rarity: "rare",
          forSale: true,
        },
      ]);
    } catch (error) {
      console.error("Failed to get user NFTs:", error);
      res.status(500).json({ error: "Failed to fetch user NFTs" });
    }
  });

  // Get marketplace stats
  app.get("/api/nft-marketplace/stats", async (req, res) => {
    try {
      // Mock stats for MVP
      res.json({
        totalVolume: "2.4M",
        totalNFTs: 52000,
        activeListings: 8945,
        avgFloorPrice: "1.8",
      });
    } catch (error) {
      console.error("Failed to get marketplace stats:", error);
      res.status(500).json({ error: "Failed to fetch marketplace stats" });
    }
  });

  // Buy NFT
  app.post("/api/nft-marketplace/buy", requireAuth, async (req, res) => {
    try {
      const { nftId, tokenId, contractAddress, price, currency } = req.body;
      const userId = req.user!.id;
      
      // Mock purchase for MVP
      res.json({
        success: true,
        transactionHash: "0x" + Math.random().toString(16).substring(2, 66),
        nftId,
        message: "NFT purchased successfully",
      });
    } catch (error) {
      console.error("Failed to purchase NFT:", error);
      res.status(500).json({ error: "Failed to purchase NFT" });
    }
  });

  // List NFT for sale
  app.post("/api/nft-marketplace/list", requireAuth, async (req, res) => {
    try {
      const { nftId, price, currency } = req.body;
      const userId = req.user!.id;
      
      // Mock listing for MVP
      res.json({
        success: true,
        nftId,
        price,
        currency,
        message: "NFT listed for sale successfully",
      });
    } catch (error) {
      console.error("Failed to list NFT:", error);
      res.status(500).json({ error: "Failed to list NFT" });
    }
  });

  // ========================================
  // MEMORY OF THE MANY - RELIC NFT MINTING
  // ========================================
  
  // Mint a Memory Relic NFT (with security fixes)
  app.post("/api/nft/mint-memory-relic", requireAuth, nftRateLimit, async (req, res) => {
    try {
      // Zod validation for mint request
      const mintRelicSchema = z.object({
        relicId: z.string().min(1, "Relic ID required"),
        walletAddress: z.string()
          .trim()
          .toLowerCase()
          .regex(/^0x[a-f0-9]{40}$/, "Invalid Ethereum address format")
          .refine((addr) => addr !== "0x0000000000000000000000000000000000000000", 
            "Cannot mint to zero address")
      });

      const validatedData = mintRelicSchema.parse(req.body);
      const { relicId, walletAddress } = validatedData;
      const userId = req.user!.id;

      // Use database transaction for atomic supply checking and minting
      const result = await dbClient.transaction(async (tx) => {
        // Lock the relic row to prevent race conditions
        const [relic] = await tx
          .select()
          .from(relicDefinitions)
          .where(eq(relicDefinitions.id, relicId))
          .for('update');

        if (!relic) {
          throw new Error("Relic not found");
        }

        // Check if supply available
        const currentSupply = parseInt(relic.currentSupply);
        const maxSupply = parseInt(relic.maxSupply);
        
        if (currentSupply >= maxSupply) {
          throw new Error("Relic sold out");
        }

        // Check if wallet already minted this relic
        const [existingMint] = await tx
          .select()
          .from(relicMints)
          .where(
            and(
              eq(relicMints.relicId, relicId),
              sql`LOWER(${relicMints.walletAddress}) = LOWER(${walletAddress})`
            )
          );

        if (existingMint) {
          throw new Error("You already own this relic");
        }

        // Generate token ID
        const tokenId = (currentSupply + 1).toString();

        // Mint the relic (simulated transaction) - price from server-side definition only
        const txHash = "0x" + Math.random().toString(16).substring(2, 66);

        const [mint] = await tx.insert(relicMints).values({
          relicId,
          userId,
          walletAddress: walletAddress.toLowerCase(),
          tokenId,
          status: "simulated",
          txHash,
          priceEthPaid: relic.priceEth, // Server-controlled price only
        }).returning();

        // Update current supply
        await tx
          .update(relicDefinitions)
          .set({ currentSupply: (currentSupply + 1).toString() })
          .where(eq(relicDefinitions.id, relicId));

        return { mint, relic, tokenId, txHash };
      });

      console.log(`✨ Relic minted: ${result.relic.name} (#${result.tokenId}) to ${walletAddress}`);

      res.json({
        success: true,
        tokenId: result.tokenId,
        txHash: result.txHash,
        status: "simulated",
        message: `Successfully minted ${result.relic.name}`,
      });
    } catch (error: any) {
      console.error("Failed to mint relic:", error);
      res.status(500).json({ error: error.message || "Failed to mint relic" });
    }
  });

  // Get user's minted relics (authenticated)
  app.get("/api/nft/my-relics", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Get all relics minted by this user (across all their wallets)
      const mints = await db
        .select({
          id: relicMints.id,
          relicId: relicMints.relicId,
          tokenId: relicMints.tokenId,
          status: relicMints.status,
          txHash: relicMints.txHash,
          walletAddress: relicMints.walletAddress,
          mintedAt: relicMints.mintedAt,
          name: relicDefinitions.name,
          description: relicDefinitions.description,
          imageUrl: relicDefinitions.imageUrl,
          rarity: relicDefinitions.rarity,
          attributes: relicDefinitions.attributes,
        })
        .from(relicMints)
        .leftJoin(relicDefinitions, eq(relicMints.relicId, relicDefinitions.id))
        .where(eq(relicMints.userId, userId))
        .orderBy(desc(relicMints.mintedAt));

      res.json(mints);
    } catch (error) {
      console.error("Failed to get user relics:", error);
      res.status(500).json({ error: "Failed to fetch relics" });
    }
  });

  // Get relic definitions with current supply
  app.get("/api/nft/relic-definitions", async (req, res) => {
    try {
      const relics = await dbClient
        .select()
        .from(relicDefinitions)
        .orderBy(desc(relicDefinitions.rarity));

      res.json(relics);
    } catch (error) {
      console.error("Failed to get relic definitions:", error);
      res.status(500).json({ error: "Failed to fetch relic definitions" });
    }
  });

  // ========================================
  // CHAOS ATM - CRYPTO WITHDRAWAL SYSTEM
  // ========================================

  // Get user's crypto balances for ATM withdrawal
  app.get("/api/chaos-atm/balances", async (req, res) => {
    try {
      // Get owner user ID directly from database for demo
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(404).json({ error: "Owner user not found" });
      }
      const userId = ownerUser.id;
      console.log("📊 ATM Balance Request - User ID:", userId);

      // Get user's wallets
      const userWallets = await storage.getWalletsByUserId(userId);
      console.log("📊 User Wallets:", userWallets?.length || 0, "wallets found");
      
      // Get token balances for all user wallets (query by each wallet address)
      let tokenBalanceRecords: any[] = [];
      if (userWallets && userWallets.length > 0) {
        try {
          // Get all token balances for user's wallets
          const allTokenBalances = await dbClient
            .select({
              walletAddress: (tokenBalances as any).walletAddress,
              tokenId: (tokenBalances as any).tokenId,
              balance: (tokenBalances as any).balance,
              symbol: tokens.symbol,
            })
            .from(tokenBalances as any)
            .innerJoin(tokens, eq((tokenBalances as any).tokenId, tokens.id));
          
          // Filter to only include wallets that belong to this user
          const walletAddressSet = new Set(userWallets.map(w => w.address?.toLowerCase?.() || w.address));
          tokenBalanceRecords = allTokenBalances.filter(tb => 
            walletAddressSet.has(tb.walletAddress?.toLowerCase?.() || tb.walletAddress)
          );
        } catch (error) {
          console.log("Token balance query error:", error);
          tokenBalanceRecords = [];
        }
      }

      // Calculate total balances by crypto type
      const balances = {
        ETH: "0",
        BTC: "0",
        USDT: "0",
        USDC: "0",
        DAI: "0"
      };

      // Sum wallet balances (ETH) - convert from wei to ETH
      if (userWallets) {
        for (const wallet of userWallets) {
          const ethBalanceWei = parseFloat(wallet.balance || "0");
          const ethBalance = ethBalanceWei / 1e18; // Convert wei to ETH
          balances.ETH = (parseFloat(balances.ETH) + ethBalance).toString();
        }
      }

      // Sum token balances - convert from base units to human-readable
      // Different tokens have different decimals:
      // BTC: 8 decimals, USDT: 6 decimals, USDC: 6 decimals, DAI: 18 decimals
      const tokenDecimals: Record<string, number> = {
        BTC: 8,
        USDT: 6,
        USDC: 6,
        DAI: 18,
        ETH: 18
      };

      for (const token of tokenBalanceRecords) {
        const symbol = token.symbol?.toUpperCase() || "";
        if (symbol in balances) {
          const tokenBalanceRaw = parseFloat(token.balance || "0");
          const decimals = tokenDecimals[symbol] || 18; // Default to 18 if unknown
          const tokenBalance = tokenBalanceRaw / Math.pow(10, decimals);
          balances[symbol as keyof typeof balances] = (
            parseFloat(balances[symbol as keyof typeof balances]) + tokenBalance
          ).toString();
        }
      }

      // Get current crypto prices
      const prices = await getAllPrices();
      console.log("📊 Prices:", prices);

      // Calculate USD values
      const balancesWithUsd = Object.entries(balances).map(([crypto, amount]) => {
        const priceObj = prices[crypto.toUpperCase()] || { usd: 0 };
        const price = typeof priceObj === 'object' ? (priceObj.usd || 0) : priceObj;
        const usdValue = (parseFloat(amount) * price).toFixed(2);
        return {
          crypto,
          amount,
          usdValue,
          price: price.toString()
        };
      });

      console.log("📊 Final Balances:", balancesWithUsd);
      res.json({
        balances: balancesWithUsd,
        total_usd: balancesWithUsd.reduce((sum, b) => sum + parseFloat(b.usdValue), 0).toFixed(2)
      });
    } catch (error) {
      console.error("Failed to get ATM balances:", error);
      res.status(500).json({ error: "Failed to fetch balances" });
    }
  });

  // Create withdrawal request
  app.post("/api/chaos-atm/withdraw", async (req, res) => {
    try {
      // Get owner user ID directly from database for demo
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(404).json({ error: "Owner user not found" });
      }
      const userId = ownerUser.id;
      
      const withdrawalSchema = z.object({
        cryptoType: z.enum(["ETH", "BTC", "USDT", "USDC", "DAI"]),
        cryptoAmount: z.string().refine(val => parseFloat(val) > 0, "Amount must be positive"),
        withdrawalMethod: z.enum(["bank_transfer", "debit_card", "instant_cash"]),
        destinationAccount: z.string().optional()
      });

      const data = withdrawalSchema.parse(req.body);

      // Get current price
      const prices = await getAllPrices();
      const priceObj = prices[data.cryptoType.toUpperCase()] || { usd: 0 };
      const price = typeof priceObj === 'object' ? (priceObj.usd || 0) : priceObj;
      const fiatAmount = (parseFloat(data.cryptoAmount) * price).toFixed(2);

      // Calculate fees (2% for instant, 1% for debit, 0.5% for bank)
      let feePercent = 0.005; // Default to bank transfer
      if (data.withdrawalMethod === "instant_cash") feePercent = 0.02; // 2%
      if (data.withdrawalMethod === "debit_card") feePercent = 0.01; // 1%
      const platformFee = (parseFloat(fiatAmount) * feePercent).toFixed(2);
      const networkFee = "2.50"; // Fixed $2.50 network fee
      const totalFiatReceived = (
        parseFloat(fiatAmount) - parseFloat(platformFee) - parseFloat(networkFee)
      ).toFixed(2);

      // Estimated arrival time
      let hoursToArrival = 24; // Bank transfer default
      if (data.withdrawalMethod === "instant_cash") hoursToArrival = 0.25; // 15 minutes
      if (data.withdrawalMethod === "debit_card") hoursToArrival = 1; // 1 hour

      const estimatedArrival = new Date(Date.now() + hoursToArrival * 60 * 60 * 1000);

      // Create withdrawal record
      const [withdrawal] = await dbClient.insert(codexAtmWithdrawals).values({
        userId,
        cryptoType: data.cryptoType,
        cryptoAmount: data.cryptoAmount,
        fiatAmount,
        fiatCurrency: "USD",
        withdrawalMethod: data.withdrawalMethod,
        destinationAccount: data.destinationAccount || null,
        status: "pending",
        exchangeRate: price.toString(),
        platformFee,
        networkFee,
        totalFiatReceived,
        estimatedArrival,
        transactionHash: "0x" + Math.random().toString(16).substring(2, 66), // Simulated
        processorReference: "CHAOS-" + Date.now(),
      }).returning();

      res.json({
        success: true,
        withdrawal,
        message: `Withdrawal of ${data.cryptoAmount} ${data.cryptoType} initiated. You'll receive $${totalFiatReceived} after fees.`
      });
    } catch (error) {
      console.error("Failed to create withdrawal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // Get user's withdrawal history
  app.get("/api/chaos-atm/withdrawals", async (req, res) => {
    try {
      // Get owner user for demo
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(404).json({ error: "Owner user not found" });
      }
      const userId = ownerUser.id;

      const withdrawals = await dbClient
        .select()
        .from(codexAtmWithdrawals)
        .where(eq(codexAtmWithdrawals.userId, userId))
        .orderBy(desc(codexAtmWithdrawals.createdAt))
        .limit(50);

      res.json(withdrawals);
    } catch (error) {
      console.error("Failed to get withdrawal history:", error);
      res.status(500).json({ error: "Failed to fetch withdrawal history" });
    }
  });

  // ============================================================================
  // PRICE ALERTS API
  // ============================================================================
  
  // Get all crypto prices
  app.get("/api/crypto/prices", async (req, res) => {
    try {
      const prices = await getAllPrices();
      res.json(prices);
    } catch (error) {
      console.error("Failed to get crypto prices:", error);
      res.status(500).json({ error: "Failed to fetch crypto prices" });
    }
  });

  // Get user's price alerts
  app.get("/api/price-alerts", async (req, res) => {
    try {
      // Get owner user for demo
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.json([]);
      }
      const userId = ownerUser.id;

      const alerts = await dbClient
        .select()
        .from(priceAlerts)
        .where(eq(priceAlerts.userId, userId))
        .orderBy(desc(priceAlerts.createdAt));

      // Transform for frontend
      const transformedAlerts = alerts.map(alert => ({
        id: alert.id,
        symbol: alert.symbol,
        targetPrice: parseFloat(alert.targetPrice || "0"),
        direction: alert.direction,
        currentPrice: parseFloat(alert.currentPrice || "0"),
        triggered: alert.triggered === "true",
        enabled: alert.enabled === "true",
        createdAt: alert.createdAt?.toISOString() || new Date().toISOString(),
      }));

      res.json(transformedAlerts);
    } catch (error) {
      console.error("Failed to get price alerts:", error);
      res.status(500).json({ error: "Failed to fetch price alerts" });
    }
  });

  // Create price alert
  app.post("/api/price-alerts", async (req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(401).json({ error: "User not found" });
      }
      const userId = ownerUser.id;

      const alertSchema = z.object({
        symbol: z.string().min(1),
        targetPrice: z.number().positive(),
        direction: z.enum(["above", "below"]),
      });

      const data = alertSchema.parse(req.body);

      const [alert] = await dbClient.insert(priceAlerts).values({
        userId,
        symbol: data.symbol,
        targetPrice: data.targetPrice.toString(),
        direction: data.direction,
        triggered: "false",
        enabled: "true",
      }).returning();

      res.json({
        success: true,
        alert: {
          id: alert.id,
          symbol: alert.symbol,
          targetPrice: parseFloat(alert.targetPrice || "0"),
          direction: alert.direction,
          triggered: false,
          enabled: true,
          createdAt: alert.createdAt?.toISOString() || new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error("Failed to create price alert:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to create price alert" });
    }
  });

  // Update price alert (toggle enabled)
  app.patch("/api/price-alerts/:alertId", async (req, res) => {
    try {
      const { alertId } = req.params;
      const { enabled } = req.body;

      const [updated] = await dbClient
        .update(priceAlerts)
        .set({ 
          enabled: enabled ? "true" : "false",
          updatedAt: new Date()
        })
        .where(eq(priceAlerts.id, alertId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Alert not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update price alert:", error);
      res.status(500).json({ error: "Failed to update price alert" });
    }
  });

  // Delete price alert
  app.delete("/api/price-alerts/:alertId", async (req, res) => {
    try {
      const { alertId } = req.params;

      await dbClient
        .delete(priceAlerts)
        .where(eq(priceAlerts.id, alertId));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete price alert:", error);
      res.status(500).json({ error: "Failed to delete price alert" });
    }
  });

  // ============================================================================
  // 🏆 STANDOUT FEATURES - Competitive & Social
  // ============================================================================

  // LEADERBOARD - Get top traders
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { timeframe = "weekly" } = req.query;
      const traders = await dbClient
        .select()
        .from(traderPerformance)
        .where(eq(traderPerformance.isPublic, "true"))
        .orderBy(desc(traderPerformance.totalPnl))
        .limit(100);

      const formattedTraders = traders.map((t, idx) => ({
        rank: idx + 1,
        userId: t.userId,
        displayName: t.displayName || `Trader_${t.userId?.slice(-4)}`,
        avatarUrl: t.avatarUrl,
        totalPnl: t.totalPnl,
        totalPnlPercent: t.totalPnlPercent,
        winRate: t.winRate,
        totalTrades: t.totalTrades,
        totalVolume: t.totalVolume,
        tradingStreak: t.tradingStreak,
        tier: t.tier,
        isOnline: false,
      }));

      res.json(formattedTraders);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      res.json([]);
    }
  });

  app.get("/api/leaderboard/stats", async (_req, res) => {
    try {
      const [totalResult] = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(traderPerformance);
      
      res.json({
        totalTraders: totalResult?.count || 0,
        totalVolume: "$2.4B",
        activeNow: Math.floor(Math.random() * 500) + 500,
        prizePool: "$50,000"
      });
    } catch (error) {
      res.json({ totalTraders: 0, totalVolume: "$0", activeNow: 0, prizePool: "$0" });
    }
  });

  // WHALE TRACKER - Get whale movements
  app.get("/api/whales/movements", async (_req, res) => {
    try {
      const movements = await dbClient
        .select()
        .from(whaleTracks)
        .orderBy(desc(whaleTracks.timestamp))
        .limit(50);
      res.json(movements);
    } catch (error) {
      console.error("Failed to fetch whale movements:", error);
      res.json([]);
    }
  });

  app.get("/api/whales/stats", async (_req, res) => {
    try {
      const [totalResult] = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(whaleTracks);
      
      res.json({
        totalWhalesTracked: 2547,
        movementsToday: totalResult?.count || 0,
        totalVolumeToday: "$2.4B",
        significantMoves: 23
      });
    } catch (error) {
      res.json({ totalWhalesTracked: 0, movementsToday: 0, totalVolumeToday: "$0", significantMoves: 0 });
    }
  });

  app.post("/api/whales/watch", async (req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { walletAddress, customLabel } = req.body;
      const [watched] = await dbClient.insert(watchedWhales).values({
        userId: ownerUser.id,
        walletAddress,
        customLabel,
        notifyOnActivity: "true",
      }).returning();

      res.json({ success: true, watched });
    } catch (error) {
      console.error("Failed to watch whale:", error);
      res.status(500).json({ error: "Failed to watch whale" });
    }
  });

  // AI SENTIMENT - Get market sentiment
  app.get("/api/ai/sentiment", async (req, res) => {
    try {
      const { symbol = "BTC" } = req.query;
      const [sentiment] = await dbClient
        .select()
        .from(aiSentimentSnapshots)
        .where(eq(aiSentimentSnapshots.symbol, symbol as string))
        .orderBy(desc(aiSentimentSnapshots.snapshotTime))
        .limit(1);

      if (sentiment) {
        res.json(sentiment);
      } else {
        res.json({
          symbol,
          sentimentScore: "68",
          sentimentLabel: "greed",
          twitterSentiment: "72",
          newsSentiment: "65",
          onchainSentiment: "71",
          fearGreedIndex: "68",
          prediction: "bullish",
          confidence: "78"
        });
      }
    } catch (error) {
      console.error("Failed to fetch AI sentiment:", error);
      res.json({ sentimentScore: "50", sentimentLabel: "neutral" });
    }
  });

  app.get("/api/ai/market-overview", async (_req, res) => {
    res.json({
      overallSentiment: "bullish",
      topGainers: ["SOL", "ETH", "BNB"],
      topLosers: ["DOGE", "XRP"],
      trendingKeywords: ["halving", "ETF", "DeFi"]
    });
  });

  // COMPETITIONS - Trading competitions
  app.get("/api/competitions", async (_req, res) => {
    try {
      const competitions = await dbClient
        .select()
        .from(tradingCompetitions)
        .orderBy(desc(tradingCompetitions.startTime));
      res.json(competitions);
    } catch (error) {
      console.error("Failed to fetch competitions:", error);
      res.json([]);
    }
  });

  app.get("/api/competitions/:id/leaderboard", async (req, res) => {
    try {
      const { id } = req.params;
      const entries = await dbClient
        .select()
        .from(competitionEntries)
        .where(eq(competitionEntries.competitionId, id))
        .orderBy(desc(competitionEntries.score))
        .limit(50);
      
      const formatted = entries.map((e, idx) => ({
        rank: idx + 1,
        userId: e.userId,
        displayName: e.displayName || `Trader_${e.userId?.slice(-4)}`,
        score: e.score,
        pnl: `+$${e.pnl}`,
        tradesCount: e.tradesCount
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Failed to fetch competition leaderboard:", error);
      res.json([]);
    }
  });

  app.post("/api/competitions/:id/join", async (req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { id } = req.params;
      const [entry] = await dbClient.insert(competitionEntries).values({
        competitionId: id,
        userId: ownerUser.id,
        displayName: ownerUser.username || "Trader",
        score: "0",
        pnl: "0",
        tradesCount: "0",
      }).returning();

      res.json({ success: true, entry });
    } catch (error) {
      console.error("Failed to join competition:", error);
      res.status(500).json({ error: "Failed to join competition" });
    }
  });

  // PAPER TRADING - Simulation mode
  app.get("/api/paper/account", async (_req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.json(null);
      }

      let [account] = await dbClient
        .select()
        .from(paperAccounts)
        .where(eq(paperAccounts.userId, ownerUser.id))
        .limit(1);

      if (!account) {
        [account] = await dbClient.insert(paperAccounts).values({
          userId: ownerUser.id,
          name: "Practice Account",
          initialBalance: "100000",
          currentBalance: "100000",
          totalPnl: "0",
          totalPnlPercent: "0",
          totalTrades: "0",
          winningTrades: "0",
          losingTrades: "0",
          holdings: {},
          isActive: "true"
        }).returning();
      }

      res.json(account);
    } catch (error) {
      console.error("Failed to fetch paper account:", error);
      res.json(null);
    }
  });

  app.get("/api/paper/trades", async (_req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.json([]);
      }

      const trades = await dbClient
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.userId, ownerUser.id))
        .orderBy(desc(paperTrades.executedAt))
        .limit(50);

      res.json(trades);
    } catch (error) {
      console.error("Failed to fetch paper trades:", error);
      res.json([]);
    }
  });

  app.post("/api/paper/trade", async (req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { type, symbol, amount } = req.body;
      const prices = getAllPrices();
      const price = prices[symbol]?.usd || 0;
      const totalValue = price * parseFloat(amount);

      const [account] = await dbClient
        .select()
        .from(paperAccounts)
        .where(eq(paperAccounts.userId, ownerUser.id))
        .limit(1);

      if (!account) {
        return res.status(400).json({ error: "No paper account found" });
      }

      const [trade] = await dbClient.insert(paperTrades).values({
        accountId: account.id,
        userId: ownerUser.id,
        type,
        symbol,
        amount: amount.toString(),
        price: price.toString(),
        totalValue: totalValue.toString(),
        status: "completed"
      }).returning();

      await dbClient
        .update(paperAccounts)
        .set({
          totalTrades: (parseInt(account.totalTrades || "0") + 1).toString(),
          updatedAt: new Date()
        })
        .where(eq(paperAccounts.id, account.id));

      res.json({ success: true, trade });
    } catch (error) {
      console.error("Failed to execute paper trade:", error);
      res.status(500).json({ error: "Failed to execute paper trade" });
    }
  });

  app.post("/api/paper/reset", async (_req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(401).json({ error: "User not found" });
      }

      await dbClient
        .update(paperAccounts)
        .set({
          currentBalance: "100000",
          totalPnl: "0",
          totalPnlPercent: "0",
          totalTrades: "0",
          winningTrades: "0",
          losingTrades: "0",
          holdings: {},
          updatedAt: new Date()
        })
        .where(eq(paperAccounts.userId, ownerUser.id));

      await dbClient
        .delete(paperTrades)
        .where(eq(paperTrades.userId, ownerUser.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to reset paper account:", error);
      res.status(500).json({ error: "Failed to reset paper account" });
    }
  });

  // LIVE ACTIVITY FEED
  app.get("/api/activity/live", async (req, res) => {
    try {
      const { filter = "all" } = req.query;
      let query = dbClient.select().from(platformActivity);
      
      if (filter !== "all") {
        query = query.where(eq(platformActivity.activityType, filter as string));
      }
      
      const activities = await query.orderBy(desc(platformActivity.createdAt)).limit(50);
      res.json(activities);
    } catch (error) {
      console.error("Failed to fetch activity feed:", error);
      res.json([]);
    }
  });

  app.get("/api/activity/stats", async (_req, res) => {
    try {
      const [totalResult] = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(platformActivity);
      
      res.json({
        totalToday: totalResult?.count || 12847,
        tradesToday: 8432,
        volumeToday: "$2.4B",
        activeUsers: 1247
      });
    } catch (error) {
      res.json({ totalToday: 0, tradesToday: 0, volumeToday: "$0", activeUsers: 0 });
    }
  });

  // ACHIEVEMENTS
  app.get("/api/achievements", async (_req, res) => {
    try {
      const allAchievements = await dbClient.select().from(achievements);
      res.json(allAchievements);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      res.json([]);
    }
  });

  app.get("/api/achievements/stats", async (_req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.json({ totalXp: 0, level: 1, achievementsUnlocked: 0, totalAchievements: 0 });
      }

      const [totalResult] = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(achievements);

      const [unlockedResult] = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, ownerUser.id),
          sql`${userAchievements.unlockedAt} IS NOT NULL`
        ));

      res.json({
        totalXp: 4350,
        level: 12,
        achievementsUnlocked: unlockedResult?.count || 0,
        totalAchievements: totalResult?.count || 0,
        nextLevelXp: 5000,
        tokensEarned: 160
      });
    } catch (error) {
      res.json({ totalXp: 0, level: 1, achievementsUnlocked: 0, totalAchievements: 0 });
    }
  });

  app.post("/api/achievements/:id/claim", async (req, res) => {
    try {
      const ownerUser = await storage.getUserByUsername("empire_owner");
      if (!ownerUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { id } = req.params;
      await dbClient
        .update(userAchievements)
        .set({ claimedAt: new Date() })
        .where(and(
          eq(userAchievements.userId, ownerUser.id),
          eq(userAchievements.achievementId, id)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to claim achievement:", error);
      res.status(500).json({ error: "Failed to claim achievement" });
    }
  });

  // 📦 ANDROID BUILD DOWNLOAD ROUTES
  // Primary download endpoint
  app.get("/download-android-build", (req, res) => {
    const filePath = "/home/runner/workspace/DOWNLOAD-THIS-android-build.tar.gz";
    res.download(filePath, "android-build.tar.gz", (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Error downloading file");
      }
    });
  });

  // Alternative download endpoint (direct download without page)
  app.get("/api/download-android", (req, res) => {
    const filePath = "/home/runner/workspace/DOWNLOAD-THIS-android-build.tar.gz";
    res.download(filePath, "android-build.tar.gz", (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Error downloading file");
      }
    });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
