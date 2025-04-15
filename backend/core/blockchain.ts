/**
 * Blockchain Core
 *
 * Core implementation of the Aurum.Gold blockchain
 */

import { EventEmitter } from "events"
import {
  type Block,
  type BlockHeader,
  type Transaction,
  type Validator,
  type Account,
  type ChainParams,
  TransactionType,
  type BlockchainState,
} from "../types/blockchain-types"
import { createHash } from "crypto"
import { calculateMerkleRoot } from "../utils/merkle"
import { logger } from "../utils/logger"

export class Blockchain extends EventEmitter {
  private chain: Block[] = []
  private pendingTransactions: Transaction[] = []
  private validators: Map<string, Validator> = new Map()
  private accounts: Map<string, Account> = new Map()
  private chainParams: ChainParams

  constructor(chainParams: ChainParams) {
    super()
    this.chainParams = chainParams
    this.initializeGenesisBlock()
  }

  /**
   * Initialize the blockchain with the genesis block
   */
  private initializeGenesisBlock(): void {
    // Check if chain already has blocks
    if (this.chain.length > 0) {
      return
    }

    logger.info("Initializing genesis block")

    // Create genesis block header
    const header: BlockHeader = {
      index: 0,
      previousHash: "0".repeat(64),
      timestamp: this.chainParams.genesisTimestamp,
      merkleRoot: "0".repeat(64),
      validator: "AURUM_GENESIS",
      nonce: 0,
    }

    // Create genesis block
    const genesisBlock: Block = {
      header,
      transactions: [],
      signature: "GENESIS_SIGNATURE",
    }

    // Calculate block hash and update header
    const blockHash = this.calculateBlockHash(genesisBlock)
    genesisBlock.header.merkleRoot = blockHash

    // Add genesis block to chain
    this.chain.push(genesisBlock)

    logger.info(`Genesis block created with hash: ${blockHash}`)
  }

  /**
   * Calculate SHA-256 hash for a block
   */
  private calculateBlockHash(block: Block): string {
    const headerStr = JSON.stringify(block.header)
    return createHash("sha256").update(headerStr).digest("hex")
  }

  /**
   * Calculate SHA-256 hash for a transaction
   */
  private calculateTransactionHash(transaction: Transaction): string {
    const { signature, ...txWithoutSignature } = transaction
    const txStr = JSON.stringify(txWithoutSignature)
    return createHash("sha256").update(txStr).digest("hex")
  }

