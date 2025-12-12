/**
 * WinningsCalculator - Core utility for calculating winnings in prediction markets
 * 
 * Handles all winnings calculations based on user authentication status, participation,
 * market state, and fee distribution rules.
 */

import type { MarketData } from '../hooks/useMarketData'
import type { ParticipantData } from '../hooks/useParticipantData'
import type { EnhancedMatchData } from '../hooks/useMatchData'
import { FEE_DISTRIBUTION, BASIS_POINTS_DIVISOR } from '../config/fees'

/**
 * Parameters for winnings calculation
 */
export interface WinningsCalculationParams {
  marketData: MarketData
  participantData?: ParticipantData | null
  userAddress?: string
  matchData?: EnhancedMatchData | null
}

/**
 * Result of winnings calculation
 */
export interface WinningsResult {
  type: 'potential' | 'actual' | 'creator_reward' | 'none'
  amount: number // in lamports
  breakdown?: {
    participantWinnings?: number
    creatorReward?: number
    totalPool?: number
    winnerCount?: number
  }
  status: 'eligible' | 'won' | 'lost' | 'distributed' | 'pending'
  message: string
  displayVariant: 'success' | 'warning' | 'info' | 'error'
  icon: string
}

/**
 * Market display state enum for different user scenarios
 */
export enum MarketDisplayState {
  OPEN_UNAUTHENTICATED = 'open_unauthenticated',
  OPEN_AUTHENTICATED_NON_PARTICIPANT = 'open_authenticated_non_participant',
  OPEN_PARTICIPANT = 'open_participant',
  OPEN_CREATOR_PARTICIPANT = 'open_creator_participant',
  OPEN_CREATOR_NON_PARTICIPANT = 'open_creator_non_participant',
  ENDED_PARTICIPANT_WINNER = 'ended_participant_winner',
  ENDED_PARTICIPANT_LOSER = 'ended_participant_loser',
  ENDED_CREATOR_PARTICIPANT = 'ended_creator_participant',
  ENDED_CREATOR_NON_PARTICIPANT = 'ended_creator_non_participant',
  RESOLVED_PARTICIPANT_WINNER = 'resolved_participant_winner',
  RESOLVED_PARTICIPANT_LOSER = 'resolved_participant_loser',
  RESOLVED_CREATOR = 'resolved_creator'
}

/**
 * Core winnings calculator class
 */
export class WinningsCalculator {
  /**
   * Main entry point for calculating winnings based on all parameters
   */
  static calculateWinnings(params: WinningsCalculationParams): WinningsResult {
    const { marketData, participantData, userAddress, matchData } = params

    // Determine market display state
    const displayState = this.determineMarketDisplayState(marketData, participantData, userAddress, matchData)

    // Calculate winnings based on state
    switch (displayState) {
      case MarketDisplayState.OPEN_UNAUTHENTICATED:
      case MarketDisplayState.OPEN_AUTHENTICATED_NON_PARTICIPANT:
        return this.calculatePotentialWinningsForNonParticipant(marketData)

      case MarketDisplayState.OPEN_PARTICIPANT:
        return this.calculatePotentialWinningsForParticipant(marketData, participantData!)

      case MarketDisplayState.OPEN_CREATOR_PARTICIPANT:
        return this.calculatePotentialWinningsForCreatorParticipant(marketData, participantData!)

      case MarketDisplayState.OPEN_CREATOR_NON_PARTICIPANT:
        return this.calculatePotentialCreatorReward(marketData)

      case MarketDisplayState.ENDED_PARTICIPANT_WINNER:
        return this.calculateActualWinningsForWinner(marketData, participantData!, matchData!)

      case MarketDisplayState.ENDED_PARTICIPANT_LOSER:
        return this.calculateLossForParticipant(marketData, participantData!)

      case MarketDisplayState.ENDED_CREATOR_PARTICIPANT:
        return this.calculateEndedCreatorParticipantWinnings(marketData, participantData!, matchData!)

      case MarketDisplayState.ENDED_CREATOR_NON_PARTICIPANT:
        return this.calculateEndedCreatorReward(marketData)

      case MarketDisplayState.RESOLVED_PARTICIPANT_WINNER:
        return this.calculateResolvedParticipantWinnings(marketData, participantData!)

      case MarketDisplayState.RESOLVED_PARTICIPANT_LOSER:
        return this.calculateResolvedParticipantLoss(marketData, participantData!)

      case MarketDisplayState.RESOLVED_CREATOR:
        return this.calculateResolvedCreatorReward(marketData)

      default:
        return this.createNoWinningsResult()
    }
  }

