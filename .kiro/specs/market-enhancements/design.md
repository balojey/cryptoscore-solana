# Design Document

## Overview

This design document outlines the implementation approach for enhancing the CryptoScore prediction market platform with automated fee distribution, intelligent resolution controls, user prediction visibility, and convenient market creation features. The enhancements will improve user experience while maintaining the existing architecture and security model.

## Architecture

### Current System Components

The existing system consists of:
- **Frontend**: React application with TypeScript
- **Solana Programs**: Factory, Market, and Dashboard programs
- **Hooks**: React hooks for market actions and data fetching
- **External API**: Football-data.org for match information

### Enhanced Components

The enhancements will modify:
1. **Market Resolution Logic**: Enhanced `resolveMarket` function with automated fee distribution
2. **UI Components**: Enhanced market cards and detail pages with prediction display and match scores
3. **Data Fetching**: Enhanced match data hooks to include score information
4. **Market Creation**: New "Create Similar" functionality

## Components and Interfaces

### 1. Enhanced Market Resolution

#### Fee Distribution Structure
```typescript
interface FeeDistribution {
  creatorFee: number;      // Percentage to creator (e.g., 2%)
  platformFee: number;     // Percentage to platform (e.g., 3%)
  participantPool: number; // Remaining percentage to winners (e.g., 95%)
}

interface ResolveMarketWithFeesParams extends ResolveMarketParams {
  platformAddress: string; // "2xUfnnyizenM7a9jWHtgxdCWCTE11afRUhX5YeFSrVTn"
}
```

#### Enhanced Resolution Function
The `resolveMarket` function will be enhanced to:
- Calculate fee distributions based on total pool
- Create multiple transfer instructions in a single transaction
- Transfer creator fee to market creator
- Transfer platform fee to specified platform address
- Leave remaining funds in market for participant withdrawals

### 2. Match Score Integration

#### Enhanced Match Data Interface
```typescript
interface EnhancedMatchData extends Match {
  score?: {
    fullTime: {
      home: number;
      away: number;
    };
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW';
  };
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
}
```

#### Resolution Eligibility Logic
```typescript
interface ResolutionEligibility {
  canResolve: boolean;
  reason: string;
  userHasWinningPrediction: boolean;
  matchResult?: 'Home' | 'Draw' | 'Away';
}
```

### 3. Enhanced Market Card Display

#### User Prediction Display Component
```typescript
interface UserPredictionBadge {
  prediction: 'Home' | 'Draw' | 'Away';
  isCorrect?: boolean; // Only shown when match is finished
  matchResult?: 'Home' | 'Draw' | 'Away';
}
```

### 4. Create Similar Market Feature

#### Similar Market Creation Interface
```typescript
interface CreateSimilarMarketParams {
  sourceMarketAddress: string;
  matchId: string;
  entryFee: number;
  isPublic: boolean;
}
```

## Data Models

### Enhanced Participant Data
```typescript
interface EnhancedParticipantData extends ParticipantData {
  isWinner?: boolean;
  canWithdraw?: boolean;
  potentialReward?: number;
}
```

### Market Resolution State
```typescript
interface MarketResolutionState {
  isResolved: boolean;
  outcome?: 'Home' | 'Draw' | 'Away';
  matchFinished: boolean;
  matchResult?: 'Home' | 'Draw' | 'Away';
  userEligibleToResolve: boolean;
  userHasWinningPrediction: boolean;
}
```

## Error Handling

### Resolution Errors
- **Insufficient Authority**: User is not creator or participant
- **Match Not Finished**: Match status is not 'FINISHED'
- **Already Resolved**: Market has already been resolved
- **Fee Distribution Failure**: Transaction fails during fee distribution

### Match Data Errors
- **API Unavailable**: Football-data.org API is down or rate-limited
- **Match Not Found**: Match ID doesn't exist in API
- **Score Unavailable**: Match finished but scores not yet available

### UI Error States
- **Loading States**: Show skeletons while fetching match scores
- **Error Fallbacks**: Display error messages when match data fails
- **Graceful Degradation**: Hide resolution controls when match data unavailable

## Testing Strategy

### Unit Tests
- Fee calculation logic
- Resolution eligibility determination
- Match result parsing
- Prediction outcome validation

### Integration Tests
- End-to-end market resolution with fee distribution
- Match data fetching and score display
- User prediction display across different market states
- Similar market creation workflow

### User Acceptance Tests
- Creator receives fees automatically upon resolution
- Users see match scores and prediction outcomes
- Resolution button only appears for eligible users
- Similar market creation works with different parameters

## Implementation Phases

### Phase 1: Enhanced Resolution with Fee Distribution
1. Modify `resolveMarket` function to include fee distribution
2. Add platform address configuration
3. Implement atomic transaction with multiple transfers
4. Add fee calculation utilities

### Phase 2: Match Score Integration and Resolution Controls
1. Enhance match data fetching to include scores
2. Add resolution eligibility logic
3. Implement conditional resolution button display
4. Add match result indicators

### Phase 3: User Prediction Display
1. Enhance EnhancedMarketCard to show user predictions
2. Add prediction badges with visual indicators
3. Implement prediction outcome status (correct/incorrect)
4. Add consistent styling across components

### Phase 4: Create Similar Market Feature
1. Add "Create Similar" button to market detail page
2. Implement similar market creation dialog
3. Pre-fill match ID and allow parameter customization
4. Add navigation to newly created market

## Security Considerations

### Fee Distribution Security
- Validate platform address is correct hardcoded value
- Ensure fee percentages are within acceptable bounds
- Prevent fee manipulation through parameter validation
- Use atomic transactions to prevent partial fee distribution

### Resolution Authority
- Maintain existing authorization checks (creator or participant)
- Validate match result against external API
- Prevent duplicate resolutions
- Log all resolution attempts for audit

### Data Validation
- Validate match scores from external API
- Sanitize user inputs for similar market creation
- Prevent creation of duplicate markets for same match
- Validate entry fee bounds and visibility settings