#!/usr/bin/env node
/**
 * Aurum.Gold Blockchain Node
 *
 * Main entry point for the Aurum.Gold blockchain node
 */

import { Command } from "commander"
import chalk from "chalk"
import figlet from "figlet"
import { startNode } from "./node/node-service"
import { createWallet, importWallet, listWallets } from "./wallet/wallet-commands"
import { startAPI } from "./api/api-server"
import { loadConfig, saveConfig } from "./utils/config"

// Create CLI program
const program = new Command()

// Display banner
console.log(chalk.yellow(figlet.textSync("Aurum.Gold", { horizontalLayout: "full" })))
console.log(chalk.yellow("Blockchain Node v0.1.0\n"))

// Define CLI commands
program.name("aurum").description("Aurum.Gold blockchain node").version("0.1.0")

// Node commands
program
  .command("start")
  .description("Start the Aurum.Gold blockchain node")
  .option("-p, --p2p-port <port>", "P2P port", "30303")
  .option("-r, --rpc-port <port>", "RPC port", "8545")
  .option("-a, --api-port <port>", "API port", "3000")
  .option("-d, --data-dir <path>", "Data directory", "./data")
  .option("-n, --network <network>", "Network ID", "aurum-mainnet")
  .option("-l, --log-level <level>", "Log level", "info")
  .option("--no-api", "Disable API server")
  .option("--no-discovery", "Disable peer discovery")
  .option("--max-peers <count>", "Maximum number of peers", "25")
  .action(async (options) => {
    try {
      // Load existing config or create new one
      let config = await loadConfig(options.dataDir)

      // Override with command line options
      config = {
        ...config,
        p2pPort: Number.parseInt(options.p2pPort),
        rpcPort: Number.parseInt(options.rpcPort),
        apiPort: Number.parseInt(options.apiPort),
        dataDir: options.dataDir,
        networkId: options.network,
        logLevel: options.logLevel,
        enableApi: options.api,
        enableDiscovery: options.discovery,
        maxPeers: Number.parseInt(options.maxPeers),
      }

      // Save updated config
      await saveConfig(config)

      console.log(chalk.green("Starting Aurum.Gold node with the following configuration:"))
      console.log(chalk.cyan(JSON.stringify(config, null, 2)))

      // Start the node
      const node = await startNode(config)

      // Start API server if enabled
      if (config.enableApi) {
        await startAPI(node, config.apiPort)
      }

      // Handle shutdown
      process.on("SIGINT", async () => {
        console.log(chalk.yellow("\nShutting down Aurum.Gold node..."))
        await node.stop()
        process.exit(0)
      })
    } catch (error) {
      console.error(chalk.red("Failed to start node:"), error)
      process.exit(1)
    }
  })

// Wallet commands
program
  .command("wallet:create")
  .description("Create a new wallet")
  .option("-n, --name <name>", "Wallet name")
  .option("-p, --password <password>", "Wallet password")
  .option("-d, --data-dir <path>", "Data directory", "./data")
  .action(async (options) => {
    try {
      const wallet = await createWallet(options.name, options.password, options.dataDir)
      console.log(chalk.green("Wallet created successfully:"))
      console.log(chalk.cyan(`Address: ${wallet.address}`))
      console.log(chalk.yellow("Keep your private key and password safe!"))
    } catch (error) {
      console.error(chalk.red("Failed to create wallet:"), error)
    }
  })

program
  .command("wallet:import")
  .description("Import a wallet from private key")
  .option("-k, --private-key <key>", "Private key")
  .option("-n, --name <name>", "Wallet name")
  .option("-p, --password <password>", "Wallet password")
  .option("-d, --data-dir <path>", "Data directory", "./data")
  .action(async (options) => {
    try {
      const wallet = await importWallet(options.privateKey, options.name, options.password, options.dataDir)
      console.log(chalk.green("Wallet imported successfully:"))
      console.log(chalk.cyan(`Address: ${wallet.address}`))
    } catch (error) {
      console.error(chalk.red("Failed to import wallet:"), error)
    }
  })

program
  .command("wallet:list")
  .description("List all wallets")
  .option("-d, --data-dir <path>", "Data directory", "./data")
  .action(async (options) => {
    try {
      const wallets = await listWallets(options.dataDir)
      console.log(chalk.green("Available wallets:"))

      if (wallets.length === 0) {
        console.log(chalk.yellow("No wallets found. Create one with wallet:create command."))
        return
      }

      wallets.forEach((wallet, index) => {
        console.log(chalk.cyan(`${index + 1}. ${wallet.name} - ${wallet.address}`))
      })
    } catch (error) {
      console.error(chalk.red("Failed to list wallets:"), error)
    }
  })

// Parse command line arguments
program.parse(process.argv)

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
