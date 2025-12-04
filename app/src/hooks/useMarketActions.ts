import type { FeeEstimate } from '../lib/solana/transaction-builder'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { FACTORY_PROGRAM_ID, MARKET_PROGRAM_ID } from '../config/programs'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { WALLET_ERROR_CODES, WalletErrorHandler } from '../lib/crossmint/wallet-error-handler'
import { SolanaErrorHandler } from '../lib/solana/error-handler'
import { InstructionEncoder } from '../lib/solana/instruction-encoder'
import { PDAUtils } from '../lib/solana/pda-utils'
import { TransactionBuilder } from '../lib/solana/transaction-builder'
import { TransactionSerializer } from '../lib/solana/transaction-serializer'
import { SolanaUtils } from '../lib/solana/utils'
import { MatchOutcome, PredictionChoice } from '../types/solana-program-types'

export type MatchOutcomeType = 'Home' | 'Draw' | 'Away'

export interface CreateMarketParams {
  matchId: string
  entryFee: number // in lamports
  kickoffTime: number
  endTime: number
  isPublic: boolean
}

export interface JoinMarketParams {
  marketAddress: string
  prediction: MatchOutcomeType
}

export interface ResolveMarketParams {
  marketAddress: string
  outcome: MatchOutcomeType
}

/**
 * Hook for performing market actions (create, join, resolve, withdraw)
 * Handles transaction signing, confirmation, and loading states
 */
export interface SimulationResult {
  success: boolean
  logs?: string[]
  error?: string
}

