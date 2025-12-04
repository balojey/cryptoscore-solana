# Design Document

## Overview

This design fixes the critical issue where Crossmint wallet transactions fail due to incorrect transaction signing implementation. The current code attempts to use the standard Solana wallet adapter's `signTransaction()` method with Crossmint wallets, but Crossmint wallets require using their SDK's `wallet.send()` method instead.

The key insight from the Crossmint documentation is that Crossmint wallets are **custodial wallets** where the private keys are managed by Crossmint's infrastructure. Therefore, they cannot expose a `signTransaction()` method. Instead, transactions must be serialized and sent to Crossmint's API using the `wallet.send()` method, which handles signing server-side and returns the transaction signature.

## Architecture

### Current (Broken) Flow

```
User Action → Build Transaction → signTransaction() → sendRawTransaction() → ❌ FAILS
                                   (Crossmint doesn't support this)
```

### Fixed Flow for Crossmint Wallets

```
User Action → Build Transaction → Serialize to Base58 → wallet.send() → ✅ SUCCESS
                                                         (Crossmint handles signing)
```

### Fixed Flow for Traditional Wallets

```
User Action → Build Transaction → signTransaction() → sendRawTransaction() → ✅ SUCCESS
                                   (Wallet adapter handles signing)
```

### Transaction Flow Decision Tree

```
┌─────────────────────────┐
│   User Initiates        │
│   Write Operation       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Build Transaction     │
│   with Instructions     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Detect Wallet Type    │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │           │
      ▼           ▼
┌──────────┐  ┌──────────┐
│Crossmint │  │ Adapter  │
└─────┬────┘  └────┬─────┘
      │            │
      ▼            ▼
┌──────────┐  ┌──────────┐
│Serialize │  │  Sign    │
│to Base58 │  │  with    │
│          │  │  Wallet  │
└─────┬────┘  └────┬─────┘
      │            │
      ▼            ▼
┌──────────┐  ┌──────────┐
│wallet.   │  │sendRaw   │
│send()    │  │Transaction│
└─────┬────┘  └────┬─────┘
      │            │
      └─────┬──────┘
            │
            ▼
┌─────────────────────────┐
│   Return Signature      │
└─────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced UnifiedWalletContext

**File:** `app/src/contexts/UnifiedWalletContext.tsx`

**Changes Required:**
- Remove the `signTransaction` method from the interface (it's not compatible with Crossmint)
- Add a `sendTransaction` method that handles both wallet types internally
- Export the Crossmint wallet object for direct access when needed

**Updated Interface:**
```typescript
interface UnifiedWalletContextType {
  // Connection state
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  
  // Wallet information
  publicKey: PublicKey | null
  walletAddress: string | null
  walletType: 'crossmint' | 'adapter' | null
  
  // User information (for Crossmint users)
  user: CrossmintUser | null
  
  // Wallet metadata
  walletName: string | undefined
  walletIcon: string | undefined
  
  // Connection methods
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  // Transaction methods
  sendTransaction: (transaction: Transaction) => Promise<string>
  
