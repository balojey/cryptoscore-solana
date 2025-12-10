# Requirements Document

## Introduction

This specification defines enhancements to the CryptoScore prediction market platform to improve user experience and market resolution functionality. The enhancements focus on automated fee distribution during market resolution, intelligent resolution controls based on match outcomes, user prediction visibility, and market creation convenience features.

## Glossary

- **Market_System**: The CryptoScore prediction market platform built on Solana
- **Market_Resolution**: The process of determining the outcome of a prediction market and distributing rewards
- **Platform_Fee**: A percentage of the market pool retained by the platform
- **Creator_Fee**: A percentage of the market pool distributed to the market creator
- **Participant**: A user who has joined a market and made a prediction
- **Match_API**: The football-data.org API that provides real-time match information and scores
- **Resolve_Button**: UI element that allows authorized users to resolve a market
- **Similar_Market**: A new market created with the same match ID but different parameters

## Requirements

### Requirement 1

**User Story:** As a market creator, I want to automatically receive my creator fee when a market is resolved, so that I don't need to perform separate withdrawal transactions.

#### Acceptance Criteria

1. WHEN a market is resolved, THE Market_System SHALL distribute the creator fee to the market creator's wallet in the same transaction
2. WHEN a market is resolved, THE Market_System SHALL distribute the platform fee to the address "2xUfnnyizenM7a9jWHtgxdCWCTE11afRUhX5YeFSrVTn" in the same transaction
3. WHEN a market is resolved, THE Market_System SHALL distribute participant rewards to the market pool for winner withdrawals in the same transaction
4. THE Market_System SHALL complete all fee distributions in a single atomic transaction
5. THE Market_System SHALL emit events for each fee distribution for transparency

### Requirement 2

**User Story:** As a participant, I want to see match scores and know if my prediction is correct before attempting to resolve a market, so that I don't waste gas fees on markets where I have no rewards to claim.

#### Acceptance Criteria

1. WHEN a match has finished status from Match_API, THE Market_System SHALL display the final match scores in the market interface
2. WHEN a match has finished status, THE Market_System SHALL indicate which prediction outcome is correct based on the match result
3. WHEN a user has no winning prediction in a finished market, THE Market_System SHALL hide the Resolve_Button from that user
4. WHEN a user has a winning prediction in a finished market, THE Market_System SHALL show the Resolve_Button to that user
5. THE Market_System SHALL display the user's prediction outcome status (correct/incorrect) when match results are available

### Requirement 3

**User Story:** As a market participant, I want to see my prediction displayed on market cards, so that I can quickly identify which markets I've joined and what I predicted.

#### Acceptance Criteria

1. WHEN a user has joined a market, THE Market_System SHALL display the user's prediction on the EnhancedMarketCard
2. THE Market_System SHALL use distinct visual indicators for each prediction type (Home/Draw/Away)
3. THE Market_System SHALL show the prediction in a prominent location on the market card
4. WHEN a user has not joined a market, THE Market_System SHALL not display any prediction indicator
5. THE Market_System SHALL maintain consistent prediction display styling across all market cards

### Requirement 4

**User Story:** As a user viewing a market detail page, I want to create a similar market for the same match with different parameters, so that I can offer alternative betting options without starting from scratch.

#### Acceptance Criteria

1. THE Market_System SHALL provide a "Create Similar" button on the market detail page
2. WHEN the "Create Similar" button is clicked, THE Market_System SHALL open a dialog with the same match ID pre-filled
3. THE Market_System SHALL allow the user to specify entry fee for the Similar_Market
4. THE Market_System SHALL allow the user to specify visibility (public/private) for the Similar_Market
5. WHEN the Similar_Market is created successfully, THE Market_System SHALL redirect the user to the new market or provide a link to it