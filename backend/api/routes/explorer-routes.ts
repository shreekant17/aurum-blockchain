/**
 * Explorer Routes
 *
 * API routes for blockchain explorer
 */

import { Router } from "express"
import type { NodeService } from "../../node/node-service"
import { logger } from "../../utils/logger"

export function explorerRoutes(node: NodeService): Router {
  const router = Router()

  /**
   * Search blockchain
   */
  router.get("/search", (req, res) => {
    try {
      const { query } = req.query

      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" })
      }

      const blockchain = node.getBlockchain()

      // Check if query is a block index
      if (/^\d+$/.test(query as string)) {
        const block = blockchain.getBlockByIndex(Number.parseInt(query as string))
        if (block) {
          return res.json({ type: "block", data: block })
        }
      }

      // TODO: Implement search by block hash, transaction ID, and address

      res.status(404).json({ error: "Not found" })
    } catch (error) {
      logger.error("Error searching blockchain:", error)
      res.status(500).json({ error: "Failed to search blockchain" })
    }
  })

  /**
   * Get latest blocks
   */
  router.get("/blocks/latest", (req, res) => {
    try {
      const limit = Number.parseInt(req.query.limit as string) || 10
      const blockchain = node.getBlockchain()
      const chain = blockchain.getChain()

      // Get latest blocks
      const latestBlocks = chain.slice(-limit).reverse()

      res.json(latestBlocks)
    } catch (error) {
      logger.error("Error getting latest blocks:", error)
      res.status(500).json({ error: "Failed to get latest blocks" })
    }
  })

  /**
   * Get block by index
   */
  router.get("/block/:index", (req, res) => {
    try {
      const index = Number.parseInt(req.params.index)
      const blockchain = node.getBlockchain()
      const block = blockchain.getBlockByIndex(index)

      if (!block) {
        return res.status(404).json({ error: "Block not found" })
      }

      res.json(block)
    } catch (error) {
      logger.error("Error getting block:", error)
      res.status(500).json({ error: "Failed to get block" })
    }
  })

  /**
   * Get latest transactions
   */
  router.get("/transactions/latest", (req, res) => {
    try {
      const limit = Number.parseInt(req.query.limit as string) || 10
      const blockchain = node.getBlockchain()
      const chain = blockchain.getChain()

      // Get latest transactions from blocks
      const transactions = []

      // Start from the latest block and go backwards
      for (let i = chain.length - 1; i >= 0 && transactions.length < limit; i--) {
        const block = chain[i]

        for (const tx of block.transactions) {
          transactions.push({
            ...tx,
            blockIndex: block.header.index,
            blockTimestamp: block.header.timestamp,
          })

          if (transactions.length >= limit) {
            break
          }
        }
      }

      res.json(transactions)
    } catch (error) {
      logger.error("Error getting latest transactions:", error)
      res.status(500).json({ error: "Failed to get latest transactions" })
    }
  })

  /**
   * Get address details
   */
  router.get("/address/:address", (req, res) => {
    try {
      const { address } = req.params
      const blockchain = node.getBlockchain()

      // Get balance
      const balance = blockchain.getAddressBalance(address)

      // Get stake
      const stake = blockchain.getAddressStake(address)

      // Get validator info
      const validator = blockchain.getValidator(address)

      // Get transactions for address
      const transactions = []
      const chain = blockchain.getChain()

      // Start from the latest block and go backwards
      for (let i = chain.length - 1; i >= 0; i--) {
        const block = chain[i]

        for (const tx of block.transactions) {
          if (tx.from === address || tx.to === address) {
            transactions.push({
              ...tx,
              blockIndex: block.header.index,
              blockTimestamp: block.header.timestamp,
            })
          }
        }
      }

      res.json({
        address,
        balance,
        stake,
        isValidator: !!validator,
        validatorInfo: validator,
        transactions,
      })
    } catch (error) {
      logger.error("Error getting address details:", error)
      res.status(500).json({ error: "Failed to get address details" })
    }
  })

  return router
}
