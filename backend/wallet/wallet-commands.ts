import { WalletService } from "./wallet-service"
import type { Wallet } from "../types/wallet-types"
import { logger } from "../utils/logger"

/**
 * Create a new wallet
 */
export async function createWallet(name: string, password: string, dataDir: string): Promise<Wallet> {
  try {
    // Initialize wallet service
    const walletService = new WalletService(dataDir)

    // Generate wallet name if not provided
    const walletName = name || `wallet-${Date.now()}`

    // Create wallet
    const wallet = await walletService.createWallet(walletName, password)

    logger.info(`Wallet created: ${wallet.address}`)

    return wallet
  } catch (error) {
    logger.error("Error creating wallet:", error)
    throw new Error("Failed to create wallet")
  }
}

/**
 * Import a wallet from private key
 */
export async function importWallet(
  privateKey: string,
  name: string,
  password: string,
  dataDir: string,
): Promise<Wallet> {
  try {
    // Initialize wallet service
    const walletService = new WalletService(dataDir)

    // Generate wallet name if not provided
    const walletName = name || `imported-${Date.now()}`

    // Import wallet
    const wallet = await walletService.importWallet(privateKey, walletName, password)

    logger.info(`Wallet imported: ${wallet.address}`)

    return wallet
  } catch (error) {
    logger.error("Error importing wallet:", error)
    throw new Error("Failed to import wallet")
  }
}

/**
 * List all wallets
 */
export async function listWallets(dataDir: string) {
  try {
    // Initialize wallet service
    const walletService = new WalletService(dataDir)

    // List wallets
    const wallets = await walletService.listWallets()

    logger.info(`Found ${wallets.length} wallets`)

    return wallets
  } catch (error) {
    logger.error("Error listing wallets:", error)
    throw new Error("Failed to list wallets")
  }
}

/**
 * Load a wallet
 */
export async function loadWallet(address: string, password: string, dataDir: string): Promise<Wallet> {
  try {
    // Initialize wallet service
    const walletService = new WalletService(dataDir)

    // Load wallet
    const wallet = await walletService.loadWallet(address, password)

    logger.info(`Wallet loaded: ${wallet.address}`)

    return wallet
  } catch (error) {
    logger.error("Error loading wallet:", error)
    throw new Error("Failed to load wallet")
  }
}

/**
 * Create a transaction
 */
export async function createTransaction(
  from: string,
  to: string,
  amount: number,
  fee: number,
  password: string,
  dataDir: string,
) {
  try {
    // Initialize wallet service
    const walletService = new WalletService(dataDir)

    // Create transaction
    const transaction = await walletService.createTransaction(
      {
        from,
        to,
        amount,
        fee,
      },
      password,
    )

    logger.info(`Transaction created: ${transaction.id}`)

    return transaction
  } catch (error) {
    logger.error("Error creating transaction:", error)
    throw new Error("Failed to create transaction")
  }
}

/**
 * Create a stake transaction
 */
export async function createStakeTransaction(
  from: string,
  amount: number,
  fee: number,
  password: string,
  dataDir: string,
) {
  try {
    // Initialize wallet service
    const walletService = new WalletService(dataDir)

    // Create stake transaction
    const transaction = await walletService.createStakeTransaction(from, amount, fee, password)

    logger.info(`Stake transaction created: ${transaction.id}`)

    return transaction
  } catch (error) {
    logger.error("Error creating stake transaction:", error)
    throw new Error("Failed to create stake transaction")
  }
}