  // Direct wallet access (for advanced use cases)
  crossmintWallet: CrossmintWallet | null
  adapterWallet: WalletContextState | null
}
```

**Key Changes:**
1. Remove `signTransaction` and `signAllTransactions` (not compatible with Crossmint)
2. Keep only `sendTransaction` which will handle both wallet types
3. Expose `crossmintWallet` for direct access to Crossmint SDK methods

### 2. Updated useMarketActions Hook

**File:** `app/src/hooks/useMarketActions.ts`

**Changes Required:**
- Replace the `signAndSendTransaction` method with a wallet-type-aware implementation
- For Crossmint wallets: serialize transaction and use `wallet.send()`
- For adapter wallets: keep existing `signTransaction` + `sendRawTransaction` flow

**New Transaction Submission Method:**

```typescript
const submitTransaction = useCallback(async (
  transaction: Transaction,
  operationName: string,
): Promise<string> => {
  if (!publicKey) {
    throw new Error('Wallet not connected')
  }

  try {
    // For Crossmint wallets, use the SDK's send method
    if (walletType === 'crossmint') {
      if (!crossmintWallet) {
        throw new Error('Crossmint wallet not available')
      }

      toast.info('Please approve the transaction...')

      // Serialize the transaction to base58
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      })
      const base58Tx = bs58.encode(serializedTx)

      // Send using Crossmint SDK
      const result = await crossmintWallet.send({
        transaction: base58Tx,
      })

      // Extract signature from result
      const signature = result.txId || result.signature

      if (!signature) {
        throw new Error('No transaction signature returned from Crossmint')
      }

      return signature
    }

    // For adapter wallets, use the standard flow
    if (walletType === 'adapter') {
      toast.info('Please approve the transaction in your wallet...')
      const signedTx = await signTransaction(transaction)

      toast.info('Sending transaction...')
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      return signature
    }

    throw new Error('Unknown wallet type')
  } catch (error) {
    // Error handling...
  }
}, [publicKey, walletType, crossmintWallet, signTransaction, connection])
```

### 3. Transaction Serialization Utility

**File:** `app/src/lib/solana/transaction-serializer.ts` (NEW)

**Purpose:**
- Provide utility functions for serializing transactions to Base58 format
- Handle transaction serialization options correctly
- Provide helper methods for debugging transaction data

**Interface:**
```typescript
export class TransactionSerializer {
  /**
   * Serialize a transaction to Base58 format for Crossmint
   * @param transaction - The transaction to serialize
   * @returns Base58-encoded transaction string
   */
  static toBase58(transaction: Transaction): string {
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })
    return bs58.encode(serialized)
  }

  /**
   * Get transaction size in bytes
   * @param transaction - The transaction to measure
   * @returns Size in bytes
   */
  static getSize(transaction: Transaction): number {
    return transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).length
  }

  /**
   * Log transaction details for debugging
   * @param transaction - The transaction to log
   * @param label - Optional label for the log
   */
  static logDetails(transaction: Transaction, label?: string): void {
    const size = this.getSize(transaction)
    const instructions = transaction.instructions.length
    
    console.log(`[Transaction${label ? ` ${label}` : ''}]`, {
      size: `${size} bytes`,
      instructions,
      feePayer: transaction.feePayer?.toBase58(),
      recentBlockhash: transaction.recentBlockhash,
    })
  }
}
```

### 4. Enhanced Error Handling

**File:** `app/src/lib/crossmint/wallet-error-handler.ts`

**Changes Required:**
- Add specific error codes for Crossmint transaction failures
- Parse Crossmint API error responses
- Provide user-friendly error messages

**New Error Codes:**
```typescript
export const WALLET_ERROR_CODES = {
  // Existing codes...
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // New Crossmint-specific codes
  CROSSMINT_API_ERROR: 'CROSSMINT_API_ERROR',
  CROSSMINT_SIGNING_ERROR: 'CROSSMINT_SIGNING_ERROR',
  CROSSMINT_WALLET_NOT_READY: 'CROSSMINT_WALLET_NOT_READY',
  TRANSACTION_SERIALIZATION_ERROR: 'TRANSACTION_SERIALIZATION_ERROR',
} as const
```

**Enhanced Error Parser:**
```typescript
export class WalletErrorHandler {
  static parseCrossmintError(error: any): WalletError {
    // Parse Crossmint API error responses
    if (error.response?.data?.message) {
      const message = error.response.data.message
      
      if (message.includes('insufficient funds')) {
        return new WalletError(
          'Insufficient funds',
          WALLET_ERROR_CODES.INSUFFICIENT_FUNDS,
          'crossmint'
        )
      }
      
      if (message.includes('rejected') || message.includes('denied')) {
        return new WalletError(
          'Transaction rejected',
          WALLET_ERROR_CODES.TRANSACTION_REJECTED,
          'crossmint'
        )
      }
      
      if (message.includes('wallet not ready')) {
        return new WalletError(
          'Wallet not ready',
          WALLET_ERROR_CODES.CROSSMINT_WALLET_NOT_READY,
          'crossmint'
        )
      }
    }
    
    // Default Crossmint error
    return new WalletError(
      error.message || 'Transaction failed',
      WALLET_ERROR_CODES.CROSSMINT_API_ERROR,
      'crossmint'
    )
  }
}
```

## Data Models

### Crossmint Transaction Request

```typescript
interface CrossmintTransactionRequest {
  // Base58-encoded serialized transaction
  transaction: string
  
