/**
 * WinningsDisplay - Reusable component for displaying winnings information
 *
 * Supports both compact and detailed display variants with proper currency formatting,
 * visual indicators for different winnings states, and responsive design.
 */

import React from 'react'
import { 
  TrendingUp, 
  Target, 
  Crown, 
  Award, 
  Trophy, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCurrency } from '@/contexts/CurrencyContext'
import { WinningsLoadingSkeleton } from './WinningsLoadingSkeleton'
import { WinningsErrorBoundary } from './WinningsErrorBoundary'
import type { WinningsResult } from '@/utils/winnings-calculator'
import type { MarketData } from '@/hooks/useMarketData'
import type { ParticipantData } from '@/hooks/useParticipantData'
import type { EnhancedMatchData } from '@/hooks/useMatchData'

/**
 * Props for WinningsDisplay component
 */
export interface WinningsDisplayProps {
  /** Market data for context */
  marketData: MarketData
  /** Participant data if user has joined */
  participantData?: ParticipantData | null
  /** User wallet address */
  userAddress?: string
  /** Match data for resolved markets */
  matchData?: EnhancedMatchData | null
  /** Calculated winnings result */
  winnings: WinningsResult
  /** Display variant - compact for cards, detailed for full views */
  variant?: 'compact' | 'detailed'
  /** Whether to show detailed breakdown */
  showBreakdown?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Icon mapping for different winnings result icons
 */
const ICON_MAP = {
  TrendingUp,
  Target,
  Crown,
  Award,
  Trophy,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
} as const

/**
 * Badge variant mapping for display variants
 */
const BADGE_VARIANT_MAP = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  error: 'error',
} as const

/**
 * WinningsDisplay component
 */
