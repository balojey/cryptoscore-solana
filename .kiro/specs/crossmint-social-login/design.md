# Design Document

## Overview

This design integrates Crossmint authentication and wallet management into the CryptoScore platform, enabling users to authenticate via social login providers (Google, email OTP) while maintaining full backward compatibility with existing Solana wallet connections (Phantom, Solflare). The integration uses Crossmint's React SDK to provide a unified authentication experience and automatically creates Solana wallets for social login users.

The design follows a provider-based architecture that wraps the existing application with Crossmint providers, creating a unified wallet interface that abstracts the differences between Crossmint-managed wallets and traditional wallet adapter connections.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (React Components, Pages, Market Interactions)              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Unified Wallet Interface                        │
│  (Abstraction layer for wallet operations)                   │
└────────┬───────────────────────────────────┬────────────────┘
         │                                   │
┌────────▼──────────────┐         ┌─────────▼────────────────┐
│  Crossmint Wallet     │         │  Solana Wallet Adapter   │
│  (Social Login Users) │         │  (Traditional Wallets)   │
└───────────────────────┘         └──────────────────────────┘
```

### Provider Hierarchy

The application will be wrapped with the following provider structure:

```tsx
<CrossmintProvider apiKey={clientApiKey}>
  <CrossmintAuthProvider loginMethods={["google", "email", "web3:solana-only"]}>
    <CrossmintWalletProvider createOnLogin={{ chain: "solana", signer: { type: "PASSKEY" } }}>
      <ConnectionProvider endpoint={rpcEndpoint}>
        <WalletProvider wallets={[Phantom, Solflare]} autoConnect>
          <WalletModalProvider>
            <QueryClientProvider>
              <App />
            </QueryClientProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </CrossmintWalletProvider>
  </CrossmintAuthProvider>
</CrossmintProvider>
```

## Components and Interfaces

### 1. Unified Wallet Context

Create a new context that provides a unified interface for both Crossmint and traditional wallets.

**File:** `app/src/contexts/UnifiedWalletContext.tsx`

**Interface:**
```typescript
interface UnifiedWalletContextType {
  // Connection state
  connected: boolean
  connecting: boolean
  
  // Wallet information
  publicKey: PublicKey | null
  walletAddress: string | null
  walletType: 'crossmint' | 'adapter' | null
  
  // User information (for Crossmint users)
  user: CrossmintUser | null
  
  // Connection methods
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  // Transaction methods
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
  sendTransaction: (transaction: Transaction) => Promise<string>
}
```

**Responsibilities:**
- Detect which wallet system is active (Crossmint or traditional adapter)
- Provide a unified API for wallet operations
- Handle connection state management
- Abstract transaction signing for both wallet types

### 2. Enhanced Connect Component

Update the existing Connect component to support both authentication methods.

**File:** `app/src/components/Connect.tsx`

**Features:**
- Display a unified login button when disconnected
- Show a modal with both social login options and traditional wallet options
- Display appropriate account information based on wallet type
- Handle logout for both authentication methods

**UI Structure:**
```
┌─────────────────────────────────────┐
│  Connect Button (when disconnected) │
└─────────────────────────────────────┘
              │ (click)
              ▼
┌─────────────────────────────────────┐
│     Authentication Modal            │
├─────────────────────────────────────┤
│  Social Login Options:              │
│  ┌─────────────────────────────┐   │
│  │  [G] Sign in with Google    │   │
│  │  [@] Sign in with Email     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─────────── OR ───────────         │
│                                     │
│  Wallet Connections:                │
│  ┌─────────────────────────────┐   │
│  │  [👻] Phantom               │   │
│  │  [🔥] Solflare              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 3. Crossmint Wallet Adapter

Create an adapter that makes Crossmint wallets compatible with the existing Solana wallet adapter interface.

**File:** `app/src/lib/crossmint/CrossmintWalletAdapter.ts`