  // Optional parameters
  options?: {
    // Skip preflight checks
    skipPreflight?: boolean
    
    // Preflight commitment level
    preflightCommitment?: 'processed' | 'confirmed' | 'finalized'
  }
}
```

### Crossmint Transaction Response

```typescript
interface CrossmintTransactionResponse {
  // Transaction signature (also called txId)
  txId?: string
  signature?: string
  
  // Transaction status
  status?: 'pending' | 'confirmed' | 'failed'
  
  // Error information (if failed)
  error?: {
    message: string
    code?: string
  }
}
```

### Transaction Submission Result

```typescript
interface TransactionSubmissionResult {
  // Transaction signature
  signature: string
  
  // Wallet type used
  walletType: 'crossmint' | 'adapter'
  
  // Submission timestamp
  timestamp: number
  
  // Operation name
  operation: string
}
```

## Error Handling

### Error Categories

1. **Wallet Not Ready Errors**
   - Crossmint wallet not initialized
   - Wallet address not available
   - User not authenticated

2. **Transaction Building Errors**
   - Invalid instruction parameters
   - PDA derivation failures
   - Missing required accounts

3. **Transaction Serialization Errors**
   - Transaction too large
   - Invalid transaction structure
   - Missing required fields

4. **Transaction Submission Errors**
   - User rejection
   - Insufficient funds
   - Network errors
   - API errors

5. **Transaction Confirmation Errors**
   - Timeout waiting for confirmation
   - Transaction failed on-chain
   - Blockhash expired

### Error Handling Flow

```typescript
try {
  // 1. Build transaction
  const transaction = await buildTransaction()
  
  // 2. Simulate transaction
  const simulation = await simulateTransaction(transaction)
  if (!simulation.success) {
    // Handle simulation failure
  }
  
  // 3. Submit transaction
  const signature = await submitTransaction(transaction)
  
  // 4. Confirm transaction
  const confirmed = await confirmTransaction(signature)
  if (!confirmed) {
    // Handle confirmation failure
  }
  
  // 5. Success
  return signature
  
} catch (error) {
  // Parse error based on wallet type
  const walletError = walletType === 'crossmint'
    ? WalletErrorHandler.parseCrossmintError(error)
    : WalletErrorHandler.parseAdapterError(error)
  
  // Log error for debugging
  WalletErrorHandler.logError(walletError, operation, walletType)
  
  // Display user-friendly message
  const message = WalletErrorHandler.getUserMessage(walletError)
  toast.error(message)
  
  // Re-throw for caller to handle
  throw walletError
}
```

## Testing Strategy

### Unit Tests

1. **TransactionSerializer Tests**
   - Test Base58 encoding
   - Test transaction size calculation
   - Test serialization options

2. **WalletErrorHandler Tests**
   - Test Crossmint error parsing
   - Test error code mapping
   - Test user message generation

3. **Transaction Submission Tests**
   - Mock Crossmint wallet.send()
   - Mock adapter signTransaction()
   - Test wallet type detection
   - Test error handling

### Integration Tests

1. **Crossmint Transaction Flow**
   - Test market creation with Crossmint wallet
   - Test market joining with Crossmint wallet
   - Test market resolution with Crossmint wallet
   - Test reward withdrawal with Crossmint wallet

2. **Adapter Transaction Flow**
   - Test all operations with Phantom wallet
   - Test all operations with Solflare wallet
   - Verify no regression in existing functionality

3. **Error Scenarios**
   - Test user rejection handling
   - Test insufficient funds handling
   - Test network error handling
   - Test wallet not ready handling

### Manual Testing Checklist

**Crossmint Wallet Testing:**
- [ ] Authenticate with Google
- [ ] Wait for wallet creation
- [ ] Create a market (verify transaction succeeds)
- [ ] Join a market (verify transaction succeeds)
- [ ] Resolve a market (verify transaction succeeds)
- [ ] Withdraw rewards (verify transaction succeeds)
- [ ] Test transaction rejection
- [ ] Test with insufficient funds
- [ ] Verify transaction appears in Solana Explorer

**Traditional Wallet Testing:**
- [ ] Connect with Phantom
- [ ] Create a market (verify no regression)
- [ ] Join a market (verify no regression)
- [ ] Resolve a market (verify no regression)
- [ ] Withdraw rewards (verify no regression)
- [ ] Verify all existing functionality works

**Error Handling Testing:**
- [ ] Test with wallet not ready
- [ ] Test with network disconnected
- [ ] Test with expired session
- [ ] Verify error messages are user-friendly
- [ ] Verify errors are logged to console

## Security Considerations

### Transaction Security

1. **Transaction Validation**
   - Always simulate transactions before submission
   - Validate all instruction parameters
   - Check account permissions
   - Verify PDA derivations

2. **User Confirmation**
   - Display transaction details before submission
   - Show estimated fees
   - Require explicit user approval
   - Handle user rejection gracefully

3. **Error Information**
   - Log detailed errors for debugging
   - Display user-friendly messages only
   - Never expose sensitive information
   - Sanitize error messages

### Crossmint-Specific Security

1. **API Communication**
   - All communication with Crossmint API is over HTTPS
   - Authentication tokens are managed by Crossmint SDK
   - Transactions are signed server-side by Crossmint
   - Private keys never leave Crossmint's infrastructure

2. **Transaction Serialization**
   - Serialize with `requireAllSignatures: false` (Crossmint signs server-side)
   - Serialize with `verifySignatures: false` (no signatures yet)
   - Validate serialization before sending
   - Check transaction size limits

## Performance Considerations

### Transaction Submission Performance

1. **Crossmint Transactions**
   - Additional network round-trip to Crossmint API
   - Typical latency: 500-1000ms
   - Comparable to traditional wallet signing
   - No significant performance impact

2. **Serialization Performance**
   - Base58 encoding is fast (<1ms)
   - Transaction size typically 200-500 bytes
   - No performance concerns

3. **Error Handling Performance**
   - Error parsing is synchronous and fast
   - No performance impact

### Optimization Opportunities

1. **Parallel Operations**
   - Simulate transaction while waiting for user approval
   - Pre-fetch blockhash for faster transaction building
   - Cache PDA derivations when possible

2. **User Experience**
   - Show loading states immediately
   - Display progress indicators
   - Provide estimated completion times
   - Allow cancellation when appropriate

## Migration Strategy

### Phase 1: Add Transaction Serialization Utility

- Create TransactionSerializer class
- Add Base58 encoding support
- Add debugging utilities
- No breaking changes

### Phase 2: Update UnifiedWalletContext

- Remove incompatible methods
- Add Crossmint wallet exposure
- Update interface documentation
- Test with existing code

### Phase 3: Update useMarketActions Hook

- Implement wallet-type-aware transaction submission
- Add Crossmint wallet.send() flow
- Maintain adapter wallet flow
- Test all operations

### Phase 4: Enhance Error Handling

- Add Crossmint-specific error codes
- Implement error parsing
- Update error messages
- Test error scenarios

### Phase 5: Testing and Validation

- Run unit tests
- Run integration tests
- Perform manual testing
- Fix any issues

### Rollback Plan

- All changes are isolated to transaction submission
- Can revert to previous implementation if needed
- No database or state changes required
- Traditional wallet functionality unaffected

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "@crossmint/client-sdk-react-ui": "^0.1.x",
    "@solana/web3.js": "^1.95.x",
    "bs58": "^5.0.0"
  }
}
```

### Package: bs58

- Used for Base58 encoding of serialized transactions
- Required for Crossmint transaction submission
- Lightweight and well-maintained
- Already used by @solana/web3.js internally

## Future Enhancements

### Potential Improvements

1. **Transaction Batching**
   - Support multiple operations in single transaction
   - Reduce transaction fees
   - Improve user experience

2. **Transaction Retry Logic**
   - Automatic retry on network errors
   - Exponential backoff
   - User notification of retries

3. **Transaction History**
   - Store transaction history locally
   - Display past transactions
   - Link to Solana Explorer

4. **Advanced Error Recovery**
   - Automatic session refresh on expiration
   - Transaction resubmission after errors
   - Better error diagnostics

5. **Performance Monitoring**
   - Track transaction submission times
   - Monitor success/failure rates
   - Identify performance bottlenecks
