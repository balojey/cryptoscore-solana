/**
 * Crossmint Configuration
 * 
 * Configuration for Crossmint authentication and wallet management.
 * Supports social login (Google, Twitter/X, Farcaster, email OTP) and
 * automatic Solana wallet creation for authenticated users.
 */

export type CrossmintEnvironment = 'staging' | 'production'

export type CrossmintLoginMethod = 
  | 'google' 
  | 'twitter' 
  | 'farcaster' 
  | 'email' 
  | 'web3:solana-only'

/**
 * Crossmint configuration interface
 */
export interface CrossmintConfig {
  clientApiKey: string
  environment: CrossmintEnvironment
  loginMethods: CrossmintLoginMethod[]
  walletConfig: {
    chain: 'solana'
    signer: {
      type: 'PASSKEY'
    }
  }
}

/**
 * Get Crossmint client API key from environment
 */
export const CROSSMINT_CLIENT_API_KEY = import.meta.env.VITE_CROSSMINT_CLIENT_API_KEY || ''

/**
 * Get Crossmint environment (staging or production)
 */
export const CROSSMINT_ENVIRONMENT: CrossmintEnvironment = 
  (import.meta.env.VITE_CROSSMINT_ENVIRONMENT || 'staging') as CrossmintEnvironment

/**
 * Supported login methods
 */
export const CROSSMINT_LOGIN_METHODS: CrossmintLoginMethod[] = [
  'google',
  'twitter',
  'farcaster',
  'email',
  'web3:solana-only',
]

/**
 * Wallet configuration for Crossmint
 * Creates Solana wallets with PASSKEY signer for authenticated users
 */
export const CROSSMINT_WALLET_CONFIG = {
  chain: 'solana' as const,
  signer: {
    type: 'PASSKEY' as const,
  },
}

/**
 * Complete Crossmint configuration object
 */
export const crossmintConfig: CrossmintConfig = {
  clientApiKey: CROSSMINT_CLIENT_API_KEY,
  environment: CROSSMINT_ENVIRONMENT,
  loginMethods: CROSSMINT_LOGIN_METHODS,
  walletConfig: CROSSMINT_WALLET_CONFIG,
}

/**
 * Validate Crossmint configuration
 * Checks if required environment variables are present
 * 
 * @returns Object with validation result and error message if invalid
 */
export function validateCrossmintConfig(): { 
  valid: boolean
  error?: string 
} {
  if (!CROSSMINT_CLIENT_API_KEY) {
    return {
      valid: false,
      error: 'VITE_CROSSMINT_CLIENT_API_KEY is not set in environment variables',
    }
  }

  if (!['staging', 'production'].includes(CROSSMINT_ENVIRONMENT)) {
    return {
      valid: false,
      error: `Invalid VITE_CROSSMINT_ENVIRONMENT: ${CROSSMINT_ENVIRONMENT}. Must be 'staging' or 'production'`,
    }
  }

  return { valid: true }
}

/**
 * Check if Crossmint is enabled
 * Returns true if API key is configured
 */
export function isCrossmintEnabled(): boolean {
  return Boolean(CROSSMINT_CLIENT_API_KEY)
}

/**
 * Get Crossmint console URL based on environment
 */
export function getCrossmintConsoleUrl(): string {
  return CROSSMINT_ENVIRONMENT === 'production'
    ? 'https://www.crossmint.com/console'
    : 'https://staging.crossmint.com/console'
}

/**
 * API scopes required for Crossmint integration
 */
export const CROSSMINT_API_SCOPES = [
  'users.create',
  'users.read',
  'wallets.read',
] as const

export type CrossmintApiScope = typeof CROSSMINT_API_SCOPES[number]
