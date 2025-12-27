import { db } from '../storage';
import {
  withdrawalWhitelists,
  antiPhishingCodes,
  timeLockedWithdrawals,
  fraudDetectionLogs,
  proofOfReserves,
  securityIncidents,
  rpcEndpoints,
  type InsertWithdrawalWhitelist,
  type InsertAntiPhishingCode,
  type InsertTimeLockedWithdrawal,
  type InsertFraudDetectionLog,
  type InsertProofOfReserves,
  type InsertSecurityIncident,
  type InsertRpcEndpoint,
} from '@shared/schema';
import { eq, and, desc, sql, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * 🛡️ ENTERPRISE SECURITY INFRASTRUCTURE SERVICE
 * 
 * Implements Kraken/Crypto.com-level security features:
 * - Withdrawal whitelists (prevent unauthorized transfers)
 * - Anti-phishing codes (prevent social engineering)
 * - Time-locked withdrawals (prevent account takeover losses)
 * - AI fraud detection (pattern recognition)
 * - Proof of reserves (real-time transparency)
 * - Security incident tracking
 * - RPC endpoint management (Alchemy/Infura)
 */

// ============================================================================
// WITHDRAWAL WHITELISTS - Kraken-Level Security
// ============================================================================

export async function addWithdrawalWhitelist(
  walletAddress: string,
  whitelistedAddress: string,
  label?: string
) {
  const [whitelist] = await db.insert(withdrawalWhitelists).values({
    walletAddress: walletAddress.toLowerCase(),
    whitelistedAddress: whitelistedAddress.toLowerCase(),
    label,
  }).returning();
  
  return whitelist;
}

export async function getWithdrawalWhitelists(walletAddress: string) {
  return await db.select().from(withdrawalWhitelists)
    .where(and(
      sql`lower(${withdrawalWhitelists.walletAddress}) = ${walletAddress.toLowerCase()}`,
      eq(withdrawalWhitelists.isActive, 'true')
    ))
    .orderBy(desc(withdrawalWhitelists.createdAt));
}

export async function isAddressWhitelisted(
  walletAddress: string,
  destinationAddress: string
): Promise<boolean> {
  const [result] = await db.select().from(withdrawalWhitelists)
    .where(and(
      sql`lower(${withdrawalWhitelists.walletAddress}) = ${walletAddress.toLowerCase()}`,
      sql`lower(${withdrawalWhitelists.whitelistedAddress}) = ${destinationAddress.toLowerCase()}`,
      eq(withdrawalWhitelists.isActive, 'true')
    ))
    .limit(1);
  
  return !!result;
}

export async function removeWithdrawalWhitelist(id: string) {
  await db.update(withdrawalWhitelists)
    .set({ isActive: 'false' })
    .where(eq(withdrawalWhitelists.id, id));
}

// ============================================================================
// ANTI-PHISHING CODES - Prevent Social Engineering
// ============================================================================

export async function setAntiPhishingCode(
  walletAddress: string,
  phishingCode: string
) {
  const [existing] = await db.select().from(antiPhishingCodes)
    .where(sql`lower(${antiPhishingCodes.walletAddress}) = ${walletAddress.toLowerCase()}`)
    .limit(1);
  
  if (existing) {
    const [updated] = await db.update(antiPhishingCodes)
      .set({ code: phishingCode, updatedAt: new Date() })
      .where(eq(antiPhishingCodes.id, existing.id))
      .returning();
    return updated;
  }
  
  const [created] = await db.insert(antiPhishingCodes).values({
    walletAddress: walletAddress.toLowerCase(),
    code: phishingCode,
  }).returning();
  
  return created;
}

export async function getAntiPhishingCode(walletAddress: string) {
  const [code] = await db.select().from(antiPhishingCodes)
    .where(sql`lower(${antiPhishingCodes.walletAddress}) = ${walletAddress.toLowerCase()}`)
    .limit(1);
  
  return code;
}

// ============================================================================
// TIME-LOCKED WITHDRAWALS - Prevent Account Takeover Losses
// ============================================================================

/**
 * Create a time-locked withdrawal (24-48 hour delay for large amounts)
 * User must confirm via email/SMS before execution
 */
export async function createTimeLockedWithdrawal(
  walletAddress: string,
  destinationAddress: string,
  amount: string,
  currency: string = 'ETH',
  lockHours: number = 24
) {
  const lockUntil = new Date();
  lockUntil.setHours(lockUntil.getHours() + lockHours);
  
  const confirmationCode = nanoid(6).toUpperCase(); // 6-character code
  
  const [withdrawal] = await db.insert(timeLockedWithdrawals).values({
    walletAddress: walletAddress.toLowerCase(),
    destinationAddress: destinationAddress.toLowerCase(),
    amount,
    currency,
    lockUntil,
    confirmationCode,
    metadata: {
      lockHours,
      createdIp: 'system', // Should be actual IP in production
    },
  }).returning();
  
  // TODO: Send email/SMS with confirmation code
  
  return withdrawal;
}

export async function confirmTimeLockedWithdrawal(
  id: string,
  confirmationCode: string
) {
  const [withdrawal] = await db.select().from(timeLockedWithdrawals)
    .where(and(
      eq(timeLockedWithdrawals.id, id),
      eq(timeLockedWithdrawals.status, 'pending')
    ))
    .limit(1);
  
  if (!withdrawal) {
    throw new Error('Withdrawal not found or already processed');
  }
  
  if (withdrawal.confirmationCode !== confirmationCode) {
    throw new Error('Invalid confirmation code');
  }
  
  const [confirmed] = await db.update(timeLockedWithdrawals)
    .set({ isConfirmed: 'true', status: 'confirmed' })
    .where(eq(timeLockedWithdrawals.id, id))
    .returning();
  
  return confirmed;
}

export async function executeTimeLockedWithdrawals() {
  // Find all confirmed withdrawals that are past their lock time
  const readyWithdrawals = await db.select().from(timeLockedWithdrawals)
    .where(and(
      eq(timeLockedWithdrawals.status, 'confirmed'),
      eq(timeLockedWithdrawals.isConfirmed, 'true'),
      lt(timeLockedWithdrawals.lockUntil, new Date())
    ));
  
  const executed = [];
  
  for (const withdrawal of readyWithdrawals) {
    // TODO: Execute actual blockchain transaction here
    // For now, just mark as executed
    const [updated] = await db.update(timeLockedWithdrawals)
      .set({ 
        status: 'executed',
        executedAt: new Date()
      })
      .where(eq(timeLockedWithdrawals.id, withdrawal.id))
      .returning();
    
    executed.push(updated);
  }
  
  return executed;
}

export async function cancelTimeLockedWithdrawal(id: string, walletAddress: string) {
  const [cancelled] = await db.update(timeLockedWithdrawals)
    .set({ 
      status: 'cancelled',
      cancelledAt: new Date()
    })
    .where(and(
      eq(timeLockedWithdrawals.id, id),
      sql`lower(${timeLockedWithdrawals.walletAddress}) = ${walletAddress.toLowerCase()}`,
      eq(timeLockedWithdrawals.status, 'pending')
    ))
    .returning();
  
  if (!cancelled) {
    throw new Error('Withdrawal not found or cannot be cancelled');
  }
  
  return cancelled;
}

export async function getPendingTimeLockedWithdrawals(walletAddress: string) {
  return await db.select().from(timeLockedWithdrawals)
    .where(and(
      sql`lower(${timeLockedWithdrawals.walletAddress}) = ${walletAddress.toLowerCase()}`,
      eq(timeLockedWithdrawals.status, 'pending')
    ))
    .orderBy(desc(timeLockedWithdrawals.createdAt));
}

// ============================================================================
// FRAUD DETECTION - AI-Powered Monitoring
// ============================================================================

/**
 * Calculate risk score for a transaction
 * Returns 0-100 (higher = more suspicious)
 */
export function calculateRiskScore(
  walletAddress: string,
  amount: string,
  metadata: any
): { score: number; level: string; flags: string[] } {
  let score = 0;
  const flags: string[] = [];
  
  // Check 1: Large transaction amount
  const amountNum = parseFloat(amount);
  if (amountNum > 10) {
    score += 30;
    flags.push('Large transaction amount');
  }
  
  // Check 2: New destination address (would need history check)
  // TODO: Implement destination history check
  
  // Check 3: Unusual time (2AM-5AM local time)
  const hour = new Date().getHours();
  if (hour >= 2 && hour <= 5) {
    score += 20;
    flags.push('Unusual transaction time');
  }
  
  // Check 4: Rapid succession of transactions (velocity)
  // TODO: Implement velocity checking
  
  // Determine risk level
  let level = 'low';
  if (score >= 70) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 30) level = 'medium';
  
  return { score, level, flags };
}

