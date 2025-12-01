# Design Document

## Overview

The currency display feature enables users to view all monetary values in their preferred currency (USD, Naira, or SOL) while maintaining SOL as the underlying blockchain currency. This is a presentation-layer feature that performs real-time conversions without affecting any blockchain operations or backend logic.

The design follows the existing patterns in the application, leveraging React Context (similar to ThemeContext), custom hooks (similar to useMarketData), and utility functions (similar to formatters.ts) to provide a seamless, consistent experience across all components.

## Architecture

### High-Level Flow

```
User selects currency → CurrencyContext updates → 
Exchange rates fetched → All monetary displays re-render with converted values
```

### Component Hierarchy

```
App
├── CurrencyProvider (wraps entire app)
│   ├── CurrencyContext (manages selected currency + exchange rates)
│   └── ExchangeRateService (fetches and caches rates)
└── Components
    ├── CurrencySelector (UI for selecting currency)
    └── All monetary displays (use useCurrency hook)
```

## Components and Interfaces

### 1. Currency Context (`app/src/contexts/CurrencyContext.tsx`)

**Purpose**: Manage global currency state and provide currency conversion utilities

**Pattern**: Similar to existing `ThemeContext.tsx` - uses React Context with localStorage persistence

```typescript
export type Currency = 'SOL' | 'USD' | 'NGN'

export interface ExchangeRates {
  SOL_USD: number
  SOL_NGN: number
  lastUpdated: number
}

export interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  exchangeRates: ExchangeRates | null
  isLoadingRates: boolean
  ratesError: string | null
  convertFromLamports: (lamports: number, targetCurrency?: Currency) => number
  formatCurrency: (lamports: number, options?: FormatOptions) => string
}

interface FormatOptions {
  showSymbol?: boolean
  showSOLEquivalent?: boolean
  decimals?: number
  targetCurrency?: Currency
}
```

**Key Features**:
- Persists selected currency to localStorage (key: `cryptoscore-currency`)
- Automatically fetches exchange rates on mount and every 60 seconds
- Provides conversion and formatting utilities
- Handles offline mode with cached rates

### 2. Exchange Rate Service (`app/src/lib/exchangeRateService.ts`)

**Purpose**: Fetch and cache SOL exchange rates from external API

**API Provider**: CoinGecko Free API (no auth required)
- Endpoint: `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,ngn`
- Rate limit: 10-30 calls/minute (sufficient for 60-second intervals)
- Fallback: CryptoCompare API if CoinGecko fails

```typescript
export class ExchangeRateService {
  private static CACHE_KEY = 'cryptoscore-exchange-rates'
  private static UPDATE_INTERVAL = 60000 // 60 seconds
  
  static async fetchRates(): Promise<ExchangeRates>
  static getCachedRates(): ExchangeRates | null
  static cacheRates(rates: ExchangeRates): void
  static isStale(rates: ExchangeRates): boolean
}
```

**Caching Strategy**:
- In-memory cache for current session
- localStorage cache for offline/startup
- Stale threshold: 5 minutes (show warning if rates older than this)

**Error Handling**:
- Network errors: Use last cached rates
- API errors: Retry with exponential backoff (max 3 attempts)
- No cached rates: Default to SOL-only display

### 3. Currency Selector Component (`app/src/components/CurrencySelector.tsx`)

**Purpose**: UI component for selecting display currency

**Location**: Header/navigation area (next to ThemeSwitcher)

**Design**: Dropdown menu similar to ThemeSwitcher
- Icon: Currency symbol (◎, $, ₦)
- Options: SOL, USD, NGN with flags/symbols
- Shows current exchange rate on hover
- Visual indicator if rates are stale

```typescript
export default function CurrencySelector() {
  const { currency, setCurrency, exchangeRates, isLoadingRates } = useCurrency()
  
  return (
    <DropdownMenu>
      {/* Currency options with symbols and current rates */}
    </DropdownMenu>
  )
}
```

### 4. Currency Hook (`app/src/hooks/useCurrency.ts`)

**Purpose**: Provide easy access to currency context in components

**Pattern**: Similar to `useTheme()` hook

```typescript
export function useCurrency() {
  const context = use(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}
```

### 5. Enhanced Formatters (`app/src/utils/formatters.ts`)

**Purpose**: Extend existing formatters with currency conversion

**New Functions**:

```typescript
// Enhanced SOL formatter with currency conversion
export function formatCurrency(
  lamports: number,
  currency: Currency,
  exchangeRates: ExchangeRates | null,
  options?: FormatOptions
): string

// Get currency symbol
export function getCurrencySymbol(currency: Currency): string

// Get currency decimals
export function getCurrencyDecimals(currency: Currency): number

// Format with SOL equivalent
export function formatWithSOLEquivalent(
  lamports: number,
  currency: Currency,
  exchangeRates: ExchangeRates | null
): { primary: string; equivalent: string }
```

**Currency Formatting Rules**:
- **SOL**: `◎ 1.2345` (4 decimals, symbol before)
- **USD**: `$123.45` (2 decimals, symbol before)
- **NGN**: `₦12,345.67` (2 decimals, symbol before, thousand separators)

## Data Models

### Exchange Rates Storage

**localStorage key**: `cryptoscore-exchange-rates`

```typescript
interface StoredExchangeRates {
  SOL_USD: number
  SOL_NGN: number
  lastUpdated: number // Unix timestamp
}
```

