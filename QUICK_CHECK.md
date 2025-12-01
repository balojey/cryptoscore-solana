# Quick Check - PortfolioSummary Display Issues

## Open Browser Console (F12) and Check:

### 1. Are markets being fetched?
Look for: `[useDashboardData] User markets data:`
- **If empty array []**: User has no markets (created or joined)
- **If has data**: Markets are being fetched ✓

### 2. Are markets categorized correctly?
Look for: 
- `[useDashboardData] Created markets: X`
- `[useDashboardData] Joined markets: Y`

**If both are 0**: No markets found
**If only created > 0**: User only created markets, didn't join any
**If joined > 0**: User has participated in markets ✓

### 3. Is PortfolioSummary receiving data?
Look for: `[PortfolioSummary] Markets to Analyze: X`
- **If 0**: No markets passed to component
- **If > 0**: Markets are being passed ✓

### 4. Are participant accounts being found?
Look for: `[PortfolioSummary] User market data count: X`
- **If 0**: User has no participant accounts (didn't actually join markets)
- **If > 0**: Participant data is being fetched ✓

### 5. Are stats being calculated?
Look for: `[PortfolioSummary] Final Stats:`
Check these values:
- `totalInvested`: Should be > 0 if user joined markets
- `activePositions`: Should match unresolved market count
- `totalClaimableRewards`: Should be > 0 if user has winning predictions
- `totalValue`: Should be sum of active positions + rewards

## Common Issues & Solutions

### Issue: All values show 0
**Cause**: User hasn't actually joined any markets (only created them)
**Solution**: Join a market first, then check Dashboard

### Issue: "Markets to Analyze: 0"
**Cause**: `useUserMarkets` isn't finding any markets
**Solution**: 
1. Check if wallet is connected
2. Verify markets exist on-chain
3. Check RPC connection

### Issue: "User market data count: 0" but markets exist
**Cause**: No participant accounts found
**Solution**:
1. User needs to actually join markets (call `join_market` instruction)
2. Verify participant PDA derivation is correct
3. Check if participant accounts exist on-chain

### Issue: Portfolio Value is 0 but user joined markets
**Cause**: Either `totalInvested` or `totalClaimableRewards` is 0
**Solution**:
1. Check if `entryFee` field is set in market data
2. For rewards, check if markets are resolved with outcome
3. Verify `totalPool` > 0 for resolved markets

### Issue: Win Rate is 0% but user has resolved markets
**Cause**: Predictions don't match outcomes
**Solution**:
1. Check prediction values (0=Home, 1=Draw, 2=Away)
2. Verify outcome is set correctly
3. Look for reward calculation logs

## Quick Test

Run this in browser console:
```javascript
// Check if wallet is connected
console.log('Wallet:', window.solana?.publicKey?.toString())

// Check localStorage for cached data
console.log('Cached queries:', Object.keys(localStorage).filter(k => k.includes('query')))
```

## If Still Not Working

1. **Clear cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check network**: Verify you're on correct Solana network (devnet/mainnet)
3. **Verify RPC**: Check if RPC endpoint is responding
4. **Test with different wallet**: Try another wallet with known participations
5. **Check program deployment**: Verify market program is deployed and accessible

## Report Back With

When reporting issues, include:
1. Full console output (copy/paste)
2. Wallet address (for debugging)
3. Network (devnet/mainnet)
4. Number of markets user created vs joined
5. Any error messages
