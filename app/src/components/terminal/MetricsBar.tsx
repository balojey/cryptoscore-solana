import type { MarketData } from '../../hooks/useMarketData'
import { useMemo } from 'react'
import { useAllMarkets } from '../../hooks/useMarketData'
import AnimatedNumber from '../ui/AnimatedNumber'

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  icon: string
  trend?: string
  isLoading?: boolean
}

function MetricCard({ label, value, suffix = '', icon, trend, isLoading }: MetricCardProps) {
  return (
    <div
      className="p-4 rounded-lg transition-all hover:scale-[1.02]"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </span>
        <span className="text-xl">{icon}</span>
      </div>
      <div
        className="text-2xl font-bold font-mono mb-1 transition-opacity duration-300"
        style={{ color: 'var(--text-primary)' }}
      >
        {isLoading
          ? (
              <div className="h-8 w-24 skeleton rounded" />
            )
          : (
              <>
                <AnimatedNumber
                  value={value}
                  duration={500}
                  decimals={suffix.includes('SOL') ? 4 : suffix.includes('PAS') ? 2 : 0}
                />
                {suffix && <span className="text-lg ml-1">{suffix}</span>}
              </>
            )}
      </div>
      {trend && !isLoading && (
        <div
          className="text-xs font-medium flex items-center gap-1"
          style={{
            color: trend.startsWith('+') ? 'var(--accent-green)' : 'var(--accent-red)',
          }}
        >
          <span className={trend.startsWith('+') ? 'icon-[mdi--trending-up]' : 'icon-[mdi--trending-down]'} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}

interface TerminalMetrics {
  totalMarkets: number
  totalValueLocked: number
  activeTraders: number
  volume24h: number
  trends: {
    markets: string
    tvl: string
    traders: string
    volume: string
  }
}

interface MetricsBarProps {
  error?: Error | null
}

export default function MetricsBar({ error }: MetricsBarProps) {
  // Fetch all markets from Solana - this already includes all details
  const { data: marketsData, isLoading } = useAllMarkets()

  // Calculate metrics from market data
  const metrics: TerminalMetrics = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData) || marketsData.length === 0) {
      return {
        totalMarkets: 0,
        totalValueLocked: 0,
        activeTraders: 0,
        volume24h: 0,
        trends: {
          markets: '+0%',
          tvl: '+0%',
          traders: '+0%',
          volume: '+0%',
        },
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 86400
    const twoDaysAgo = now - 172800

    const totalMarkets = marketsData.length

    // Calculate TVL (sum of all totalPool values) - already in lamports
    const totalPoolLamports = marketsData.reduce((sum: number, market: MarketData) => {
      return sum + market.totalPool
    }, 0)
    const totalValueLocked = totalPoolLamports / 1_000_000_000 // Convert lamports to SOL

    // Debug logging
    console.log('MetricsBar - TVL Calculation:', {
      totalMarkets: marketsData.length,
      totalPoolLamports,
      totalValueLocked,
      sampleMarket: marketsData[0] ? {
        totalPool: marketsData[0].totalPool,
        entryFee: marketsData[0].entryFee,
        participantCount: marketsData[0].participantCount,
      } : null,
    })

    // Calculate unique active traders (creators)
    const uniqueTraders = new Set<string>()
    marketsData.forEach((market: MarketData) => {
      uniqueTraders.add(market.creator.toLowerCase())
    })
    const activeTraders = uniqueTraders.size

    // Calculate 24h volume and trends
    let volume24h = 0
    let volumePrevious24h = 0
    let markets24h = 0
    let marketsPrevious24h = 0
    let tvl24h = 0
    let tvlPrevious24h = 0

    marketsData.forEach((market: MarketData) => {
      const poolSize = market.totalPool
      const kickoffTime = market.kickoffTime

      if (kickoffTime >= oneDayAgo) {
        volume24h += poolSize
        markets24h += 1
        tvl24h += poolSize
      }
      else if (kickoffTime >= twoDaysAgo) {
        volumePrevious24h += poolSize
        marketsPrevious24h += 1
        tvlPrevious24h += poolSize
      }
    })

    // Convert lamports to SOL for volume
    const volume24hValue = volume24h / 1_000_000_000

    // Debug logging
    console.log('MetricsBar - 24h Volume Calculation:', {
      volume24hLamports: volume24h,
      volume24hSOL: volume24hValue,
      markets24h,
      totalMarkets24h: marketsData.filter(m => m.kickoffTime >= oneDayAgo).length,
      now,
      oneDayAgo,
      sampleKickoffTimes: marketsData.slice(0, 3).map(m => ({
        kickoffTime: m.kickoffTime,
        isRecent: m.kickoffTime >= oneDayAgo,
        date: new Date(m.kickoffTime * 1000).toISOString(),
      })),
    })

    // Calculate trend percentages
    let marketsTrend = '+0%'
    if (marketsPrevious24h > 0) {
      const trend = ((markets24h - marketsPrevious24h) / marketsPrevious24h) * 100
      marketsTrend = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`
    }
    else if (markets24h > 0) {
      marketsTrend = '+100%'
    }

    let tvlTrend = '+0%'
    if (tvlPrevious24h > 0) {
      const trend = ((tvl24h - tvlPrevious24h) / tvlPrevious24h) * 100
      tvlTrend = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`
    }
    else if (tvl24h > 0) {
      tvlTrend = '+100%'
    }

    let volumeTrend = '+0%'
    if (volumePrevious24h > 0) {
      const trend = ((volume24h - volumePrevious24h) / volumePrevious24h) * 100
      volumeTrend = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`
    }
    else if (volume24h > 0) {
      volumeTrend = '+100%'
    }

    // Trader trend (simplified - based on recent market creation activity)
    const traderTrend = markets24h > marketsPrevious24h ? '+15%' : markets24h < marketsPrevious24h ? '-5%' : '+0%'

    return {
      totalMarkets,
      totalValueLocked,
      activeTraders,
      volume24h: volume24hValue,
      trends: {
        markets: marketsTrend,
        tvl: tvlTrend,
        traders: traderTrend,
        volume: volumeTrend,
      },
    }
  }, [marketsData])

  // Show error state if there's an error and no data
  const showError = error && !marketsData

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      <MetricCard
        label="Total Markets"
        value={showError ? 0 : metrics.totalMarkets}
        icon="📊"
        trend={showError ? undefined : metrics.trends.markets}
        isLoading={isLoading}
      />
      <MetricCard
        label="Total Value Locked"
        value={showError ? 0 : metrics.totalValueLocked}
        suffix=" SOL"
        icon="🔒"
        trend={showError ? undefined : metrics.trends.tvl}
        isLoading={isLoading}
      />
      <MetricCard
        label="Active Traders"
        value={showError ? 0 : metrics.activeTraders}
        icon="👥"
        trend={showError ? undefined : metrics.trends.traders}
        isLoading={isLoading}
      />
      <MetricCard
        label="24h Volume"
        value={showError ? 0 : metrics.volume24h}
        suffix=" SOL"
        icon="📈"
        trend={showError ? undefined : metrics.trends.volume}
        isLoading={isLoading}
      />
    </div>
  )
}
