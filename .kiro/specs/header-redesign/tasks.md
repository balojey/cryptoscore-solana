# Implementation Plan

- [x] 1. Update Header component to remove redundant navigation elements
  - Remove SearchBar import and all related code
  - Remove Home navigation link from desktop navigation
  - Remove Leaderboard navigation link from desktop navigation
  - Remove `showSearch` state variable
  - Remove `isMarketsPage` conditional logic
  - Remove mobile search toggle functionality
  - Remove SearchBar rendering in header (both desktop and mobile)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 4.1, 4.3_

- [x] 2. Simplify Header navigation to core links
  - Keep only Markets, Terminal, and Dashboard navigation links in desktop view
  - Update navigation button layout and spacing
  - Ensure active state styling works for all three links
  - Verify route matching logic for Markets (including sub-routes)
  - Verify route matching logic for Terminal
  - Verify route matching logic for Dashboard
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4_

- [x] 3. Update mobile menu navigation
  - Remove Home link from mobile menu
  - Remove Leaderboard link from mobile menu
  - Remove search toggle option from mobile menu
  - Keep only Markets, Terminal, and Dashboard in navigation section
  - Maintain Currency selector section in mobile menu
  - Maintain Theme selector section in mobile menu
  - Maintain Connect wallet button in mobile menu
  - Update active state indicators (check icons) for mobile menu items
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.5_

- [x] 4. Remove network badge from Connect component
  - Open Connect.tsx component
  - Remove network indicator div and related styling
  - Remove networkColors object if no longer used
  - Clean up any unused imports
  - _Requirements: 1.5_

- [ ] 5. Integrate SearchBar into Markets page
  - Open Markets.tsx component
  - Import SearchBar component
  - Add SearchBar at the top of the Markets component layout
  - Add state management for search query (useState)
  - Implement search filtering logic for matches array
  - Filter matches by team names or competition name based on search query
  - Update the rendered matches to use filtered results
  - Style SearchBar container with appropriate max-width and spacing
  - _Requirements: 3.4, 3.5_

- [ ] 6. Add Leaderboard access to Terminal page
  - Open TradingTerminal.tsx (or equivalent terminal page component)
  - Add a prominent link or button to navigate to Leaderboard
  - Implement as either: tab navigation, quick action button, or sidebar link
  - Add appropriate icon (trophy icon: icon-[mdi--trophy])
  - Style consistently with terminal page design
  - Ensure navigation to /leaderboard route works correctly
  - _Requirements: 4.2_

- [ ] 7. Verify responsive behavior and styling
  - Test header on mobile viewport (< 768px)
  - Test header on tablet viewport (768px - 1024px)
  - Test header on desktop viewport (>= 1024px)
  - Verify hamburger menu appears only on mobile
  - Verify desktop navigation appears only on desktop
  - Verify header height remains consistent (80px)
  - Verify sticky positioning works correctly
  - Verify backdrop blur effect renders properly
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8. Test navigation and active states
  - Navigate to Markets page and verify active styling
  - Navigate to Markets detail page and verify Markets link stays active
  - Navigate to Terminal page and verify active styling
  - Navigate to Dashboard page and verify active styling
  - Click logo and verify navigation to home page
  - Verify no active state on logo
  - Test all navigation from mobile menu
  - Verify check icons appear next to active items in mobile menu
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Test utility controls functionality
  - Test CurrencySelector in desktop header
  - Test CurrencySelector in mobile menu
  - Test ThemeSwitcher in desktop header
  - Test ThemeSwitcher in mobile menu
  - Test Connect wallet button in desktop header
  - Test Connect wallet button in mobile menu
  - Verify all dropdowns open and close correctly
  - Verify theme changes apply immediately
  - Verify currency changes apply immediately
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10. Test SearchBar functionality on Markets page
  - Navigate to Markets page
  - Verify SearchBar is visible at the top
  - Type search query and verify filtering works
  - Test search by home team name
  - Test search by away team name
  - Test search by competition name
  - Verify search is case-insensitive
  - Verify empty search shows all matches
  - _Requirements: 3.4, 3.5_

- [ ] 11. Test Leaderboard access from Terminal page
  - Navigate to Terminal page
  - Verify Leaderboard link/button is visible
  - Click Leaderboard access and verify navigation works
  - Verify styling is consistent with terminal design
  - _Requirements: 4.2_

- [ ]* 12. Verify accessibility compliance
  - Test keyboard navigation through all header elements
  - Verify tab order is logical (logo → nav links → utilities → mobile menu)
  - Test mobile menu keyboard navigation
  - Verify all buttons have appropriate aria-labels
  - Verify active navigation items have aria-current="page"
  - Test with screen reader (announce navigation items correctly)
  - Verify focus indicators are visible
  - Verify color contrast meets WCAG AA standards
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 13. Verify visual polish and interactions
  - Test logo hover glow effect
  - Test navigation button hover states
  - Test smooth transitions on state changes
  - Verify all icons render correctly
  - Verify spacing and alignment at all breakpoints
  - Verify no layout shifts during navigation
  - Test in different themes (all theme presets)
  - Verify backdrop blur effect quality
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14. Clean up and optimize code
  - Remove unused imports from Header.tsx
  - Remove unused state variables
  - Remove unused conditional logic
  - Verify TypeScript types are correct
  - Add code comments for complex logic if needed
  - Verify no console errors or warnings
  - Check for any unused CSS or styling
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
