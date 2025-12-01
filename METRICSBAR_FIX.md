# MetricsBar Component Fix

## Issues Found

### 1. **Type Mismatch**
- Component imported `Market` type from `types.ts`
- Hooks returned `MarketData` type from `useMarketData.ts`
- These have different field names and structures

### 2. **Wrong Field Names**
```typescript
// ❌ Component was using (doesn't exist in MarketData):
market.startTime
market.participantsCount

// ✅ Should use (exists in MarketData):
market.kickoffTime
market.participantCount
```

### 3. **Redundant Data Fetching**
- Called `useFactoryMarkets()` to get markets
- Then called `useMarketDetails()` to get same data again
- Attempted to merge arrays by index (flawed logic)
- **Reality**: `useAllMarkets()` already returns complete market data

### 4. **Unnecessary Type Conversions**
- Used `BigInt()` on values that were already `number` types
- `MarketData.entryFee` is `number`, not `bigint`
- `MarketData.participantCount` is `number`, not `bigint`

### 5. **Incorrect TVL Calculation**
```typescript
// ❌ Old (wrong):
const poolSize = BigInt(market.entryFee) * BigInt(market.participantsCount)

// ✅ New (correct):
const poolSize = market.totalPool // Already calculated in Solana program
```

## Solution

### Changes Made:
1. Import `MarketData` type instead of `Market`
2. Use `useAllMarkets()` directly (single hook call)
3. Use correct field names: `kickoffTime`, `participantCount`, `totalPool`
4. Remove BigInt conversions (work with numbers directly)
5. Simplify data flow - no merging needed

### Result:
- Metrics now calculate correctly from actual Solana data
- No type mismatches
- Cleaner, more efficient code
- Proper TVL using `totalPool` from market accounts
