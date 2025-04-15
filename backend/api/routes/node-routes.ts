/**
 * Node Routes
 *
 * API routes for node operations
 */

import { Router } from "express"
import type { NodeService } from "../../node/node-service"
import { logger } from "../../utils/logger"

export function nodeRoutes(node: NodeService): Router {
  const router = Router()

  /**
   * Get node status
   */
  router.get("/status", (req, res) => {
    try {
      const status = node.getStatus()
      res.json(status)
    } catch (error) {
      logger.error("Error getting node status:", error)
      res.status(500).json({ error: "Failed to get node status" })
    }
  })

  /**
   * Get peers
   */
  router.get("/peers", (req, res) => {
    try {
      const peers = node.getP2PService().getPeers()
      res.json(peers)
    } catch (error) {
      logger.error("Error getting peers:", error)
      res.status(500).json({ error: "Failed to get peers" })
    }
  })

  /**
   * Connect to peer
   */
  router.post("/peer", async (req, res) => {
    try {
      const { ip, port } = req.body

      // Validate request
      if (!ip || !port) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // Connect to peer
      const success = await node.getP2PService().connectToPeer(ip, Number.parseInt(port))

      if (success) {
        res.json({ success: true, message: "Connected to peer" })
      } else {
        res.status(400).json({ success: false, error: "Failed to connect to peer" })
      }
    } catch (error) {
      logger.error("Error connecting to peer:", error)
      res.status(500).json({ error: "Failed to connect to peer" })
    }
  })

  /**
   * Sync with network
   */
  router.post("/sync", async (req, res) => {
    try {
      // TODO: Implement sync with network
      res.json({ success: true, message: "Sync started" })
    } catch (error) {
      logger.error("Error syncing with network:", error)
      res.status(500).json({ error: "Failed to sync with network" })
    }
  })

  /**
   * Get node configuration
   */
  router.get("/config", (req, res) => {
    try {
      const config = node.getConfig()
      res.json(config)
    } catch (error) {
      logger.error("Error getting node configuration:", error)
      res.status(500).json({ error: "Failed to get node configuration" })
    }
  })

  return router
}