  /**
   * Get the latest block in the chain
   */
  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1]
  }

  /**
   * Get the entire blockchain
   */
  public getChain(): Block[] {
    return this.chain
  }

  /**
   * Get a block by its index
   */
  public getBlockByIndex(index: number): Block | undefined {
    if (index < 0 || index >= this.chain.length) {
      return undefined
    }
    return this.chain[index]
  }

  /**
   * Get a block by its hash
   */
  public getBlockByHash(hash: string): Block | undefined {
    return this.chain.find((block) => this.calculateBlockHash(block) === hash)
  }

  /**
   * Add a new transaction to the pending transactions pool
   */
  public addTransaction(transaction: Transaction): boolean {
    // Validate transaction
    if (!this.isValidTransaction(transaction)) {
      logger.warn(`Invalid transaction: ${transaction.id}`)
      return false
    }

    // Add to pending transactions
    this.pendingTransactions.push(transaction)
    logger.info(`Transaction added to pool: ${transaction.id}`)

    // Emit event
    this.emit("transactionAdded", transaction)

    return true
  }

  /**
   * Create a new block with pending transactions
   */
  public createBlock(validatorAddress: string, signature: string): Block {
    const previousBlock = this.getLatestBlock()

    // Select transactions from the pool
    const selectedTransactions = this.selectTransactionsForBlock()

    // Calculate merkle root of transactions
    const merkleRoot = calculateMerkleRoot(selectedTransactions)

    // Create block header
    const header: BlockHeader = {
      index: previousBlock.header.index + 1,
      previousHash: this.calculateBlockHash(previousBlock),
      timestamp: Date.now(),
      merkleRoot,
      validator: validatorAddress,
      nonce: Math.floor(Math.random() * 1000000),
    }

    // Create new block
    const newBlock: Block = {
      header,
      transactions: selectedTransactions,
      signature,
    }

    // Add block to chain
    if (this.addBlock(newBlock)) {
      // Add validator reward transaction to pending pool
      this.addValidatorReward(validatorAddress)
      return newBlock
    }

    throw new Error("Failed to add block to chain")
  }

  /**
   * Add a block to the blockchain
   */
  public addBlock(block: Block): boolean {
    // Validate block
    if (!this.isValidBlock(block)) {
      logger.warn(`Invalid block: ${block.header.index}`)
      return false
    }

    // Add block to chain
    this.chain.push(block)
    logger.info(`Block added to chain: ${block.header.index}`)

    // Process transactions in the block
    this.processBlockTransactions(block)

    // Update validator's last validated block
    if (this.validators.has(block.header.validator)) {
      const validator = this.validators.get(block.header.validator)!
      validator.lastBlockValidated = block.header.index
      validator.totalBlocksValidated += 1
      this.validators.set(block.header.validator, validator)
    }

    // Emit event
    this.emit("blockAdded", block)

    return true
  }

  /**
   * Process all transactions in a block
   */
  private processBlockTransactions(block: Block): void {
    // Remove transactions from pending pool
    const txIds = new Set(block.transactions.map((tx) => tx.id))
    this.pendingTransactions = this.pendingTransactions.filter((tx) => !txIds.has(tx.id))

    // Process each transaction
    for (const transaction of block.transactions) {
      this.processTransaction(transaction)
    }
  }

  /**
   * Process a single transaction
   */
  private processTransaction(transaction: Transaction): void {
    switch (transaction.type) {
      case TransactionType.REGULAR:
        this.processRegularTransaction(transaction)
        break
      case TransactionType.REWARD:
        this.processRewardTransaction(transaction)
        break
      case TransactionType.STAKE:
        this.processStakeTransaction(transaction)
        break
      case TransactionType.UNSTAKE:
        this.processUnstakeTransaction(transaction)
        break
      // Future: handle contract transactions
    }
  }

  /**
   * Process a regular transaction (transfer)
   */
  private processRegularTransaction(transaction: Transaction): void {
    // Get or create accounts
    const sender = this.getOrCreateAccount(transaction.from)
    const recipient = this.getOrCreateAccount(transaction.to)

    // Update balances
    sender.balance -= transaction.amount + transaction.fee
    recipient.balance += transaction.amount
    sender.nonce += 1

    // Update accounts
    this.accounts.set(transaction.from, sender)
    this.accounts.set(transaction.to, recipient)
  }

  /**
   * Process a reward transaction
   */
  private processRewardTransaction(transaction: Transaction): void {
    // Get or create validator account
    const validator = this.getOrCreateAccount(transaction.to)

    // Update balance
    validator.balance += transaction.amount

    // Update account
    this.accounts.set(transaction.to, validator)
  }

  /**
   * Process a stake transaction
   */
  private processStakeTransaction(transaction: Transaction): void {
    // Get or create accounts
    const staker = this.getOrCreateAccount(transaction.from)

    // Update balance and stake
    staker.balance -= transaction.amount + transaction.fee
    staker.stake += transaction.amount
    staker.nonce += 1

    // Update account
    this.accounts.set(transaction.from, staker)

    // Register or update validator
    this.registerValidator(transaction.from, transaction.amount)
  }

  /**
   * Process an unstake transaction
   */
  private processUnstakeTransaction(transaction: Transaction): void {
    // Get account
    const staker = this.getOrCreateAccount(transaction.from)

    // Update balance and stake
    staker.balance -= transaction.fee
    staker.balance += transaction.amount // Amount is the unstaked amount
    staker.stake -= transaction.amount
    staker.nonce += 1

    // Update account
    this.accounts.set(transaction.from, staker)

    // Update validator
    if (this.validators.has(transaction.from)) {
      const validator = this.validators.get(transaction.from)!
      validator.stake -= transaction.amount

      // Deactivate validator if stake falls below minimum
      if (validator.stake < this.chainParams.minStake) {
        validator.isActive = false
      }

      this.validators.set(transaction.from, validator)
    }
  }

  /**
   * Get or create an account
   */
  private getOrCreateAccount(address: string): Account {
    if (!this.accounts.has(address)) {
      this.accounts.set(address, {
        address,
        balance: 0,
        nonce: 0,
        stake: 0,
      })
    }

    return this.accounts.get(address)!
  }

  /**
   * Add a validator reward transaction to the pending pool
   */
  private addValidatorReward(validatorAddress: string): void {
    const rewardTransaction: Transaction = {
      id: `reward-${Date.now()}-${validatorAddress}`,
      type: TransactionType.REWARD,
      from: "NETWORK",
      to: validatorAddress,
      amount: this.chainParams.blockReward,
      fee: 0,
      timestamp: Date.now(),
      signature: "NETWORK_REWARD",
      nonce: 0,
    }

    this.pendingTransactions.push(rewardTransaction)
  }

  /**
   * Select transactions from the pool for a new block
   */
  private selectTransactionsForBlock(): Transaction[] {
    // Sort transactions by fee (highest first)
    const sortedTransactions = [...this.pendingTransactions].sort((a, b) => b.fee - a.fee)

    // Select up to 100 transactions
    return sortedTransactions.slice(0, 100)
  }

  /**
   * Validate a block before adding it to the chain
   */
  private isValidBlock(block: Block): boolean {
    const previousBlock = this.getLatestBlock()

    // Check block index
    if (block.header.index !== previousBlock.header.index + 1) {
      logger.warn(`Invalid block index: ${block.header.index}, expected: ${previousBlock.header.index + 1}`)
      return false
    }

    // Check previous hash
    const previousBlockHash = this.calculateBlockHash(previousBlock)
    if (block.header.previousHash !== previousBlockHash) {
      logger.warn(`Invalid previous hash: ${block.header.previousHash}, expected: ${previousBlockHash}`)
      return false
    }

    // Verify merkle root
    const calculatedMerkleRoot = calculateMerkleRoot(block.transactions)
    if (block.header.merkleRoot !== calculatedMerkleRoot) {
      logger.warn(`Invalid merkle root: ${block.header.merkleRoot}, calculated: ${calculatedMerkleRoot}`)
      return false
    }

    // Verify block signature
    if (!this.verifyBlockSignature(block)) {
      logger.warn(`Invalid block signature for block: ${block.header.index}`)
      return false
    }

    // Verify transactions
    for (const transaction of block.transactions) {
      if (!this.isValidTransaction(transaction)) {
        logger.warn(`Invalid transaction in block: ${transaction.id}`)
        return false
      }
    }

    return true
  }

  /**
   * Verify block signature
   */
  private verifyBlockSignature(block: Block): boolean {
    // Skip verification for genesis block
    if (block.header.index === 0) {
      return true
    }

    // Get validator's public key
    const validator = this.validators.get(block.header.validator)
    if (!validator) {
      logger.warn(`Validator not found: ${block.header.validator}`)
      return false
    }

    // Verify signature
    const blockHash = this.calculateBlockHash(block)

    // In a real implementation, we would verify the signature using the validator's public key
    // For now, we'll just check if the signature exists
    return block.signature !== undefined && block.signature !== ""
  }

  /**
   * Validate a transaction
   */
  private isValidTransaction(transaction: Transaction): boolean {
    // Skip validation for network rewards
    if (transaction.type === TransactionType.REWARD && transaction.from === "NETWORK") {
      return true
    }

    // Verify transaction signature
    if (!this.verifyTransactionSignature(transaction)) {
      logger.warn(`Invalid signature for transaction: ${transaction.id}`)
      return false
    }

    // Check if sender has enough balance
    const sender = this.accounts.get(transaction.from)
    if (!sender) {
      // New account with no balance
      logger.warn(`Sender account not found: ${transaction.from}`)
      return false
    }

    // Check balance for different transaction types
    switch (transaction.type) {
      case TransactionType.REGULAR:
        if (sender.balance < transaction.amount + transaction.fee) {
          logger.warn(`Insufficient balance for transaction: ${transaction.id}`)
          return false
        }
        break
      case TransactionType.STAKE:
        if (sender.balance < transaction.amount + transaction.fee) {
          logger.warn(`Insufficient balance for staking: ${transaction.id}`)
          return false
        }
        // Check minimum stake
        if (transaction.amount < this.chainParams.minStake) {
          logger.warn(`Stake amount below minimum: ${transaction.amount}`)
          return false
        }
        break
      case TransactionType.UNSTAKE:
        if (sender.stake < transaction.amount) {
          logger.warn(`Insufficient stake for unstaking: ${transaction.id}`)
          return false
        }
        if (sender.balance < transaction.fee) {
          logger.warn(`Insufficient balance for unstaking fee: ${transaction.id}`)
          return false
        }
        break
    }

    // Check nonce
    if (transaction.nonce !== sender.nonce) {
      logger.warn(`Invalid nonce for transaction: ${transaction.id}, expected: ${sender.nonce}`)
      return false
    }

    return true
  }

  /**
   * Verify transaction signature
   */
  private verifyTransactionSignature(transaction: Transaction): boolean {
    // Skip verification for network rewards
    if (transaction.type === TransactionType.REWARD && transaction.from === "NETWORK") {
      return true
    }

    // Calculate transaction hash
    const txHash = this.calculateTransactionHash(transaction)

    // In a real implementation, we would verify the signature using the sender's public key
    // For now, we'll just check if the signature exists
    return transaction.signature !== undefined && transaction.signature !== ""
  }

  /**
   * Register a new validator
   */
  public registerValidator(address: string, stake: number): boolean {
    // Check minimum stake
    if (stake < this.chainParams.minStake) {
      logger.warn(`Stake amount below minimum: ${stake}`)
      return false
    }

    // Check if validator already exists
    if (this.validators.has(address)) {
      // Update existing validator
      const validator = this.validators.get(address)!
      validator.stake += stake
      validator.isActive = true
      this.validators.set(address, validator)
      logger.info(`Validator updated: ${address}, stake: ${validator.stake}`)
    } else {
      // Register new validator
      const validator: Validator = {
        address,
        stake,
        isActive: true,
        lastBlockValidated: this.getLatestBlock().header.index,
        totalBlocksValidated: 0,
        rewardAddress: address,
        registeredAt: Date.now(),
      }
      this.validators.set(address, validator)
      logger.info(`New validator registered: ${address}, stake: ${stake}`)
    }

    // Emit event
    this.emit("validatorRegistered", { address, stake })

    return true
  }

  /**
   * Select a validator for the next block using Proof of Stake
   */
  public selectValidator(): string {
    // Get active validators
    const activeValidators = Array.from(this.validators.values()).filter((validator) => validator.isActive)

    if (activeValidators.length === 0) {
      throw new Error("No active validators available")
    }

    // Calculate total stake
    const totalStake = activeValidators.reduce((sum, validator) => sum + validator.stake, 0)

    // Select validator based on stake weight (PoS)
    let cumulativeStake = 0
    const randomPoint = Math.random() * totalStake

    for (const validator of activeValidators) {
      cumulativeStake += validator.stake
      if (cumulativeStake >= randomPoint) {
        return validator.address
      }
    }

    // Fallback to first validator if something goes wrong
    return activeValidators[0].address
  }

  /**
   * Get the balance of an address
   */
  public getAddressBalance(address: string): number {
    const account = this.accounts.get(address)
    return account ? account.balance : 0
  }

  /**
   * Get the stake of an address
   */
  public getAddressStake(address: string): number {
    const account = this.accounts.get(address)
    return account ? account.stake : 0
  }

  /**
   * Get all pending transactions
   */
  public getPendingTransactions(): Transaction[] {
    return this.pendingTransactions
  }

  /**
   * Get all validators
   */
  public getValidators(): Validator[] {
    return Array.from(this.validators.values())
  }

  /**
   * Get a validator by address
   */
  public getValidator(address: string): Validator | undefined {
    return this.validators.get(address)
  }

  /**
   * Get the current blockchain state
   */
  public getState(): BlockchainState {
    return {
      blocks: this.chain,
      latestBlock: this.getLatestBlock(),
      validators: this.validators,
      accounts: this.accounts,
      pendingTransactions: this.pendingTransactions,
    }
  }

  /**
   * Restore blockchain state from saved state
   */
  public restoreState(state: BlockchainState): void {
    this.chain = state.blocks
    this.validators = state.validators
    this.accounts = state.accounts
    this.pendingTransactions = state.pendingTransactions

    logger.info(`Blockchain state restored with ${this.chain.length} blocks`)
  }
}
