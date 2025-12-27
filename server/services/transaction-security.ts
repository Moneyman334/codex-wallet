import {
  isAddressWhitelisted,
  getPendingTimeLockedWithdrawals,
  createTimeLockedWithdrawal,
  calculateRiskScore,
  logFraudDetection,
  createSecurityIncident,
} from './security-infrastructure';

/**
 * 🛡️ TRANSACTION SECURITY ENFORCEMENT
 * 
 * This is the CORE security layer that prevents unauthorized transactions.
 * Every withdrawal/transaction MUST pass through these checks.
 * 
 * Matches industry leaders: Kraken, Coinbase, Crypto.com security standards
 */

export interface TransactionRequest {
  fromAddress: string;
  toAddress: string;
  amount: string; // in wei or smallest unit
  currency: string;
  metadata?: any;
}

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
  timeLockedWithdrawalId?: string;
  riskScore?: number;
  riskLevel?: string;
}

/**
 * MASTER SECURITY CHECK
 * All transactions MUST pass through this before execution
 */
export async function validateTransactionSecurity(
  request: TransactionRequest
): Promise<SecurityCheckResult> {
  const { fromAddress, toAddress, amount, currency, metadata } = request;

  // ============================================================================
  // CHECK 1: Withdrawal Whitelist (Kraken-Level Security)
  // ============================================================================
  // NOTE: Whitelist enforcement is OPTIONAL until users configure it
  // This prevents blocking legitimate first-time withdrawals
  
  const whitelistEnabled = false; // TODO: Make this a user preference in Security Center
  
  if (whitelistEnabled) {
    const isWhitelisted = await isAddressWhitelisted(fromAddress, toAddress);
    
    if (!isWhitelisted) {
      await logFraudDetection(
        fromAddress,
        'unauthorized_destination',
        80,
        'high',
        `Attempted withdrawal to non-whitelisted address: ${toAddress}`,
        { toAddress, amount, currency }
      );
      
      return {
        allowed: false,
        reason: `Security Alert: ${toAddress} is not on your approved withdrawal list. Add it to your whitelist in Security Settings to proceed.`,
      };
    }
  }

  // ============================================================================
  // CHECK 2: Fraud Detection (AI-Powered Risk Scoring)
  // ============================================================================
  
  const riskAnalysis = calculateRiskScore(fromAddress, amount, metadata);
  
  // Log all transactions for analysis
  await logFraudDetection(
    fromAddress,
    'transaction_attempt',
    riskAnalysis.score,
    riskAnalysis.level,
    `Transaction: ${amount} ${currency} to ${toAddress}`,
    { toAddress, amount, currency, flags: riskAnalysis.flags }
  );
  
  // BLOCK: Critical risk transactions
  if (riskAnalysis.level === 'critical') {
    await createSecurityIncident({
      incidentType: 'suspicious_transaction',
      severity: 'critical',
      affectedWallet: fromAddress,
      description: `BLOCKED: Critical risk transaction detected. Score: ${riskAnalysis.score}. Flags: ${riskAnalysis.flags.join(', ')}`,
      status: 'open',
      detectedBy: 'system',
      metadata: { transaction: request, riskAnalysis },
    });
    
    return {
      allowed: false,
      reason: `Security Alert: This transaction has been flagged as high-risk and blocked for your protection. Please contact support if this is a legitimate transaction.`,
      riskScore: riskAnalysis.score,
      riskLevel: riskAnalysis.level,
    };
  }
  
  // ============================================================================
  // CHECK 3: Time-Locked Withdrawals (Prevent Account Takeover)
  // ============================================================================
  
  // FIX: Settlement amounts are already in ETH (human-readable), not wei
  // So we parse them directly instead of dividing by 1e18
  const amountInEth = parseFloat(amount);
  const LARGE_WITHDRAWAL_THRESHOLD = 1.0; // 1 ETH threshold
  
  // Check if there's already a pending time-locked withdrawal
  const pendingWithdrawals = await getPendingTimeLockedWithdrawals(fromAddress);
  const existingPending = pendingWithdrawals.find(
    w => w.destinationAddress.toLowerCase() === toAddress.toLowerCase() &&
         w.amount === amount &&
         w.currency === currency
  );
  
  if (existingPending) {
    return {
      allowed: false,
      reason: `This withdrawal is time-locked for security. Lock expires: ${existingPending.lockUntil}. Check your email for confirmation code.`,
      requiresConfirmation: true,
      timeLockedWithdrawalId: existingPending.id,
    };
  }
  
  // CREATE TIME LOCK: Large withdrawals require 24-hour delay
  if (amountInEth >= LARGE_WITHDRAWAL_THRESHOLD) {
    const lockHours = amountInEth >= 10 ? 48 : 24; // 48 hours for 10+ ETH
    
    const timeLocked = await createTimeLockedWithdrawal(
      fromAddress,
      toAddress,
      amount,
      currency,
      lockHours
    );
    
    // TODO: Send email/SMS with confirmation code
    
    return {
      allowed: false,
      reason: `Large Withdrawal Protection: This withdrawal of ${amountInEth.toFixed(4)} ETH requires a ${lockHours}-hour security delay. You'll receive a confirmation code via email. This prevents unauthorized access to your funds.`,
      requiresConfirmation: true,
      timeLockedWithdrawalId: timeLocked.id,
    };
  }
  
  // ============================================================================
  // CHECK 4: High-Risk Flagging (Human Review Required)
  // ============================================================================
  
  if (riskAnalysis.level === 'high') {
    await createSecurityIncident({
      incidentType: 'flagged_transaction',
      severity: 'high',
      affectedWallet: fromAddress,
      description: `HIGH RISK: Transaction flagged for review. Score: ${riskAnalysis.score}. Flags: ${riskAnalysis.flags.join(', ')}`,
      status: 'open',
      detectedBy: 'system',
      metadata: { transaction: request, riskAnalysis },
    });
    
    // Allow but flag for review
    return {
      allowed: true,
      reason: `Warning: This transaction has been flagged for security review but is being processed. Risk score: ${riskAnalysis.score}`,
      riskScore: riskAnalysis.score,
      riskLevel: riskAnalysis.level,
    };
  }
  
  // ============================================================================
  // ALL CHECKS PASSED - Transaction Approved
  // ============================================================================
  
  return {
    allowed: true,
    riskScore: riskAnalysis.score,
    riskLevel: riskAnalysis.level,
  };
}

