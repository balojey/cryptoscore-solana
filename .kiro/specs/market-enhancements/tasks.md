# Implementation Plan

- [x] 1. Enhanced Market Resolution with Automated Fee Distribution
  - Create enhanced resolution function with atomic fee distribution to creator, platform, and participant pool
  - Add platform address configuration and fee calculation utilities
  - Implement multi-transfer transaction logic within single atomic operation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Add fee distribution configuration and utilities
  - Create fee distribution constants and configuration
  - Add platform address constant "2xUfnnyizenM7a9jWHtgxdCWCTE11afRUhX5YeFSrVTn"
  - Implement fee calculation utilities for creator, platform, and participant shares
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Enhance resolveMarket function with fee distribution
  - Modify useMarketActions.ts resolveMarket function to include fee distribution logic
  - Add multiple transfer instructions to single transaction
  - Implement atomic transaction with creator fee, platform fee, and remaining pool distribution
  - Add proper error handling for fee distribution failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.3 Add unit tests for fee distribution logic
  - Write tests for fee calculation utilities
  - Test atomic transaction creation with multiple transfers
  - Test error scenarios for fee distribution failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Match Score Integration and Intelligent Resolution Controls
  - Enhance match data fetching to include scores and finished status
  - Implement resolution eligibility logic based on user predictions and match outcomes
  - Add conditional resolution button display based on user's potential rewards
  - Display match scores and prediction outcome status in UI
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Enhance match data fetching with scores
  - Modify useMatchData hook to fetch match scores from football-data.org API
  - Add score parsing and winner determination logic
  - Handle cases where scores are not yet available for finished matches
  - Add proper error handling for API failures
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Implement resolution eligibility logic
  - Create utility function to determine if user can resolve market
  - Check if user has winning prediction based on match result
  - Implement logic to hide resolve button for users with no potential rewards
  - Add resolution eligibility state management
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 2.3 Update MarketDetail page with score display and intelligent controls
  - Add match score display when match is finished
  - Show user's prediction outcome status (correct/incorrect)
  - Implement conditional resolve button based on eligibility
  - Add visual indicators for match results and user prediction accuracy
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.4 Add integration tests for match score and resolution logic
  - Test match data fetching with various match states
  - Test resolution eligibility determination
  - Test UI behavior with different user prediction scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. User Prediction Display on Market Cards
  - Enhance EnhancedMarketCard to show user's prediction when they have joined
  - Add visual indicators for different prediction types (Home/Draw/Away)
  - Implement prediction outcome status when match results are available
  - Ensure consistent styling across all market card displays
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.1 Create user prediction badge component
  - Design and implement UserPredictionBadge component
  - Add distinct visual styling for Home, Draw, and Away predictions
  - Include prediction outcome status (correct/incorrect) when match is finished
  - Ensure accessibility and responsive design
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 3.2 Enhance EnhancedMarketCard with prediction display
  - Integrate UserPredictionBadge into EnhancedMarketCard component
  - Fetch user's prediction data using existing useParticipantData hook
  - Show prediction badge only when user has joined the market
  - Position badge prominently on the market card
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 3.3 Add prediction outcome status integration
  - Connect match result data with user prediction display
  - Show correct/incorrect status when match is finished
  - Add visual feedback for winning vs losing predictions
  - Handle cases where match result is not yet available
  - _Requirements: 3.2, 3.5_

- [ ]* 3.4 Add unit tests for prediction display components
  - Test UserPredictionBadge with different prediction types
  - Test prediction outcome status display
  - Test conditional rendering based on user participation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Create Similar Market Feature
  - Add "Create Similar" button to market detail page
  - Implement similar market creation dialog with match ID pre-filled
  - Allow customization of entry fee and visibility settings
  - Provide navigation to newly created similar market
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.1 Add Create Similar button to MarketDetail page
  - Add "Create Similar" button to market detail page UI
  - Position button appropriately in the action panel
  - Implement button click handler to open creation dialog
  - Add proper styling consistent with existing design
  - _Requirements: 4.1_

- [ ] 4.2 Create similar market creation dialog component
  - Design and implement CreateSimilarMarketDialog component
  - Pre-fill match ID from current market being viewed
  - Add form fields for entry fee and visibility (public/private)
  - Include form validation and error handling
  - _Requirements: 4.2, 4.3, 4.4_

- [ ] 4.3 Implement similar market creation logic
  - Extend useMarketActions hook with createSimilarMarket function
  - Reuse existing createMarket logic with pre-filled parameters
  - Add proper transaction handling and user feedback
  - Implement success navigation or link to new market
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ]* 4.4 Add integration tests for similar market creation
  - Test dialog opening and form pre-filling
  - Test market creation with different parameters
  - Test navigation to newly created market
  - Test error scenarios and validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Integration and Testing
  - Integrate all enhanced features and ensure compatibility
  - Test end-to-end workflows with enhanced functionality
  - Verify fee distribution works correctly in resolved markets
  - Validate user experience improvements across all components
  - _Requirements: All requirements_

- [ ] 5.1 End-to-end integration testing
  - Test complete market lifecycle with enhanced resolution
  - Verify fee distribution to creator and platform addresses
  - Test user prediction display across different market states
  - Test similar market creation and navigation workflows
  - _Requirements: All requirements_

- [ ] 5.2 User experience validation and refinement
  - Validate resolution controls work correctly for different user types
  - Ensure match score display is accurate and timely
  - Verify prediction display is consistent and clear
  - Test similar market creation user flow
  - _Requirements: All requirements_