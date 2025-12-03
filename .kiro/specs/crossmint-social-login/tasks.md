# Implementation Plan

- [x] 1. Setup Crossmint SDK and environment configuration
  - Install @crossmint/client-sdk-react-ui package
  - Add Crossmint API key environment variables to .env files
  - Create Crossmint configuration utility file
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Integrate Crossmint providers into application
  - [x] 2.1 Wrap application with CrossmintProvider in main.tsx
    - Import Crossmint provider components
    - Configure CrossmintProvider with API key from environment
    - Configure CrossmintAuthProvider with login methods (google, twitter, farcaster, email, web3:solana-only)
    - Configure CrossmintWalletProvider with Solana chain and PASSKEY signer
    - Maintain existing Solana wallet adapter providers
    - _Requirements: 1.1, 2.1, 5.1, 5.2_

- [x] 3. Create unified wallet abstraction layer
  - [x] 3.1 Implement UnifiedWalletContext
    - Create context with unified wallet interface
    - Implement wallet type detection (Crossmint vs adapter)
    - Implement connection state management
    - Implement disconnect functionality for both wallet types
    - Export useUnifiedWallet hook
    - _Requirements: 1.4, 2.3, 3.1, 4.4_

  - [x] 3.2 Create CrossmintWalletAdapter class
    - Implement Solana wallet adapter interface
    - Implement transaction signing using Crossmint SDK
    - Implement sendTransaction method
    - Handle Crossmint wallet connection state
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 Integrate UnifiedWalletContext with existing wallet providers
    - Wrap App component with UnifiedWalletContext provider
    - Connect to both Crossmint and Solana wallet adapter contexts
    - Implement wallet state synchronization
    - _Requirements: 2.3, 2.4, 3.1_

- [x] 4. Create authentication modal component
  - [x] 4.1 Build AuthModal component
    - Create modal UI with social login section
    - Add Google, Twitter/X, Farcaster, and email login buttons using Crossmint components
    - Add separator between social and wallet options
    - Add traditional wallet connection buttons (Phantom, Solflare)
    - Implement modal open/close state management
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 4.2 Implement authentication flow handlers
    - Handle social login button clicks using Crossmint useAuth hook
    - Handle traditional wallet connection using existing wallet adapter
    - Display loading states during authentication
    - Handle authentication errors with user-friendly messages
    - Close modal on successful authentication
    - _Requirements: 1.2, 1.3, 2.2, 4.4_

- [x] 5. Update Connect component
  - [x] 5.1 Refactor Connect component to use UnifiedWalletContext
    - Replace useWallet hook with useUnifiedWallet hook
    - Update connection state checks
    - Update button click handler to open AuthModal
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 5.2 Update Account component display logic
    - Display email/social username for Crossmint users
    - Display wallet address for both wallet types
    - Add wallet type indicator
    - Update logout/disconnect button to handle both wallet types
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Update market interaction hooks to support unified wallet
  - [x] 6.1 Update useMarketActions hook
    - Replace direct wallet adapter usage with UnifiedWalletContext
    - Update transaction signing to use unified interface
    - Ensure createMarket works with both wallet types
    - Ensure joinMarket works with both wallet types
    - Ensure resolveMarket works with both wallet types
    - Ensure withdrawRewards works with both wallet types
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Update other hooks that use wallet functionality
    - Update useSolanaProgram hook if needed
    - Update any other hooks that directly access wallet adapter
    - Ensure all transaction flows work with unified wallet interface
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 7. Implement error handling and user feedback
  - [x] 7.1 Create error handling utilities
    - Define WalletError class with error codes
    - Create error message mapping for user-friendly messages
    - Implement error logging for debugging
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.2 Add error handling to authentication flows
    - Handle social login failures with toast notifications
    - Handle wallet connection failures
    - Handle session expiration with re-authentication prompt
    - Handle JWT token refresh failures
    - _Requirements: 6.3, 6.4_

  - [x] 7.3 Add error handling to transaction flows
    - Handle transaction signing failures
    - Handle transaction rejection by user
    - Handle network errors during transactions
    - Display transaction status and confirmations
    - _Requirements: 3.5, 6.5_

- [x] 8. Implement session management and persistence
  - [x] 8.1 Add session persistence for Crossmint users
    - Implement automatic session restoration on page load
    - Handle JWT token storage securely
    - Implement automatic token refresh
    - _Requirements: 1.5, 6.1, 6.2, 6.3_

  - [x] 8.2 Add logout functionality
    - Implement logout for Crossmint users (clear tokens and session)
    - Maintain existing disconnect for traditional wallets
    - Clear all wallet state on logout/disconnect
    - _Requirements: 4.4, 4.5_

- [x] 9. Add configuration validation and environment checks
  - [x] 9.1 Create configuration validation utility
    - Validate presence of required environment variables
    - Validate API key format
    - Check environment configuration (staging vs production)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 9.2 Add startup validation
    - Run configuration validation on application startup
    - Display error message if configuration is invalid
    - Prevent app initialization with missing configuration
    - _Requirements: 5.4, 5.5_

- [ ] 10. Update documentation and add usage examples
  - [ ] 10.1 Update README with Crossmint setup instructions
    - Document required environment variables
    - Document how to obtain Crossmint API keys
    - Document supported login methods
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 10.2 Add code comments and JSDoc
    - Document UnifiedWalletContext interface
    - Document CrossmintWalletAdapter methods
    - Document AuthModal component props
    - Document error handling patterns
    - _Requirements: All_

- [ ]* 11. Testing and validation
  - [ ]* 11.1 Write unit tests for core functionality
    - Test UnifiedWalletContext state management
    - Test CrossmintWalletAdapter interface implementation
    - Test error handling utilities
    - _Requirements: All_

  - [ ]* 11.2 Write integration tests for authentication flows
    - Test social login flow (mocked)
    - Test traditional wallet connection flow
    - Test logout/disconnect flow
    - Test session persistence
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 11.3 Write integration tests for transaction flows
    - Test market creation with Crossmint wallet
    - Test market joining with Crossmint wallet
    - Test market resolution with Crossmint wallet
    - Test transaction signing with both wallet types
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 11.4 Perform manual testing
    - Test all social login methods
    - Test traditional wallet connections
    - Test all market interactions with both wallet types
    - Test error scenarios
    - Test session persistence
    - _Requirements: All_
