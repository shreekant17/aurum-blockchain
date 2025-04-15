/**
 * API Server
 *
 * REST API server for the Aurum.Gold blockchain
 */

import * as express from "express"
import * as cors from "cors"
import * as bodyParser from "body-parser"
import type { NodeService } from "../node/node-service"
import { logger } from "../utils/logger"
import { blockchainRoutes } from "./routes/blockchain-routes"
import { nodeRoutes } from "./routes/node-routes"
import { walletRoutes } from "./routes/wallet-routes"
import { explorerRoutes } from "./routes/explorer-routes"

/**
 * Start API server
 */
export async function startAPI(node: NodeService, port: number): Promise<void> {
  try {
    // Create Express app
    const app = express()

    // Set up middleware
    app.use(cors())
    app.use(bodyParser.json())

    // Set up request logging
    app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`)
      next()
    })

    // Set up routes
    app.use("/api/blockchain", blockchainRoutes(node))
    app.use("/api/node", nodeRoutes(node))
    app.use("/api/wallet", walletRoutes(node))
    app.use("/api/explorer", explorerRoutes(node))

    // Error handling
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error("API error:", err)
      res.status(500).json({ error: err.message || "Internal server error" })
    })

    // Start server
    app.listen(port, () => {
      logger.info(`API server started on port ${port}`)
    })
  } catch (error) {
    logger.error("Error starting API server:", error)
    throw new Error("Failed to start API server")
  }
}
