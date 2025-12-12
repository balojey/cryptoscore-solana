/**
 * useWinnings - Reactive hook for winnings calculations
 *
 * Combines market data, participant data, and match data to provide
 * comprehensive winnings information with caching and error handling.
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { WinningsCalculator, type WinningsCalculationParams, type WinningsResult } from '../utils/winnings-calculator'
import { useMarketData } from './useMarketData'
import { useParticipantData } from './useParticipantData'
import { useMatchData } from './useMatchData'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'

/**
 * Result interface for useWinnings hook
 */
export interface UseWinningsResult {
  /** Calculated winnings result */
  winnings: WinningsResult | null
  /** Loading state for any dependent data */
  isLoading: boolean
  /** Error message if calculation fails */
  error: string | null
  /** Function to manually refetch all dependent data */
  refetch: () => void
  /** Individual loading states for debugging */
  loadingStates: {
    market: boolean
    participant: boolean
    match: boolean
  }
}

/**
 * Hook for reactive winnings calculations
 *
 * Automatically fetches and combines market data, participant data, and match data
 * to provide comprehensive winnings information. Includes caching, memoization,
 * and proper error handling.
 *
 * @param marketAddress - Market address to calculate winnings for
 * @param userAddress - Optional user address (defaults to connected wallet)
 * @returns Winnings calculation result with loading states and error handling
 *
 * @example
 * ```tsx
 * function WinningsDisplay({ marketAddress }: { marketAddress: string }) {
 *   const { winnings, isLoading, error } = useWinnings(marketAddress)
 *
 *   if (isLoading) return <div>Loading winnings...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!winnings) return <div>No winnings data</div>
 *
 *   return (
 *     <div>
 *       <p>Type: {winnings.type}</p>
 *       <p>Amount: {winnings.amount} lamports</p>
 *       <p>Status: {winnings.status}</p>
 *       <p>{winnings.message}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWinnings(
  marketAddress?: string,
  userAddress?: string
): UseWinningsResult {
  const { walletAddress } = useUnifiedWallet()

  // Use provided userAddress or connected wallet address
  const effectiveUserAddress = userAddress || walletAddress

  // Fetch market data
  const {
    data: marketData,
    isLoading: isLoadingMarket,
    error: marketError,
    refetch: refetchMarket,
  } = useMarketData(marketAddress)

  // Fetch participant data (only if user is connected)
  const {
    data: participantData,
    isLoading: isLoadingParticipant,
    error: participantError,
    refetch: refetchParticipant,
  } = useParticipantData(marketAddress, effectiveUserAddress || undefined)

  // Extract match ID from market data for match data fetching
  const matchId = useMemo(() => {
    if (!marketData?.matchId) return undefined
    
    // Parse match ID - it might be a string or number
    const parsed = parseInt(marketData.matchId, 10)
    return isNaN(parsed) ? undefined : parsed
  }, [marketData?.matchId])

  // Fetch match data (only if we have a valid match ID)
  const {
    data: matchData,
    loading: isLoadingMatch,
    error: matchError,
  } = useMatchData(matchId || 0) // Provide default value for undefined

  // Manual refetch function for match data (useMatchData doesn't return refetch)
  const refetchMatch = useMemo(() => {
    // useMatchData doesn't expose refetch, so we return a no-op
    // The hook will automatically refetch when matchId changes
    return () => {
      console.log('Match data refetch requested - will refetch on next render')
    }
  }, [])

  // Combine all loading states
  const isLoading = useMemo(() => {
    return isLoadingMarket || isLoadingParticipant || isLoadingMatch
  }, [isLoadingMarket, isLoadingParticipant, isLoadingMatch])

  // Combine all errors
  const error = useMemo(() => {
    const errors = [marketError, participantError, matchError].filter(Boolean)
    return errors.length > 0 ? errors.join('; ') : null
  }, [marketError, participantError, matchError])

  // Combined refetch function
  const refetch = useMemo(() => {
    return () => {
      refetchMarket()
      refetchParticipant()
      refetchMatch()
    }
  }, [refetchMarket, refetchParticipant, refetchMatch])

  // Loading states for debugging
  const loadingStates = useMemo(() => ({
    market: isLoadingMarket,
    participant: isLoadingParticipant,
    match: isLoadingMatch,
  }), [isLoadingMarket, isLoadingParticipant, isLoadingMatch])

  // Calculate winnings using TanStack Query for caching and memoization
  const winningsQuery = useQuery({
    queryKey: [
      'winnings',
      marketAddress,
      effectiveUserAddress,
      marketData?.status,
      marketData?.outcome,
      marketData?.totalPool,
      marketData?.participantCount,
      participantData?.prediction,
      participantData?.hasWithdrawn,
      matchData?.isFinished,
      matchData?.matchResult,
    ],
    queryFn: (): WinningsResult | null => {
      // Don't calculate if we don't have market data
      if (!marketData) {
        return null
      }

      // Prepare calculation parameters
      const params: WinningsCalculationParams = {
        marketData,
        participantData,
        userAddress: effectiveUserAddress || undefined,
        matchData,
      }

      try {
        // Use WinningsCalculator to compute winnings
        const result = WinningsCalculator.calculateWinnings(params)
        
        console.log('[useWinnings] Calculated winnings:', {
          marketAddress,
          userAddress: effectiveUserAddress,
          marketStatus: marketData.status,
          participantPrediction: participantData?.prediction,
          matchResult: matchData?.matchResult,
          result,
        })

        return result
      } catch (calculationError) {
        console.error('[useWinnings] Calculation error:', calculationError)
        
        // Return error result instead of throwing
        return {
          type: 'none',
          amount: 0,
          status: 'eligible',
          message: 'Error calculating winnings',
          displayVariant: 'error',
          icon: 'AlertTriangle',
        }
      }
    },
    enabled: !!marketData && !isLoading && !error,
    staleTime: 10000, // 10 seconds - same as market data
    gcTime: 300000, // 5 minutes - keep in cache longer for performance
    refetchInterval: (data) => {
      // Only auto-refetch for active markets or when waiting for resolution
      if (!data || !marketData) return false
      
      // Refetch open markets more frequently
      if (marketData.status === 'Open') {
        return 15000 // 15 seconds
      }
      
      // Refetch live markets waiting for match results
      if (marketData.status === 'Live' && !matchData?.isFinished) {
        return 30000 // 30 seconds
      }
      
      // Don't auto-refetch resolved markets
      return false
    },
  })

  // Return combined result
  return useMemo(() => ({
    winnings: winningsQuery.data || null,
    isLoading: isLoading || winningsQuery.isLoading,
    error: error || (winningsQuery.error ? String(winningsQuery.error) : null),
    refetch: () => {
      refetch()
      winningsQuery.refetch()
    },
    loadingStates,
  }), [
    winningsQuery.data,
    winningsQuery.isLoading,
    winningsQuery.error,
    winningsQuery.refetch,
    isLoading,
    error,
    refetch,
    loadingStates,
  ])
}

/**
 * Hook for calculating potential winnings for a specific prediction
 *
 * Useful for showing potential winnings before a user joins a market.
 * Does not require user authentication or participation data.
 *
 * @param marketAddress - Market address
 * @param prediction - Prediction to calculate winnings for
 * @returns Potential winnings amount in lamports
 *
 * @example
 * ```tsx
 * function PredictionOption({ marketAddress, prediction }: Props) {
 *   const { potentialWinnings, isLoading } = usePotentialWinnings(marketAddress, prediction)
 *
 *   return (
 *     <div>
 *       <p>Prediction: {prediction}</p>
 *       <p>Potential Winnings: {potentialWinnings} lamports</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function usePotentialWinnings(
  marketAddress?: string,
  prediction?: 'Home' | 'Draw' | 'Away'
) {
  const { data: marketData, isLoading } = useMarketData(marketAddress)

  return useQuery({
    queryKey: ['potential-winnings', marketAddress, prediction, marketData?.totalPool, marketData?.participantCount],
    queryFn: () => {
      if (!marketData || !prediction) {
        return 0
      }

      return WinningsCalculator.calculatePotentialWinnings(marketData, prediction)
    },
    enabled: !!marketData && !!prediction,
    staleTime: 10000,
    select: (data) => ({
      potentialWinnings: data,
      isLoading,
    }),
  })
}

/**
 * Hook for batch winnings calculations across multiple markets
 *
 * Useful for portfolio views or market lists where you need winnings
 * information for multiple markets efficiently.
 *
 * @param marketAddresses - Array of market addresses
 * @param userAddress - Optional user address (defaults to connected wallet)
 * @returns Array of winnings results
 *
 * @example
 * ```tsx
 * function PortfolioView({ marketAddresses }: Props) {
 *   const { winningsResults, isLoading } = useBatchWinnings(marketAddresses)
 *
 *   return (
 *     <div>
 *       {winningsResults.map((result, index) => (
 *         <div key={marketAddresses[index]}>
 *           <p>Market: {marketAddresses[index]}</p>
 *           <p>Winnings: {result?.amount || 0} lamports</p>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useBatchWinnings(
  marketAddresses: string[] = [],
  userAddress?: string
) {
  const { walletAddress } = useUnifiedWallet()
  const effectiveUserAddress = userAddress || walletAddress

  return useQuery({
    queryKey: ['batch-winnings', marketAddresses, effectiveUserAddress],
    queryFn: async () => {
      // This would require implementing batch data fetching
      // For now, return empty array as placeholder
      // In a real implementation, you'd fetch all market data in parallel
      // and calculate winnings for each market
      return marketAddresses.map(() => null)
    },
    enabled: marketAddresses.length > 0 && !!effectiveUserAddress,
    staleTime: 15000,
    select: (data) => ({
      winningsResults: data,
      isLoading: false, // Placeholder
    }),
  })
}