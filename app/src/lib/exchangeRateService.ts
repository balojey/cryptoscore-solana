/**
 * Exchange Rate Service
 * 
 * Fetches and caches SOL exchange rates from external APIs
 * Supports CoinGecko (primary) and CryptoCompare (fallback)
 */

import type { ExchangeRates, CachedExchangeRates } from '@/types/currency'

export class ExchangeRateService {
  private static readonly CACHE_KEY = 'cryptoscore-exchange-rates'
  private static readonly CACHE_VERSION = 1
  private static readonly UPDATE_INTERVAL = 60000 // 60 seconds
  private static readonly STALE_THRESHOLD = 300000 // 5 minutes
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff

  // CoinGecko Free API (no auth required)
  private static readonly COINGECKO_URL = 
    'https://corsproxy.io/?https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,ngn'
  
  // CryptoCompare fallback API
  private static readonly CRYPTOCOMPARE_URL = 
    'https://corsproxy.io/?https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD,NGN'

  /**
   * Fetch current exchange rates from API
   * Tries CoinGecko first, falls back to CryptoCompare on failure
   */
  static async fetchRates(): Promise<ExchangeRates> {
    let lastError: Error | null = null

    // Try CoinGecko with retries
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const rates = await this.fetchFromCoinGecko()
        this.cacheRates(rates)
        return rates
      } catch (error) {
        lastError = error as Error
        
        // Wait before retry (except on last attempt)
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAYS[attempt])
        }
      }
    }

    // Try CryptoCompare fallback
    try {
      const rates = await this.fetchFromCryptoCompare()
      this.cacheRates(rates)
      return rates
    } catch (error) {
      // Both APIs failed, throw the last error
      throw new Error(
        `Failed to fetch exchange rates: ${lastError?.message || 'Unknown error'}`
      )
    }
  }

  /**
   * Fetch rates from CoinGecko API
   */
  private static async fetchFromCoinGecko(): Promise<ExchangeRates> {
    const response = await fetch(this.COINGECKO_URL)
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.solana || !data.solana.usd || !data.solana.ngn) {
      throw new Error('Invalid response format from CoinGecko')
    }

    return {
      SOL_USD: data.solana.usd,
      SOL_NGN: data.solana.ngn,
      lastUpdated: Date.now()
    }
  }

  /**
   * Fetch rates from CryptoCompare API (fallback)
   */
  private static async fetchFromCryptoCompare(): Promise<ExchangeRates> {
    const response = await fetch(this.CRYPTOCOMPARE_URL)
    
    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.USD || !data.NGN) {
      throw new Error('Invalid response format from CryptoCompare')
    }

    return {
      SOL_USD: data.USD,
      SOL_NGN: data.NGN,
      lastUpdated: Date.now()
    }
  }

  /**
   * Get cached exchange rates from localStorage
   */
  static getCachedRates(): ExchangeRates | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (!cached) return null

      const data: CachedExchangeRates = JSON.parse(cached)
      
      // Validate cache structure
      if (
        typeof data.SOL_USD !== 'number' ||
        typeof data.SOL_NGN !== 'number' ||
        typeof data.lastUpdated !== 'number'
      ) {
        return null
      }

      return {
        SOL_USD: data.SOL_USD,
        SOL_NGN: data.SOL_NGN,
        lastUpdated: data.lastUpdated
      }
    } catch (error) {
      console.error('Failed to read cached exchange rates:', error)
      return null
    }
  }

  /**
   * Cache exchange rates to localStorage
   */
  static cacheRates(rates: ExchangeRates): void {
    try {
      const cached: CachedExchangeRates = {
        ...rates,
        version: this.CACHE_VERSION
      }
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cached))
    } catch (error) {
      console.error('Failed to cache exchange rates:', error)
    }
  }

  /**
   * Check if cached rates are stale (older than 5 minutes)
   */
  static isStale(rates: ExchangeRates): boolean {
    const age = Date.now() - rates.lastUpdated
    return age > this.STALE_THRESHOLD
  }

  /**
   * Get the age of rates in milliseconds
   */
  static getRateAge(rates: ExchangeRates): number {
    return Date.now() - rates.lastUpdated
  }

  /**
   * Format rate age as human-readable string
   */
  static formatRateAge(rates: ExchangeRates): string {
    const ageMs = this.getRateAge(rates)
    const ageMinutes = Math.floor(ageMs / 60000)
    
    if (ageMinutes < 1) return 'just now'
    if (ageMinutes === 1) return '1 minute ago'
    if (ageMinutes < 60) return `${ageMinutes} minutes ago`
    
    const ageHours = Math.floor(ageMinutes / 60)
    if (ageHours === 1) return '1 hour ago'
    return `${ageHours} hours ago`
  }

  /**
   * Clear cached rates (useful for testing or troubleshooting)
   */
  static clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY)
    } catch (error) {
      console.error('Failed to clear exchange rate cache:', error)
    }
  }

  /**
   * Delay helper for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