export function useMarketActions() {
  const { connection } = useConnection()
  const { publicKey, walletType, crossmintWallet, adapterWallet } = useUnifiedWallet()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [estimatedFee, setEstimatedFee] = useState<FeeEstimate | null>(null)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)

  /**
   * Simulate a transaction before sending
   * Logs results and returns simulation outcome
   */
  const simulateBeforeSend = useCallback(async (
    transaction: any,
    operationName: string,
  ): Promise<boolean> => {
    console.log(`Simulating ${operationName} transaction...`)

    const simulation = await SolanaUtils.simulateTransaction(connection, transaction)
    setSimulationResult(simulation)

    if (simulation.success) {
      console.log(`✅ ${operationName} simulation successful`)
      if (simulation.logs && simulation.logs.length > 0) {
        console.log('Simulation logs:', simulation.logs)
      }
      return true
    }
    else {
      console.error(`❌ ${operationName} simulation failed:`, simulation.error)
      if (simulation.logs && simulation.logs.length > 0) {
        console.error('Simulation logs:', simulation.logs)
      }

      // Warn user about simulation failure
      const shouldProceed = window.confirm(
        `Transaction simulation failed: ${simulation.error}\n\n`
        + 'This transaction may fail on-chain. Do you want to proceed anyway?\n\n'
        + 'Click OK to proceed or Cancel to abort.',
      )

      return shouldProceed
    }
  }, [connection])

  /**
   * Submit a transaction using the appropriate wallet method
   * Handles both Crossmint and adapter wallets with wallet-type-aware logic
   */
  const submitTransaction = useCallback(async (
    transaction: any,
    operationName: string,
  ): Promise<string> => {
    // Validate wallet connection
    if (!publicKey) {
      const error = WalletErrorHandler.parseError(
        new Error('Wallet not connected'),
        walletType,
        operationName,
      )
      throw error
    }

    // Log transaction submission details
    console.log(`[${operationName}] Submitting transaction with wallet type: ${walletType}`)
    TransactionSerializer.logDetails(transaction, operationName)

    try {
      // Handle Crossmint wallet transaction flow
      if (walletType === 'crossmint') {
        if (!crossmintWallet) {
          throw new Error('Crossmint wallet not available')
        }

        console.log(`[${operationName}] Using Crossmint wallet flow`)
        
        // Show user feedback
        toast.info('Please approve the transaction...')

        // Serialize transaction to Base58 format for Crossmint
        const base58Tx = TransactionSerializer.toBase58(transaction)
        console.log(`[${operationName}] Transaction serialized (${TransactionSerializer.getSize(transaction)} bytes)`)

        // Send using Crossmint SDK
        toast.info('Sending transaction...')
        const result = await crossmintWallet.send({
          transaction: base58Tx,
        })

        console.log(`[${operationName}] Crossmint response:`, result)

        // Extract signature from Crossmint response
        const signature = result.txId || result.signature

        if (!signature) {
          throw new Error('No transaction signature returned from Crossmint')
        }

        console.log(`[${operationName}] Transaction signature: ${signature}`)
        return signature
      }

      // Handle adapter wallet transaction flow
      if (walletType === 'adapter') {
        if (!adapterWallet?.signTransaction) {
          throw new Error('Adapter wallet does not support transaction signing')
        }

        console.log(`[${operationName}] Using adapter wallet flow`)

        // Show user feedback
        toast.info('Please approve the transaction in your wallet...')

        // Sign the transaction using adapter wallet
        const signedTx = await adapterWallet.signTransaction(transaction)

        // Send the signed transaction
        toast.info('Sending transaction...')
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })

        console.log(`[${operationName}] Transaction signature: ${signature}`)
        return signature
      }

      throw new Error('Unknown wallet type')
    }
    catch (error) {
      // Parse the error using appropriate handler based on wallet type
      const walletError = walletType === 'crossmint'
        ? WalletErrorHandler.parseCrossmintError(error, operationName)
        : WalletErrorHandler.parseError(error, walletType, operationName)

      // Log the error for debugging
      WalletErrorHandler.logError(walletError, operationName, walletType)

      // Get user-friendly error message
      const userMessage = WalletErrorHandler.getUserMessage(walletError)

      // Display user-friendly error message with toast
      toast.error(userMessage)

      throw walletError
    }
  }, [publicKey, walletType, crossmintWallet, adapterWallet, connection])

  /**
   * Create a new prediction market
   */
  const createMarket = useCallback(async (params: CreateMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const factoryProgramId = new PublicKey(FACTORY_PROGRAM_ID)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

      // Derive Factory and Market PDAs using PDAUtils
      const factoryPdaUtils = new PDAUtils(factoryProgramId)
      const marketPdaUtils = new PDAUtils(marketProgramId)

      const { pda: factoryPda } = await factoryPdaUtils.findFactoryPDA()
      const { pda: marketPda } = await marketPdaUtils.findMarketPDA(factoryPda, params.matchId)

      console.log('Factory PDA:', factoryPda.toString())
      console.log('Market PDA:', marketPda.toString())

      // Build instruction using InstructionEncoder
      const encoder = new InstructionEncoder(marketProgramId)
      const createMarketInstruction = encoder.createMarket(
        {
          matchId: params.matchId,
          entryFee: BigInt(params.entryFee),
          kickoffTime: BigInt(params.kickoffTime),
          endTime: BigInt(params.endTime),
          isPublic: params.isPublic,
        },
        {
          factory: factoryPda,
          market: marketPda,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        },
      )

      // Build transaction using TransactionBuilder
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1,
      })

      builder.addInstruction(createMarketInstruction)

      // Estimate fee before building final transaction
      const feeEstimate = await builder.previewFee(connection, publicKey)
      setEstimatedFee(feeEstimate)

      if (feeEstimate.success) {
        console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
      }
      else {
        console.warn('Fee estimation failed:', feeEstimate.error)
        // Continue with transaction even if fee estimation fails
      }

      const transaction = await builder.build(connection)
      transaction.feePayer = publicKey

      // Simulate transaction before sending
      const shouldProceed = await simulateBeforeSend(transaction, 'createMarket')
      if (!shouldProceed) {
        toast.error('Transaction cancelled by user')
        return null
      }

      // Submit transaction using wallet-type-aware method
      const signature = await submitTransaction(transaction, 'createMarket')

      console.log('Transaction sent:', signature)
      toast.info('Confirming transaction...')

      // Confirm transaction with retry logic
      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

      if (!confirmed) {
        const error = WalletErrorHandler.parseError(
          new Error('Transaction confirmation failed'),
          walletType,
          'createMarket',
        )
        throw error
      }

      setTxSignature(signature)

      // Handle success with toast notification and cache invalidation
      toast.success('Market created successfully!', {
        description: 'Your market is now live',
        action: {
          label: 'View',
          onClick: () => {
            window.open(SolanaUtils.getExplorerUrl(signature, import.meta.env.VITE_SOLANA_NETWORK || 'devnet'), '_blank')
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['markets'] })

      return signature
    }
    catch (error: any) {
      // Check if it's already a WalletError
      if (error.name === 'WalletError') {
        // Already handled by signAndSendTransaction
        return null
      }

      // Handle errors with both handlers for backward compatibility
      SolanaErrorHandler.logError(error, 'createMarket')
      WalletErrorHandler.logError(error, 'createMarket', walletType)

      const walletError = WalletErrorHandler.parseError(error, walletType, 'createMarket')
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Only show toast if not already shown by signAndSendTransaction
      if (!error.message?.includes('rejected') && !error.message?.includes('insufficient')) {
        toast.error(errorMessage)
      }

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, queryClient, simulateBeforeSend, submitTransaction, walletType])

  /**
   * Join an existing market with a prediction
   */
  const joinMarket = useCallback(async (params: JoinMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(params.marketAddress)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

      // Derive participant PDA using PDAUtils
      const pdaUtils = new PDAUtils(marketProgramId)
      const { pda: participantPda } = await pdaUtils.findParticipantPDA(marketPubkey, publicKey)

      console.log('Participant PDA:', participantPda.toString())

      // Convert prediction to enum value
      const predictionValue = params.prediction === 'Home'
        ? PredictionChoice.Home
        : params.prediction === 'Draw'
          ? PredictionChoice.Draw
          : PredictionChoice.Away

      // Build instruction using InstructionEncoder
      const encoder = new InstructionEncoder(marketProgramId)
      const joinMarketInstruction = encoder.joinMarket(
        { prediction: predictionValue },
        {
          market: marketPubkey,
          participant: participantPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        },
      )

      // Build and send transaction
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1,
      })

      builder.addInstruction(joinMarketInstruction)

      // Estimate fee before building final transaction
      const feeEstimate = await builder.previewFee(connection, publicKey)
      setEstimatedFee(feeEstimate)

      if (feeEstimate.success) {
        console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
      }
      else {
        console.warn('Fee estimation failed:', feeEstimate.error)
      }

      const transaction = await builder.build(connection)
      transaction.feePayer = publicKey

      // Simulate transaction before sending
      const shouldProceed = await simulateBeforeSend(transaction, 'joinMarket')
      if (!shouldProceed) {
        toast.error('Transaction cancelled by user')
        return null
      }

      // Submit transaction using wallet-type-aware method
      const signature = await submitTransaction(transaction, 'joinMarket')

      console.log('Transaction sent:', signature)
      toast.info('Confirming transaction...')

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

      if (!confirmed) {
        const error = WalletErrorHandler.parseError(
          new Error('Transaction confirmation failed'),
          walletType,
          'joinMarket',
        )
        throw error
      }

      setTxSignature(signature)

      // Handle success and errors appropriately
      toast.success('Joined market successfully!', {
        description: 'Your prediction has been recorded',
        action: {
          label: 'View',
          onClick: () => {
            window.open(SolanaUtils.getExplorerUrl(signature, import.meta.env.VITE_SOLANA_NETWORK || 'devnet'), '_blank')
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', params.marketAddress] })

      return signature
    }
    catch (error: any) {
      // Check if it's already a WalletError
      if (error.name === 'WalletError') {
        // Already handled by signAndSendTransaction
        return null
      }

      // Handle errors with both handlers for backward compatibility
      SolanaErrorHandler.logError(error, 'joinMarket')
      WalletErrorHandler.logError(error, 'joinMarket', walletType)

      const walletError = WalletErrorHandler.parseError(error, walletType, 'joinMarket')
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Only show toast if not already shown by signAndSendTransaction
      if (!error.message?.includes('rejected') && !error.message?.includes('insufficient')) {
        toast.error(errorMessage)
      }

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, queryClient, simulateBeforeSend, submitTransaction, walletType])

  /**
   * Resolve a market with the match outcome
   */
  const resolveMarket = useCallback(async (params: ResolveMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(params.marketAddress)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

      // Convert outcome to enum value
      const outcomeValue = params.outcome === 'Home'
        ? MatchOutcome.Home
        : params.outcome === 'Draw'
          ? MatchOutcome.Draw
          : MatchOutcome.Away

      // Build instruction using InstructionEncoder
      const encoder = new InstructionEncoder(marketProgramId)
      const resolveMarketInstruction = encoder.resolveMarket(
        { outcome: outcomeValue },
        {
          market: marketPubkey,
          creator: publicKey,
        },
      )

      // Build and send transaction
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1,
      })

      builder.addInstruction(resolveMarketInstruction)

      // Estimate fee before building final transaction
      const feeEstimate = await builder.previewFee(connection, publicKey)
      setEstimatedFee(feeEstimate)

      if (feeEstimate.success) {
        console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
      }
      else {
        console.warn('Fee estimation failed:', feeEstimate.error)
      }

      const transaction = await builder.build(connection)
      transaction.feePayer = publicKey

      // Simulate transaction before sending
      const shouldProceed = await simulateBeforeSend(transaction, 'resolveMarket')
      if (!shouldProceed) {
        toast.error('Transaction cancelled by user')
        return null
      }

      // Submit transaction using wallet-type-aware method
      const signature = await submitTransaction(transaction, 'resolveMarket')

      console.log('Transaction sent:', signature)
      toast.info('Confirming transaction...')

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

      if (!confirmed) {
        const error = WalletErrorHandler.parseError(
          new Error('Transaction confirmation failed'),
          walletType,
          'resolveMarket',
        )
        throw error
      }

      setTxSignature(signature)

      // Handle success and errors appropriately
      toast.success('Market resolved successfully!', {
        description: 'Winners can now withdraw their rewards',
        action: {
          label: 'View',
          onClick: () => {
            window.open(SolanaUtils.getExplorerUrl(signature, import.meta.env.VITE_SOLANA_NETWORK || 'devnet'), '_blank')
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', params.marketAddress] })

      return signature
    }
    catch (error: any) {
      // Check if it's already a WalletError
      if (error.name === 'WalletError') {
        // Already handled by signAndSendTransaction
        return null
      }

      // Handle errors with both handlers for backward compatibility
      SolanaErrorHandler.logError(error, 'resolveMarket')
      WalletErrorHandler.logError(error, 'resolveMarket', walletType)

      const walletError = WalletErrorHandler.parseError(error, walletType, 'resolveMarket')
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Only show toast if not already shown by signAndSendTransaction
      if (!error.message?.includes('rejected') && !error.message?.includes('insufficient')) {
        toast.error(errorMessage)
      }

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, queryClient, simulateBeforeSend, submitTransaction, walletType])

  /**
   * Withdraw rewards from a resolved market
   */
  const withdrawRewards = useCallback(async (marketAddress: string) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(marketAddress)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

      // Derive participant PDA using PDAUtils
      const pdaUtils = new PDAUtils(marketProgramId)
      const { pda: participantPda } = await pdaUtils.findParticipantPDA(marketPubkey, publicKey)

      console.log('Participant PDA:', participantPda.toString())

      // Build instruction using InstructionEncoder
      const encoder = new InstructionEncoder(marketProgramId)
      const withdrawInstruction = encoder.withdraw({
        market: marketPubkey,
        participant: participantPda,
        user: publicKey,
        systemProgram: SystemProgram.programId,
      })

      // Build and send transaction
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1,
      })

      builder.addInstruction(withdrawInstruction)

      // Estimate fee before building final transaction
      const feeEstimate = await builder.previewFee(connection, publicKey)
      setEstimatedFee(feeEstimate)

      if (feeEstimate.success) {
        console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
      }
      else {
        console.warn('Fee estimation failed:', feeEstimate.error)
      }

      const transaction = await builder.build(connection)
      transaction.feePayer = publicKey

      // Simulate transaction before sending
      const shouldProceed = await simulateBeforeSend(transaction, 'withdrawRewards')
      if (!shouldProceed) {
        toast.error('Transaction cancelled by user')
        return null
      }

      // Submit transaction using wallet-type-aware method
      const signature = await submitTransaction(transaction, 'withdrawRewards')

      console.log('Transaction sent:', signature)
      toast.info('Confirming transaction...')

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

      if (!confirmed) {
        const error = WalletErrorHandler.parseError(
          new Error('Transaction confirmation failed'),
          walletType,
          'withdrawRewards',
        )
        throw error
      }

      setTxSignature(signature)

      // Handle success with celebration and cache invalidation
      toast.success('🎉 Rewards withdrawn successfully!', {
        description: 'Your winnings have been transferred to your wallet',
        action: {
          label: 'View',
          onClick: () => {
            window.open(SolanaUtils.getExplorerUrl(signature, import.meta.env.VITE_SOLANA_NETWORK || 'devnet'), '_blank')
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketAddress] })
      queryClient.invalidateQueries({ queryKey: ['user'] })

      return signature
    }
    catch (error: any) {
      // Check if it's already a WalletError
      if (error.name === 'WalletError') {
        // Already handled by signAndSendTransaction
        return null
      }

      // Handle errors with both handlers for backward compatibility
      SolanaErrorHandler.logError(error, 'withdrawRewards')
      WalletErrorHandler.logError(error, 'withdrawRewards', walletType)

      const walletError = WalletErrorHandler.parseError(error, walletType, 'withdrawRewards')
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Only show toast if not already shown by signAndSendTransaction
      if (!error.message?.includes('rejected') && !error.message?.includes('insufficient')) {
        toast.error(errorMessage)
      }

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, queryClient, simulateBeforeSend, submitTransaction, walletType])

  /**
   * Get Solana Explorer link for a transaction
   */
  const getExplorerLink = useCallback((signature: string) => {
    const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
    return SolanaUtils.getExplorerUrl(signature, network as any)
  }, [])

  return {
    createMarket,
    joinMarket,
    resolveMarket,
    withdrawRewards,
    getExplorerLink,
    isLoading,
    txSignature,
    estimatedFee,
    simulationResult,
  }
}
