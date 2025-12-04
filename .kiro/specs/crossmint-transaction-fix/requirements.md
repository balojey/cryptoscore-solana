# Requirements Document

## Introduction

This feature fixes the Solana transaction signing and submission issues when using Crossmint-managed wallets in the CryptoScore prediction market platform. The current implementation incorrectly attempts to use the standard Solana wallet adapter transaction signing flow with Crossmint wallets, which causes failures for all write operations (creating markets, joining markets, resolving markets, and withdrawing rewards). The fix will implement the correct Crossmint SDK transaction flow using the `wallet.send()` method with properly formatted transaction parameters.

## Glossary

- **CryptoScore_Platform**: The Solana-based sports prediction market application
- **Crossmint_Wallet**: A Solana wallet created and managed by Crossmint on behalf of authenticated users
- **Crossmint_SDK**: The @crossmint/client-sdk-react-ui package that provides wallet and transaction methods
- **Transaction_Builder**: The utility class that constructs Solana transactions with instructions
- **Wallet_Adapter**: The standard Solana wallet adapter interface used by traditional wallets (Phantom, Solflare)
- **Write_Operation**: Any blockchain transaction that modifies state (create market, join market, resolve market, withdraw)
- **Read_Operation**: Any blockchain query that only reads state without modifying it
- **Transaction_Instruction**: A Solana instruction that specifies an operation to perform on-chain
- **Base58_Encoding**: The encoding format used for Solana transaction serialization

## Requirements

### Requirement 1

**User Story:** As a user authenticated via Crossmint, I want to create prediction markets successfully, so that I can host markets using my Crossmint-managed wallet

#### Acceptance Criteria

1. WHEN a Crossmint user initiates market creation, THE CryptoScore_Platform SHALL build the transaction using Transaction_Builder with the create market instruction
2. WHEN the transaction is built, THE CryptoScore_Platform SHALL serialize the transaction to Base58_Encoding format
3. WHEN the transaction is serialized, THE CryptoScore_Platform SHALL call Crossmint_Wallet.send() method with the serialized transaction
4. WHEN Crossmint_Wallet.send() is called, THE Crossmint_SDK SHALL handle transaction signing internally without exposing private keys
5. WHEN the transaction is submitted successfully, THE CryptoScore_Platform SHALL return the transaction signature to the user
6. WHEN the transaction fails, THE CryptoScore_Platform SHALL parse the error and display a user-friendly message

### Requirement 2

**User Story:** As a user authenticated via Crossmint, I want to join prediction markets successfully, so that I can participate in markets using my Crossmint-managed wallet

#### Acceptance Criteria

1. WHEN a Crossmint user initiates joining a market, THE CryptoScore_Platform SHALL build the transaction using Transaction_Builder with the join market instruction
2. WHEN the transaction is built, THE CryptoScore_Platform SHALL serialize the transaction to Base58_Encoding format
3. WHEN the transaction is serialized, THE CryptoScore_Platform SHALL call Crossmint_Wallet.send() method with the serialized transaction
4. WHEN the transaction is submitted successfully, THE CryptoScore_Platform SHALL confirm the transaction on-chain
5. WHEN the transaction is confirmed, THE CryptoScore_Platform SHALL update the UI to reflect the user's participation

### Requirement 3

**User Story:** As a user authenticated via Crossmint, I want to resolve markets and withdraw rewards successfully, so that I can complete the full market lifecycle using my Crossmint-managed wallet

#### Acceptance Criteria

1. WHEN a Crossmint user initiates market resolution, THE CryptoScore_Platform SHALL build the transaction using Transaction_Builder with the resolve market instruction
2. WHEN a Crossmint user initiates reward withdrawal, THE CryptoScore_Platform SHALL build the transaction using Transaction_Builder with the withdraw instruction
3. WHEN either transaction is built, THE CryptoScore_Platform SHALL serialize the transaction to Base58_Encoding format
4. WHEN the transaction is serialized, THE CryptoScore_Platform SHALL call Crossmint_Wallet.send() method with the serialized transaction
5. WHEN the transaction is submitted successfully, THE CryptoScore_Platform SHALL confirm the transaction and update the UI

