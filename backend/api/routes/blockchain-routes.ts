/**
 * Blockchain Routes
 *
 * API routes for blockchain operations
 */

import { Router } from "express"
import type { NodeService } from "../../node/node-service"
import { logger } from "../../utils/logger"

export function blockchainRoutes(node: NodeService): Router {
  const router = Router()

  /**
   * Get blockchain info
   */
  router.get("/info", (req, res) => {
    try {
      const blockchain = node.getBlockchain()
      const latestBlock = blockchain.getLatestBlock()

      res.json({
        blocks: blockchain.getChain().length,
        latestBlock: {
          index: latestBlock.header.index,
          hash: latestBlock.header.merkleRoot,
          timestamp: latestBlock.header.timestamp,
          transactions: latestBlock.transactions.length,
        },
        pendingTransactions: blockchain.getPendingTransactions().length,
        validators: blockchain.getValidators().length,
      })
    } catch (error) {
      logger.error("Error getting blockchain info:", error)
      res.status(500).json({ error: "Failed to get blockchain info" })
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
   * Get pending transactions
   */
  router.get("/transactions/pending", (req, res) => {
    try {
      const blockchain = node.getBlockchain()
      const pendingTransactions = blockchain.getPendingTransactions()

      res.json(pendingTransactions)
    } catch (error) {
      logger.error("Error getting pending transactions:", error)
      res.status(500).json({ error: "Failed to get pending transactions" })
    }
  })

  /**
   * Create transaction
   */
  router.post("/transaction", async (req, res) => {
    try {
      const { from, to, amount, fee, password } = req.body

      // Validate request
      if (!from || !to || !amount || !password) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // Create transaction
      const transaction = await node.createTransaction(
        from,
        to,
        Number.parseFloat(amount),
        Number.parseFloat(fee) || 0.001,
        password,
      )

      res.json(transaction)
    } catch (error) {
      logger.error("Error creating transaction:", error)
      res.status(500).json({ error: "Failed to create transaction" })
    }
  })

  /**
   * Create stake transaction
   */
  router.post("/stake", async (req, res) => {
    try {
      const { from, amount, fee, password } = req.body

      // Validate request
      if (!from || !amount || !password) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // Create stake transaction
      const transaction = await node.createStakeTransaction(
        from,
        Number.parseFloat(amount),
        Number.parseFloat(fee) || 0.001,
        password,
      )

      res.json(transaction)
    } catch (error) {
      logger.error("Error creating stake transaction:", error)
      res.status(500).json({ error: "Failed to create stake transaction" })
    }
  })

  /**
   * Get validators
   */
  router.get("/validators", (req, res) => {
    try {
      const blockchain = node.getBlockchain()
      const validators = blockchain.getValidators()

      res.json(validators)
    } catch (error) {
      logger.error("Error getting validators:", error)
      res.status(500).json({ error: "Failed to get validators" })
    }
  })

  /**
   * Register as validator
   */
  router.post("/validator/register", async (req, res) => {
    try {
      const { address, password } = req.body

      // Validate request
      if (!address || !password) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // Register as validator
      const success = await node.registerAsValidator(address, password)

      if (success) {
        res.json({ success: true, message: "Registered as validator" })
      } else {
        res.status(400).json({ success: false, error: "Failed to register as validator" })
      }
    } catch (error) {
      logger.error("Error registering as validator:", error)
      res.status(500).json({ error: "Failed to register as validator" })
    }
  })

  return router
}
