/**
 * Unified Wallet Context
 *
 * Provides a unified interface for both Crossmint-managed wallets and
 * traditional Solana wallet adapter connections. This abstraction allows
 * the application to work seamlessly with both authentication methods.
 */

import type { Transaction, VersionedTransaction } from '@solana/web3.js'
import { useAuth, useWallet as useCrossmintWallet, type Wallet, type Chain } from '@crossmint/client-sdk-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import React, { createContext, use, useCallback, useMemo, useState } from 'react'

/**
 * Wallet type discriminator
 */
export type WalletType = 'crossmint' | 'adapter' | null

/**
 * Crossmint user information
 */
export interface CrossmintUser {
  userId: string
  email?: string
  phoneNumber?: string
  google?: { displayName: string }
  twitter?: { username: string }
  farcaster?: { username: string }
}

/**
 * Unified wallet context interface
 */
export interface UnifiedWalletContextType {
  // Connection state
  connected: boolean
  connecting: boolean
  disconnecting: boolean

  // Wallet information
  publicKey: PublicKey | null
  walletAddress: string | null
  walletType: WalletType

  // User information (for Crossmint users)
  user: CrossmintUser | null

  // Wallet metadata
  walletName: string | undefined
  walletIcon: string | undefined

  // Connection methods
  connect: () => Promise<void>
  disconnect: () => Promise<void>

  // Transaction methods
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>
  signAllTransactions: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>
  sendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>
}

/**
 * Create the context with undefined default
 */
const UnifiedWalletContext = createContext<UnifiedWalletContextType | undefined>(undefined)

/**
 * Props for UnifiedWalletProvider
 */
export interface UnifiedWalletProviderProps {
  children: React.ReactNode
}

/**
 * Unified Wallet Provider Component
 *
 * Wraps the application and provides unified wallet functionality
 * by combining Crossmint and Solana wallet adapter contexts.
 */
