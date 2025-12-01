# Portfolio Summary Calculation Fixes

## Issues Fixed

### 1. **Active Positions Count**
**Problem**: Counted all markets in `marketsToAnalyze` that weren't resolved, including markets where the user never made a prediction.

**Fix**: Now only counts markets where the user has an actual participant account (has made a prediction).

```typescript
// Before: counted all unresolved markets
const activePositions = marketsToAnalyze.filter(m => !m.resolved).length

// After: only counts markets user actually joined
const activePositions = userMarketData.filter(data => !data.market.resolved).length
```

### 2. **Win Rate Calculation**
**Problem**: Used `resolvedMarkets.length` which could include markets the user didn't participate in.

**Fix**: Now calculates based only on markets where the user has a participant account.

```typescript
// Before: could include non-participated markets
const resolvedMarkets = userMarketData.filter(data => data.market.resolved)
const winRate = resolvedMarkets.length > 0 ? (totalWins / resolvedMarkets.length) * 100 : 0

// After: uses resolvedPositions which only counts participated markets
const resolvedPositions = userMarketData.filter(data => data.market.resolved).length
const winRate = resolvedPositions > 0 ? (totalWins / resolvedPositions) * 100 : 0
```

### 3. **Portfolio Value Calculation**
**Problem**: The calculation was conceptually correct but could be clearer. It added active positions value + claimable rewards.

**Fix**: Clarified the logic:
- **Active positions value**: Entry fees for unresolved markets (what's currently at stake)
- **Claimable rewards**: Winnings from resolved markets not yet withdrawn
- **Total value**: Sum of both

```typescript
// Active positions: what's at stake in ongoing markets
const activePositionsValueLamports = userMarketData
  .filter(data => !data.market.resolved)
  .reduce((sum, data) => sum + data.entryFee, 0)

// Total portfolio value: at-stake amount + claimable winnings
const totalValueLamports = activePositionsValueLamports + totalClaimableRewardsLamports
```

### 4. **P&L Calculation**
**Problem**: The formula was correct but the implementation had issues with tracking withdrawn vs claimable rewards.

**Fix**: Properly tracks both withdrawn and claimable rewards:
- Iterates through all resolved markets
- For wins: adds reward to either withdrawn or claimable based on `hasWithdrawn` flag
- For losses: user loses entry fee (no reward)
- P&L = Total rewards - Total invested

```typescript
userMarketData.forEach((data) => {
  if (market.resolved && market.outcome) {
    if (prediction === winningPrediction) {
      totalWins++
      if (hasWithdrawn) {
        totalWithdrawnRewardsLamports += reward
      } else {
        totalClaimableRewardsLamports += reward
      }
    } else {
      totalLosses++
      // Lost: entry fee is gone, no reward
    }
  }
})

const totalRewardsLamports = totalWithdrawnRewardsLamports + totalClaimableRewardsLamports
const totalPnLLamports = totalRewardsLamports - totalInvestedLamports
```

### 5. **Participant Data Filtering**
**Problem**: Returned placeholder data for markets where user had no participant account, polluting the dataset.

**Fix**: Returns `null` for non-participated markets and filters them out:

```typescript
// In queryFn
if (!accountInfo || !accountInfo.data) {
  // User hasn't joined this market
  return null
}

// Filter out nulls
return {
  userMarketData: userMarketData.filter(data => data !== null)
}
```

### 6. **Removed Unused withdrawnRewards Object**
**Problem**: `withdrawnRewards` object was initialized but never populated from on-chain data.

**Fix**: Removed the unused object and now track withdrawn status directly from participant accounts using the `hasWithdrawn` flag.

## Key Improvements

1. **Accuracy**: All calculations now only consider markets where the user actually participated
2. **Clarity**: Separated lamports calculations from SOL conversions for better precision
3. **Correctness**: Properly tracks withdrawn vs claimable rewards using on-chain data
4. **Performance**: Filters out non-participated markets early in the data pipeline

## Testing Recommendations

1. Test with a user who has:
   - Created markets but not joined them
   - Joined markets but not created them
   - Both created and joined the same market
   
2. Verify calculations with:
   - Active positions only
   - Resolved wins only
   - Resolved losses only
   - Mix of all three

3. Check edge cases:
   - No markets participated in
   - All markets resolved
   - All markets active
   - Markets with withdrawn rewards
