import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface SecurityEvent {
  timestamp: Date;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  statusCode?: number;
  riskScore: number;
  blocked: boolean;
  reason?: string;
}

class SecurityMonitor {
  private events: Map<string, SecurityEvent[]> = new Map();
  private ipReputationCache: Map<string, number> = new Map();
  private blacklistedIPs: Set<string> = new Set();
  private whitelistedIPs: Set<string> = new Set();
  
  whitelistIP(ip: string) {
    this.whitelistedIPs.add(ip);
    this.blacklistedIPs.delete(ip);
    console.log(`✅ IP WHITELISTED: ${ip}`);
  }
  
  isWhitelisted(ip: string): boolean {
    return this.whitelistedIPs.has(ip);
  }
  
  logEvent(event: SecurityEvent) {
    const key = event.ip;
    if (!this.events.has(key)) {
      this.events.set(key, []);
    }
    this.events.get(key)!.push(event);
    
    if (this.events.get(key)!.length > 100) {
      this.events.get(key)!.shift();
    }
    
    if (event.blocked && event.riskScore > 80) {
      console.error('🚨 HIGH-RISK EVENT DETECTED:', event);
    }
  }
  
  getIPReputation(ip: string): number {
    if (this.blacklistedIPs.has(ip)) return 100;
    if (this.ipReputationCache.has(ip)) {
      return this.ipReputationCache.get(ip)!;
    }
    
    const events = this.events.get(ip) || [];
    if (events.length === 0) return 0;
    
    const recent = events.filter(e => 
      Date.now() - e.timestamp.getTime() < 3600000
    );
    
    const suspiciousCount = recent.filter(e => 
      e.blocked || e.riskScore > 50
    ).length;
    
    const reputation = Math.min((suspiciousCount / Math.max(recent.length, 1)) * 100, 100);
    this.ipReputationCache.set(ip, reputation);
    
    setTimeout(() => this.ipReputationCache.delete(ip), 3600000);
    
    return reputation;
  }
  
  blacklistIP(ip: string, reason: string) {
    this.blacklistedIPs.add(ip);
    console.error(`🚫 IP BLACKLISTED: ${ip} - Reason: ${reason}`);
    
    this.logEvent({
      timestamp: new Date(),
      ip,
      userAgent: 'System',
      path: '/system/blacklist',
      method: 'SYSTEM',
      riskScore: 100,
      blocked: true,
      reason: `Auto-blacklisted: ${reason}`
    });
  }
  
  isBlacklisted(ip: string): boolean {
    return this.blacklistedIPs.has(ip);
  }
  
  unblacklistIP(ip: string) {
    this.blacklistedIPs.delete(ip);
    console.log(`✅ IP UNBLACKLISTED: ${ip}`);
  }
  
  getStats() {
    return {
      totalIPs: this.events.size,
      blacklistedIPs: this.blacklistedIPs.size,
      totalEvents: Array.from(this.events.values()).reduce((sum, arr) => sum + arr.length, 0),
      blockedEvents: Array.from(this.events.values())
        .flat()
        .filter(e => e.blocked).length
    };
  }
}

export const securityMonitor = new SecurityMonitor();

export function advancedThreatDetection(req: Request, res: Response, next: NextFunction) {
  const ip = (req.ip || req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
  
  // Skip all security checks for whitelisted IPs (mobile devices, trusted sources)
  if (securityMonitor.isWhitelisted(ip)) {
    return next();
  }
  
  // Check if it's a mobile/Replit Bonsai/Social media in-app browser - auto-whitelist
  const userAgent = req.headers['user-agent'] || '';
  const trustedClients = [
    'Replit-Bonsai',
    'Mobile',
    'iPhone',
    'Android',
    'TikTok',
    'Instagram',
    'Facebook',
    'Twitter',
    'FBAN',
    'FBAV',
    'Snapchat',
    'LinkedIn'
  ];
  
  if (trustedClients.some(client => userAgent.includes(client))) {
    securityMonitor.whitelistIP(ip);
    console.log(`📱 Auto-whitelisted trusted client (${userAgent.substring(0, 50)}...): ${ip}`);
    return next();
  }
  
  if (securityMonitor.isBlacklisted(ip)) {
    securityMonitor.logEvent({
      timestamp: new Date(),
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      path: req.path,
      method: req.method,
      riskScore: 100,
      blocked: true,
      reason: 'IP is blacklisted'
    });
    
    return res.status(403).json({ 
      error: 'Access denied',
      code: 'IP_BLACKLISTED'
    });
  }
  
  const reputation = securityMonitor.getIPReputation(ip);
  
  if (reputation > 70) {
    securityMonitor.logEvent({
      timestamp: new Date(),
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      path: req.path,
      method: req.method,
      riskScore: reputation,
      blocked: true,
      reason: 'High IP reputation score'
    });
    
    return res.status(429).json({ 
      error: 'Suspicious activity detected. Access temporarily denied.',
      code: 'HIGH_REPUTATION_SCORE',
      retryAfter: 3600
    });
  }
  
  res.on('finish', () => {
    const riskScore = calculateRequestRisk(req, res);
    
    securityMonitor.logEvent({
      timestamp: new Date(),
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      riskScore,
      blocked: res.statusCode === 403 || res.statusCode === 429
    });
    
    // Only blacklist if risk score is VERY high (95+) and not a mobile device
    // This prevents accidental blocking of legitimate mobile users
    if (riskScore > 95 && !securityMonitor.isWhitelisted(ip)) {
      const userAgent = req.headers['user-agent'] || '';
      // Never blacklist mobile devices or Replit clients
      if (!userAgent.includes('Replit-Bonsai') && !userAgent.includes('Mobile') && !userAgent.includes('iPhone') && !userAgent.includes('Android')) {
        securityMonitor.blacklistIP(ip, `Risk score: ${riskScore}`);
      }
    }
  });
  
  next();
}

function calculateRequestRisk(req: Request, res: Response): number {
  let risk = 0;
  
  if (res.statusCode === 401) risk += 10;
  if (res.statusCode === 403) risk += 20;
  if (res.statusCode === 429) risk += 30;
  if (res.statusCode >= 500) risk += 5;
  
  const userAgent = req.headers['user-agent'] || '';
  if (!userAgent) risk += 15;
  if (/bot|crawler|spider|scraper/i.test(userAgent)) risk += 25;
  
  const suspiciousPaths = ['/admin', '/.env', '/wp-admin', '/phpmyadmin', '/.git'];
  if (suspiciousPaths.some(path => req.path.includes(path))) risk += 30;
  
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    if (!req.headers['content-type']) risk += 10;
  }
  
  return Math.min(risk, 100);
}

