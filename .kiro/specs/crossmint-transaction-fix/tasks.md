# Implementation Plan

- [x] 1. Install required dependencies and create transaction serialization utility
  - Install bs58 package for Base58 encoding
  - Create TransactionSerializer class with toBase58() method
  - Add getSize() method for transaction size calculation
  - Add logDetails() method for debugging
  - _Requirements: 1.2, 2.2, 3.3_

- [ ] 2. Update UnifiedWalletContext to expose Crossmint wallet
  - [ ] 2.1 Remove incompatible signTransaction and signAllTransactions methods from interface
    - Remove signTransaction from UnifiedWalletContextType interface
    - Remove signAllTransactions from UnifiedWalletContextType interface
    - Update JSDoc comments to reflect changes
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 2.2 Add crossmintWallet and adapterWallet to context interface
    - Add crossmintWallet property to UnifiedWalletContextType interface
    - Add adapterWallet property to UnifiedWalletContextType interface
    - Export these properties from the context provider
    - Update context value to include wallet objects
    - _Requirements: 1.3, 5.1_

  - [ ] 2.3 Remove signTransaction and signAllTransactions implementations
    - Remove signTransaction callback from UnifiedWalletProvider
    - Remove signAllTransactions callback from UnifiedWalletProvider
    - Remove related error handling code
    - _Requirements: 5.1, 5.2_

- [ ] 3. Implement wallet-type-aware transaction submission in useMarketActions
  - [ ] 3.1 Update useMarketActions to get crossmintWallet from context
    - Import crossmintWallet from useUnifiedWallet hook
    - Remove direct signTransaction usage
    - Update hook dependencies
    - _Requirements: 1.1, 1.3, 5.1_

  - [ ] 3.2 Create submitTransaction method that detects wallet type
    - Implement wallet type detection (crossmint vs adapter)
    - Add error handling for wallet not connected
    - Add logging for transaction submission
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 3.3 Implement Crossmint transaction flow in submitTransaction
    - Serialize transaction using TransactionSerializer.toBase58()
    - Call crossmintWallet.send() with serialized transaction
    - Extract signature from Crossmint response (txId or signature field)
    - Handle Crossmint-specific errors
    - Add toast notifications for user feedback
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.2, 6.3_

  - [ ] 3.4 Implement adapter wallet transaction flow in submitTransaction
    - Keep existing signTransaction + sendRawTransaction flow
    - Maintain backward compatibility
    - Add toast notifications for user feedback
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 3.5 Replace signAndSendTransaction calls with submitTransaction
    - Update createMarket to use submitTransaction
    - Update joinMarket to use submitTransaction
    - Update resolveMarket to use submitTransaction
    - Update withdrawRewards to use submitTransaction
    - _Requirements: 1.1, 2.1, 3.1, 3.2_

- [ ] 4. Enhance error handling for Crossmint transactions
  - [ ] 4.1 Add Crossmint-specific error codes to WalletErrorHandler
    - Add CROSSMINT_API_ERROR error code
    - Add CROSSMINT_SIGNING_ERROR error code
    - Add CROSSMINT_WALLET_NOT_READY error code
    - Add TRANSACTION_SERIALIZATION_ERROR error code
    - _Requirements: 7.1, 7.6_

  - [ ] 4.2 Implement parseCrossmintError method
    - Parse Crossmint API error responses
    - Map error messages to error codes
    - Handle user rejection errors
    - Handle insufficient funds errors
    - Handle network errors
    - Handle session expiration errors
    - _Requirements: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 4.3 Update error handling in submitTransaction
    - Use parseCrossmintError for Crossmint wallet errors
    - Use existing parseError for adapter wallet errors
    - Log errors with WalletErrorHandler.logError()
    - Display user-friendly error messages with toast
    - _Requirements: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 5. Update transaction confirmation and user feedback
  - [ ] 5.1 Add detailed toast notifications for transaction stages
    - Add "Preparing transaction" toast when building transaction
    - Add "Approve transaction" toast when waiting for user approval
    - Add "Sending transaction" toast when submitting transaction
    - Add "Confirming transaction" toast when waiting for confirmation
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 5.2 Update success notifications with explorer links
    - Add success toast with transaction signature
    - Add "View" action button that opens Solana Explorer
    - Use SolanaUtils.getExplorerUrl() for correct network
    - _Requirements: 1.5, 6.5_

  - [ ] 5.3 Update error notifications with specific messages
    - Display specific error message based on error code
    - Avoid duplicate toast notifications
    - Log detailed error information to console
    - _Requirements: 1.6, 6.6, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. Add transaction debugging and logging
  - [ ] 6.1 Add transaction logging in submitTransaction
    - Log transaction details before submission
    - Log wallet type being used
    - Log serialized transaction size for Crossmint
    - Log transaction signature after submission
    - _Requirements: 5.5, 8.5_

  - [ ] 6.2 Add simulation result logging
    - Log simulation success/failure
    - Log simulation logs if available
    - Log simulation errors with details
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7. Test Crossmint transaction flows
  - [ ] 7.1 Test market creation with Crossmint wallet
    - Authenticate with Crossmint (Google or email)
    - Create a market with valid parameters
    - Verify transaction is submitted successfully
    - Verify transaction signature is returned
    - Verify transaction appears in Solana Explorer
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 7.2 Test market joining with Crossmint wallet
    - Join an existing market
    - Verify transaction is submitted successfully
    - Verify transaction is confirmed on-chain
    - Verify UI updates to show participation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 7.3 Test market resolution and withdrawal with Crossmint wallet
    - Resolve a market with outcome
    - Withdraw rewards from a resolved market
    - Verify both transactions succeed
    - Verify UI updates correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 7.4 Test error scenarios with Crossmint wallet
    - Test transaction rejection by user
    - Test insufficient funds error
    - Test network error handling
    - Verify error messages are user-friendly
    - Verify errors are logged to console
    - _Requirements: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 8. Verify backward compatibility with traditional wallets
  - [ ] 8.1 Test all operations with Phantom wallet
    - Connect with Phantom
    - Create, join, resolve market, and withdraw
    - Verify no regression in functionality
    - Verify existing flow still works
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.2 Test all operations with Solflare wallet
    - Connect with Solflare
    - Create, join, resolve market, and withdraw
    - Verify no regression in functionality
    - Verify existing flow still works
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Update documentation and add code comments
  - [ ] 9.1 Add JSDoc comments to new methods
    - Document submitTransaction method
    - Document TransactionSerializer class
    - Document parseCrossmintError method
    - Document updated UnifiedWalletContext interface
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 9.2 Update README with Crossmint transaction information
    - Document how Crossmint transactions work
    - Document differences from traditional wallets
    - Document error handling approach
    - Add troubleshooting section
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
