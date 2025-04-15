/**
 * Storage Service
 *
 * Service for persistent storage in the Aurum.Gold blockchain
 */

import * as fs from "fs/promises"
import * as path from "path"
import { Level } from "level"
import type { BlockchainState } from "../types/blockchain-types"
import { logger } from "../utils/logger"

export class StorageService {
  private dataDir: string
  private blockchainDir: string
  private stateFile: string
  private db: Level | null = null

  constructor(dataDir: string) {
    this.dataDir = dataDir
    this.blockchainDir = path.join(dataDir, "blockchain")
    this.stateFile = path.join(dataDir, "blockchain_state.json")
    this.initStorage()
  }

  /**
   * Initialize storage
   */
  private async initStorage(): Promise<void> {
    try {
      // Create data directory
      await fs.mkdir(this.dataDir, { recursive: true })

      // Create blockchain directory
      await fs.mkdir(this.blockchainDir, { recursive: true })

      // Initialize LevelDB
      this.db = new Level(path.join(this.blockchainDir, "db"))

      logger.info(`Storage initialized at ${this.dataDir}`)
    } catch (error) {
      logger.error("Error initializing storage:", error)
      throw new Error("Failed to initialize storage")
    }
  }

  /**
   * Save blockchain state
   */
  public async saveBlockchainState(state: BlockchainState): Promise<void> {
    try {
      // Convert state to JSON-compatible object
      const stateJson = {
        blocks: state.blocks,
        latestBlock: state.latestBlock,
        validators: Array.from(state.validators.entries()),
        accounts: Array.from(state.accounts.entries()),
        pendingTransactions: state.pendingTransactions,
      }

      // Save state to file
      await fs.writeFile(this.stateFile, JSON.stringify(stateJson, null, 2))

      logger.info(`Blockchain state saved to ${this.stateFile}`)
    } catch (error) {
      logger.error("Error saving blockchain state:", error)
      throw new Error("Failed to save blockchain state")
    }
  }

  /**
   * Load blockchain state
   */
  public async loadBlockchainState(): Promise<BlockchainState | null> {
    try {
      // Check if state file exists
      try {
        await fs.access(this.stateFile)
      } catch (error) {
        logger.info("No blockchain state file found")
        return null
      }

      // Load state from file
      const stateJson = JSON.parse(await fs.readFile(this.stateFile, "utf-8"))

      // Convert JSON object to BlockchainState
      const state: BlockchainState = {
        blocks: stateJson.blocks,
        latestBlock: stateJson.latestBlock,
        validators: new Map(stateJson.validators),
        accounts: new Map(stateJson.accounts),
        pendingTransactions: stateJson.pendingTransactions,
      }

      logger.info(`Blockchain state loaded from ${this.stateFile}`)

      return state
    } catch (error) {
      logger.error("Error loading blockchain state:", error)
      return null
    }
  }

  /**
   * Save block to database
   */
  public async saveBlock(block: any): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      const key = `block:${block.header.index}`
      await this.db.put(key, JSON.stringify(block))

      // Also save by hash
      const hash = this.calculateBlockHash(block)
      await this.db.put(`block:hash:${hash}`, JSON.stringify(block))

      logger.info(`Block ${block.header.index} saved to database`)
    } catch (error) {
      logger.error("Error saving block to database:", error)
      throw new Error("Failed to save block to database")
    }
  }

  /**
   * Load block from database
   */
  public async loadBlock(index: number): Promise<any | null> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      const key = `block:${index}`
      const blockJson = await this.db.get(key)

      return JSON.parse(blockJson)
    } catch (error) {
      if ((error as any).type === "NotFoundError") {
        return null
      }

      logger.error("Error loading block from database:", error)
      throw new Error("Failed to load block from database")
    }
  }

  /**
   * Save transaction to database
   */
  public async saveTransaction(transaction: any): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      const key = `tx:${transaction.id}`
      await this.db.put(key, JSON.stringify(transaction))

      logger.info(`Transaction ${transaction.id} saved to database`)
    } catch (error) {
      logger.error("Error saving transaction to database:", error)
      throw new Error("Failed to save transaction to database")
    }
  }

  /**
   * Load transaction from database
   */
  public async loadTransaction(id: string): Promise<any | null> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      const key = `tx:${id}`
      const txJson = await this.db.get(key)

      return JSON.parse(txJson)
    } catch (error) {
      if ((error as any).type === "NotFoundError") {
        return null
      }

      logger.error("Error loading transaction from database:", error)
      throw new Error("Failed to load transaction from database")
    }
  }

  /**
   * Calculate block hash
   */
  private calculateBlockHash(block: any): string {
    const headerStr = JSON.stringify(block.header)
    return require("crypto").createHash("sha256").update(headerStr).digest("hex")
  }
}
