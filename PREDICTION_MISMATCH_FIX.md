# Prediction Mismatch Bug Fix

## Problem Summary

Users were experiencing a mismatch between their selected prediction and what was displayed after joining a market. For example:
- User selects **HOME** in the UI
- After transaction completes, the UI shows their prediction as **DRAW**

## Root Cause

The issue was an **enum value mismatch** between the Rust program and TypeScript frontend.

### Rust Program (Correct)
```rust
// programs/market/src/lib.rs
pub enum MatchOutcome {
    Home,  // = 0 (Rust enums are 0-indexed)
    Draw,  // = 1
    Away,  // = 2
}
```

### TypeScript Frontend (Incorrect - BEFORE FIX)
```typescript
// app/src/types/solana-program-types.ts
export enum PredictionChoice {
  Home = 1,  // ❌ Wrong! Should be 0
  Draw = 2,  // ❌ Wrong! Should be 1
  Away = 3,  // ❌ Wrong! Should be 2
}

export enum MatchOutcome {
  None = 0,
  Home = 1,  // ❌ Wrong! Should be 0
  Draw = 2,  // ❌ Wrong! Should be 1
  Away = 3,  // ❌ Wrong! Should be 2
}
```

## What Was Happening

1. User selects "HOME" (selectedTeam = 1) in the UI
2. `useMarketActions.ts` converts it to `PredictionChoice.Home` which equals **1**
3. The instruction is sent to the Solana program with value **1**
4. The Rust program receives **1** and interprets it as **Draw** (the second enum variant)
5. The prediction is stored on-chain as **1** (Draw)
6. When fetching data, `useParticipantData.ts` reads **1** and converts it to "Draw"

## The Fix

Updated TypeScript enums to match Rust's 0-based indexing:

```typescript
// app/src/types/solana-program-types.ts
export enum PredictionChoice {
  Home = 0,  // ✅ Correct
  Draw = 1,  // ✅ Correct
  Away = 2,  // ✅ Correct
}

export enum MatchOutcome {
  Home = 0,  // ✅ Correct
  Draw = 1,  // ✅ Correct
  Away = 2,  // ✅ Correct
}
```

Also updated the parsing functions:

```typescript
// app/src/hooks/useMarketData.ts
function parseOutcome(outcome: number): 'Home' | 'Draw' | 'Away' | null {
  switch (outcome) {
    case 0: return 'Home'   // ✅ Was: case 1
    case 1: return 'Draw'   // ✅ Was: case 2
    case 2: return 'Away'   // ✅ Was: case 3
    case 255: return null   // Option::None
    default: return null
  }
}

// app/src/hooks/useParticipantData.ts
function parsePrediction(prediction: number): 'Home' | 'Draw' | 'Away' {
  switch (prediction) {
    case 0: return 'Home'  // ✅ Was: case 1
    case 1: return 'Draw'  // ✅ Was: case 2
    case 2: return 'Away'  // ✅ Was: case 3
    default: return 'Home'
  }
}
```

## Files Modified

1. `app/src/types/solana-program-types.ts` - Fixed enum values
2. `app/src/hooks/useMarketData.ts` - Fixed outcome parsing
3. `app/src/hooks/useParticipantData.ts` - Fixed prediction parsing

## Testing

After this fix:
- Selecting **HOME** will correctly store and display as **HOME**
- Selecting **DRAW** will correctly store and display as **DRAW**
- Selecting **AWAY** will correctly store and display as **AWAY**

## Important Note

**Existing predictions on-chain are NOT affected** by this fix. The on-chain data was always correct - it was just the TypeScript interpretation that was wrong. This means:
- Old predictions that show as "DRAW" were actually "HOME" predictions
- Old predictions that show as "AWAY" were actually "DRAW" predictions
- There were no "AWAY" predictions stored (since the UI was sending 3, which is invalid)

If you have existing test data, you may want to clear it and start fresh to avoid confusion.
