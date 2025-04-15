/**
 * Node Service
 *
 * Service for managing the Aurum.Gold blockchain node
 */

import { EventEmitter } from "events"
import { Blockchain } from "../core/blockchain"
import { P2PService } from "../p2p/p2p-service"
import { StorageService } from "../storage/storage-service"
import { WalletService } from "../wallet/wallet-service"
import { type NodeConfig, type NodeStatus, SyncStatus, NodeEvent, type Peer } from "../types/node-types"
import type { Block, Transaction, ChainParams } from "../types/blockchain-types"
import { logger } from "../utils/logger"

export class NodeService extends EventEmitter {
  private blockchain: Blockchain
  private p2pService: P2PService
  private storageService: StorageService
  private walletService: WalletService
  private config: NodeConfig
  private nodeId: string
  private isRunning = false
  private isSyncing = false
  private startTime = 0
  private validatorAddress: string | null = null
  private validatorInterval: NodeJS.Timeout | null = null

  constructor(config: NodeConfig) {
    super()
    this.config = config
    this.nodeId = `aurum-${Date.now().toString(16)}`

    // Initialize chain parameters
    const chainParams: ChainParams = {
      networkId: config.networkId,
      blockTime: 15000, // 15 seconds
      blockReward: 5, // 5 $AUR
      minStake: 1000, // 1000 $AUR
      maxSupply: 100000000, // 100 million $AUR
      initialSupply: 10000000, // 10 million $AUR
      difficultyAdjustmentInterval: 2016, // ~2 weeks with 15s blocks
      genesisTimestamp: 1609459200000, // January 1, 2021
    }

    // Initialize services
    this.blockchain = new Blockchain(chainParams)
    this.p2pService = new P2PService(this.nodeId, config)
    this.storageService = new StorageService(config.dataDir)
    this.walletService = new WalletService(config.dataDir)

    // Set up event handlers
    this.setupEventHandlers()
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // P2P events
    this.p2pService.on("peer:connected", (peer: Peer) => {
      logger.info(`Peer connected: ${peer.id} (${peer.ip}:${peer.port})`)
      this.emit(NodeEvent.PEER_CONNECTED, peer)
    })

    this.p2pService.on("peer:disconnected", (peer: Peer) => {
      logger.info(`Peer disconnected: ${peer.id}`)
      this.emit(NodeEvent.PEER_DISCONNECTED, peer)
    })

    this.p2pService.on("message:new_block", (block: Block) => {
      logger.info(`Received new block: ${block.header.index}`)
      this.handleNewBlock(block)
    })

    this.p2pService.on("message:new_transaction", (transaction: Transaction) => {
      logger.info(`Received new transaction: ${transaction.id}`)
      this.handleNewTransaction(transaction)
    })

    // Blockchain events
    this.blockchain.on("blockAdded", (block: Block) => {
      logger.info(`Block added to chain: ${block.header.index}`)
      this.emit(NodeEvent.BLOCK_ADDED, block)

      // Save blockchain state
      this.saveBlockchainState()
    })

    this.blockchain.on("transactionAdded", (transaction: Transaction) => {
      logger.info(`Transaction added to pool: ${transaction.id}`)
      this.emit(NodeEvent.TRANSACTION_ADDED, transaction)
    })

    this.blockchain.on("validatorRegistered", (data: { address: string; stake: number }) => {
      logger.info(`Validator registered: ${data.address} with stake ${data.stake}`)
      this.emit(NodeEvent.VALIDATOR_REGISTERED, data)
    })
  }

