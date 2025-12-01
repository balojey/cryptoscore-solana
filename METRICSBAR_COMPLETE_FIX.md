# MetricsBar Complete Fix - TVL & 24h Volume

## Problem
Total Value Locked (TVL) and 24h Volume were not displaying correctly in the MetricsBar component.

## Root Causes

### 1. **Type Mismatch**
- Component imported `Market` type from `types.ts`
- Hooks returned `MarketData` type from `useMarketData.ts`
- Field names didn't match: `startTime` vs `kickoffTime`, `participantsCount` vs `participantCount`

### 2. **Incorrect Data Fetching**
- Used `useFactoryMarkets()` + `useMarketDetails()` (two separate calls)
- Attempted to merge arrays by index (flawed logic)
- `useAllMarkets()` already provides complete data

### 3. **Wrong TVL Calculation**
- Manually calculated: `entryFee * participantsCount`
- Should use: `market.totalPool` (pre-calculated in Solana program)

### 4. **Missing Decimal Precision**
- SOL amounts displayed with 0 decimals
- Small values like 0.1234 SOL showed as "0 SOL"

## Solution Applied

### Changes Made:

1. **Import correct type:**
   ```typescript
   import type { MarketData } from '../../hooks/useMarketData'
   ```

2. **Use single data source:**
   ```typescript
   const { data: marketsData, isLoading } = useAllMarkets()
   ```

3. **Fix TVL calculation:**
   ```typescript
   const totalPoolLamports = marketsData.reduce((sum, market) => {
     return sum + market.totalPool  // Use Solana's calculated value
   }, 0)
   const totalValueLocked = totalPoolLamports / 1_000_000_000
   ```

4. **Fix 24h volume calculation:**
   ```typescript
   marketsData.forEach((market: MarketData) => {
     const poolSize = market.totalPool
     const kickoffTime = market.kickoffTime  // Correct field name
     
     if (kickoffTime >= oneDayAgo) {
       volume24h += poolSize
       markets24h += 1
     }
   })
   ```

5. **Add decimal precision:**
   ```typescript
   decimals={suffix.includes('SOL') ? 4 : suffix.includes('PAS') ? 2 : 0}
   ```

6. **Add debug logging:**
   - TVL calculation details
   - 24h volume calculation details
   - Sample market data for verification

## How to Verify

### 1. Check Browser Console
Open DevTools (F12) and look for:

```
MetricsBar - TVL Calculation: {
  totalMarkets: 5,
  totalPoolLamports: 500000000,
  totalValueLocked: 0.5,
  sampleMarket: {
    totalPool: 100000000,
    entryFee: 50000000,
    participantCount: 2
  }
}
```

```
MetricsBar - 24h Volume Calculation: {
  volume24hLamports: 200000000,
  volume24hSOL: 0.2,
  markets24h: 2,
  sampleKickoffTimes: [
    { kickoffTime: 1733097600, isRecent: true, date: "2024-12-01T..." }
  ]
}
```

### 2. Verify Calculations

**TVL Formula:**
```
TVL (SOL) = Sum of all market.totalPool / 1,000,000,000
```

**24h Volume Formula:**
```
Volume (SOL) = Sum of totalPool for markets where kickoffTime >= (now - 86400) / 1,000,000,000
```

**Lamports to SOL:**
```
1 SOL = 1,000,000,000 lamports
0.1 SOL = 100,000,000 lamports
0.01 SOL = 10,000,000 lamports
```

### 3. Check Display
- TVL shows 4 decimal places: "0.1234 SOL"
- 24h Volume shows 4 decimal places: "0.0567 SOL"
- Values animate smoothly when changing
- Trends show percentage changes

## Common Scenarios

### Scenario 1: TVL shows 0.0000 SOL
**Possible causes:**
- No markets exist
- Markets have 0 participants
- All markets are empty

**Check console log:**
```javascript
totalPoolLamports: 0  // Confirms no value locked
```

### Scenario 2: 24h Volume shows 0.0000 SOL
**Possible causes:**
- No markets created in last 24 hours
- All markets are older than 24h

**Check console log:**
```javascript
markets24h: 0
sampleKickoffTimes: [
  { isRecent: false, date: "2024-11-28..." }  // Older than 24h
]
```

### Scenario 3: Small values (0.0001 SOL)
**This is correct!**
- Test markets often use small entry fees
- 100,000 lamports = 0.0001 SOL
- Component now displays these correctly

## Data Flow

```
┌─────────────────────────────────────┐
│ Solana Market Program               │
│ - total_pool updated on join        │
│ - Stored as u64 (lamports)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ AccountDecoder.decodeMarket()       │
│ - Deserializes Borsh data           │
│ - Returns bigint types              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ useMarketData.ts                    │
│ - Converts bigint to number         │
│ - Returns MarketData[]              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ MetricsBar.tsx                      │
│ - Sums totalPool values             │
│ - Converts lamports to SOL          │
│ - Displays with 4 decimals          │
└─────────────────────────────────────┘
```

## Testing Checklist

- [ ] Console shows debug logs
- [ ] TVL matches sum of market pools
- [ ] 24h Volume filters by kickoffTime correctly
- [ ] Decimals display (4 places for SOL)
- [ ] Values animate smoothly
- [ ] Trends calculate correctly
- [ ] Loading state shows skeleton
- [ ] Error state shows zeros

## Files Modified

- `app/src/components/terminal/MetricsBar.tsx` - Complete rewrite of data fetching and calculations

## Related Documentation

- `METRICSBAR_DEBUG_GUIDE.md` - Debugging steps
- `METRICSBAR_FIX_SUMMARY.md` - Quick summary of changes
