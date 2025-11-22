/**
 * Environment variable validation on startup
 * Ensures all required configuration is present before the app starts
 */

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'PGHOST',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'PGPORT',
] as const;

/**
 * Optional environment variables with defaults (development only)
 */
const OPTIONAL_ENV_VARS_DEV = {
  'NODE_ENV': 'development',
  'PORT': '5000',
} as const;

/**
 * Minimum entropy required for SESSION_SECRET (256 bits = 32 bytes = 64 hex chars)
 */
const MIN_SECRET_LENGTH = 64;

/**
 * Default development SESSION_SECRET (INSECURE - only for development)
 */
const DEV_SESSION_SECRET = 'bnbpot-dev-secret-change-in-production';

/**
 * Validate that all required environment variables are set
 * @throws Error if any required variable is missing or insecure
 */
export function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const missing: string[] = [];
  
  // Validate required database variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('🚨 Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // SECURITY: Validate SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    if (!isDevelopment) {
      // Fail in production, staging, preview, or any non-dev environment
      console.error('🚨 SESSION_SECRET is required in non-development environments');
      throw new Error('SESSION_SECRET environment variable must be set');
    }
    // Development only: Use default with warning
    process.env.SESSION_SECRET = DEV_SESSION_SECRET;
    console.warn('⚠️ Using default SESSION_SECRET in development (insecure)');
  } else {
    // SECURITY: Check SESSION_SECRET entropy in all non-development environments
    if (!isDevelopment) {
      if (sessionSecret === DEV_SESSION_SECRET) {
        console.error('🚨 Default SESSION_SECRET detected in non-development environment!');
        throw new Error('SESSION_SECRET must not use default value outside of development');
      }
      
      if (sessionSecret.length < MIN_SECRET_LENGTH) {
        console.error(`🚨 SESSION_SECRET too short (${sessionSecret.length} chars, minimum ${MIN_SECRET_LENGTH})`);
        throw new Error(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters for security`);
      }
    }
  }
  
  // Set optional variables with defaults (development only)
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_ENV_VARS_DEV)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
    }
  }
  
  console.log('✅ Environment validation passed');
}

/**
 * Get environment variable or throw error
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Get environment variable with default fallback
 */
export function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}