  /**
   * Start the node
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Node is already running")
      return
    }

    logger.info("Starting Aurum.Gold node...")

    try {
      // Load blockchain state
      await this.loadBlockchainState()

      // Start P2P service
      await this.p2pService.start()

      // Set node as running
      this.isRunning = true
      this.startTime = Date.now()

      logger.info(`Aurum.Gold node started with ID: ${this.nodeId}`)

      // Sync with network
      if (this.config.enableDiscovery) {
        this.syncWithNetwork()
      }
    } catch (error) {
      logger.error("Error starting node:", error)
      throw new Error("Failed to start node")
    }
  }

  /**
   * Stop the node
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn("Node is not running")
      return
    }

    logger.info("Stopping Aurum.Gold node...")

    try {
      // Stop validator process
      this.stopValidator()

      // Save blockchain state
      await this.saveBlockchainState()

      // Stop P2P service
      await this.p2pService.stop()

      // Set node as not running
      this.isRunning = false

      logger.info("Aurum.Gold node stopped")
    } catch (error) {
      logger.error("Error stopping node:", error)
      throw new Error("Failed to stop node")
    }
  }

  /**
   * Sync with network
   */
  private async syncWithNetwork(): Promise<void> {
    if (this.isSyncing) {
      logger.warn("Node is already syncing")
      return
    }

    logger.info("Starting blockchain synchronization...")

    this.isSyncing = true
    this.emit(NodeEvent.SYNC_STARTED)

    try {
      // Get peers
      const peers = this.p2pService.getPeers()

      if (peers.length === 0) {
        logger.warn("No peers available for synchronization")
        this.isSyncing = false
        return
      }

      // Get current block height
      const currentHeight = this.blockchain.getLatestBlock().header.index

      // Request blocks from peers
      const blocksReceived = await this.p2pService.requestBlocks(currentHeight + 1)

      if (blocksReceived > 0) {
        logger.info(`Synchronized ${blocksReceived} blocks from network`)
      } else {
        logger.info("No new blocks to synchronize")
      }

      // Set sync status
      this.isSyncing = false
      this.emit(NodeEvent.SYNC_COMPLETED)
    } catch (error) {
      logger.error("Error syncing with network:", error)
      this.isSyncing = false
      this.emit(NodeEvent.ERROR, error)
    }
  }

  /**
   * Handle new block from network
   */
  private handleNewBlock(block: Block): void {
    try {
      // Validate and add block to chain
      const added = this.blockchain.addBlock(block)

      if (added) {
        logger.info(`Added block from network: ${block.header.index}`)

        // Broadcast block to peers
        this.p2pService.broadcastBlock(block)
      } else {
        logger.warn(`Rejected invalid block from network: ${block.header.index}`)
      }
    } catch (error) {
      logger.error("Error handling new block:", error)
    }
  }

  /**
   * Handle new transaction from network
   */
  private handleNewTransaction(transaction: Transaction): void {
    try {
      // Validate and add transaction to pool
      const added = this.blockchain.addTransaction(transaction)

      if (added) {
        logger.info(`Added transaction from network: ${transaction.id}`)

        // Broadcast transaction to peers
        this.p2pService.broadcastTransaction(transaction)
      } else {
        logger.warn(`Rejected invalid transaction from network: ${transaction.id}`)
      }
    } catch (error) {
      logger.error("Error handling new transaction:", error)
    }
  }

  /**
   * Save blockchain state
   */
  private async saveBlockchainState(): Promise<void> {
    try {
      const state = this.blockchain.getState()
      await this.storageService.saveBlockchainState(state)
      logger.info("Blockchain state saved")
    } catch (error) {
      logger.error("Error saving blockchain state:", error)
    }
  }

  /**
   * Load blockchain state
   */
  private async loadBlockchainState(): Promise<void> {
    try {
      const state = await this.storageService.loadBlockchainState()

      if (state) {
        this.blockchain.restoreState(state)
        logger.info(`Blockchain state loaded with ${state.blocks.length} blocks`)
      } else {
        logger.info("No blockchain state found, starting with genesis block")
      }
    } catch (error) {
      logger.error("Error loading blockchain state:", error)
    }
  }

  /**
   * Register as validator
   */
  public async registerAsValidator(address: string, password: string): Promise<boolean> {
    try {
      // Load wallet
      const wallet = await this.walletService.loadWallet(address, password)

      // Get stake amount
      const stake = this.blockchain.getAddressStake(address)

      if (stake <= 0) {
        logger.warn(`Address ${address} has no stake`)
        return false
      }

      // Register validator
      const registered = this.blockchain.registerValidator(address, stake)

      if (registered) {
        logger.info(`Registered as validator: ${address}`)
        this.validatorAddress = address

        // Start validator process
        this.startValidator(wallet.privateKey)

        return true
      } else {
        logger.warn(`Failed to register as validator: ${address}`)
        return false
      }
    } catch (error) {
      logger.error("Error registering as validator:", error)
      return false
    }
  }

  /**
   * Start validator process
   */
  private startValidator(privateKey: string): void {
    if (this.validatorInterval) {
      clearInterval(this.validatorInterval)
    }

    logger.info("Starting validator process...")

    // Start validator interval
    this.validatorInterval = setInterval(() => {
      this.tryValidateBlock(privateKey)
    }, 5000) // Check every 5 seconds
  }

  /**
   * Stop validator process
   */
  private stopValidator(): void {
    if (this.validatorInterval) {
      clearInterval(this.validatorInterval)
      this.validatorInterval = null
      logger.info("Validator process stopped")
    }
  }

