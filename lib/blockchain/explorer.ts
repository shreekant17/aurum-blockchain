/**
 * Aurum.Gold Explorer Implementation
 *
 * This file contains the explorer implementation for Aurum.Gold ($AUR)
 */

import type { AurumBlockchain, Block, Transaction, Validator } from "./core"

// Types
export interface BlockDetails extends Block {
  size: number
  confirmations: number
}

export interface TransactionDetails extends Transaction {
  blockIndex: number
  confirmations: number
}

export interface AddressDetails {
  address: string
  balance: number
  transactions: TransactionDetails[]
  isValidator: boolean
  validatorDetails?: Validator
}

// Explorer Class
export class AurumExplorer {
  private blockchain: AurumBlockchain

  constructor(blockchain: AurumBlockchain) {
    this.blockchain = blockchain
  }

  /**
   * Gets a block by index
   */
  public getBlockByIndex(index: number): BlockDetails | null {
    const chain = this.blockchain.getChain()

    if (index < 0 || index >= chain.length) {
      return null
    }

    const block = chain[index]
    const latestBlockIndex = chain.length - 1

    return {
      ...block,
      size: this.calculateBlockSize(block),
      confirmations: latestBlockIndex - index + 1,
    }
  }

  /**
   * Gets a block by hash
   */
  public getBlockByHash(hash: string): BlockDetails | null {
    const chain = this.blockchain.getChain()
    const block = chain.find((b) => b.hash === hash)

    if (!block) {
      return null
    }

    const latestBlockIndex = chain.length - 1

    return {
      ...block,
      size: this.calculateBlockSize(block),
      confirmations: latestBlockIndex - block.index + 1,
    }
  }

  /**
   * Gets a transaction by ID
   */
  public getTransactionById(id: string): TransactionDetails | null {
    const chain = this.blockchain.getChain()
    const latestBlockIndex = chain.length - 1

    for (const block of chain) {
      const transaction = block.transactions.find((tx) => tx.id === id)

      if (transaction) {
        return {
          ...transaction,
          blockIndex: block.index,
          confirmations: latestBlockIndex - block.index + 1,
        }
      }
    }

    // Check pending transactions
    const pendingTransactions = this.blockchain.getPendingTransactions()
    const pendingTransaction = pendingTransactions.find((tx) => tx.id === id)

    if (pendingTransaction) {
      return {
        ...pendingTransaction,
        blockIndex: -1, // -1 indicates pending
        confirmations: 0,
      }
    }

    return null
  }

  /**
   * Gets address details
   */
  public getAddressDetails(address: string): AddressDetails {
    const balance = this.blockchain.getAddressBalance(address)
    const transactions: TransactionDetails[] = []
    const chain = this.blockchain.getChain()
    const latestBlockIndex = chain.length - 1

    // Get all transactions for this address
    for (const block of chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address || transaction.to === address) {
          transactions.push({
            ...transaction,
            blockIndex: block.index,
            confirmations: latestBlockIndex - block.index + 1,
          })
        }
      }
    }

    // Check if address is a validator
    const validators = this.blockchain.getValidators()
    const validator = validators.find((v) => v.address === address)
    const isValidator = !!validator

    return {
      address,
      balance,
      transactions,
      isValidator,
      validatorDetails: validator,
    }
  }

  /**
   * Gets latest blocks
   */
  public getLatestBlocks(count: number): BlockDetails[] {
    const chain = this.blockchain.getChain()
    const latestBlockIndex = chain.length - 1
    const blocks: BlockDetails[] = []

    for (let i = latestBlockIndex; i >= 0 && blocks.length < count; i--) {
      const block = chain[i]

      blocks.push({
        ...block,
        size: this.calculateBlockSize(block),
        confirmations: latestBlockIndex - i + 1,
      })
    }

    return blocks
  }

  /**
   * Gets latest transactions
   */
  public getLatestTransactions(count: number): TransactionDetails[] {
    const chain = this.blockchain.getChain()
    const latestBlockIndex = chain.length - 1
    const transactions: TransactionDetails[] = []

    // Start from the latest block and go backwards
    for (let i = latestBlockIndex; i >= 0 && transactions.length < count; i--) {
      const block = chain[i]

      for (const transaction of block.transactions) {
        transactions.push({
          ...transaction,
          blockIndex: block.index,
          confirmations: latestBlockIndex - i + 1,
        })

        if (transactions.length >= count) {
          break
        }
      }
    }

    return transactions
  }

  /**
   * Calculates the size of a block in bytes (simplified)
   */
  private calculateBlockSize(block: Block): number {
    // Simplified size calculation
    // In a real implementation, this would calculate the actual serialized size
    const blockJson = JSON.stringify(block)
    return blockJson.length
  }

  /**
   * Searches for blocks, transactions, or addresses
   */
  public search(query: string): {
    blocks: BlockDetails[]
    transactions: TransactionDetails[]
    addresses: AddressDetails[]
  } {
    const blocks: BlockDetails[] = []
    const transactions: TransactionDetails[] = []
    const addresses: AddressDetails[] = []

    // Check if query is a block hash
    const blockByHash = this.getBlockByHash(query)
    if (blockByHash) {
      blocks.push(blockByHash)
    }

    // Check if query is a block index
    const blockIndex = Number.parseInt(query)
    if (!isNaN(blockIndex)) {
      const blockByIndex = this.getBlockByIndex(blockIndex)
      if (blockByIndex) {
        blocks.push(blockByIndex)
      }
    }

    // Check if query is a transaction ID
    const transaction = this.getTransactionById(query)
    if (transaction) {
      transactions.push(transaction)
    }

    // Check if query is an address
    if (query.startsWith("aur1")) {
      const addressDetails = this.getAddressDetails(query)
      addresses.push(addressDetails)
    }

    return {
      blocks,
      transactions,
      addresses,
    }
  }
}
