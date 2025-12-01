# UserMarkets Component Fix

## Issues Identified

### 1. **Critical: `useUserMarkets` Hook Only Returned Creator Markets**
The `useUserMarkets` hook was only fetching markets where the user was the creator, completely ignoring markets where the user was a participant. This meant users couldn't see markets they had joined.

**Root Cause:**
```typescript
// Old code only checked if user is creator
if (market.creator.equals(userPubkey)) {
  userMarkets.push(...)
}
```

### 2. **Overly Restrictive Time Filter**
The component filtered out markets that started more than 2 hours ago, which was too restrictive. Users couldn't see:
- Live matches in progress
- Recently finished matches awaiting resolution
- Markets where they needed to claim rewards

**Old Logic:**
```typescript
// Excluded markets older than 2 hours
if (marketData.kickoffTime < now - 7200) return false
```

### 3. **Missing Participant Account Queries**
The hook never queried Participant accounts on-chain, which store the relationship between users and markets they've joined.

## Solutions Implemented

### 1. **Fixed `useUserMarkets` to Query Both Creator and Participant Markets**

The hook now performs three steps:

**Step 1:** Fetch all Participant accounts where the user is a participant
```typescript
const participantAccounts = await connection.getProgramAccounts(marketProgramId, {
  filters: [
    { dataSize: 83 }, // Participant account size
    {
      memcmp: {
        offset: 40, // User field offset
        bytes: userPubkey.toBase58(),
      },
    },
  ],
})
```

**Step 2:** Fetch all Market accounts where the user is the creator
```typescript
const creatorMarketAccounts = await connection.getProgramAccounts(marketProgramId, {
  filters: [
    { dataSize: 193 }, // Market account size
    {
      memcmp: {
        offset: 40, // Creator field offset
        bytes: userPubkey.toBase58(),
      },
    },
  ],
})
```

**Step 3:** Combine unique market addresses and fetch full market data

### 2. **Relaxed Time Filter to 24 Hours**

Changed the filter to show markets within 24 hours of kickoff:
```typescript
// Include markets that are upcoming, live, or finished within the last 24 hours
const hoursSinceKickoff = (now - marketData.kickoffTime) / 3600
if (hoursSinceKickoff > 24) return false
```

This allows users to:
- See live matches
- Resolve finished matches (if they're the creator)
- Claim rewards from recently finished markets

### 3. **Improved Comments and Documentation**

Added clear comments explaining:
- Account structure offsets
- Filter logic reasoning
- What each step accomplishes

## Technical Details

### Participant Account Structure
```rust
pub struct Participant {
    pub market: Pubkey,        // 32 bytes at offset 8
    pub user: Pubkey,          // 32 bytes at offset 40
    pub prediction: MatchOutcome, // 1 byte at offset 72
    pub joined_at: i64,        // 8 bytes at offset 73
    pub has_withdrawn: bool,   // 1 byte at offset 81
    pub bump: u8,              // 1 byte at offset 82
}
// Total: 83 bytes (including 8-byte discriminator)
```

### Market Account Structure
```rust
pub struct Market {
    pub factory: Pubkey,       // 32 bytes at offset 8
    pub creator: Pubkey,       // 32 bytes at offset 40
    // ... other fields
}
// Total: 193 bytes (including 8-byte discriminator)
```

## Testing Recommendations

1. **Test with a user who has:**
   - Created markets (should appear)
   - Joined markets as participant (should appear)
   - Both created and joined the same market (should appear once)

2. **Test time filtering:**
   - Markets starting in the future (should appear)
   - Markets that started < 24 hours ago (should appear)
   - Markets that started > 24 hours ago (should NOT appear)

3. **Test status filtering:**
   - Open markets (should appear)
   - Live markets (should appear)
   - Resolved markets (should NOT appear)
   - Cancelled markets (should NOT appear)

## Performance Considerations

The new implementation makes multiple RPC calls:
1. Query participant accounts (filtered by user)
2. Query creator markets (filtered by user)
3. Fetch individual market data for each unique market

This is more efficient than the old approach of fetching ALL markets and filtering client-side, especially as the number of markets grows.

## Files Modified

1. `app/src/hooks/useMarketData.ts` - Fixed `useUserMarkets` hook
2. `app/src/components/market/UserMarkets.tsx` - Improved time filtering logic