export function UnifiedWalletProvider({ children }: UnifiedWalletProviderProps) {
  // Get Solana wallet adapter state
  const adapterWallet = useWallet()

  // Get Crossmint auth and wallet state
  const crossmintAuth = useAuth()
  const crossmintWalletContext = useCrossmintWallet()
  const crossmintWallet = crossmintWalletContext.wallet

  // Track internal connection state
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Determine which wallet type is active
  const walletType: WalletType = useMemo(() => {
    // Check if Crossmint wallet is connected
    if (crossmintAuth.isAuthenticated && crossmintWallet?.address) {
      return 'crossmint'
    }

    // Check if adapter wallet is connected
    if (adapterWallet.connected && adapterWallet.publicKey) {
      return 'adapter'
    }

    return null
  }, [
    crossmintAuth.isAuthenticated,
    crossmintWallet?.address,
    adapterWallet.connected,
    adapterWallet.publicKey,
  ])

  // Get public key based on wallet type
  const publicKey = useMemo(() => {
    if (walletType === 'crossmint' && crossmintWallet?.address) {
      try {
        return new PublicKey(crossmintWallet.address)
      }
      catch (error) {
        console.error('Failed to parse Crossmint wallet address:', error)
        return null
      }
    }

    if (walletType === 'adapter') {
      return adapterWallet.publicKey
    }

    return null
  }, [walletType, crossmintWallet?.address, adapterWallet.publicKey])

  // Get wallet address string
  const walletAddress = useMemo(() => {
    return publicKey?.toBase58() || null
  }, [publicKey])

  // Extract Crossmint user information
  const user: CrossmintUser | null = useMemo(() => {
    if (walletType !== 'crossmint' || !crossmintAuth.user) {
      return null
    }

    return {
      userId: crossmintAuth.user.id || '',
      email: crossmintAuth.user.email,
      phoneNumber: crossmintAuth.user.phoneNumber,
      google: crossmintAuth.user.google,
      twitter: crossmintAuth.user.twitter,
      farcaster: crossmintAuth.user.farcaster,
    }
  }, [walletType, crossmintAuth.user])

  // Get wallet name and icon
  const walletName = useMemo(() => {
    if (walletType === 'crossmint') {
      return 'Crossmint'
    }
    return adapterWallet.wallet?.adapter.name
  }, [walletType, adapterWallet.wallet])

  const walletIcon = useMemo(() => {
    if (walletType === 'crossmint') {
      // Crossmint logo or icon URL
      return 'https://www.crossmint.com/assets/crossmint/logo.png'
    }
    return adapterWallet.wallet?.adapter.icon
  }, [walletType, adapterWallet.wallet])

  // Determine connection state
  const connected = useMemo(() => {
    return walletType !== null
  }, [walletType])

  const connecting = useMemo(() => {
    return isConnecting || adapterWallet.connecting
  }, [isConnecting, adapterWallet.connecting])

  const disconnecting = useMemo(() => {
    return isDisconnecting || adapterWallet.disconnecting
  }, [isDisconnecting, adapterWallet.disconnecting])

  // Connect method - delegates to appropriate wallet system
  const connect = useCallback(async () => {
    setIsConnecting(true)
    try {
      // For now, this will be handled by the AuthModal component
      // which will call the appropriate login method
      // This is a placeholder for future direct connection support
      console.log('Connect called - should open auth modal')
    }
    finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect method - handles both wallet types
  const disconnect = useCallback(async () => {
    setIsDisconnecting(true)
    try {
      if (walletType === 'crossmint') {
        // Logout from Crossmint
        await crossmintAuth.logout()
      }
      else if (walletType === 'adapter') {
        // Disconnect adapter wallet
        await adapterWallet.disconnect()
      }
    }
    catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
    finally {
      setIsDisconnecting(false)
    }
  }, [walletType, crossmintAuth, adapterWallet])

  // Sign transaction - delegates to appropriate wallet
  const signTransaction = useCallback(async <T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> => {
    if (!connected) {
      throw new Error('Wallet not connected')
    }

    if (walletType === 'crossmint') {
      // Crossmint wallets use a different transaction model
      // They handle signing internally through their sendTransaction method
      // For now, we'll throw an error and require using sendTransaction instead
      throw new Error('Crossmint wallets do not support direct transaction signing. Use sendTransaction instead.')
    }

    if (walletType === 'adapter') {
      // Use adapter wallet to sign
      if (!adapterWallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing')
      }
      return await adapterWallet.signTransaction(transaction) as T
    }

    throw new Error('No wallet connected')
  }, [connected, walletType, adapterWallet])

  // Sign all transactions - delegates to appropriate wallet
  const signAllTransactions = useCallback(async <T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> => {
    if (!connected) {
      throw new Error('Wallet not connected')
    }

    if (walletType === 'crossmint') {
      // Crossmint wallets use a different transaction model
      throw new Error('Crossmint wallets do not support signing multiple transactions')
    }

    if (walletType === 'adapter') {
      // Use adapter wallet to sign all
      if (!adapterWallet.signAllTransactions) {
        throw new Error('Wallet does not support signing multiple transactions')
      }
      return await adapterWallet.signAllTransactions(transactions) as T[]
    }

    throw new Error('No wallet connected')
  }, [connected, walletType, adapterWallet])

  // Send transaction - delegates to appropriate wallet
  const sendTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction,
  ): Promise<string> => {
    if (!connected) {
      throw new Error('Wallet not connected')
    }

    if (walletType === 'crossmint') {
      // Crossmint wallets use their own transaction API
      // This method is not directly compatible with Solana Transaction objects
      // Applications should use Crossmint's wallet.send() method directly for Crossmint wallets
      throw new Error('Crossmint wallets require using the Crossmint SDK transaction methods directly')
    }

    if (walletType === 'adapter') {
      // Use adapter wallet to send
      if (!adapterWallet.sendTransaction) {
        throw new Error('Wallet does not support sending transactions')
      }
      // Note: adapter sendTransaction requires connection and options
      // We'll need to get the connection from context or pass it
      throw new Error('Adapter sendTransaction requires connection - use signTransaction instead')
    }

    throw new Error('No wallet connected')
  }, [connected, walletType, adapterWallet])

  // Create context value
  const value: UnifiedWalletContextType = useMemo(
    () => ({
      connected,
      connecting,
      disconnecting,
      publicKey,
      walletAddress,
      walletType,
      user,
      walletName,
      walletIcon,
      connect,
      disconnect,
      signTransaction,
      signAllTransactions,
      sendTransaction,
    }),
    [
      connected,
      connecting,
      disconnecting,
      publicKey,
      walletAddress,
      walletType,
      user,
      walletName,
      walletIcon,
      connect,
      disconnect,
      signTransaction,
      signAllTransactions,
      sendTransaction,
    ],
  )

  return (
    <UnifiedWalletContext value={value}>
      {children}
    </UnifiedWalletContext>
  )
}

/**
 * Hook to use the unified wallet context
 *
 * @throws Error if used outside of UnifiedWalletProvider
 */
export function useUnifiedWallet(): UnifiedWalletContextType {
  const context = use(UnifiedWalletContext)

  if (context === undefined) {
    throw new Error('useUnifiedWallet must be used within a UnifiedWalletProvider')
  }

  return context
}
