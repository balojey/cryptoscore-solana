# Implementation Plan

- [x] 1. Create exchange rate service and currency types
  - Create TypeScript types for Currency, ExchangeRates, and related interfaces
  - Implement ExchangeRateService class with API integration (CoinGecko)
  - Add localStorage caching for exchange rates
  - Implement rate fetching with error handling and retry logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3_

- [x] 2. Implement CurrencyContext and provider
  - Create CurrencyContext with state management for selected currency and exchange rates
  - Implement CurrencyProvider component with localStorage persistence
  - Add automatic rate fetching on mount and 60-second intervals
  - Implement convertFromLamports and formatCurrency utility methods
  - Add error state management for rate fetching failures
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.5, 5.1, 5.2, 6.1, 6.4_

- [x] 3. Create useCurrency hook
  - Implement useCurrency hook to access CurrencyContext
  - Add error handling for usage outside provider
  - Export hook from contexts directory
  - _Requirements: 5.1, 5.2_

- [x] 4. Extend formatter utilities with currency conversion
  - Add formatCurrency function that accepts lamports and converts to selected currency
  - Implement getCurrencySymbol helper function
  - Implement getCurrencyDecimals helper function
  - Add formatWithSOLEquivalent function for dual display
  - Handle edge cases (zero values, very small amounts, very large amounts)
  - Add thousand separator formatting for NGN
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 5.3, 5.4, 5.5_

- [x] 5. Build CurrencySelector component
  - Create CurrencySelector component with dropdown menu UI
  - Add currency options (SOL, USD, NGN) with symbols and icons
  - Display current exchange rates in dropdown
  - Show loading state while rates are fetching
  - Add visual indicator for stale rates
  - Implement keyboard navigation and accessibility features
  - _Requirements: 1.1, 1.4, 6.5_

- [x] 6. Integrate CurrencyProvider into app
  - Wrap App component with CurrencyProvider in main.tsx
  - Add CurrencySelector to header/navigation area
  - Ensure provider is at same level as ThemeProvider
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 7. Update PortfolioSummary component
  - Replace formatSOL calls with formatCurrency from useCurrency hook
  - Add SOL equivalent display for converted values
  - Update all stat cards to show values in selected currency
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.4, 7.3_

- [x] 8. Update market card components
  - Update EnhancedMarketCard to display entry fees in selected currency
  - Update pool size displays with currency conversion
  - Add SOL equivalent tooltips on hover
  - Update reward displays in market cards
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.3, 4.4, 7.1, 7.2_

- [ ] 9. Update Balance and wallet components
  - Update Balance component to show wallet balance in selected currency
  - Add SOL equivalent display below converted balance
  - Update Connect component if it displays balance
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 7.4_

- [ ] 10. Update TradingTerminal MetricsBar and LandingPage LiveMetrics
  - Update MetricsBar to display all monetary metrics in selected currency
  - Convert total volume, average pool size, and other monetary values
  - Update LiveMetrics to display all monetary metrics in selected currency
  - Convert total value locked
  - Add SOL equivalents where appropriate
  - _Requirements: 3.1, 3.2, 3.3, 7.5_

- [ ] 11. Update chart components
  - Update PoolTrendChart to use selected currency for Y-axis
  - Update PredictionDistributionChart if it shows monetary values
  - Update PerformanceChart to display values in selected currency
  - Ensure chart tooltips show converted values
  - _Requirements: 3.1, 3.2, 3.3, 7.5_

- [ ] 12. Add stale rate warning banner
  - Create warning banner component for stale exchange rates
  - Display banner when rates are older than 5 minutes
  - Show last update timestamp
  - Add dismiss functionality
  - _Requirements: 6.4, 6.5_

- [ ] 13. Add offline mode handling
  - Display info banner when using cached rates offline
  - Disable USD/NGN options when no rates available
  - Show appropriate error messages for rate fetch failures
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 14. Write unit tests for exchange rate service
  - Test fetchRates with mocked API responses
  - Test caching mechanism (getCachedRates, cacheRates)
  - Test stale rate detection (isStale)
  - Test error handling for network and API errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 15. Write unit tests for currency formatters
  - Test formatCurrency for all three currencies
  - Test conversion accuracy with known exchange rates
  - Test edge cases (zero, very small, very large values)
  - Test getCurrencySymbol and getCurrencyDecimals
  - Test formatWithSOLEquivalent output
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 5.4_

- [ ] 16. Write integration tests for currency feature
  - Test currency selection flow end-to-end
  - Test rate updates propagating to all components
  - Test localStorage persistence across sessions
  - Test offline mode with cached rates
  - _Requirements: 1.2, 1.3, 1.5, 2.5, 6.1, 6.2, 6.3_
