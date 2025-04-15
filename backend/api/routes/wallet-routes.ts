/**
 * Wallet Routes
 *
 * API routes for wallet operations
 */

import { Router } from "express"
import type { NodeService } from "../../node/node-service"
import { logger } from "../../utils/logger"

export function walletRoutes(node: NodeService): Router {
  const router = Router()

  /**
   * Create wallet
   */
  router.post("/create", async (req, res) => {
    try {
      const { name, password } = req.body

      // Validate request
      if (!password) {
        return res.status(400).json({ error: "Password is required" })
      }

      // Create wallet
      const wallet = await node.getWalletService().createWallet(name || "", password)

      // Remove private key from response
      const { privateKey, ...walletResponse } = wallet

      res.json(walletResponse)
    } catch (error) {
      logger.error("Error creating wallet:", error)
      res.status(500).json({ error: "Failed to create wallet" })
    }
  })

  /**
   * Import wallet
   */
  router.post("/import", async (req, res) => {
    try {
      const { privateKey, name, password } = req.body

      // Validate request
      if (!privateKey || !password) {
        return res.status(400).json({ error: "Private key and password are required" })
      }

      // Import wallet
      const wallet = await node.getWalletService().importWallet(privateKey, name || "", password)

      // Remove private key from response
      const { privateKey: pk, ...walletResponse } = wallet

      res.json(walletResponse)
    } catch (error) {
      logger.error("Error importing wallet:", error)
      res.status(500).json({ error: "Failed to import wallet" })
    }
  })

  /**
   * List wallets
   */
  router.get("/list", async (req, res) => {
    try {
      const wallets = await node.getWalletService().listWallets()
      res.json(wallets)
    } catch (error) {
      logger.error("Error listing wallets:", error)
      res.status(500).json({ error: "Failed to list wallets" })
    }
  })

  /**
   * Get wallet balance
   */
  router.get("/:address/balance", (req, res) => {
    try {
      const { address } = req.params
      const blockchain = node.getBlockchain()

      // Get balance
      const balance = blockchain.getAddressBalance(address)

      // Get stake
      const stake = blockchain.getAddressStake(address)

      res.json({ address, balance, stake })
    } catch (error) {
      logger.error("Error getting wallet balance:", error)
      res.status(500).json({ error: "Failed to get wallet balance" })
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

  return router
}