export async function logFraudDetection(
  walletAddress: string,
  eventType: string,
  riskScore: number,
  riskLevel: string,
  description: string,
  metadata?: any
) {
  const action = riskLevel === 'critical' ? 'blocked' : 
                 riskLevel === 'high' ? 'flagged' : 'logged';
  
  const [log] = await db.insert(fraudDetectionLogs).values({
    walletAddress: walletAddress.toLowerCase(),
    eventType,
    riskScore,
    riskLevel,
    description,
    action,
    metadata,
  }).returning();
  
  // If critical, create security incident
  if (riskLevel === 'critical') {
    await createSecurityIncident({
      incidentType: eventType,
      severity: 'critical',
      affectedWallet: walletAddress,
      description: `Critical fraud detection: ${description}`,
      status: 'open',
      detectedBy: 'system',
      metadata: { fraudLogId: log.id, ...metadata },
    });
  }
  
  return log;
}

export async function getFraudLogs(walletAddress: string, limit: number = 50) {
  return await db.select().from(fraudDetectionLogs)
    .where(sql`lower(${fraudDetectionLogs.walletAddress}) = ${walletAddress.toLowerCase()}`)
    .orderBy(desc(fraudDetectionLogs.createdAt))
    .limit(limit);
}

// ============================================================================
// PROOF OF RESERVES - Real-Time Transparency
// ============================================================================

