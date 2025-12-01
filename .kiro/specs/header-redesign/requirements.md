# Requirements Document

## Introduction

This document outlines the requirements for redesigning the CryptoScore application header component. The current header is cluttered with too many navigation links and elements that could be better positioned elsewhere or removed entirely. The redesign aims to create a cleaner, more focused header that emphasizes essential navigation while relocating or removing redundant elements.

## Glossary

- **Header Component**: The sticky navigation bar at the top of the application that provides primary navigation and user controls
- **Logo Link**: The CryptoScore logo and text that serves as a home navigation element
- **Primary Navigation**: Core navigation links displayed prominently in the header
- **Utility Controls**: Non-navigation elements like theme switcher, currency selector, and wallet connection
- **Mobile Menu**: Collapsible dropdown menu for mobile/tablet viewports
- **SearchBar Component**: Input field for searching markets by team or competition name
- **Markets Page**: The `/markets` route where users browse available prediction markets
- **Terminal Page**: The `/terminal` route displaying trading terminal and analytics
- **Dashboard Page**: The `/dashboard` route showing user-specific data and portfolio
- **Leaderboard**: Feature showing top users by performance metrics

## Requirements

### Requirement 1

**User Story:** As a user, I want a cleaner header with fewer navigation links, so that I can focus on the most important actions without visual clutter

#### Acceptance Criteria

1. WHEN the Header Component renders, THE Header Component SHALL display only the Markets, Terminal, and Dashboard navigation links
2. THE Header Component SHALL NOT display a separate Home navigation link
3. THE Header Component SHALL NOT display a Leaderboard navigation link in the header
4. THE Header Component SHALL maintain the logo as a clickable link to the home page
5. THE Header Component SHALL reduce the total number of primary navigation items from five to three

### Requirement 2

**User Story:** As a user, I want the logo to serve as the home navigation, so that I don't need a redundant "Home" button

#### Acceptance Criteria

1. WHEN a user clicks on the logo, THE Header Component SHALL navigate to the root path "/"
2. THE Header Component SHALL display visual feedback on logo hover with a glow effect
3. THE Header Component SHALL maintain the existing logo SVG and "CryptoScore" text
4. THE Header Component SHALL NOT display any active state styling on the logo based on current route

### Requirement 3

**User Story:** As a user browsing markets, I want the search functionality integrated into the Markets page itself, so that search is contextually available where I need it

#### Acceptance Criteria

1. THE Header Component SHALL NOT display the SearchBar component in the header on any page
2. THE Header Component SHALL remove the conditional rendering logic for SearchBar based on route
3. THE Header Component SHALL remove the mobile search toggle functionality
4. THE Markets Page SHALL be responsible for displaying its own SearchBar component
5. THE Header Component SHALL reduce its height or visual weight by removing the search bar space

### Requirement 4

**User Story:** As a user viewing the terminal, I want access to the leaderboard from within the Terminal page, so that related features are grouped together

#### Acceptance Criteria

1. THE Header Component SHALL NOT display a Leaderboard navigation link
2. THE Terminal Page SHALL provide navigation or access to the Leaderboard feature
3. THE Header Component SHALL remove all Leaderboard-related routing logic and styling
4. THE Mobile Menu SHALL NOT include a Leaderboard menu item

### Requirement 5

**User Story:** As a user, I want the essential utility controls (wallet, theme, currency) easily accessible, so that I can quickly adjust my preferences

#### Acceptance Criteria

1. THE Header Component SHALL display the CurrencySelector component in the desktop header
2. THE Header Component SHALL display the ThemeSwitcher component in the desktop header
3. THE Header Component SHALL display the Connect (wallet) component in the desktop header
4. THE Header Component SHALL maintain the current positioning of utility controls on the right side
5. THE Header Component SHALL preserve all utility controls in the mobile menu

### Requirement 6

**User Story:** As a mobile user, I want a simplified mobile menu with only essential navigation, so that I can quickly access key features

#### Acceptance Criteria

1. WHEN the mobile menu opens, THE Header Component SHALL display Markets, Terminal, and Dashboard links
2. THE Mobile Menu SHALL NOT display a Home link
3. THE Mobile Menu SHALL NOT display a Leaderboard link
4. THE Mobile Menu SHALL display Currency selector in a dedicated section
5. THE Mobile Menu SHALL display Theme options in a dedicated section
6. THE Mobile Menu SHALL display the Connect wallet button at the bottom

### Requirement 7

**User Story:** As a user, I want clear visual indication of which page I'm currently on, so that I can maintain context while navigating

#### Acceptance Criteria

1. WHEN a navigation link matches the current route, THE Header Component SHALL apply active state styling with cyan accent color
2. THE Header Component SHALL apply active background color to the active navigation button
3. THE Header Component SHALL apply active text color to the active navigation button
4. THE Header Component SHALL apply active border color to the active navigation button
5. THE Mobile Menu SHALL display a check icon next to the active menu item

### Requirement 8

**User Story:** As a developer, I want the header component to be maintainable and follow React best practices, so that future updates are straightforward

#### Acceptance Criteria

1. THE Header Component SHALL use semantic HTML elements for accessibility
2. THE Header Component SHALL maintain TypeScript type safety for all props and state
3. THE Header Component SHALL use CSS custom properties for theming consistency
4. THE Header Component SHALL follow the existing component structure patterns
5. THE Header Component SHALL remove unused imports and state variables after redesign

### Requirement 9

**User Story:** As a user on any device, I want the header to remain sticky and accessible, so that navigation is always available

#### Acceptance Criteria

1. THE Header Component SHALL maintain sticky positioning at the top of the viewport
2. THE Header Component SHALL apply backdrop blur effect for visual depth
3. THE Header Component SHALL maintain z-index of 50 for proper layering
4. THE Header Component SHALL use responsive padding that adapts to screen size
5. THE Header Component SHALL maintain the maximum width constraint of 2xl (1536px)

### Requirement 10

**User Story:** As a user, I want smooth transitions and visual feedback on interactive elements, so that the interface feels responsive and polished

#### Acceptance Criteria

1. WHEN hovering over navigation links, THE Header Component SHALL display hover state styling
2. WHEN hovering over the logo, THE Header Component SHALL display a cyan glow effect
3. THE Header Component SHALL apply transition effects to color and background changes
4. THE Header Component SHALL maintain consistent animation durations across all interactive elements
5. THE Header Component SHALL use theme-aware colors from CSS custom properties