export function WinningsDisplay({
  participantData,
  matchData,
  winnings,
  variant = 'detailed',
  showBreakdown = false,
  className,
}: WinningsDisplayProps) {
  const { formatCurrency, exchangeRates, ratesError } = useCurrency()

  // Get icon component
  const IconComponent = ICON_MAP[winnings.icon as keyof typeof ICON_MAP] || Info

  // Get badge variant
  const badgeVariant = BADGE_VARIANT_MAP[winnings.displayVariant] || 'info'

  // Format main amount with error handling
  const formattedAmount = React.useMemo(() => {
    if (winnings.amount <= 0) return '—'
    
    try {
      return formatCurrency(winnings.amount)
    } catch (error) {
      console.warn('[WinningsDisplay] Currency formatting error:', error)
      // Fallback to SOL display
      const solAmount = winnings.amount / 1_000_000_000
      return `◎${solAmount.toFixed(4)}`
    }
  }, [winnings.amount, formatCurrency])

  // Show exchange rate warning if needed
  const showRateWarning = ratesError && !exchangeRates

  // Format breakdown amounts if available with error handling
  const formattedBreakdown = React.useMemo(() => {
    if (!winnings.breakdown) return undefined

    const formatSafely = (amount?: number) => {
      if (!amount) return undefined
      try {
        return formatCurrency(amount)
      } catch (error) {
        console.warn('[WinningsDisplay] Breakdown formatting error:', error)
        const solAmount = amount / 1_000_000_000
        return `◎${solAmount.toFixed(4)}`
      }
    }

    return {
      participantWinnings: formatSafely(winnings.breakdown.participantWinnings),
      creatorReward: formatSafely(winnings.breakdown.creatorReward),
      totalPool: formatSafely(winnings.breakdown.totalPool),
      winnerCount: winnings.breakdown.winnerCount,
    }
  }, [winnings.breakdown, formatCurrency])

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <IconComponent 
          className={cn(
            'h-4 w-4 flex-shrink-0',
            winnings.displayVariant === 'success' && 'text-[var(--accent-green)]',
            winnings.displayVariant === 'warning' && 'text-[var(--accent-amber)]',
            winnings.displayVariant === 'info' && 'text-[var(--accent-cyan)]',
            winnings.displayVariant === 'error' && 'text-[var(--accent-red)]'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-semibold text-sm',
              winnings.displayVariant === 'success' && 'text-[var(--accent-green)]',
              winnings.displayVariant === 'warning' && 'text-[var(--accent-amber)]',
              winnings.displayVariant === 'info' && 'text-[var(--text-primary)]',
              winnings.displayVariant === 'error' && 'text-[var(--accent-red)]'
            )}>
              {formattedAmount}
            </span>
            <Badge variant={badgeVariant} className="text-xs">
              {winnings.type === 'potential' && 'Potential'}
              {winnings.type === 'actual' && 'Actual'}
              {winnings.type === 'creator_reward' && 'Creator'}
              {winnings.type === 'none' && 'None'}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {winnings.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with icon and status */}
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg flex-shrink-0',
              winnings.displayVariant === 'success' && 'bg-[var(--accent-green)]/10',
              winnings.displayVariant === 'warning' && 'bg-[var(--accent-amber)]/10',
              winnings.displayVariant === 'info' && 'bg-[var(--accent-cyan)]/10',
              winnings.displayVariant === 'error' && 'bg-[var(--accent-red)]/10'
            )}>
              <IconComponent className={cn(
                'h-5 w-5',
                winnings.displayVariant === 'success' && 'text-[var(--accent-green)]',
                winnings.displayVariant === 'warning' && 'text-[var(--accent-amber)]',
                winnings.displayVariant === 'info' && 'text-[var(--accent-cyan)]',
                winnings.displayVariant === 'error' && 'text-[var(--accent-red)]'
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Winnings
                </h3>
                <Badge variant={badgeVariant}>
                  {winnings.type === 'potential' && 'Potential'}
                  {winnings.type === 'actual' && 'Actual'}
                  {winnings.type === 'creator_reward' && 'Creator Reward'}
                  {winnings.type === 'none' && 'No Winnings'}
                </Badge>
              </div>
              
              <p className="text-sm text-[var(--text-secondary)]">
                {winnings.message}
              </p>
            </div>
          </div>

          {/* Amount display */}
          <div className="border-t border-[var(--border-default)] pt-3">
            <div className="text-center">
              <div className={cn(
                'text-2xl font-bold mb-1',
                winnings.displayVariant === 'success' && 'text-[var(--accent-green)]',
                winnings.displayVariant === 'warning' && 'text-[var(--accent-amber)]',
                winnings.displayVariant === 'info' && 'text-[var(--text-primary)]',
                winnings.displayVariant === 'error' && 'text-[var(--accent-red)]'
              )}>
                {formattedAmount}
              </div>
              
              {winnings.status && (
                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
                  Status: {winnings.status.replace('_', ' ')}
                </div>
              )}
              
              {/* Exchange rate warning */}
              {showRateWarning && (
                <div className="flex items-center gap-1 text-xs text-[var(--accent-amber)] mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Exchange rates unavailable - showing SOL values</span>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown section */}
          {showBreakdown && formattedBreakdown && (
            <div className="border-t border-[var(--border-default)] pt-3 space-y-2">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Breakdown
              </h4>
              
              {formattedBreakdown.participantWinnings && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">
                    Participant Winnings:
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formattedBreakdown.participantWinnings}
                  </span>
                </div>
              )}
              
              {formattedBreakdown.creatorReward && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">
                    Creator Reward:
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formattedBreakdown.creatorReward}
                  </span>
                </div>
              )}
              
              {formattedBreakdown.totalPool && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">
                    Total Pool:
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formattedBreakdown.totalPool}
                  </span>
                </div>
              )}
              
              {formattedBreakdown.winnerCount !== undefined && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">
                    Winners:
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formattedBreakdown.winnerCount}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Additional context for participants */}
          {participantData && (
            <div className="border-t border-[var(--border-default)] pt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">
                  Your Prediction:
                </span>
                <Badge variant="outline" className="text-xs">
                  {participantData.prediction}
                </Badge>
              </div>
              
              {matchData?.matchResult && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-[var(--text-secondary)]">
                    Match Result:
                  </span>
                  <Badge 
                    variant={matchData.matchResult === participantData.prediction ? 'success' : 'error'}
                    className="text-xs"
                  >
                    {matchData.matchResult}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact winnings display for use in market cards and lists
 */
export function CompactWinningsDisplay(props: Omit<WinningsDisplayProps, 'variant'>) {
  return <WinningsDisplay {...props} variant="compact" />
}

/**
 * Detailed winnings display for use in market detail pages
 */
export function DetailedWinningsDisplay(props: Omit<WinningsDisplayProps, 'variant'>) {
  return <WinningsDisplay {...props} variant="detailed" showBreakdown />
}

/**
 * Hook-integrated winnings display that fetches its own data
 */
export interface IntegratedWinningsDisplayProps {
  /** Market address */
  marketAddress: string
  /** User address (optional, defaults to connected wallet) */
  userAddress?: string
  /** Display variant */
  variant?: 'compact' | 'detailed'
  /** Whether to show breakdown */
  showBreakdown?: boolean
  /** Additional CSS classes */
  className?: string
  /** Loading component */
  LoadingComponent?: React.ComponentType<{
    variant?: 'compact' | 'detailed'
    showBreakdown?: boolean
    className?: string
  }>
  /** Error component */
  ErrorComponent?: React.ComponentType<{ error: string }>
}

/**
 * Integrated winnings display that handles its own data fetching
 */
export function IntegratedWinningsDisplay({
  marketAddress,
  userAddress,
  variant = 'detailed',
  showBreakdown = false,
  className,
  LoadingComponent,
  ErrorComponent,
}: IntegratedWinningsDisplayProps) {
  // Import hooks dynamically to avoid circular dependencies
  const useWinnings = React.useMemo(() => {
    try {
      return require('../hooks/useWinnings').useWinnings
    } catch {
      return null
    }
  }, [])

  const useMarketData = React.useMemo(() => {
    try {
      return require('../hooks/useMarketData').useMarketData
    } catch {
      return null
    }
  }, [])

  const useParticipantData = React.useMemo(() => {
    try {
      return require('../hooks/useParticipantData').useParticipantData
    } catch {
      return null
    }
  }, [])

  const useMatchData = React.useMemo(() => {
    try {
      return require('../hooks/useMatchData').useMatchData
    } catch {
      return null
    }
  }, [])

  // Use hooks if available
  const winningsResult = useWinnings ? useWinnings(marketAddress, userAddress) : null
  const marketResult = useMarketData ? useMarketData(marketAddress) : null
  const participantResult = useParticipantData ? useParticipantData(marketAddress, userAddress) : null
  
  const matchId = marketResult?.data?.matchId ? parseInt(marketResult.data.matchId, 10) : undefined
  const matchResult = useMatchData && matchId ? useMatchData(matchId) : null

  // Extract data
  const { winnings, isLoading, error, structuredError, isRecoverable } = winningsResult || {}
  const marketData = marketResult?.data
  const participantData = participantResult?.data
  const matchData = matchResult?.data

  // Show loading state
  if (isLoading) {
    const LoadingComp = LoadingComponent || WinningsLoadingSkeleton
    return <LoadingComp variant={variant} showBreakdown={showBreakdown} className={className} />
  }

  // Show error state with error boundary
  if (error || structuredError) {
    if (ErrorComponent) {
      return <ErrorComponent error={error || structuredError?.userMessage || 'Unknown error'} />
    }

    // Use WinningsErrorBoundary for structured error handling
    return (
      <WinningsErrorBoundary
        variant={variant}
        marketData={marketData ? {
          entryFee: marketData.entryFee,
          totalPool: marketData.totalPool,
          participantCount: marketData.participantCount,
        } : undefined}
        showRetry={isRecoverable}
        errorMessage={structuredError?.userMessage}
        fallback={
          <div className={cn('text-center text-[var(--text-secondary)] py-4', className)}>
            Unable to load winnings data
          </div>
        }
      >
        <div>Error occurred</div>
      </WinningsErrorBoundary>
    )
  }

  // Show empty state
  if (!winnings || !marketData) {
    return (
      <div className={cn('text-center text-[var(--text-secondary)] py-4', className)}>
        No winnings data available
      </div>
    )
  }

  // Render winnings display with error boundary
  return (
    <WinningsErrorBoundary
      variant={variant}
      marketData={{
        entryFee: marketData.entryFee,
        totalPool: marketData.totalPool,
        participantCount: marketData.participantCount,
      }}
    >
      <WinningsDisplay
        marketData={marketData}
        participantData={participantData}
        userAddress={userAddress}
        matchData={matchData}
        winnings={winnings}
        variant={variant}
        showBreakdown={showBreakdown}
        className={className}
      />
    </WinningsErrorBoundary>
  )
}

