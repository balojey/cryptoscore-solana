# Session Management and Persistence

This document describes the session management and persistence implementation for Crossmint social login users.

## Overview

The session management system provides automatic session restoration, token management, and secure logout functionality for users authenticated via Crossmint social login.

## Components

### SessionManager (`app/src/lib/crossmint/session-manager.ts`)

A utility class that handles session persistence and monitoring:

**Key Features:**
- Stores session metadata (auth method, timestamp, user ID) in localStorage
- Validates session age and determines if refresh is needed
- Monitors session health with periodic checks
- Provides user preference storage
- Handles session cleanup on logout

**Session Lifecycle:**
1. **Authentication**: When a user logs in via Crossmint, session metadata is stored
2. **Restoration**: On page load, the system checks for recent sessions and validates them
3. **Monitoring**: Active sessions are monitored every 5 minutes for health checks
4. **Expiration Warning**: Users are warned when their session is about to expire (within 1 hour)
5. **Logout**: All session data is cleared when the user logs out

### UnifiedWalletContext Updates

The UnifiedWalletContext has been enhanced with session management capabilities:

**Session Restoration (on mount):**
- Checks for recent sessions in localStorage
- Validates session age (max 7 days)
- Automatically restores valid sessions
- Clears invalid session data

**Session Monitoring:**
- Monitors active Crossmint sessions every 5 minutes
- Detects session expiration and prompts re-authentication
- Tracks token refresh needs (SDK handles refresh automatically)
- Shows warning when session is about to expire

**Logout Functionality:**
- Clears all session data from localStorage
- Calls Crossmint SDK logout method
- Maintains existing disconnect for traditional wallets
- Shows appropriate success messages

## Storage Keys

Session data is stored in localStorage with the following keys:

- `crossmint_last_auth_method`: The authentication method used (google, twitter, etc.)
- `crossmint_session_timestamp`: Timestamp when the session was created
- `crossmint_user_preferences`: User preferences (rememberMe, lastWalletAddress)

## Session Validation

Sessions are validated based on:

1. **Age**: Sessions older than 7 days are considered expired
2. **Refresh Threshold**: Sessions older than 1 day may need token refresh
3. **Token Validity**: The Crossmint SDK validates JWT tokens automatically

## Security Considerations

1. **Token Storage**: JWT tokens are managed by the Crossmint SDK and stored securely
2. **Session Metadata**: Only non-sensitive metadata is stored in localStorage
3. **Automatic Cleanup**: Session data is cleared on logout and when invalid
4. **Expiration Warnings**: Users are warned before session expiration

## User Experience

### Automatic Session Restoration

When a user returns to the application:
1. The system checks for a recent session
2. If valid, the user is automatically signed in
3. No re-authentication is required (unless session expired)

### Session Expiration

When a session is about to expire:
1. User receives a warning notification (1 hour before expiry)
2. User can continue working and save their progress
3. After expiration, user is prompted to sign in again

### Logout

When a user logs out:
1. All session data is cleared
2. User is disconnected from the wallet
3. Success message is displayed
4. User can sign in again at any time

## API Reference

### SessionManager Methods

```typescript
// Store session metadata
SessionManager.storeSessionMetadata({
  authMethod: 'google',
  userId: 'user123'
})

// Get session metadata
const metadata = SessionManager.getSessionMetadata()

// Clear all session data
SessionManager.clearAll()

// Check if session exists and is recent
const hasSession = SessionManager.hasRecentSession()

// Validate session
const validation = await SessionManager.validateSession()

// Monitor session health
await SessionManager.monitorSession(
  onSessionExpired,
  onRefreshNeeded
)

// Check if session is expiring soon
const expiringSoon = SessionManager.isSessionExpiringSoon()
```

## Testing

To test session management:

1. **Login**: Sign in with a social provider
2. **Refresh**: Reload the page - session should be restored
3. **Expiration**: Wait for session to expire (or manually clear tokens)
4. **Logout**: Click logout button - all data should be cleared
5. **Re-login**: Sign in again - new session should be created

## Future Enhancements

Potential improvements:

1. **Remember Me**: Option to extend session duration
2. **Multi-Device**: Sync sessions across devices
3. **Session History**: Track login history and active sessions
4. **Security Alerts**: Notify users of suspicious activity
5. **Biometric Auth**: Add biometric authentication for session restoration
