# Requirements Document

## Introduction

This feature implements a comprehensive winnings display system that shows users their potential or actual winnings based on their authentication status, participation in markets, and market resolution state. The system provides clear visibility into financial outcomes for different user scenarios across the CryptoScore prediction market platform.

## Glossary

- **Market_Display_System**: The component responsible for showing winnings information to users viewing markets
- **Unauthenticated_User**: A user who has not connected their wallet to the platform
- **Authenticated_User**: A user who has connected their wallet but may or may not have participated in markets
- **Market_Participant**: An authenticated user who has placed a prediction in a specific market
- **Market_Creator**: The authenticated user who created a specific market
- **Open_Market**: A market that is still accepting predictions (before match start time)
- **Ended_Market**: A market where the match has concluded but may not yet be resolved
- **Resolved_Market**: A market where the outcome has been determined and rewards distributed
- **Potential_Winnings**: The amount a user could win if their prediction is correct
- **Actual_Winnings**: The confirmed amount a user has won from a resolved market
- **Creator_Reward**: The fee earned by the market creator for creating the market (2% of total pool)
- **Platform_Fee**: The fee collected by the platform (3% of total pool)
- **Participant_Pool**: The remaining pool distributed to winners (95% of total pool after fees)

## Requirements

### Requirement 1

**User Story:** As an unauthenticated user, I want to see potential winnings when viewing an open market, so that I understand the financial incentive to participate.

#### Acceptance Criteria

1. WHEN an unauthenticated user views an open market, THE Market_Display_System SHALL display the potential winnings amount for each prediction option
2. THE Market_Display_System SHALL calculate potential winnings based on current market odds and entry fee
3. THE Market_Display_System SHALL only display potential winnings for open markets
4. THE Market_Display_System SHALL include a clear label indicating these are potential winnings

### Requirement 2

**User Story:** As an authenticated user who hasn't joined a market, I want to see potential winnings when viewing an open market, so that I can make informed decisions about participation.

#### Acceptance Criteria

1. WHEN an authenticated user who has not participated views an open market, THE Market_Display_System SHALL display the potential winnings amount for each prediction option
2. THE Market_Display_System SHALL calculate potential winnings based on current market odds and entry fee
3. THE Market_Display_System SHALL only display potential winnings for open markets
4. THE Market_Display_System SHALL differentiate the display from unauthenticated users with wallet-specific messaging

### Requirement 3

**User Story:** As a market participant, I want to see my potential winnings when viewing a market I've joined, so that I can track my investment outcome.

#### Acceptance Criteria

1. WHEN a market participant views a market they have joined, THE Market_Display_System SHALL display their potential winnings based on their specific prediction
2. THE Market_Display_System SHALL highlight the participant's chosen prediction option
3. THE Market_Display_System SHALL calculate winnings based on the participant's actual stake and current odds
4. THE Market_Display_System SHALL display potential winnings for open markets and actual winnings for ended markets

### Requirement 4

**User Story:** As a market participant with a correct prediction, I want to see my actual winnings when viewing a market after the match has ended, so that I can confirm my payout amount.

#### Acceptance Criteria

1. WHEN a market participant with a correct prediction views a market after the match has ended, THE Market_Display_System SHALL display their actual winnings amount
2. THE Market_Display_System SHALL clearly indicate that these are confirmed winnings
3. THE Market_Display_System SHALL show the winning prediction outcome
4. THE Market_Display_System SHALL display a success indicator for winning participants

### Requirement 5

**User Story:** As a market creator who is also a participant, I want to see my total potential winnings including creator rewards, so that I understand my complete financial position.

#### Acceptance Criteria

1. WHEN a market creator who is also a participant views an open or ended market, THE Market_Display_System SHALL display their potential or actual winnings plus creator reward
2. THE Market_Display_System SHALL clearly separate participant winnings from creator reward in the display
3. WHEN a market creator who is also a participant views a resolved market, THE Market_Display_System SHALL display only their participant winnings
4. THE Market_Display_System SHALL indicate that creator rewards are distributed separately upon resolution

### Requirement 6

**User Story:** As a market creator who didn't participate, I want to see my potential creator reward, so that I can track my earnings from market creation.

#### Acceptance Criteria

1. WHEN a market creator who did not participate views their market, THE Market_Display_System SHALL display their potential creator reward
2. THE Market_Display_System SHALL calculate creator reward based on market participation and fee structure
3. THE Market_Display_System SHALL display creator reward for open and ended markets
4. THE Market_Display_System SHALL clearly label the amount as creator reward

### Requirement 7

**User Story:** As a market creator viewing a resolved market, I want confirmation that my creator reward has been distributed, so that I know the transaction is complete.

#### Acceptance Criteria

1. WHEN a market creator views a resolved market, THE Market_Display_System SHALL display a confirmation message that creator rewards have been sent
2. THE Market_Display_System SHALL show the amount of creator reward that was distributed
3. THE Market_Display_System SHALL include transaction confirmation details if available
4. THE Market_Display_System SHALL distinguish between creator reward confirmation and participant winnings