**Purpose:**
- Implement the Solana wallet adapter interface for Crossmint wallets
- Enable seamless integration with existing transaction code
- Handle transaction signing using Crossmint's SDK

**Key Methods:**
```typescript
class CrossmintWalletAdapter implements WalletAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  signTransaction(transaction: Transaction): Promise<Transaction>
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>
  sendTransaction(transaction: Transaction, connection: Connection): Promise<string>
}
```

### 4. Enhanced Account Component

Update the Account component to display appropriate information for both wallet types.

**File:** `app/src/components/Account.tsx`

**Display Logic:**
- For Crossmint users: Show email/social username + wallet address
- For traditional wallet users: Show wallet address (existing behavior)
- Show wallet type indicator
- Provide logout/disconnect button

### 5. Authentication Modal Component

Create a new modal component for the unified authentication experience.

**File:** `app/src/components/auth/AuthModal.tsx`

**Features:**
- Display social login buttons using Crossmint's UI components
- Display traditional wallet connection buttons
- Handle authentication flow for both methods
- Show loading states during authentication
- Display error messages for failed authentication attempts

## Data Models

### Unified Wallet State

```typescript
interface UnifiedWalletState {
  // Connection status
  connected: boolean
  connecting: boolean
  
  // Wallet data
  publicKey: PublicKey | null
  walletAddress: string | null
  walletType: 'crossmint' | 'adapter' | null
  
  // Crossmint-specific data
  crossmintUser: {
    userId: string
    email?: string
    phoneNumber?: string
    google?: { displayName: string }
  } | null
  
  // Traditional wallet data
  adapterWallet: {
    name: string
    icon: string
  } | null
}
```

### Environment Configuration

```typescript
interface CrossmintConfig {
  clientApiKey: string
  environment: 'staging' | 'production'
  loginMethods: Array<'google' | 'email' | 'web3:solana-only'>
  walletConfig: {
    chain: 'solana'
    signer: {
      type: 'PASSKEY'
    }
  }
}
```

## Error Handling

### Error Types

1. **Authentication Errors**
   - Social login failure (user cancels, provider error)
   - Traditional wallet connection failure
   - Session expiration
   - JWT token refresh failure

2. **Transaction Errors**
   - Transaction signing failure
   - Insufficient funds
   - Network errors
   - User rejection

3. **Configuration Errors**
   - Missing API keys
   - Invalid environment configuration
   - Unsupported network

### Error Handling Strategy

```typescript
class WalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public walletType: 'crossmint' | 'adapter'
  ) {
    super(message)
  }
}

// Error codes
const ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
} as const
```

### User-Facing Error Messages

- Display toast notifications for all errors
- Provide actionable error messages (e.g., "Please try connecting again")
- Log detailed errors to console for debugging
- Gracefully handle session expiration with re-authentication prompt

## Testing Strategy

### Unit Tests

1. **UnifiedWalletContext Tests**
   - Test wallet type detection
   - Test connection state management
   - Test transaction signing for both wallet types
   - Test error handling

2. **CrossmintWalletAdapter Tests**
   - Test adapter interface implementation
   - Test transaction signing
   - Test connection/disconnection
   - Mock Crossmint SDK responses

3. **Component Tests**
   - Test Connect component rendering
   - Test AuthModal interactions
   - Test Account component display logic
   - Test error state rendering

### Integration Tests

1. **Authentication Flow Tests**
   - Test social login flow (mocked)
   - Test traditional wallet connection flow
   - Test logout/disconnect flow
   - Test session persistence

2. **Transaction Flow Tests**
   - Test market creation with Crossmint wallet
   - Test market joining with Crossmint wallet
   - Test market resolution with Crossmint wallet
   - Test transaction signing with both wallet types

3. **Error Scenario Tests**
   - Test authentication failure handling
   - Test transaction rejection handling
   - Test network error handling
   - Test session expiration handling

### Manual Testing Checklist

