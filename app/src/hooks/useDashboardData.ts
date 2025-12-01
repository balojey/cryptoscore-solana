/**
 * Dashboard data hooks using Anchor-free implementation
 * Fetches market data using Connection.getProgramAccounts() and AccountDecoder
 */

import type { Market, MarketDashboardInfo } from '../types'
import { useMemo } from 'react'
import { useAllMarkets as useAllMarketsData, useUserMarkets as useUserMarketsData } from './useMarketData'

export interface DashboardData {
  createdMarkets: MarketDashboardInfo[]
  joinedMarkets: MarketDashboardInfo[]
  allInvolvedMarkets: MarketDashboardInfo[]
  isLoading: boolean
  error: Error | null
}

/**
 * Helper to transform MarketData to MarketDashboardInfo
 */
function transformToMarketDashboardInfo(marketData: any): MarketDashboardInfo {
  return {
    marketAddress: marketData.marketAddress,
    matchId: BigInt(marketData.matchId || '0'),
    entryFee: BigInt(marketData.entryFee),
    creator: marketData.creator,
    participantsCount: BigInt(marketData.participantCount),
    resolved: marketData.status === 'Resolved',
    isPublic: marketData.isPublic,
    startTime: BigInt(marketData.kickoffTime),
    homeCount: BigInt(marketData.homeCount),
    awayCount: BigInt(marketData.awayCount),
    drawCount: BigInt(marketData.drawCount),
    totalPool: BigInt(marketData.totalPool),
    status: marketData.status,
    outcome: marketData.outcome,
  }
}

/**
 * Hook for fetching user dashboard data (created and joined markets)
 * Uses useUserMarkets to fetch markets where user is creator
 */
export function useDashboardData(userAddress?: string): DashboardData {
  const { data: userMarketsData, isLoading, error } = useUserMarketsData(userAddress)

  // Transform and categorize markets
  const { createdMarkets, joinedMarkets, allInvolvedMarkets } = useMemo(() => {
    if (!userMarketsData || userMarketsData.length === 0) {
      return {
        createdMarkets: [],
        joinedMarkets: [],
        allInvolvedMarkets: [],
      }
    }

    // Transform all markets
    const transformed = userMarketsData.map(transformToMarketDashboardInfo)

    // For now, all markets from useUserMarkets are created markets
    // TODO: Implement participant tracking to identify joined markets
    const created = transformed
    const joined: MarketDashboardInfo[] = []

    // Combine and deduplicate
    const uniqueMarketsMap = new Map<string, MarketDashboardInfo>()
    ;[...created, ...joined].forEach((market) => {
      uniqueMarketsMap.set(market.marketAddress, market)
    })

    // Sort by start time (newest first)
    const allMarkets = Array.from(uniqueMarketsMap.values())
    allMarkets.sort((a, b) => Number(b.startTime) - Number(a.startTime))

    return {
      createdMarkets: created,
      joinedMarkets: joined,
      allInvolvedMarkets: allMarkets,
    }
  }, [userMarketsData])

  return {
    createdMarkets,
    joinedMarkets,
    allInvolvedMarkets,
    isLoading,
    error: error as Error | null,
  }
}

/**
 * Hook for fetching all markets
 * Uses useAllMarkets from useMarketData with filtering options
 */
export function useAllMarkets(options: {
  page?: number
  pageSize?: number
  publicOnly?: boolean
  enabled?: boolean
} = {}) {
  const { publicOnly = false } = options
  const { data: marketsData, isLoading, error, refetch } = useAllMarketsData()

  // Transform and filter markets
  const markets = useMemo(() => {
    if (!marketsData || marketsData.length === 0) return []

    let filtered = marketsData

    // Filter by visibility if requested
    if (publicOnly) {
      filtered = filtered.filter(m => m.isPublic)
    }

    // Transform to Market type
    return filtered.map(m => ({
      marketAddress: m.marketAddress,
      matchId: BigInt(m.matchId || '0'),
      entryFee: BigInt(m.entryFee),
      creator: m.creator,
      participantsCount: BigInt(m.participantCount),
      resolved: m.status === 'Resolved',
      isPublic: m.isPublic,
      startTime: BigInt(m.kickoffTime),
      homeCount: BigInt(m.homeCount),
      awayCount: BigInt(m.awayCount),
      drawCount: BigInt(m.drawCount),
    }))
  }, [marketsData, publicOnly])

  return {
    data: markets,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching all markets from factory
 * Alias for useAllMarkets for backward compatibility
 */
export function useFactoryMarkets(options: { enabled?: boolean } = {}) {
  return useAllMarkets(options)
}

/**
 * Hook for fetching detailed market data for multiple addresses
 * Returns all markets and filters by the provided addresses
 */
export function useMarketDetails(marketAddresses: string[], options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { data: allMarketsData, isLoading, error } = useAllMarketsData()

  const markets = useMemo(() => {
    if (!allMarketsData || marketAddresses.length === 0) return []

    // Filter markets by addresses
    const addressSet = new Set(marketAddresses)
    return allMarketsData
      .filter(m => addressSet.has(m.marketAddress))
      .map(transformToMarketDashboardInfo)
  }, [allMarketsData, marketAddresses])

  return {
    data: markets,
    isLoading: enabled ? isLoading : false,
    error,
  }
}