### Requirement 4

**User Story:** As a user with a traditional wallet (Phantom, Solflare), I want all my transactions to continue working without any changes, so that the fix does not break existing functionality

#### Acceptance Criteria

1. WHEN a Wallet_Adapter user initiates any Write_Operation, THE CryptoScore_Platform SHALL use the existing signTransaction and sendRawTransaction flow
2. THE CryptoScore_Platform SHALL detect the wallet type before choosing the transaction submission method
3. WHEN using Wallet_Adapter, THE CryptoScore_Platform SHALL NOT call Crossmint_Wallet.send() method
4. THE CryptoScore_Platform SHALL maintain backward compatibility with all existing wallet adapter functionality

### Requirement 5

**User Story:** As a developer, I want the transaction code to be properly abstracted, so that wallet-specific logic is isolated and maintainable

#### Acceptance Criteria

1. THE CryptoScore_Platform SHALL implement a transaction submission method that detects wallet type
2. WHEN wallet type is 'crossmint', THE CryptoScore_Platform SHALL use Crossmint_SDK transaction flow
3. WHEN wallet type is 'adapter', THE CryptoScore_Platform SHALL use Wallet_Adapter transaction flow
4. THE CryptoScore_Platform SHALL handle errors consistently across both wallet types
5. THE CryptoScore_Platform SHALL log transaction details for debugging purposes

### Requirement 6

**User Story:** As a user, I want to see clear feedback during transaction processing, so that I understand what is happening with my transaction

#### Acceptance Criteria

1. WHEN a transaction is being prepared, THE CryptoScore_Platform SHALL display a "Preparing transaction" message
2. WHEN a transaction is awaiting user approval, THE CryptoScore_Platform SHALL display an "Approve transaction" message
3. WHEN a transaction is being submitted, THE CryptoScore_Platform SHALL display a "Sending transaction" message
4. WHEN a transaction is being confirmed, THE CryptoScore_Platform SHALL display a "Confirming transaction" message
5. WHEN a transaction succeeds, THE CryptoScore_Platform SHALL display a success message with a link to the transaction explorer
6. WHEN a transaction fails, THE CryptoScore_Platform SHALL display a specific error message based on the failure reason

### Requirement 7

**User Story:** As a developer, I want proper error handling for Crossmint transactions, so that users receive helpful feedback when transactions fail

#### Acceptance Criteria

1. WHEN Crossmint_Wallet.send() throws an error, THE CryptoScore_Platform SHALL catch and parse the error
2. WHEN the error indicates user rejection, THE CryptoScore_Platform SHALL display "Transaction was rejected"
3. WHEN the error indicates insufficient funds, THE CryptoScore_Platform SHALL display "Insufficient funds to complete this transaction"
4. WHEN the error indicates a network issue, THE CryptoScore_Platform SHALL display "Network error. Please check your connection and try again"
5. WHEN the error indicates session expiration, THE CryptoScore_Platform SHALL display "Your session has expired. Please sign in again"
6. THE CryptoScore_Platform SHALL log detailed error information to the console for debugging

### Requirement 8

**User Story:** As a user, I want transaction simulation to work correctly before submitting, so that I can avoid failed transactions

#### Acceptance Criteria

1. WHEN a transaction is built, THE CryptoScore_Platform SHALL simulate the transaction before submission
2. WHEN simulation succeeds, THE CryptoScore_Platform SHALL proceed with transaction submission
3. WHEN simulation fails, THE CryptoScore_Platform SHALL display the simulation error to the user
4. WHEN simulation fails, THE CryptoScore_Platform SHALL ask the user whether to proceed anyway
5. THE CryptoScore_Platform SHALL log simulation results for debugging purposes