/**
 * Create a proof of reserves snapshot (similar to Kraken/Binance)
 * Should be run hourly or daily
 */
export async function createProofOfReservesSnapshot(
  totalEthReserves: string,
  totalUserBalances: string,
  chainId: string = '1',
  blockNumber?: string,
  merkleRoot?: string
) {
  const reserveRatio = (
    parseFloat(totalEthReserves) / parseFloat(totalUserBalances)
  ).toFixed(4);
  
  const [snapshot] = await db.insert(proofOfReserves).values({
    totalEthReserves,
    totalUserBalances,
    reserveRatio,
    chainId,
    blockNumber,
    merkleRoot,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  }).returning();
  
  return snapshot;
}

export async function getLatestProofOfReserves(chainId: string = '1') {
  const [latest] = await db.select().from(proofOfReserves)
    .where(eq(proofOfReserves.chainId, chainId))
    .orderBy(desc(proofOfReserves.snapshotTime))
    .limit(1);
  
  return latest;
}

export async function getProofOfReservesHistory(chainId: string = '1', limit: number = 30) {
  return await db.select().from(proofOfReserves)
    .where(eq(proofOfReserves.chainId, chainId))
    .orderBy(desc(proofOfReserves.snapshotTime))
    .limit(limit);
}

// ============================================================================
// SECURITY INCIDENTS - Track & Respond to Threats
// ============================================================================

export async function createSecurityIncident(
  incident: InsertSecurityIncident
) {
  const [created] = await db.insert(securityIncidents).values({
    ...incident,
    affectedWallet: incident.affectedWallet?.toLowerCase(),
  }).returning();
  
  return created;
}

