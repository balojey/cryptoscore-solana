import type { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { Buffer } from 'buffer'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { 
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from '@crossmint/client-sdk-react-ui'

import App from './App.tsx'
import { 
  CROSSMINT_CLIENT_API_KEY,
  CROSSMINT_LOGIN_METHODS,
  CROSSMINT_WALLET_CONFIG,
  isCrossmintEnabled,
} from './config/crossmint'

import './style.css'
import '@solana/wallet-adapter-react-ui/styles.css'

// Polyfill Buffer for browser
window.Buffer = Buffer

const queryClient = new QueryClient()

function Root() {
  // Get network from environment
  const network = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as WalletAdapterNetwork

  // Get RPC endpoint from environment or use devnet
  const endpoint = useMemo(
    () => import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network),
    [network],
  )

  // Initialize wallet adapters with explicit network configuration
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network],
  )

  // Check if Crossmint is enabled
  const crossmintEnabled = isCrossmintEnabled()

  return (
    <React.StrictMode>
      {crossmintEnabled ? (
        // Wrap with Crossmint providers when enabled
        <CrossmintProvider apiKey={CROSSMINT_CLIENT_API_KEY}>
          <CrossmintAuthProvider loginMethods={CROSSMINT_LOGIN_METHODS}>
            <CrossmintWalletProvider createOnLogin={CROSSMINT_WALLET_CONFIG}>
              <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                  <WalletModalProvider>
                    <QueryClientProvider client={queryClient}>
                      <App />
                    </QueryClientProvider>
                  </WalletModalProvider>
                </WalletProvider>
              </ConnectionProvider>
            </CrossmintWalletProvider>
          </CrossmintAuthProvider>
        </CrossmintProvider>
      ) : (
        // Use existing providers when Crossmint is not configured
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <QueryClientProvider client={queryClient}>
                <App />
              </QueryClientProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      )}
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration)
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  })
}