### Currency Preference Storage

**localStorage key**: `cryptoscore-currency`

```typescript
type StoredCurrency = 'SOL' | 'USD' | 'NGN'
```

## Error Handling

### Exchange Rate Fetch Failures

1. **Network Error**:
   - Use cached rates from localStorage
   - Show warning banner: "Using cached exchange rates (last updated: X minutes ago)"
   - Continue retrying in background

2. **API Error (429 Rate Limit)**:
   - Exponential backoff: 1s, 2s, 4s
   - Use cached rates
   - Increase update interval to 120 seconds temporarily

3. **No Cached Rates Available**:
   - Default to SOL display only
   - Show info message: "Currency conversion unavailable. Displaying values in SOL."
   - Disable USD/NGN options in selector

### Conversion Edge Cases

1. **Zero/Null Values**: Display as `0.00` in selected currency
2. **Very Small Amounts** (< 0.0001 SOL): Show as `< 0.01` in fiat currencies
3. **Very Large Amounts** (> 1M SOL): Use formatNumber() with K/M/B suffixes

## Testing Strategy

### Unit Tests

**File**: `app/src/lib/__tests__/exchangeRateService.test.ts`
- Test rate fetching from API
- Test caching mechanism
- Test stale rate detection
- Test error handling

**File**: `app/src/utils/__tests__/formatters.test.ts`
- Test currency formatting for all currencies
- Test conversion accuracy
- Test edge cases (zero, very small, very large)
- Test SOL equivalent display

### Integration Tests

**File**: `app/src/__tests__/currency-integration.test.ts`
- Test currency selection flow
- Test rate updates propagating to UI
- Test offline mode with cached rates
- Test localStorage persistence

### Manual Testing Checklist

1. **Currency Selection**:
   - [ ] Select USD - all values update correctly
   - [ ] Select NGN - all values update correctly
   - [ ] Select SOL - shows original values
   - [ ] Selection persists after page refresh

2. **Exchange Rates**:
   - [ ] Rates fetch on app load
   - [ ] Rates update every 60 seconds
   - [ ] Cached rates used when offline
   - [ ] Stale rate warning appears after 5 minutes

3. **Display Accuracy**:
   - [ ] Entry fees display correctly
   - [ ] Pool sizes display correctly
   - [ ] Rewards display correctly
   - [ ] Balance displays correctly
   - [ ] Charts show converted values

4. **SOL Equivalent**:
   - [ ] Shows below converted values
   - [ ] Tooltip shows exact SOL amount
   - [ ] Formatted with 4 decimals

5. **Error Scenarios**:
   - [ ] Network offline - uses cached rates
   - [ ] API error - shows appropriate message
   - [ ] No cached rates - defaults to SOL

## Implementation Phases

### Phase 1: Core Infrastructure
- Create CurrencyContext with basic state management
- Implement ExchangeRateService with API integration
- Add localStorage persistence
- Create useCurrency hook

### Phase 2: UI Components
- Build CurrencySelector component
- Integrate into header/navigation
- Add rate update indicator
- Add stale rate warning banner

### Phase 3: Formatter Integration
- Extend formatters.ts with currency conversion
- Create formatCurrency utility
- Add SOL equivalent formatting
- Handle edge cases

### Phase 4: Component Updates
- Update PortfolioSummary to use currency formatting
- Update EnhancedMarketCard to show converted values
- Update Balance component
- Update all chart components
- Update MetricsBar in TradingTerminal

### Phase 5: Testing & Polish
- Write unit tests for all utilities
- Write integration tests
- Manual testing across all components
- Performance optimization (memoization)
- Documentation updates

## Performance Considerations

### Memoization Strategy

```typescript
// In CurrencyContext
const convertFromLamports = useMemo(
  () => (lamports: number, targetCurrency?: Currency) => {
    // Conversion logic
  },
  [currency, exchangeRates]
)

const formatCurrency = useMemo(
  () => (lamports: number, options?: FormatOptions) => {
    // Formatting logic
  },
  [currency, exchangeRates]
)
```

### Re-render Optimization

- Use React.memo() for components that display many monetary values
- Batch rate updates to minimize re-renders
- Use TanStack Query's staleTime to prevent excessive refetches

### API Rate Limiting

- 60-second update interval (well within free tier limits)
- Exponential backoff on errors
- Cache-first strategy to minimize API calls

## Accessibility

- Currency selector keyboard navigable (Tab, Enter, Arrow keys)
- Screen reader announces currency changes
- Tooltips for SOL equivalents are accessible
- High contrast for currency symbols
- ARIA labels for all currency-related elements

## Migration Path

Since this is a new feature with no existing currency logic:

1. **No Breaking Changes**: All existing code continues to work
2. **Gradual Rollout**: Components can adopt currency formatting incrementally
3. **Backward Compatible**: If CurrencyContext not available, components fall back to SOL display
4. **Default Behavior**: SOL is default currency, matching current behavior

## Future Enhancements

1. **Additional Currencies**: EUR, GBP, JPY, etc.
2. **Custom Refresh Interval**: User preference for rate update frequency
3. **Historical Rates**: Show price changes over time
4. **Rate Alerts**: Notify when SOL price changes significantly
5. **Multi-Currency Charts**: Toggle between currencies in chart views