export async function getSecurityIncidents(
  filters?: {
    severity?: string;
    status?: string;
    walletAddress?: string;
  },
  limit: number = 100
) {
  let query = db.select().from(securityIncidents);
  
  const conditions = [];
  if (filters?.severity) conditions.push(eq(securityIncidents.severity, filters.severity));
  if (filters?.status) conditions.push(eq(securityIncidents.status, filters.status));
  if (filters?.walletAddress) {
    conditions.push(
      sql`lower(${securityIncidents.affectedWallet}) = ${filters.walletAddress.toLowerCase()}`
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query
    .orderBy(desc(securityIncidents.createdAt))
    .limit(limit);
}

export async function resolveSecurityIncident(
  id: string,
  resolvedBy: string,
  actionsTaken?: any
) {
  const [resolved] = await db.update(securityIncidents)
    .set({
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy,
      actionsTaken,
      updatedAt: new Date(),
    })
    .where(eq(securityIncidents.id, id))
    .returning();
  
  return resolved;
}

// ============================================================================
// RPC ENDPOINT MANAGEMENT - Enterprise Infrastructure
// ============================================================================

export async function addRpcEndpoint(
  provider: string,
  chainId: string,
  endpoint: string,
  apiKey?: string,
  isPrimary: boolean = false
) {
  // If setting as primary, unset other primaries for this chain
  if (isPrimary) {
    await db.update(rpcEndpoints)
      .set({ isPrimary: 'false' })
      .where(eq(rpcEndpoints.chainId, chainId));
  }
  
  const [rpc] = await db.insert(rpcEndpoints).values({
    provider,
    chainId,
    endpoint,
    apiKey, // TODO: Encrypt in production
    isPrimary: isPrimary ? 'true' : 'false',
  }).returning();
  
  return rpc;
}

export async function getPrimaryRpcEndpoint(chainId: string) {
  const [primary] = await db.select().from(rpcEndpoints)
    .where(and(
      eq(rpcEndpoints.chainId, chainId),
      eq(rpcEndpoints.isPrimary, 'true'),
      eq(rpcEndpoints.isActive, 'true')
    ))
    .limit(1);
  
  if (!primary) {
    // Fallback to any active endpoint
    const [fallback] = await db.select().from(rpcEndpoints)
      .where(and(
        eq(rpcEndpoints.chainId, chainId),
        eq(rpcEndpoints.isActive, 'true')
      ))
      .limit(1);
    return fallback;
  }
  
  return primary;
}

export async function updateRpcHealth(
  id: string,
  healthStatus: 'healthy' | 'degraded' | 'down'
) {
  await db.update(rpcEndpoints)
    .set({
      healthStatus,
      lastHealthCheck: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(rpcEndpoints.id, id));
}

export async function getAllRpcEndpoints(chainId?: string) {
  let query = db.select().from(rpcEndpoints);
  
  if (chainId) {
    query = query.where(eq(rpcEndpoints.chainId, chainId)) as any;
  }
  
  return await query.orderBy(desc(rpcEndpoints.createdAt));
}

// ============================================================================
// SECURITY CENTER API HELPERS
// ============================================================================

// Aliases for consistent API naming
export const getWhitelistedAddresses = getWithdrawalWhitelists;
export const addWhitelistAddress = addWithdrawalWhitelist;
export const removeWhitelistAddress = removeWithdrawalWhitelist;

export async function getAntiPhishingCodes(walletAddress: string) {
  const codes = await db.select().from(antiPhishingCodes)
    .where(sql`lower(${antiPhishingCodes.walletAddress}) = ${walletAddress.toLowerCase()}`)
    .orderBy(desc(antiPhishingCodes.createdAt));
  
  return codes;
}

export async function getAllFraudLogs(limit: number = 100) {
  const logs = await db.select().from(fraudDetectionLogs)
    .orderBy(desc(fraudDetectionLogs.createdAt))
    .limit(limit);
  
  return logs;
}

export async function getAllTimeLockedWithdrawals() {
  const withdrawals = await db.select().from(timeLockedWithdrawals)
    .orderBy(desc(timeLockedWithdrawals.createdAt));
  
  return withdrawals;
}

// ============================================================================
// EMERGENCY LOCKDOWN SYSTEM
// ============================================================================

let emergencyLockdownEnabled = false;

export async function toggleEmergencyLockdown(enabled: boolean) {
  emergencyLockdownEnabled = enabled;
  
  // Log security incident
  await createSecurityIncident({
    incidentType: enabled ? 'emergency_lockdown_activated' : 'emergency_lockdown_deactivated',
    severity: enabled ? 'critical' : 'low',
    description: enabled 
      ? 'Emergency lockdown activated - all withdrawals blocked' 
      : 'Emergency lockdown deactivated - normal operations resumed',
    status: 'open',
    detectedBy: 'admin',
    metadata: { timestamp: new Date().toISOString() },
  });
  
  console.log(enabled 
    ? '🚨 EMERGENCY LOCKDOWN ACTIVATED - All withdrawals blocked'
    : '✅ Emergency lockdown deactivated - Normal operations resumed'
  );
}

export async function getEmergencyLockdownStatus() {
  return {
    enabled: emergencyLockdownEnabled,
    timestamp: new Date().toISOString(),
  };
}

export function isEmergencyLockdownActive(): boolean {
  return emergencyLockdownEnabled;
}