  /**
   * Calculate potential winnings for a specific prediction (for non-participants)
   */
  static calculatePotentialWinnings(
    marketData: MarketData, 
    prediction?: 'Home' | 'Draw' | 'Away'
  ): number {
    if (!prediction || marketData.participantCount === 0) {
      return marketData.entryFee
    }

    // Calculate participant pool (95% of total pool)
    const participantPool = this.calculateParticipantPool(marketData.totalPool)
    
    // Get count for the specific prediction
    const predictionCount = this.getPredictionCount(marketData, prediction)
    
    // If no one has made this prediction yet, return the full participant pool
    if (predictionCount === 0) {
      return participantPool + marketData.entryFee
    }

    // Calculate winnings per winner
    return Math.floor(participantPool / predictionCount)
  }

  /**
   * Calculate actual winnings for a participant with correct prediction
   */
  static calculateActualWinnings(
    marketData: MarketData, 
    participantData: ParticipantData
  ): number {
    if (!marketData.outcome || marketData.outcome !== participantData.prediction) {
      return 0
    }

    const participantPool = this.calculateParticipantPool(marketData.totalPool)
    const winnerCount = this.getPredictionCount(marketData, marketData.outcome)
    
    if (winnerCount === 0) {
      return 0
    }

    return Math.floor(participantPool / winnerCount)
  }

  /**
   * Calculate creator reward (2% of total pool)
   */
  static calculateCreatorReward(marketData: MarketData): number {
    return Math.floor((marketData.totalPool * FEE_DISTRIBUTION.CREATOR_FEE_BPS) / BASIS_POINTS_DIVISOR)
  }

  /**
   * Check if user is the market creator
   */
  static isUserCreator(marketData: MarketData, userAddress?: string): boolean {
    return !!userAddress && marketData.creator.toLowerCase() === userAddress.toLowerCase()
  }

  /**
   * Check if user is a participant in the market
   */
  static isUserParticipant(participantData?: ParticipantData | null): boolean {
    return !!participantData
  }

  /**
   * Determine the market display state based on all parameters
   */
  private static determineMarketDisplayState(
    marketData: MarketData,
    participantData?: ParticipantData | null,
    userAddress?: string,
    matchData?: EnhancedMatchData | null
  ): MarketDisplayState {
    const isCreator = this.isUserCreator(marketData, userAddress)
    const isParticipant = this.isUserParticipant(participantData)
    const isAuthenticated = !!userAddress

    // Open market states
    if (marketData.status === 'Open') {
      if (!isAuthenticated) {
        return MarketDisplayState.OPEN_UNAUTHENTICATED
      }
      
      if (isCreator && isParticipant) {
        return MarketDisplayState.OPEN_CREATOR_PARTICIPANT
      }
      
      if (isCreator && !isParticipant) {
        return MarketDisplayState.OPEN_CREATOR_NON_PARTICIPANT
      }
      
      if (isParticipant) {
        return MarketDisplayState.OPEN_PARTICIPANT
      }
      
      return MarketDisplayState.OPEN_AUTHENTICATED_NON_PARTICIPANT
    }

    // Ended market states (match finished but not resolved)
    if (marketData.status === 'Live' && matchData?.isFinished) {
      const isWinner = isParticipant && 
        matchData.matchResult && 
        participantData?.prediction === matchData.matchResult

      if (isCreator && isParticipant) {
        return MarketDisplayState.ENDED_CREATOR_PARTICIPANT
      }
      
      if (isCreator && !isParticipant) {
        return MarketDisplayState.ENDED_CREATOR_NON_PARTICIPANT
      }
      
      if (isParticipant && isWinner) {
        return MarketDisplayState.ENDED_PARTICIPANT_WINNER
      }
      
      if (isParticipant && !isWinner) {
        return MarketDisplayState.ENDED_PARTICIPANT_LOSER
      }
    }

    // Resolved market states
    if (marketData.status === 'Resolved') {
      const isWinner = isParticipant && 
        marketData.outcome && 
        participantData?.prediction === marketData.outcome

      if (isCreator) {
        return MarketDisplayState.RESOLVED_CREATOR
      }
      
      if (isParticipant && isWinner) {
        return MarketDisplayState.RESOLVED_PARTICIPANT_WINNER
      }
      
      if (isParticipant && !isWinner) {
        return MarketDisplayState.RESOLVED_PARTICIPANT_LOSER
      }
    }

    // Default fallback
    return MarketDisplayState.OPEN_UNAUTHENTICATED
  }

  /**
   * Calculate participant pool (95% of total pool after fees)
   */
  private static calculateParticipantPool(totalPool: number): number {
    return Math.floor((totalPool * FEE_DISTRIBUTION.PARTICIPANT_POOL_BPS) / BASIS_POINTS_DIVISOR)
  }

  /**
   * Get prediction count for a specific outcome
   */
  private static getPredictionCount(marketData: MarketData, prediction: 'Home' | 'Draw' | 'Away'): number {
    switch (prediction) {
      case 'Home': return marketData.homeCount
      case 'Draw': return marketData.drawCount
      case 'Away': return marketData.awayCount
      default: return 0
    }
  }

  // Individual calculation methods for each state