  /**
   * Try to validate a block
   */
  private tryValidateBlock(privateKey: string): void {
    if (!this.validatorAddress) {
      return
    }

    try {
      // Check if it's this validator's turn
      const selectedValidator = this.blockchain.selectValidator()

      if (selectedValidator === this.validatorAddress) {
        logger.info("Selected as validator for the next block")

        // Create block signature
        const latestBlock = this.blockchain.getLatestBlock()
        const blockData = {
          index: latestBlock.header.index + 1,
          previousHash: this.calculateBlockHash(latestBlock),
          timestamp: Date.now(),
          validator: this.validatorAddress,
        }

        // Sign block data
        const signature = this.signData(blockData, privateKey)

        // Create new block
        const newBlock = this.blockchain.createBlock(this.validatorAddress, signature)

        logger.info(`Created new block #${newBlock.header.index}`)

        // Broadcast new block to peers
        this.p2pService.broadcastBlock(newBlock)
      }
    } catch (error) {
      logger.error("Error validating block:", error)
    }
  }

  /**
   * Calculate block hash
   */
  private calculateBlockHash(block: Block): string {
    const headerStr = JSON.stringify(block.header)
    return require("crypto").createHash("sha256").update(headerStr).digest("hex")
  }

  /**
   * Sign data with private key
   */
  private signData(data: any, privateKey: string): string {
    const dataStr = JSON.stringify(data)
    return require("../crypto/signature").signMessage(dataStr, privateKey)
  }

  /**
   * Create a transaction
   */
  public async createTransaction(
    from: string,
    to: string,
    amount: number,
    fee: number,
    password: string,
  ): Promise<Transaction> {
    try {
      // Create transaction
      const transaction = await this.walletService.createTransaction(
        {
          from,
          to,
          amount,
          fee,
        },
        password,
      )

      // Add to blockchain
      const added = this.blockchain.addTransaction(transaction)

      if (added) {
        logger.info(`Transaction created and added to pool: ${transaction.id}`)

        // Broadcast transaction to peers
        this.p2pService.broadcastTransaction(transaction)

        return transaction
      } else {
        throw new Error("Transaction validation failed")
      }
    } catch (error) {
      logger.error("Error creating transaction:", error)
      throw error
    }
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
    try {
      // Create stake transaction
      const transaction = await this.walletService.createStakeTransaction(from, amount, fee, password)

      // Add to blockchain
      const added = this.blockchain.addTransaction(transaction)

      if (added) {
        logger.info(`Stake transaction created and added to pool: ${transaction.id}`)

        // Broadcast transaction to peers
        this.p2pService.broadcastTransaction(transaction)

        return transaction
      } else {
        throw new Error("Stake transaction validation failed")
      }
    } catch (error) {
      logger.error("Error creating stake transaction:", error)
      throw error
    }
  }

  /**
   * Get node status
   */
  public getStatus(): NodeStatus {
    const latestBlock = this.blockchain.getLatestBlock()
    const peerCount = this.p2pService.getPeers().length

    // Determine sync status
    let syncStatus: SyncStatus
    if (this.isSyncing) {
      syncStatus = SyncStatus.SYNCING
    } else if (peerCount > 0) {
      syncStatus = SyncStatus.SYNCHRONIZED
    } else {
      syncStatus = SyncStatus.NOT_SYNCED
    }

    return {
      nodeId: this.nodeId,
      version: "0.1.0",
      networkId: this.config.networkId,
      p2pPort: this.config.p2pPort,
      rpcPort: this.config.rpcPort,
      apiPort: this.config.apiPort,
      peerCount,
      syncStatus,
      currentBlock: latestBlock.header.index,
      highestBlock: latestBlock.header.index, // This should be updated with network height
      startTime: this.startTime,
      isMining: false,
      isValidator: this.validatorAddress !== null,
    }
  }

  /**
   * Get blockchain
   */
  public getBlockchain(): Blockchain {
    return this.blockchain
  }

  /**
   * Get P2P service
   */
  public getP2PService(): P2PService {
    return this.p2pService
  }

  /**
   * Get wallet service
   */
  public getWalletService(): WalletService {
    return this.walletService
  }

  /**
   * Get node configuration
   */
  public getConfig(): NodeConfig {
    return this.config
  }
}

// Export function to start node
export async function startNode(config: NodeConfig): Promise<NodeService> {
  const node = new NodeService(config)
  await node.start()
  return node
}
