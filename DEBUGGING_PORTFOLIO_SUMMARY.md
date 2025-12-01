# Debugging PortfolioSummary Display Issues

## Added Debug Logging

I've added comprehensive console logging to trace the data flow. Open your browser console and look for these log messages:

### 1. useDashboardData Hook
```
[useDashboardData] User address: <address>
[useDashboardData] User markets data: [...]
[useDashboardData] Transformed markets: [...]
[useDashboardData] Created markets: X [...]
[useDashboardData] Joined markets: Y [...]
```

**What to check:**
- Is `User markets data` populated?
- Are markets being correctly categorized into created vs joined?
- Compare the creator addresses with the user address (case-sensitive!)

### 2. PortfolioSummary Component
```
[PortfolioSummary] Wallet: <address>
[PortfolioSummary] Joined Markets Count: X
[PortfolioSummary] Joined Markets: [...]
[PortfolioSummary] Computing stats...
[PortfolioSummary] Portfolio Data: {...}
[PortfolioSummary] Active positions: X
[PortfolioSummary] Resolved positions: Y
[PortfolioSummary] User market data count: Z
```

**What to check:**
- Is `Joined Markets Count` > 0?
- Is `Portfolio Data` being fetched successfully?
- Are `Active positions` and `Resolved positions` correct?

### 3. Reward Calculation
```
[PortfolioSummary] Market <address>: prediction=X, winning=Y, outcome=Z
[PortfolioSummary] Winner! totalPool=X, winnerCount=Y
[PortfolioSummary] Calculated reward: X lamports
```

**What to check:**
- Are predictions being fetched correctly?
- Is totalPool > 0?
- Is winnerCount > 0?
- Are rewards being calculated?

### 4. Final Stats
```
[PortfolioSummary] Final Stats: {
  totalValue: X,
  activePositions: Y,
  totalInvested: Z,
  totalClaimableRewards: A,
  ...
}
```

**What to check:**
- Are all values 0 or do they have actual data?
- Is `totalInvested` correct (sum of entry fees)?
- Is `totalClaimableRewards` being calculated?

## Common Issues to Check

### Issue 1: No Joined Markets
**Symptom:** `Joined Markets Count: 0`

**Possible causes:**
1. User hasn't actually joined any markets (only created them)
2. `useUserMarkets` isn't finding participant accounts
3. Address comparison is case-sensitive and failing

**Fix:** Check if the user has actually joined markets by looking at participant accounts on-chain.

### Issue 2: Markets Not Categorized Correctly
**Symptom:** All markets show as "created" or all as "joined"

**Possible causes:**
1. Address comparison issue (case sensitivity)
2. Creator field not matching user address format

**Fix:** I've added `.toLowerCase()` to address comparison. Check console logs to verify.

### Issue 3: Zero Rewards Despite Winning
**Symptom:** `totalClaimableRewards: 0` even with resolved markets

**Possible causes:**
1. `totalPool` is undefined or 0
2. `winnerCount` is 0
3. Prediction doesn't match outcome
4. `hasWithdrawn` is true (already claimed)

**Fix:** Check the reward calculation logs to see where it's failing.

### Issue 4: Participant Account Not Found
**Symptom:** Error logs about participant account not found

**Possible causes:**
1. User hasn't actually joined the market
2. PDA derivation is incorrect
3. Market address is wrong

**Fix:** Verify the participant PDA derivation matches the program's logic.

## Manual Testing Steps

1. **Open browser console** (F12 or Cmd+Option+I)
2. **Navigate to Dashboard** page
3. **Look for the debug logs** listed above
4. **Check each section** to identify where data is missing

## Expected Data Flow

```
useUserMarkets (useMarketData.ts)
  ↓ Fetches markets where user is creator OR participant
  ↓ Returns MarketData[] with totalPool, outcome, etc.
  ↓
useDashboardData (useDashboardData.ts)
  ↓ Transforms to MarketDashboardInfo[]
  ↓ Separates into created vs joined based on creator field
  ↓
PortfolioSummary (PortfolioSummary.tsx)
  ↓ Receives joinedMarkets prop
  ↓ Fetches participant data for each market
  ↓ Calculates rewards for resolved markets
  ↓ Computes final stats
  ↓ Displays in UI
```

## Quick Fixes to Try

### If joinedMarkets is empty:
1. Check if user has actually joined markets (not just created them)
2. Verify `useUserMarkets` is finding participant accounts
3. Check address comparison logic

### If stats are all zero:
1. Verify `portfolioData` is being fetched
2. Check if `totalPool` field exists in market data
3. Verify participant accounts are being decoded correctly

### If rewards are zero:
1. Check if markets are actually resolved
2. Verify `outcome` field is set
3. Check if user's prediction matches the outcome
4. Verify `totalPool` > 0 and `winnerCount` > 0

## Next Steps

After checking the console logs, report back with:
1. The actual console output
2. Which section is failing
3. Any error messages

This will help identify the exact issue and fix it.