- [ ] Social login with Google
- [ ] Email OTP login
- [ ] Traditional wallet connection (Phantom)
- [ ] Traditional wallet connection (Solflare)
- [ ] Create market with Crossmint wallet
- [ ] Join market with Crossmint wallet
- [ ] Resolve market with Crossmint wallet
- [ ] Withdraw rewards with Crossmint wallet
- [ ] Logout from social login
- [ ] Disconnect traditional wallet
- [ ] Session persistence after page refresh
- [ ] Error handling for failed authentication
- [ ] Error handling for rejected transactions

## Security Considerations

### Authentication Security

1. **JWT Token Management**
   - Store JWT tokens in secure browser storage (httpOnly cookies preferred)
   - Implement automatic token refresh
   - Clear tokens on logout
   - Validate token expiration

2. **API Key Security**
   - Store API keys in environment variables
   - Never expose server-side API keys in client code
   - Use client-side API keys with appropriate scopes only
   - Separate keys for staging and production

3. **Transaction Security**
   - Always require user confirmation before signing transactions
   - Display transaction details before signing
   - Validate transaction parameters
   - Handle transaction errors gracefully

### Data Privacy

1. **User Data**
   - Only request necessary user information
   - Store minimal user data locally
   - Clear user data on logout
   - Comply with privacy regulations

2. **Wallet Data**
   - Never expose private keys
   - Use Crossmint's secure wallet management
   - Display wallet addresses safely
   - Implement proper access controls

## Migration Strategy

### Phase 1: Add Crossmint Providers (Non-Breaking)

- Install Crossmint SDK packages
- Add Crossmint providers to application
- Configure environment variables
- No changes to existing functionality

### Phase 2: Implement Unified Wallet Context

- Create UnifiedWalletContext
- Implement CrossmintWalletAdapter
- Test with existing wallet connections
- Ensure backward compatibility

### Phase 3: Update UI Components

- Update Connect component
- Create AuthModal component
- Update Account component
- Add social login options

### Phase 4: Testing and Refinement

- Conduct thorough testing
- Fix bugs and edge cases
- Optimize user experience
- Document usage

### Rollback Plan

- All changes are additive and non-breaking
- Traditional wallet connections remain unchanged
- Can disable Crossmint features via environment variable
- No database migrations required

## Performance Considerations

### Bundle Size

- Crossmint SDK adds approximately 150KB to bundle
- Use code splitting to load Crossmint components on demand
- Lazy load authentication modal
- Tree-shake unused Crossmint features

### Runtime Performance

- Minimize re-renders in UnifiedWalletContext
- Cache wallet state appropriately
- Optimize transaction signing flow
- Use React.memo for expensive components

### Network Performance

- Implement request caching for user data
- Batch multiple API calls when possible
- Handle network errors gracefully
- Implement retry logic for failed requests

## Accessibility

### Keyboard Navigation

- Ensure all authentication options are keyboard accessible
- Implement proper focus management in modals
- Add keyboard shortcuts for common actions
- Support tab navigation through all interactive elements

### Screen Reader Support

- Add ARIA labels to all buttons and interactive elements
- Announce authentication state changes
- Provide descriptive error messages
- Ensure modal dialogs are properly announced

### Visual Accessibility

- Maintain sufficient color contrast
- Support high contrast mode
- Provide visual feedback for all actions
- Ensure text is readable at different zoom levels

## Future Enhancements

### Potential Improvements

1. **Multi-Wallet Support**
   - Allow users to link multiple authentication methods
   - Switch between wallets without disconnecting
   - Aggregate balances across wallets

2. **Enhanced User Profiles**
   - Store user preferences
   - Display user statistics
   - Social features (following, sharing)

3. **Advanced Security**
   - Two-factor authentication
   - Biometric authentication
   - Transaction limits and approvals

4. **Wallet Management**
   - View transaction history
   - Export wallet data
   - Backup and recovery options
