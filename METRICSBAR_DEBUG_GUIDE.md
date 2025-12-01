# MetricsBar TVL & Volume Debug Guide

## What to Check in Browser Console

After the fix, open your browser console and look for these debug logs:

### 1. TVL Calculation Log
```
MetricsBar - TVL Calculation: {
  totalMarkets: X,
  totalPoolLamports: Y,
  totalValueLocked: Z,
  sampleMarket: { ... }
}
```

**What to verify:**
- `totalPoolLamports` should be > 0 if markets have participants
- `totalValueLocked` = `totalPoolLamports / 1_000_000_000`
- Check `sampleMarket.totalPool` matches `entryFee * participantCount`

### 2. 24h Volume Log
```
MetricsBar - 24h Volume Calculation: {
  volume24hLamports: X,
  volume24hSOL: Y,
  markets24h: Z,
  sampleKickoffTimes: [...]
}
```

**What to verify:**
- Check if `sampleKickoffTimes` shows recent dates
- `kickoffTime` is Unix timestamp in seconds
- `isRecent` should be true for markets created in last 24h

## Common Issues

### Issue 1: TVL shows 0 but markets exist
**Cause:** Markets have 0 participants
**Solution:** Markets need participants to have TVL. Check:
```javascript
market.participantCount > 0
market.totalPool > 0
```

### Issue 2: 24h Volume shows 0
**Cause:** No markets created in last 24 hours
**Check:** Look at `sampleKickoffTimes` in console
- If all dates are older than 24h, this is correct
- `kickoffTime` is when market was created, not when match starts

### Issue 3: Values are very small (0.0001 SOL)
**Cause:** Test markets with small entry fees
**Solution:** This is correct! The component now shows 4 decimal places for SOL

## Data Flow

```
Solana Market Account
  ↓
AccountDecoder.decodeMarket() → bigint values
  ↓
useMarketData.ts → Number() conversion
  ↓
MarketData interface → number types
  ↓
MetricsBar → calculations → display
```

## Verification Steps

1. **Check if markets have participants:**
   ```javascript
   // In console
   marketsData.filter(m => m.participantCount > 0)
   ```

2. **Check total pool values:**
   ```javascript
   marketsData.map(m => ({
     address: m.marketAddress,
     totalPool: m.totalPool,
     entryFee: m.entryFee,
     participants: m.participantCount
   }))
   ```

3. **Verify lamports to SOL conversion:**
   ```javascript
   // 1 SOL = 1,000,000,000 lamports
   // Example: 100,000,000 lamports = 0.1 SOL
   ```

## Expected Behavior

- **TVL**: Sum of all `market.totalPool` values in SOL
- **24h Volume**: Sum of `totalPool` for markets where `kickoffTime >= (now - 86400)`
- **Decimals**: Shows 4 decimal places for SOL amounts
- **Zero values**: Correct if no participants or no recent markets
