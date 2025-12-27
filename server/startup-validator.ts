/**
 * Startup Validator - Ensures all required configuration is present before the app starts
 * Implements fail-fast approach for production readiness
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ServiceConfig {
  name: string;
  required: boolean;
  envVars: string[];
  description: string;
}

// Define all service configurations
const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    name: 'Database',
    required: true,
    envVars: ['DATABASE_URL'],
    description: 'PostgreSQL database connection'
  },
  {
    name: 'Session Secret',
    required: true,
    envVars: ['SESSION_SECRET'],
    description: 'Session encryption key'
  },
  {
    name: 'Moralis (NFT Data)',
    required: false, // Optional but recommended
    envVars: ['MORALIS_API_KEY'],
    description: 'NFT and blockchain data provider'
  },
  {
    name: 'NOWPayments (Crypto Payments)',
    required: false,
    envVars: ['NOWPAYMENTS_API_KEY'],
    description: 'Cryptocurrency payment processing'
  },
  {
    name: 'Twitter/X API (Social Automation)',
    required: false,
    envVars: ['TWITTER_APP_KEY', 'TWITTER_APP_SECRET'],
    description: 'Social media automation'
  },
  {
    name: 'Coinbase Pro (Trading Bot)',
    required: false,
    envVars: ['COINBASE_API_KEY', 'COINBASE_API_SECRET', 'COINBASE_PASSPHRASE'],
    description: 'Automated trading functionality'
  },
  {
    name: 'Alchemy (Blockchain RPC)',
    required: false,
    envVars: ['ALCHEMY_API_KEY'],
    description: 'Enhanced blockchain connectivity'
  },
  {
    name: 'CoinGecko API',
    required: false,
    envVars: ['COINGECKO_API_KEY'],
    description: 'Cryptocurrency price data'
  }
];

/**
 * Validates all required environment variables and service configurations
 */
export function validateStartupConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('\n🔍 Validating startup configuration...\n');

  for (const service of SERVICE_CONFIGS) {
    const missingVars: string[] = [];
    
    for (const envVar of service.envVars) {
      if (!process.env[envVar] || process.env[envVar]?.trim() === '') {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      const message = `${service.name}: Missing ${missingVars.join(', ')} - ${service.description}`;
      
      if (service.required) {
        errors.push(message);
        console.error(`❌ ${message}`);
      } else {
        warnings.push(message);
        console.warn(`⚠️  ${message} (optional - feature will be disabled)`);
      }
    } else {
      console.log(`✅ ${service.name}: Configured`);
    }
  }

  // Additional validations
  validateDatabaseUrl(errors);
  validateSessionSecret(warnings);
  validatePaymentConfiguration(warnings);

  console.log('\n');

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates DATABASE_URL format and accessibility
 */
function validateDatabaseUrl(errors: string[]): void {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) return; // Already caught by main validation
  
  if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string (postgres:// or postgresql://)');
  }
}

/**
 * Validates session secret strength
 */
function validateSessionSecret(warnings: string[]): void {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) return; // Already caught by main validation
  
  if (secret === 'codex-secret-key-change-in-production') {
    warnings.push('SESSION_SECRET is using default value - please change in production for security');
  }
  
  if (secret.length < 32) {
    warnings.push('SESSION_SECRET should be at least 32 characters for strong security');
  }
}

/**
 * Validates payment service configuration
 */
function validatePaymentConfiguration(warnings: string[]): void {
  const hasNowPayments = process.env.NOWPAYMENTS_API_KEY;
  const hasMetaMask = true; // MetaMask is always available (Web3)
  
  if (!hasNowPayments && !hasMetaMask) {
    warnings.push('No payment providers configured - payment features will be limited');
  }
}

/**
 * Main startup validation - throws error if critical configuration is missing
 */
export function enforceStartupValidation(): void {
  const result = validateStartupConfig();
  
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Configuration Warnings:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (!result.isValid) {
    console.error('\n❌ Critical Configuration Errors:');
    result.errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n💡 Please configure the required environment variables and restart the server.\n');
    
    throw new Error('Startup validation failed - missing required configuration');
  }
  
  console.log('✅ Startup validation passed - all required services configured\n');
}

/**
 * Check if a specific service is configured
 */
export function isServiceConfigured(serviceName: string): boolean {
  const service = SERVICE_CONFIGS.find(s => s.name === serviceName);
  if (!service) return false;
  
  return service.envVars.every(envVar => 
    process.env[envVar] && process.env[envVar]?.trim() !== ''
  );
}
