/**
 * Configuration Utilities
 *
 * Utilities for loading and saving configuration
 */

import * as fs from "fs/promises"
import * as path from "path"
import type { NodeConfig } from "../types/node-types"
import { logger } from "./logger"

/**
 * Default configuration
 */
const defaultConfig: NodeConfig = {
  p2pPort: 30303,
  rpcPort: 8545,
  apiPort: 3000,
  dataDir: "./data",
  networkId: "aurum-mainnet",
  logLevel: "info",
  enableApi: true,
  enableDiscovery: true,
  maxPeers: 25,
  bootstrapNodes: ["127.0.0.1:30304", "127.0.0.1:30305"],
}

/**
 * Load configuration
 */
export async function loadConfig(dataDir: string): Promise<NodeConfig> {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(dataDir, { recursive: true })

    // Config file path
    const configPath = path.join(dataDir, "config.json")

    // Check if config file exists
    try {
      await fs.access(configPath)
    } catch (error) {
      // Config file doesn't exist, create it with default config
      await saveConfig({ ...defaultConfig, dataDir })
      return { ...defaultConfig, dataDir }
    }

    // Load config from file
    const configData = await fs.readFile(configPath, "utf-8")
    const config = JSON.parse(configData)

    // Merge with default config to ensure all fields are present
    return { ...defaultConfig, ...config, dataDir }
  } catch (error) {
    logger.error("Error loading configuration:", error)
    return { ...defaultConfig, dataDir }
  }
}

/**
 * Save configuration
 */
export async function saveConfig(config: NodeConfig): Promise<void> {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(config.dataDir, { recursive: true })

    // Config file path
    const configPath = path.join(config.dataDir, "config.json")

    // Save config to file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))

    logger.info(`Configuration saved to ${configPath}`)
  } catch (error) {
    logger.error("Error saving configuration:", error)
    throw new Error("Failed to save configuration")
  }
}
