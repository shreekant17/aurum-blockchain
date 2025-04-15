/**
 * Wallet Service
 *
 * Service for managing Aurum.Gold wallets
 */

import * as fs from "fs/promises"
import * as path from "path"
import { generateKeyPair, derivePublicKey, deriveAddress, encryptPrivateKey, decryptPrivateKey } from "../crypto/keys"
import { signMessage } from "../crypto/signature"
import type { Wallet, EncryptedWallet, WalletMetadata, TransactionRequest } from "../types/wallet-types"
import { type Transaction, TransactionType } from "../types/blockchain-types"
import { logger } from "../utils/logger"
import { createHash } from "crypto"

export class WalletService {
  private walletDir: string

  constructor(dataDir: string) {
    this.walletDir = path.join(dataDir, "wallets")
    this.initWalletDir()
  }

  /**
   * Initialize wallet directory
   */
  private async initWalletDir(): Promise<void> {
    try {
      await fs.mkdir(this.walletDir, { recursive: true })
      logger.info(`Wallet directory initialized: ${this.walletDir}`)
    } catch (error) {
      logger.error("Error initializing wallet directory:", error)
      throw new Error("Failed to initialize wallet directory")
    }
  }

  /**
   * Create a new wallet
   */
  public async createWallet(name: string, password: string): Promise<Wallet> {
    try {
      // Generate key pair
      const { privateKey, publicKey } = generateKeyPair()

      // Derive address
      const address = deriveAddress(publicKey)

      // Create wallet
      const wallet: Wallet = {
        address,
        publicKey,
        privateKey,
        name,
        createdAt: Date.now(),
      }

      // Save wallet
      await this.saveWallet(wallet, password)

      logger.info(`Wallet created: ${address}`)

      return wallet
    } catch (error) {
      logger.error("Error creating wallet:", error)
      throw new Error("Failed to create wallet")
    }
  }

  /**
   * Import wallet from private key
   */
  public async importWallet(privateKey: string, name: string, password: string): Promise<Wallet> {
    try {
      // Derive public key
      const publicKey = derivePublicKey(privateKey)

      // Derive address
      const address = deriveAddress(publicKey)

      // Create wallet
      const wallet: Wallet = {
        address,
        publicKey,
        privateKey,
        name,
        createdAt: Date.now(),
      }

      // Save wallet
      await this.saveWallet(wallet, password)

      logger.info(`Wallet imported: ${address}`)

      return wallet
    } catch (error) {
      logger.error("Error importing wallet:", error)
      throw new Error("Failed to import wallet")
    }
  }

  /**
   * Save wallet to disk
   */
  private async saveWallet(wallet: Wallet, password: string): Promise<void> {
    try {
      // Encrypt private key
      const { encryptedPrivateKey, options } = await encryptPrivateKey(wallet.privateKey, password)

      // Create encrypted wallet
      const encryptedWallet: EncryptedWallet = {
        address: wallet.address,
        publicKey: wallet.publicKey,
        encryptedPrivateKey,
        name: wallet.name || wallet.address.substring(0, 8),
        createdAt: wallet.createdAt,
      }

      // Save wallet to file
      const walletPath = path.join(this.walletDir, `${wallet.address}.json`)
      await fs.writeFile(walletPath, JSON.stringify({ ...encryptedWallet, options }, null, 2))

      logger.info(`Wallet saved: ${walletPath}`)
    } catch (error) {
      logger.error("Error saving wallet:", error)
      throw new Error("Failed to save wallet")
    }
  }

  /**
   * Load wallet from disk
   */
  public async loadWallet(address: string, password: string): Promise<Wallet> {
    try {
      // Load encrypted wallet
      const walletPath = path.join(this.walletDir, `${address}.json`)
      const walletData = await fs.readFile(walletPath, "utf-8")
      const { encryptedPrivateKey, publicKey, name, createdAt, options } = JSON.parse(walletData)

      // Decrypt private key
      const privateKey = await decryptPrivateKey(encryptedPrivateKey, password, options)

      // Create wallet
      const wallet: Wallet = {
        address,
        publicKey,
        privateKey,
        name,
        createdAt,
      }

      logger.info(`Wallet loaded: ${address}`)

      return wallet
    } catch (error) {
      logger.error("Error loading wallet:", error)
      throw new Error("Failed to load wallet")
    }
  }

  /**
   * List all wallets
   */
  public async listWallets(): Promise<WalletMetadata[]> {
    try {
      // Get all wallet files
      const files = await fs.readdir(this.walletDir)
      const walletFiles = files.filter((file) => file.endsWith(".json"))

      // Load wallet metadata
      const wallets: WalletMetadata[] = []

      for (const file of walletFiles) {
        try {
          const walletPath = path.join(this.walletDir, file)
          const walletData = await fs.readFile(walletPath, "utf-8")
          const { address, name, createdAt } = JSON.parse(walletData)

          wallets.push({
            address,
            name,
            createdAt,
          })
        } catch (error) {
          logger.warn(`Error loading wallet metadata from ${file}:`, error)
        }
      }

      return wallets
    } catch (error) {
      logger.error("Error listing wallets:", error)
      throw new Error("Failed to list wallets")
    }
  }

  /**
   * Create a transaction
   */
  public async createTransaction(
    request: TransactionRequest,
    password: string,
    type: TransactionType = TransactionType.REGULAR,
  ): Promise<Transaction> {
    try {
      // Load wallet
      const wallet = await this.loadWallet(request.from, password)

      // Create transaction
      const transaction: Omit<Transaction, "signature"> = {
        id: this.generateTransactionId(request),
        type,
        from: request.from,
        to: request.to,
        amount: request.amount,
        fee: request.fee || 0.001,
        timestamp: Date.now(),
        data: request.data,
        nonce: 0, // This should be fetched from the blockchain
      }

      // Sign transaction
      const signature = signMessage(transaction, wallet.privateKey)

      return {
        ...transaction,
        signature,
      }
    } catch (error) {
      logger.error("Error creating transaction:", error)
      throw new Error("Failed to create transaction")
    }
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(request: TransactionRequest): string {
    const data = `${request.from}${request.to}${request.amount}${request.fee || 0.001}${Date.now()}`
    return createHash("sha256").update(data).digest("hex")
  }

  /**
   * Create a stake transaction
   */
  public async createStakeTransaction(
    from: string,
    amount: number,
    fee: number,
    password: string,
  ): Promise<Transaction> {
    return this.createTransaction(
      {
        from,
        to: from, // Stake to self
        amount,
        fee,
      },
      password,
      TransactionType.STAKE,
    )
  }

  /**
   * Create an unstake transaction
   */
  public async createUnstakeTransaction(
    from: string,
    amount: number,
    fee: number,
    password: string,
  ): Promise<Transaction> {
    return this.createTransaction(
      {
        from,
        to: from, // Unstake to self
        amount,
        fee,
      },
      password,
      TransactionType.UNSTAKE,
    )
  }
}
