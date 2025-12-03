/**
 * Authentication Modal Component
 *
 * Provides a unified authentication experience with both social login
 * (via Crossmint) and traditional Solana wallet connections.
 *
 * @module components/auth/AuthModal
 */

import { useAuth } from '@crossmint/client-sdk-react-ui'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isCrossmintEnabled } from '@/config/crossmint'
import { WALLET_ERROR_CODES, WalletErrorHandler } from '@/lib/crossmint/wallet-error-handler'

/**
 * Props for AuthModal component
 */
export interface AuthModalProps {
  /** Controls whether the modal is visible */
  open: boolean

  /** Callback function to control modal visibility */
  onOpenChange: (open: boolean) => void
}

/**
 * Authentication Modal Component
 *
 * Displays a unified authentication interface that allows users to choose
 * between social login methods (via Crossmint) and traditional Solana
 * wallet connections.
 *
 * Features:
 * - Social login options (Google, Twitter/X, Farcaster, Email)
 * - Traditional wallet connection (Phantom, Solflare, etc.)
 * - Loading states during authentication
 * - Error handling with user-friendly messages
 * - Automatic modal closure on successful authentication
 *
 * @param props - Component props
 * @returns Authentication modal component
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 *
 * <AuthModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const crossmintAuth = useAuth()
  const { setVisible: setWalletModalVisible } = useWalletModal()

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null)

  const crossmintEnabled = isCrossmintEnabled()

  /**
   * Handle social login via Crossmint
   *
   * Initiates the authentication flow for the selected social provider.
   * The user will be redirected to the provider's authentication page.
   *
   * @param method - The authentication method to use
   */
  const handleSocialLogin = async (method: 'google' | 'twitter' | 'farcaster' | 'email') => {
    setIsLoading(true)
    setLoadingMethod(method)

    try {
      // Trigger Crossmint authentication
      // The login method will redirect to the provider's auth page
      // @ts-expect-error - Crossmint SDK types may not be fully accurate
      await crossmintAuth.login({ loginMethod: method })

      // Note: Modal will be closed automatically when user returns from auth
      // or we can close it immediately since the redirect will happen
      toast.success(`Redirecting to ${method} login...`)
    }
    catch (error) {
      // Use WalletErrorHandler to parse and log the error
      WalletErrorHandler.logError(error, `socialLogin:${method}`, 'crossmint')
      const walletError = WalletErrorHandler.parseError(error, 'crossmint', `socialLogin:${method}`)

      // Get user-friendly error message
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Show appropriate error message based on error type
      if (walletError.code === WALLET_ERROR_CODES.AUTH_CANCELLED) {
        toast.info('Authentication was cancelled')
      }
      else if (walletError.code === WALLET_ERROR_CODES.AUTH_TIMEOUT) {
        toast.error('Authentication timed out. Please try again.')
      }
      else if (WalletErrorHandler.isRecoverable(walletError)) {
        toast.error(`${errorMessage} Please try again.`)
      }
      else {
        toast.error(errorMessage)
      }

      setIsLoading(false)
      setLoadingMethod(null)
    }
  }

  /**
   * Handle traditional wallet connection
   *
   * Opens the Solana wallet adapter modal to allow users to connect
   * their traditional crypto wallets (Phantom, Solflare, etc.).
   */
  const handleWalletConnect = () => {
    try {
      // Close auth modal
      onOpenChange(false)

      // Open the wallet adapter modal
      setWalletModalVisible(true)
    }
    catch (error) {
      // Use WalletErrorHandler to parse and log the error
      WalletErrorHandler.logError(error, 'walletConnect', 'adapter')
      const walletError = WalletErrorHandler.parseError(error, 'adapter', 'walletConnect')

      // Get user-friendly error message
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)
      toast.error(errorMessage)
    }
  }

  /**
   * Check if a specific authentication method is currently loading
   *
   * @param method - The authentication method to check
   * @returns True if the method is currently processing
   */
  const isMethodLoading = (method: string) => {
    return isLoading && loadingMethod === method
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-jakarta">
            Connect to CryptoScore
          </DialogTitle>
          <DialogDescription>
            Choose your preferred authentication method to get started
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Social Login Section */}
          {crossmintEnabled && (
            <>
              <div className="flex flex-col gap-2">
                <p
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Social Login
                </p>

                {/* Google Login */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="w-full justify-start gap-3 h-12"
                >
                  {isMethodLoading('google') ? (
                    <span className="icon-[mdi--loading] w-5 h-5 animate-spin" />
                  ) : (
                    <span className="icon-[mdi--google] w-5 h-5" />
                  )}
                  <span className="flex-1 text-left">Sign in with Google</span>
                </Button>

                {/* Twitter/X Login */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSocialLogin('twitter')}
                  disabled={isLoading}
                  className="w-full justify-start gap-3 h-12"
                >
                  {isMethodLoading('twitter') ? (
                    <span className="icon-[mdi--loading] w-5 h-5 animate-spin" />
                  ) : (
                    <span className="icon-[mdi--twitter] w-5 h-5" />
                  )}
                  <span className="flex-1 text-left">Sign in with Twitter</span>
                </Button>

                {/* Farcaster Login */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSocialLogin('farcaster')}
                  disabled={isLoading}
                  className="w-full justify-start gap-3 h-12"
                >
                  {isMethodLoading('farcaster') ? (
                    <span className="icon-[mdi--loading] w-5 h-5 animate-spin" />
                  ) : (
                    <span className="icon-[mdi--cast] w-5 h-5" />
                  )}
                  <span className="flex-1 text-left">Sign in with Farcaster</span>
                </Button>

                {/* Email Login */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSocialLogin('email')}
                  disabled={isLoading}
                  className="w-full justify-start gap-3 h-12"
                >
                  {isMethodLoading('email') ? (
                    <span className="icon-[mdi--loading] w-5 h-5 animate-spin" />
                  ) : (
                    <span className="icon-[mdi--email] w-5 h-5" />
                  )}
                  <span className="flex-1 text-left">Sign in with Email</span>
                </Button>
              </div>

              {/* Separator */}
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div
                    className="w-full border-t"
                    style={{ borderColor: 'var(--border-default)' }}
                  />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span
                    className="px-2 font-semibold"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    Or
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Traditional Wallet Section */}
          <div className="flex flex-col gap-2">
            <p
              className="text-xs font-semibold uppercase mb-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Wallet Connection
            </p>

            <Button
              variant="outline"
              size="lg"
              onClick={handleWalletConnect}
              disabled={isLoading}
              className="w-full justify-start gap-3 h-12"
            >
              <span className="icon-[mdi--wallet] w-5 h-5" />
              <span className="flex-1 text-left">Connect Wallet</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Phantom, Solflare, etc.
              </span>
            </Button>
          </div>

          {/* Info Text */}
          <p
            className="text-xs text-center mt-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
