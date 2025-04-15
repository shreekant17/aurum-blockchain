/**
 * Aurum.Gold Blockchain Core Implementation
 *
 * This file contains the core blockchain implementation for Aurum.Gold ($AUR)
 */

import { createHash } from "crypto"

// Types
export interface Block {
  index: number
  timestamp: number
  transactions: Transaction[]
  previousHash: string
  hash: string
  validator: string
  signature: string
  nonce: number
}

export interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  fee: number
  timestamp: number
  signature: string
}

export interface Validator {
  address: string
  stake: number
  isActive: boolean
  lastBlockValidated: number
}

// Core Blockchain Class
export class AurumBlockchain {
  private chain: Block[]
  private pendingTransactions: Transaction[]
  private validators: Map<string, Validator>
  private difficulty: number
  private blockReward: number
  private networkId: string

  constructor() {
    // Initialize blockchain with genesis block
    this.chain = [this.createGenesisBlock()]
    this.pendingTransactions = []
    this.validators = new Map()
    this.difficulty = 4 // Difficulty for PoS selection
    this.blockReward = 5 // Block reward in $AUR
    this.networkId = "aurum-mainnet"
  }

  /**
   * Creates the genesis block for the blockchain
   */
  private createGenesisBlock(): Block {
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: "0".repeat(64),
      hash: "",
      validator: "AURUM_GENESIS",
      signature: "GENESIS_SIGNATURE",
      nonce: 0,
    }

    // Calculate hash for genesis block
    genesisBlock.hash = this.calculateBlockHash(genesisBlock)

    return genesisBlock
  }

  /**
   * Calculates SHA-256 hash for a block
   */
  private calculateBlockHash(block: Block): string {
    const blockData = {
      index: block.index,
      timestamp: block.timestamp,
      transactions: block.transactions,
      previousHash: block.previousHash,
      validator: block.validator,
      nonce: block.nonce,
    }

    return createHash("sha256").update(JSON.stringify(blockData)).digest("hex")
  }

  /**
   * Gets the latest block in the chain
   */
  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1]
  }

  /**
   * Adds a new transaction to the pending transactions pool
   */
  public createTransaction(transaction: Omit<Transaction, "id" | "timestamp">): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateTransactionId(transaction),
      timestamp: Date.now(),
    }

    this.pendingTransactions.push(newTransaction)
    return newTransaction
  }

  /**
   * Generates a unique transaction ID
   */
  private generateTransactionId(transaction: Omit<Transaction, "id" | "timestamp">): string {
    const txData = `${transaction.from}${transaction.to}${transaction.amount}${transaction.fee}${Date.now()}`
    return createHash("sha256").update(txData).digest("hex")
  }

  /**
   * Selects a validator for the next block using Proof of Stake
   */
  public selectValidator(): string {
    // Convert validators map to array for selection
    const validatorArray = Array.from(this.validators.values()).filter((validator) => validator.isActive)

    if (validatorArray.length === 0) {
      throw new Error("No active validators available")
    }

    // Calculate total stake
    const totalStake = validatorArray.reduce((sum, validator) => sum + validator.stake, 0)

    // Select validator based on stake weight (PoS)
    let cumulativeStake = 0
    const randomPoint = Math.random() * totalStake

    for (const validator of validatorArray) {
      cumulativeStake += validator.stake
      if (cumulativeStake >= randomPoint) {
        return validator.address
      }
    }

    // Fallback to first validator if something goes wrong
    return validatorArray[0].address
  }

  /**
   * Creates a new block with pending transactions
   */
  public createBlock(validatorAddress: string, signature: string): Block {
    const previousBlock = this.getLatestBlock()
    const newBlock: Block = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions],
      previousHash: previousBlock.hash,
      hash: "",
      validator: validatorAddress,
      signature: signature,
      nonce: Math.floor(Math.random() * 1000000),
    }

    // Calculate block hash
    newBlock.hash = this.calculateBlockHash(newBlock)

    // Reset pending transactions and add validator reward
    this.pendingTransactions = [
      {
        id: `reward-${newBlock.index}`,
        from: "NETWORK",
        to: validatorAddress,
        amount: this.blockReward,
        fee: 0,
        timestamp: Date.now(),
        signature: "NETWORK_REWARD",
      },
    ]

    // Add block to chain
    this.chain.push(newBlock)

    // Update validator's last validated block
    if (this.validators.has(validatorAddress)) {
      const validator = this.validators.get(validatorAddress)!
      validator.lastBlockValidated = newBlock.index
      this.validators.set(validatorAddress, validator)
    }

    return newBlock
  }

  /**
   * Validates a block before adding it to the chain
   */
  public isValidBlock(block: Block): boolean {
    const previousBlock = this.getLatestBlock()

    // Check block index
    if (block.index !== previousBlock.index + 1) {
      return false
    }

    // Check previous hash
    if (block.previousHash !== previousBlock.hash) {
      return false
    }

    // Verify block hash
    if (block.hash !== this.calculateBlockHash(block)) {
      return false
    }

    // Verify transactions
    for (const transaction of block.transactions) {
      if (!this.isValidTransaction(transaction)) {
        return false
      }
    }

    return true
  }

  /**
   * Validates a transaction
   */
  private isValidTransaction(transaction: Transaction): boolean {
    // Skip validation for network rewards
    if (transaction.from === "NETWORK") {
      return true
    }

    // Verify transaction signature (simplified)
    // In a real implementation, this would use public key cryptography
    if (!transaction.signature) {
      return false
    }

    // Check if sender has enough balance
    const senderBalance = this.getAddressBalance(transaction.from)
    if (senderBalance < transaction.amount + transaction.fee) {
      return false
    }

    return true
  }

  /**
   * Gets the balance of an address
   */
  public getAddressBalance(address: string): number {
    let balance = 0

    // Check all blocks for transactions involving this address
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address) {
          balance -= transaction.amount + transaction.fee
        }
        if (transaction.to === address) {
          balance += transaction.amount
        }
      }
    }

    // Also check pending transactions
    for (const transaction of this.pendingTransactions) {
      if (transaction.from === address) {
        balance -= transaction.amount + transaction.fee
      }
      if (transaction.to === address) {
        balance += transaction.amount
      }
    }

    return balance
  }

  /**
   * Registers a new validator
   */
  public registerValidator(address: string, stake: number): boolean {
    // Minimum stake requirement
    const minimumStake = 1000 // 1000 $AUR

    if (stake < minimumStake) {
      return false
    }

    // Check if address has enough balance
    const balance = this.getAddressBalance(address)
    if (balance < stake) {
      return false
    }

    // Register validator
    this.validators.set(address, {
      address,
      stake,
      isActive: true,
      lastBlockValidated: 0,
    })

    return true
  }

  /**
   * Gets the entire blockchain
   */
  public getChain(): Block[] {
    return this.chain
  }

  /**
   * Gets all pending transactions
   */
  public getPendingTransactions(): Transaction[] {
    return this.pendingTransactions
  }

  /**
   * Gets all validators
   */
  public getValidators(): Validator[] {
    return Array.from(this.validators.values())
  }
}
