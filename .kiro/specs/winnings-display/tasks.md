# Implementation Plan

- [x] 1. Create core winnings calculation utility
  - Implement WinningsCalculator class with all calculation methods
  - Add fee distribution calculations (2% creator, 3% platform, 95% participants)
  - Include helper methods for determining user roles (creator, participant, non-participant)
  - Add market state detection logic for different display scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ]* 1.1 Write unit tests for WinningsCalculator
  - Test potential winnings calculations for all prediction outcomes
  - Test actual winnings calculations for resolved markets
  - Test creator reward calculations
  - Test edge cases (zero participants, single participant, large pools)
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 2. Create useWinnings hook for reactive data management
  - Implement hook that combines market data, participant data, and match data
  - Add caching and memoization for expensive calculations
  - Include loading states and error handling
  - Integrate with existing TanStack Query patterns
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [x] 3. Create WinningsDisplay component
  - Build reusable component for displaying winnings information
  - Support both compact and detailed display variants
  - Include proper currency formatting with exchange rate support
  - Add visual indicators for different winnings states (potential, actual, creator reward)
  - Implement responsive design for different screen sizes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ]* 3.1 Write component tests for WinningsDisplay
  - Test rendering for all user states and market conditions
  - Test currency formatting and conversion accuracy
  - Test responsive design breakpoints
  - Test accessibility features
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 4. Integrate winnings display into MarketDetail page
  - Update MarketStats component to include winnings information
  - Modify ActionPanel to show winnings alongside action buttons
  - Add winnings display to the main market information section
  - Ensure proper state management and data flow
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 5. Add winnings preview to Market component cards
  - Implement compact winnings display for market list view
  - Show potential winnings for unauthenticated and non-participant users
  - Display user-specific winnings for participants
  - Optimize performance for list rendering
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Update CreateSimilarMarketDialog to enforce SOL-only entry fees
  - Modify the dialog to disable currency selection
  - Force SOL currency for all entry fee inputs and displays
  - Update validation logic to work with SOL-only constraints
  - Ensure proper formatting and conversion handling
  - _Requirements: Additional requirement for Create Similar Market constraint_

- [ ] 7. Implement comprehensive error handling and edge cases
  - Add error boundaries for winnings calculation failures
  - Handle missing exchange rate data gracefully
  - Implement fallback displays for network errors
  - Add proper loading states and skeleton screens
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ]* 7.1 Write integration tests for complete user flows
  - Test unauthenticated user viewing markets
  - Test authenticated non-participant user flows
  - Test participant user flows through market lifecycle
  - Test creator user flows with and without participation
  - Test currency switching and exchange rate updates
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 8. Performance optimization and accessibility improvements
  - Implement React.memo for WinningsDisplay component
  - Add proper ARIA labels and screen reader support
  - Optimize re-renders with proper dependency management
  - Add keyboard navigation support
  - Implement proper focus management
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_