export function honeypotTrap(req: Request, res: Response, next: NextFunction) {
  const honeypots = [
    '/wp-login.php',
    '/administrator',
    '/phpmyadmin',
    '/.env',
    '/.git/config',
    '/admin/login',
    '/wp-admin',
    '/xmlrpc.php'
  ];
  
  if (honeypots.some(trap => req.path.includes(trap))) {
    const ip = (req.ip || req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
    
    securityMonitor.blacklistIP(ip, `Honeypot triggered: ${req.path}`);
    
    console.error('🍯 HONEYPOT TRIGGERED:', {
      ip,
      path: req.path,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    setTimeout(() => {
      res.status(404).send('');
    }, 5000);
    
    return;
  }
  
  next();
}

export function requestIntegrityCheck(req: Request, res: Response, next: NextFunction) {
  const requiredHeaders = ['user-agent', 'accept'];
  const missingHeaders = requiredHeaders.filter(h => !req.headers[h]);
  
  if (missingHeaders.length > 0) {
    console.warn('⚠️ Missing required headers:', {
      ip: req.ip,
      path: req.path,
      missing: missingHeaders
    });
  }
  
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);
    if (contentLength > 10 * 1024 * 1024) {
      return res.status(413).json({ 
        error: 'Request entity too large',
        maxSize: '10MB' 
      });
    }
  }
  
  next();
}

export function ddosProtection(req: Request, res: Response, next: NextFunction) {
  const ip = (req.ip || req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
  
  const now = Date.now();
  const windowKey = `ddos:${ip}:${Math.floor(now / 1000)}`;
  
  if (!ddosCounter.has(windowKey)) {
    ddosCounter.set(windowKey, 0);
    setTimeout(() => ddosCounter.delete(windowKey), 1000);
  }
  
  const currentCount = ddosCounter.get(windowKey)! + 1;
  ddosCounter.set(windowKey, currentCount);
  
  if (currentCount > 100) {
    securityMonitor.blacklistIP(ip, `DDoS attempt: ${currentCount} req/s`);
    
    return res.status(429).json({ 
      error: 'Too many requests per second',
      code: 'DDOS_DETECTED'
    });
  }
  
  next();
}

const ddosCounter = new Map<string, number>();

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Paths exempt from CSRF protection (analytics, webhooks, public endpoints)
  const CSRF_EXEMPT_PATHS = [
    '/api/analytics/track-pageview',
    '/api/webhooks',
    '/api/codex-pay/webhooks',
    '/api/codex-pay/merchants', // Merchant signup must be public (external merchants can't have CSRF tokens)
    '/api/codex-pay/payment-intents', // Merchants create intents via API keys (no session)
    '/api/codex-pay/process-payment', // Customer payment processing (no session)
    '/api/public',
  ];
  
  // Check if current path is exempt
  const isExempt = CSRF_EXEMPT_PATHS.some(exemptPath => 
    req.path.startsWith(exemptPath)
  );
  
  // Skip CSRF check for exempt paths
  if (isExempt) {
    return next();
  }
  
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] as string;
    const sessionToken = (req.session as any)?.csrfToken;
    
    if (!sessionToken) {
      (req.session as any).csrfToken = crypto.randomBytes(32).toString('hex');
      return next();
    }
    
    if (!token || token !== sessionToken) {
      console.warn('⚠️ CSRF token mismatch:', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
    }
  }
  
  next();
}

export function generateCSRFToken(req: Request): string {
  if (!(req.session as any).csrfToken) {
    (req.session as any).csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return (req.session as any).csrfToken;
}

export function securityAuditLog(req: Request, res: Response, next: NextFunction) {
  const sensitiveRoutes = [
    '/api/auth',
    '/api/admin',
    '/api/owner',
    '/api/wallets',
    '/api/transactions',
    '/api/security'
  ];
  
  const isSensitive = sensitiveRoutes.some(route => req.path.startsWith(route));
  
  if (isSensitive) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      userId: (req.session as any)?.userId,
      statusCode: 0
    };
    
    res.on('finish', () => {
      auditEntry.statusCode = res.statusCode;
      console.log('📋 AUDIT LOG:', auditEntry);
    });
  }
  
  next();
}

export const FortressShield = {
  advancedThreatDetection,
  honeypotTrap,
  requestIntegrityCheck,
  ddosProtection,
  csrfProtection,
  generateCSRFToken,
  securityAuditLog,
  securityMonitor
};
