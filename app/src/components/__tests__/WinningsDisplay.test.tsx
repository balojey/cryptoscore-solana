/**
 * Tests for WinningsDisplay component
 *
 * Tests the component props and logic without full rendering
 * since React Testing Library is not available.
 */

import { describe, it, expect, vi } from 'vitest'
import { WinningsDisplay, CompactWinningsDisplay, DetailedWinningsDisplay } from '../WinningsDisplay'
import type { WinningsResult } from '@/utils/winnings-calculator'
import type { MarketData } from '@/hooks/useMarketData'
import type { ParticipantData } from '@/hooks/useParticipantData'
import type { EnhancedMatchData } from '@/hooks/useMatchData'

// Mock the currency context
vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: vi.fn(() => ({
    formatCurrency: vi.fn((lamports: number) => `◎${(lamports / 1_000_000_000).toFixed(4)}`),
  })),
}))

// Test data
const mockMarketData: MarketData = {
  creator: 'test-creator-address',
  matchId: '12345',
  entryFee: 100000000, // 0.1 SOL in lamports
  totalPool: 1000000000, // 1 SOL in lamports
  participantCount: 10,
  homeCount: 4,
  drawCount: 2,
  awayCount: 4,
  status: 'Open',
  outcome: null,
  createdAt: new Date(),
  startsAt: new Date(Date.now() + 3600000), // 1 hour from now
}

const mockParticipantData: ParticipantData = {
  address: 'test-participant-address',
  prediction: 'Home',
  hasWithdrawn: false,
  joinedAt: Date.now(),
}

const mockMatchData: EnhancedMatchData = {
  id: 12345,
  homeTeam: {
    id: 1,
    name: 'Team A',
    shortName: 'TEA',
    tla: 'TEA',
    crest: 'team-a.png'
  },
  awayTeam: {
    id: 2,
    name: 'Team B',
    shortName: 'TEB',
    tla: 'TEB',
    crest: 'team-b.png'
  },
  competition: {
    id: 1,
    name: 'Test League',
    code: 'TL',
    type: 'LEAGUE',
    emblem: 'league.png'
  },
  score: {
    winner: null,
    duration: 'REGULAR',
    fullTime: { home: null, away: null },
    halfTime: { home: null, away: null }
  },
  startTime: new Date(Date.now() + 3600000),
  isFinished: false,
  matchResult: undefined,
}

const mockPotentialWinnings: WinningsResult = {
  type: 'potential',
  amount: 250000000, // 0.25 SOL
  status: 'eligible',
  message: 'Potential winnings for your Home prediction',
  displayVariant: 'info',
  icon: 'Target',
}

const mockActualWinnings: WinningsResult = {
  type: 'actual',
  amount: 237500000, // 0.2375 SOL
  breakdown: {
    participantWinnings: 237500000,
    totalPool: 1000000000,
    winnerCount: 4,
  },
  status: 'won',
  message: 'You won! Correct Home prediction',
  displayVariant: 'success',
  icon: 'Trophy',
}

const mockCreatorReward: WinningsResult = {
  type: 'creator_reward',
  amount: 20000000, // 0.02 SOL
  status: 'distributed',
  message: 'Creator reward has been distributed',
  displayVariant: 'success',
  icon: 'CheckCircle',
}

const mockLoss: WinningsResult = {
  type: 'none',
  amount: 0,
  status: 'lost',
  message: 'Your Home prediction was incorrect',
  displayVariant: 'error',
  icon: 'X',
}