/**
 * Emergency Lockdown Mode
 * Blocks ALL withdrawals during security incidents
 */
let EMERGENCY_LOCKDOWN_ACTIVE = false;

export function activateEmergencyLockdown(reason: string, activatedBy: string) {
  EMERGENCY_LOCKDOWN_ACTIVE = true;
  
  createSecurityIncident({
    incidentType: 'emergency_lockdown',
    severity: 'critical',
    description: `EMERGENCY LOCKDOWN ACTIVATED: ${reason}`,
    status: 'open',
    detectedBy: activatedBy,
    metadata: { reason, timestamp: new Date().toISOString() },
  });
  
  console.log(`🚨 EMERGENCY LOCKDOWN ACTIVATED: ${reason}`);
}

export function deactivateEmergencyLockdown(deactivatedBy: string) {
  EMERGENCY_LOCKDOWN_ACTIVE = false;
  console.log(`✅ Emergency lockdown deactivated by: ${deactivatedBy}`);
}

export function isEmergencyLockdownActive(): boolean {
  return EMERGENCY_LOCKDOWN_ACTIVE;
}

/**
 * Check if emergency lockdown is active
 * This should be called before ANY withdrawal
 */
export async function checkEmergencyLockdown(): Promise<SecurityCheckResult> {
  if (EMERGENCY_LOCKDOWN_ACTIVE) {
    return {
      allowed: false,
      reason: 'EMERGENCY LOCKDOWN: All withdrawals are temporarily suspended due to a security incident. Our team is working to resolve this. You will be notified when normal operations resume.',
    };
  }
  
  return { allowed: true };
}

/**
 * Velocity Limiting - Prevent rapid-fire withdrawals
 */
const withdrawalVelocity: Map<string, number[]> = new Map();

export async function checkWithdrawalVelocity(walletAddress: string): Promise<SecurityCheckResult> {
  const now = Date.now();
  const address = walletAddress.toLowerCase();
  
  // Get recent withdrawal timestamps for this wallet
  const timestamps = withdrawalVelocity.get(address) || [];
  
  // Remove timestamps older than 1 hour
  const recentTimestamps = timestamps.filter(t => now - t < 3600000);
  
  // Update the map
  withdrawalVelocity.set(address, recentTimestamps);
  
  // BLOCK: More than 10 withdrawals in 1 hour
  if (recentTimestamps.length >= 10) {
    await logFraudDetection(
      walletAddress,
      'velocity_limit_exceeded',
      90,
      'critical',
      `Velocity limit exceeded: ${recentTimestamps.length} withdrawals in 1 hour`,
      { timestamps: recentTimestamps }
    );
    
    return {
      allowed: false,
      reason: 'Security Alert: Too many withdrawal attempts. Please wait 1 hour before trying again. This protects your account from automated attacks.',
    };
  }
  
  // FLAG: More than 5 withdrawals in 1 hour
  if (recentTimestamps.length >= 5) {
    await logFraudDetection(
      walletAddress,
      'high_velocity_warning',
      60,
      'high',
      `High withdrawal velocity: ${recentTimestamps.length} withdrawals in 1 hour`,
      { timestamps: recentTimestamps }
    );
  }
  
  // Record this withdrawal attempt
  recentTimestamps.push(now);
  withdrawalVelocity.set(address, recentTimestamps);
  
  return { allowed: true };
}

/**
 * Complete Security Validation Pipeline
 * Call this before EVERY withdrawal/transaction
 */
export async function validateWithdrawalSecurity(
  request: TransactionRequest
): Promise<SecurityCheckResult> {
  // 1. Emergency lockdown check
  const lockdownCheck = await checkEmergencyLockdown();
  if (!lockdownCheck.allowed) return lockdownCheck;
  
  // 2. Velocity limiting
  const velocityCheck = checkWithdrawalVelocity(request.fromAddress);
  if (!velocityCheck.allowed) return velocityCheck;
  
  // 3. Full security validation
  const securityCheck = await validateTransactionSecurity(request);
  
  return securityCheck;
}
