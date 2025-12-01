# Requirements Document

## Introduction

This feature enables users to view monetary values (entry fees, pool sizes, rewards, etc.) in their preferred display currency (USD or Naira) while maintaining SOL as the underlying transaction currency. The system will perform real-time currency conversions for display purposes only, without affecting blockchain operations.

## Glossary

- **Display Currency**: The currency selected by the user for viewing monetary values in the UI (USD, Naira, or SOL)
- **Base Currency**: The underlying blockchain currency used for all transactions (SOL)
- **Currency Selector**: UI component allowing users to choose their preferred display currency
- **Exchange Rate Service**: External API providing real-time SOL conversion rates
- **Currency Context**: React context managing the selected display currency across the application
- **Formatted Value**: A monetary amount converted and displayed in the user's selected currency

## Requirements

### Requirement 1

**User Story:** As a user, I want to select my preferred display currency, so that I can view monetary values in a currency I'm familiar with

#### Acceptance Criteria

1. THE Currency Selector SHALL display three currency options: SOL, USD, and Naira
2. WHEN a user selects a display currency, THE Currency Context SHALL persist the selection in browser local storage
3. WHEN a user returns to the application, THE Currency Context SHALL restore their previously selected display currency
4. THE Currency Selector SHALL be accessible from the main navigation or header area
5. WHEN a user changes the display currency, THE application SHALL update all monetary displays within 500 milliseconds

### Requirement 2

**User Story:** As a user, I want to see real-time exchange rates, so that the displayed values accurately reflect current market conditions

#### Acceptance Criteria

1. THE Exchange Rate Service SHALL fetch SOL conversion rates from a reliable API provider
2. THE Exchange Rate Service SHALL update exchange rates at intervals not exceeding 60 seconds
3. IF the Exchange Rate Service fails to fetch rates, THEN THE application SHALL use the last successfully fetched rates
4. THE Exchange Rate Service SHALL cache exchange rates in memory to minimize API calls
5. WHEN exchange rates are updated, THE application SHALL recalculate and display all visible monetary values

### Requirement 3

**User Story:** As a user, I want to see monetary values formatted correctly for my selected currency, so that amounts are easy to read and understand

#### Acceptance Criteria

1. WHEN the display currency is USD, THE application SHALL format values with the "$" symbol and two decimal places
2. WHEN the display currency is Naira, THE application SHALL format values with the "₦" symbol and two decimal places
3. WHEN the display currency is SOL, THE application SHALL format values with the "◎" symbol and up to four decimal places
4. THE application SHALL use locale-appropriate thousand separators for all formatted values
5. THE application SHALL display currency symbols before the numeric value for all currencies

### Requirement 4

**User Story:** As a user, I want to see the SOL equivalent alongside converted values, so that I understand the actual blockchain transaction amount

#### Acceptance Criteria

1. WHERE the display currency is not SOL, THE application SHALL show the SOL equivalent in smaller text below or beside the converted value
2. THE application SHALL format SOL equivalent values with up to four decimal places
3. WHEN hovering over a converted value, THE application SHALL display a tooltip with the exact SOL amount
4. THE application SHALL display SOL equivalents for entry fees, pool sizes, and reward amounts
5. WHERE space is limited, THE application SHALL prioritize displaying the converted value over the SOL equivalent

### Requirement 5

**User Story:** As a developer, I want a centralized currency conversion utility, so that currency formatting is consistent across the application

#### Acceptance Criteria

1. THE application SHALL provide a currency formatting hook that accepts SOL amounts and returns formatted display values
2. THE currency formatting hook SHALL automatically use the current display currency from Currency Context
3. THE application SHALL provide a utility function for manual currency conversion without formatting
4. THE currency formatting hook SHALL handle edge cases including zero values, very small amounts, and very large amounts
5. THE application SHALL provide TypeScript types for all currency-related functions and data structures

### Requirement 6

**User Story:** As a user, I want the currency feature to work offline with cached rates, so that I can still view the application when my connection is unstable

#### Acceptance Criteria

1. WHEN the application starts, THE Exchange Rate Service SHALL load cached rates from local storage
2. IF no cached rates exist, THEN THE application SHALL default to displaying values in SOL only
3. THE Exchange Rate Service SHALL persist fetched rates to local storage within 1 second of retrieval
4. WHEN the application is offline, THE application SHALL display a visual indicator showing that rates may be outdated
5. THE application SHALL display the timestamp of the last successful rate update

### Requirement 7

**User Story:** As a user, I want currency conversion to work seamlessly across all monetary displays, so that my experience is consistent throughout the application

#### Acceptance Criteria

1. THE application SHALL apply currency conversion to market entry fees on all market cards
2. THE application SHALL apply currency conversion to pool sizes on all market displays
3. THE application SHALL apply currency conversion to reward amounts in portfolio summaries
4. THE application SHALL apply currency conversion to balance displays in wallet components
5. THE application SHALL apply currency conversion to all monetary values in charts and graphs