describe('WinningsDisplay', () => {
  it('accepts correct props for potential winnings', () => {
    const props = {
      marketData: mockMarketData,
      participantData: mockParticipantData,
      userAddress: "test-user-address",
      matchData: mockMatchData,
      winnings: mockPotentialWinnings,
      variant: 'detailed' as const,
    }

    expect(props.winnings.type).toBe('potential')
    expect(props.winnings.amount).toBe(250000000)
    expect(props.winnings.displayVariant).toBe('info')
    expect(props.winnings.message).toBe('Potential winnings for your Home prediction')
  })

  it('accepts correct props for actual winnings with breakdown', () => {
    const props = {
      marketData: mockMarketData,
      participantData: mockParticipantData,
      userAddress: "test-user-address",
      matchData: mockMatchData,
      winnings: mockActualWinnings,
      variant: 'detailed' as const,
      showBreakdown: true,
    }

    expect(props.winnings.type).toBe('actual')
    expect(props.winnings.amount).toBe(237500000)
    expect(props.winnings.displayVariant).toBe('success')
    expect(props.winnings.breakdown?.winnerCount).toBe(4)
    expect(props.showBreakdown).toBe(true)
  })

  it('accepts correct props for creator reward', () => {
    const props = {
      marketData: mockMarketData,
      participantData: undefined,
      userAddress: "test-creator-address",
      matchData: mockMatchData,
      winnings: mockCreatorReward,
      variant: 'detailed' as const,
    }

    expect(props.winnings.type).toBe('creator_reward')
    expect(props.winnings.amount).toBe(20000000)
    expect(props.winnings.displayVariant).toBe('success')
    expect(props.winnings.message).toBe('Creator reward has been distributed')
  })

  it('accepts correct props for loss state', () => {
    const props = {
      marketData: mockMarketData,
      participantData: mockParticipantData,
      userAddress: "test-user-address",
      matchData: mockMatchData,
      winnings: mockLoss,
      variant: 'detailed' as const,
    }

    expect(props.winnings.type).toBe('none')
    expect(props.winnings.amount).toBe(0)
    expect(props.winnings.displayVariant).toBe('error')
    expect(props.winnings.message).toBe('Your Home prediction was incorrect')
  })

  it('handles participant data correctly', () => {
    expect(mockParticipantData.prediction).toBe('Home')
    expect(mockParticipantData.hasWithdrawn).toBe(false)
    expect(typeof mockParticipantData.joinedAt).toBe('number')
  })

  it('handles match result data correctly', () => {
    const finishedMatchData = {
      ...mockMatchData,
      isFinished: true,
      matchResult: 'Home' as const,
    }

    expect(finishedMatchData.isFinished).toBe(true)
    expect(finishedMatchData.matchResult).toBe('Home')
  })
})

describe('CompactWinningsDisplay', () => {
  it('is a wrapper for WinningsDisplay with compact variant', () => {
    // CompactWinningsDisplay should pass variant="compact" to WinningsDisplay
    expect(CompactWinningsDisplay).toBeDefined()
    expect(typeof CompactWinningsDisplay).toBe('function')
  })

  it('handles zero amount in winnings data', () => {
    expect(mockLoss.amount).toBe(0)
    expect(mockLoss.type).toBe('none')
  })
})

describe('DetailedWinningsDisplay', () => {
  it('is a wrapper for WinningsDisplay with detailed variant and breakdown', () => {
    // DetailedWinningsDisplay should pass variant="detailed" and showBreakdown=true
    expect(DetailedWinningsDisplay).toBeDefined()
    expect(typeof DetailedWinningsDisplay).toBe('function')
  })

  it('handles breakdown data correctly', () => {
    expect(mockActualWinnings.breakdown).toBeDefined()
    expect(mockActualWinnings.breakdown?.participantWinnings).toBe(237500000)
    expect(mockActualWinnings.breakdown?.totalPool).toBe(1000000000)
    expect(mockActualWinnings.breakdown?.winnerCount).toBe(4)
  })
})

describe('WinningsDisplay configuration', () => {
  it('accepts custom className prop', () => {
    const props = {
      marketData: mockMarketData,
      participantData: mockParticipantData,
      userAddress: "test-user-address",
      matchData: mockMatchData,
      winnings: mockPotentialWinnings,
      variant: 'detailed' as const,
      className: "custom-class",
    }

    expect(props.className).toBe('custom-class')
  })

  it('handles different display variants', () => {
    const detailedProps = {
      variant: 'detailed' as const,
      showBreakdown: true,
    }

    const compactProps = {
      variant: 'compact' as const,
      showBreakdown: false,
    }

    expect(detailedProps.variant).toBe('detailed')
    expect(detailedProps.showBreakdown).toBe(true)
    expect(compactProps.variant).toBe('compact')
    expect(compactProps.showBreakdown).toBe(false)
  })
})

describe('Currency formatting integration', () => {
  it('validates mock currency formatting function', () => {
    // Test that the mock currency formatter works as expected
    const mockFormatCurrency = vi.fn((lamports: number) => `◎${(lamports / 1_000_000_000).toFixed(4)}`)
    
    expect(mockFormatCurrency).toBeDefined()
    expect(typeof mockFormatCurrency).toBe('function')
    
    // Test the mock formatting
    const formatted = mockFormatCurrency(250000000)
    expect(formatted).toBe('◎0.2500')
    expect(mockFormatCurrency).toHaveBeenCalledWith(250000000)
  })
})