  private static calculatePotentialWinningsForNonParticipant(marketData: MarketData): WinningsResult {
    const potentialWinnings = this.calculatePotentialWinnings(marketData, 'Home') // Show example for Home
    
    return {
      type: 'potential',
      amount: potentialWinnings,
      status: 'eligible',
      message: 'Potential winnings if you join and predict correctly',
      displayVariant: 'info',
      icon: 'TrendingUp'
    }
  }

  private static calculatePotentialWinningsForParticipant(
    marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    const potentialWinnings = this.calculatePotentialWinnings(marketData, participantData.prediction)
    
    return {
      type: 'potential',
      amount: potentialWinnings,
      status: 'eligible',
      message: `Potential winnings for your ${participantData.prediction} prediction`,
      displayVariant: 'info',
      icon: 'Target'
    }
  }

  private static calculatePotentialWinningsForCreatorParticipant(
    marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    const participantWinnings = this.calculatePotentialWinnings(marketData, participantData.prediction)
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'potential',
      amount: participantWinnings + creatorReward,
      breakdown: {
        participantWinnings,
        creatorReward,
        totalPool: marketData.totalPool
      },
      status: 'eligible',
      message: `Potential winnings (${participantData.prediction} prediction + creator reward)`,
      displayVariant: 'info',
      icon: 'Crown'
    }
  }

  private static calculatePotentialCreatorReward(marketData: MarketData): WinningsResult {
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'creator_reward',
      amount: creatorReward,
      status: 'eligible',
      message: 'Potential creator reward (2% of total pool)',
      displayVariant: 'info',
      icon: 'Award'
    }
  }

  private static calculateActualWinningsForWinner(
    marketData: MarketData, 
    participantData: ParticipantData,
    matchData: EnhancedMatchData
  ): WinningsResult {
    const actualWinnings = this.calculateActualWinnings(marketData, participantData)
    const winnerCount = this.getPredictionCount(marketData, matchData.matchResult!)
    
    return {
      type: 'actual',
      amount: actualWinnings,
      breakdown: {
        participantWinnings: actualWinnings,
        totalPool: marketData.totalPool,
        winnerCount
      },
      status: 'won',
      message: `You won! Correct ${participantData.prediction} prediction`,
      displayVariant: 'success',
      icon: 'Trophy'
    }
  }

  private static calculateLossForParticipant(
    _marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    return {
      type: 'none',
      amount: 0,
      status: 'lost',
      message: `Your ${participantData.prediction} prediction was incorrect`,
      displayVariant: 'error',
      icon: 'X'
    }
  }

  private static calculateEndedCreatorParticipantWinnings(
    marketData: MarketData, 
    participantData: ParticipantData,
    matchData: EnhancedMatchData
  ): WinningsResult {
    const isWinner = matchData.matchResult === participantData.prediction
    const participantWinnings = isWinner ? this.calculateActualWinnings(marketData, participantData) : 0
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'actual',
      amount: participantWinnings + creatorReward,
      breakdown: {
        participantWinnings,
        creatorReward,
        totalPool: marketData.totalPool
      },
      status: 'pending',
      message: isWinner 
        ? `Match ended! You won ${participantData.prediction} + creator reward (pending resolution)`
        : `Match ended! Creator reward only (${participantData.prediction} prediction incorrect)`,
      displayVariant: isWinner ? 'success' : 'warning',
      icon: 'Clock'
    }
  }

  private static calculateEndedCreatorReward(marketData: MarketData): WinningsResult {
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'creator_reward',
      amount: creatorReward,
      status: 'pending',
      message: 'Match ended! Creator reward pending resolution',
      displayVariant: 'warning',
      icon: 'Clock'
    }
  }

  private static calculateResolvedParticipantWinnings(
    marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    const actualWinnings = this.calculateActualWinnings(marketData, participantData)
    const winnerCount = this.getPredictionCount(marketData, marketData.outcome!)
    
    return {
      type: 'actual',
      amount: actualWinnings,
      breakdown: {
        participantWinnings: actualWinnings,
        totalPool: marketData.totalPool,
        winnerCount
      },
      status: 'distributed',
      message: `Winnings distributed! Correct ${participantData.prediction} prediction`,
      displayVariant: 'success',
      icon: 'CheckCircle'
    }
  }

  private static calculateResolvedParticipantLoss(
    _marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    return {
      type: 'none',
      amount: 0,
      status: 'distributed',
      message: `Market resolved. Your ${participantData.prediction} prediction was incorrect`,
      displayVariant: 'error',
      icon: 'XCircle'
    }
  }

  private static calculateResolvedCreatorReward(marketData: MarketData): WinningsResult {
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'creator_reward',
      amount: creatorReward,
      status: 'distributed',
      message: 'Creator reward has been distributed',
      displayVariant: 'success',
      icon: 'CheckCircle'
    }
  }

  private static createNoWinningsResult(): WinningsResult {
    return {
      type: 'none',
      amount: 0,
      status: 'eligible',
      message: 'No winnings information available',
      displayVariant: 'info',
      icon: 'Info'
    }
  }
}