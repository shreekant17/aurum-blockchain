/**
 * P2P Service
 *
 * Service for peer-to-peer communication in the Aurum.Gold blockchain
 */

import { EventEmitter } from "events"
import * as WebSocket from "ws"
import { type NodeConfig, type Peer, MessageType, type P2PMessage } from "../types/node-types"
import type { Block, Transaction } from "../types/blockchain-types"
import { logger } from "../utils/logger"

export class P2PService extends EventEmitter {
  private server: WebSocket.Server | null = null
  private peers: Map<string, { socket: WebSocket; info: Peer }> = new Map()
  private nodeId: string
  private config: NodeConfig

  constructor(nodeId: string, config: NodeConfig) {
    super()
    this.nodeId = nodeId
    this.config = config
  }

  /**
   * Start P2P server
   */
  public async start(): Promise<void> {
    try {
      // Create WebSocket server
      this.server = new WebSocket.Server({ port: this.config.p2pPort })

      // Set up server event handlers
      this.server.on("connection", (socket, request) => {
        this.handleConnection(socket, request)
      })

      this.server.on("error", (error) => {
        logger.error("P2P server error:", error)
      })

      logger.info(`P2P server started on port ${this.config.p2pPort}`)

      // Connect to bootstrap nodes
      if (this.config.enableDiscovery && this.config.bootstrapNodes) {
        for (const node of this.config.bootstrapNodes) {
          const [host, port] = node.split(":")
          await this.connectToPeer(host, Number.parseInt(port))
        }
      }
    } catch (error) {
      logger.error("Error starting P2P server:", error)
      throw new Error("Failed to start P2P server")
    }
  }

  /**
   * Stop P2P server
   */
  public async stop(): Promise<void> {
    try {
      // Disconnect from all peers
      for (const [peerId, { socket }] of this.peers.entries()) {
        this.sendMessage(socket, {
          type: MessageType.DISCONNECT,
          data: { reason: "Node shutting down" },
          from: this.nodeId,
          timestamp: Date.now(),
        })

        socket.close()
      }

      // Clear peers
      this.peers.clear()

      // Close server
      if (this.server) {
        this.server.close()
        this.server = null
      }

      logger.info("P2P server stopped")
    } catch (error) {
      logger.error("Error stopping P2P server:", error)
      throw new Error("Failed to stop P2P server")
    }
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: WebSocket, request: any): void {
    const ip = request.socket.remoteAddress
    const port = request.socket.remotePort

    logger.info(`New connection from ${ip}:${port}`)

    // Set up socket event handlers
    socket.on("message", (data) => {
      this.handleMessage(socket, data.toString())
    })

    socket.on("close", () => {
      this.handleDisconnect(socket)
    })

    socket.on("error", (error) => {
      logger.error("Socket error:", error)
      socket.close()
    })

    // Send handshake message
    this.sendMessage(socket, {
      type: MessageType.HANDSHAKE,
      data: {
        nodeId: this.nodeId,
        version: "0.1.0",
        port: this.config.p2pPort,
        networkId: this.config.networkId,
      },
      from: this.nodeId,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle incoming message
   */
  private handleMessage(socket: WebSocket, data: string): void {
    try {
      const message: P2PMessage = JSON.parse(data)

      switch (message.type) {
        case MessageType.HANDSHAKE:
          this.handleHandshake(socket, message)
          break
        case MessageType.DISCONNECT:
          this.handlePeerDisconnect(socket, message)
          break
        case MessageType.GET_PEERS:
          this.handleGetPeers(socket, message)
          break
        case MessageType.PEERS:
          this.handlePeers(message)
          break
        case MessageType.GET_BLOCKS:
          this.handleGetBlocks(socket, message)
          break
        case MessageType.BLOCKS:
          this.handleBlocks(message)
          break
        case MessageType.GET_TRANSACTIONS:
          this.handleGetTransactions(socket, message)
          break
        case MessageType.TRANSACTIONS:
          this.handleTransactions(message)
          break
        case MessageType.NEW_BLOCK:
          this.handleNewBlock(message)
          break
        case MessageType.NEW_TRANSACTION:
          this.handleNewTransaction(message)
          break
        default:
          logger.warn(`Unknown message type: ${message.type}`)
      }
    } catch (error) {
      logger.error("Error handling message:", error)
    }
  }

  /**
   * Handle handshake message
   */
  private handleHandshake(socket: WebSocket, message: P2PMessage): void {
    const { nodeId, version, port, networkId } = message.data

    // Check network ID
    if (networkId !== this.config.networkId) {
      logger.warn(`Peer ${nodeId} has different network ID: ${networkId}`)
      this.sendMessage(socket, {
        type: MessageType.DISCONNECT,
        data: { reason: "Network ID mismatch" },
        from: this.nodeId,
        timestamp: Date.now(),
      })
      socket.close()
      return
    }

    // Add peer
    const peer: Peer = {
      id: nodeId,
      ip: socket.remoteAddress || "unknown",
      port,
      lastSeen: Date.now(),
      version,
      capabilities: [],
    }

    this.peers.set(nodeId, { socket, info: peer })

    logger.info(`Handshake completed with peer: ${nodeId}`)

    // Emit peer connected event
    this.emit("peer:connected", peer)

    // Request peers
    this.sendMessage(socket, {
      type: MessageType.GET_PEERS,
      data: {},
      from: this.nodeId,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle peer disconnect message
   */
  private handlePeerDisconnect(socket: WebSocket, message: P2PMessage): void {
    const { reason } = message.data
    const peerId = message.from

    logger.info(`Peer ${peerId} disconnected: ${reason}`)

    // Remove peer
    if (this.peers.has(peerId)) {
      const peer = this.peers.get(peerId)!.info
      this.peers.delete(peerId)

      // Emit peer disconnected event
      this.emit("peer:disconnected", peer)
    }

    // Close socket
    socket.close()
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: WebSocket): void {
    // Find peer by socket
    for (const [peerId, { socket: peerSocket, info }] of this.peers.entries()) {
      if (peerSocket === socket) {
        logger.info(`Peer ${peerId} disconnected`)

        // Remove peer
        this.peers.delete(peerId)

        // Emit peer disconnected event
        this.emit("peer:disconnected", info)

        break
      }
    }
  }

  /**
   * Handle get peers message
   */
  private handleGetPeers(socket: WebSocket, message: P2PMessage): void {
    // Get peers
    const peers = Array.from(this.peers.values()).map(({ info }) => info)

    // Send peers
    this.sendMessage(socket, {
      type: MessageType.PEERS,
      data: { peers },
      from: this.nodeId,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle peers message
   */
  private handlePeers(message: P2PMessage): void {
    const { peers } = message.data

    logger.info(`Received ${peers.length} peers from ${message.from}`)

    // Connect to new peers
    for (const peer of peers) {
      if (peer.id !== this.nodeId && !this.peers.has(peer.id)) {
        this.connectToPeer(peer.ip, peer.port)
      }
    }
  }

  /**
   * Handle get blocks message
   */
  private handleGetBlocks(socket: WebSocket, message: P2PMessage): void {
    const { fromIndex, count } = message.data

    // TODO: Get blocks from blockchain
    const blocks: Block[] = []

    // Send blocks
    this.sendMessage(socket, {
      type: MessageType.BLOCKS,
      data: { blocks },
      from: this.nodeId,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle blocks message
   */
  private handleBlocks(message: P2PMessage): void {
    const { blocks } = message.data

    logger.info(`Received ${blocks.length} blocks from ${message.from}`)

    // TODO: Process blocks

    // Emit blocks received event
    this.emit("blocks:received", blocks)
  }

  /**
   * Handle get transactions message
   */
  private handleGetTransactions(socket: WebSocket, message: P2PMessage): void {
    // TODO: Get transactions from blockchain
    const transactions: Transaction[] = []

    // Send transactions
    this.sendMessage(socket, {
      type: MessageType.TRANSACTIONS,
      data: { transactions },
      from: this.nodeId,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle transactions message
   */
  private handleTransactions(message: P2PMessage): void {
    const { transactions } = message.data

    logger.info(`Received ${transactions.length} transactions from ${message.from}`)

    // TODO: Process transactions

    // Emit transactions received event
    this.emit("transactions:received", transactions)
  }

  /**
   * Handle new block message
   */
  private handleNewBlock(message: P2PMessage): void {
    const block = message.data.block

    logger.info(`Received new block ${block.header.index} from ${message.from}`)

    // Emit new block event
    this.emit("message:new_block", block)
  }

  /**
   * Handle new transaction message
   */
  private handleNewTransaction(message: P2PMessage): void {
    const transaction = message.data.transaction

    logger.info(`Received new transaction ${transaction.id} from ${message.from}`)

    // Emit new transaction event
    this.emit("message:new_transaction", transaction)
  }

  /**
   * Connect to peer
   */
  public async connectToPeer(ip: string, port: number): Promise<boolean> {
    try {
      // Check if we already have max peers
      if (this.peers.size >= this.config.maxPeers) {
        logger.warn(`Cannot connect to peer ${ip}:${port}: Max peers reached`)
        return false
      }

      // Create WebSocket connection
      const socket = new WebSocket(`ws://${ip}:${port}`)

      // Set up socket event handlers
      socket.on("open", () => {
        logger.info(`Connected to peer ${ip}:${port}`)

        // Send handshake message
        this.sendMessage(socket, {
          type: MessageType.HANDSHAKE,
          data: {
            nodeId: this.nodeId,
            version: "0.1.0",
            port: this.config.p2pPort,
            networkId: this.config.networkId,
          },
          from: this.nodeId,
          timestamp: Date.now(),
        })
      })

      socket.on("message", (data) => {
        this.handleMessage(socket, data.toString())
      })

      socket.on("close", () => {
        this.handleDisconnect(socket)
      })

      socket.on("error", (error) => {
        logger.error(`Error connecting to peer ${ip}:${port}:`, error)
        socket.close()
      })

      return true
    } catch (error) {
      logger.error(`Error connecting to peer ${ip}:${port}:`, error)
      return false
    }
  }

  /**
   * Send message to peer
   */
  private sendMessage(socket: WebSocket, message: P2PMessage): void {
    try {
      socket.send(JSON.stringify(message))
    } catch (error) {
      logger.error("Error sending message:", error)
    }
  }

  /**
   * Broadcast message to all peers
   */
  private broadcast(message: P2PMessage): void {
    for (const { socket } of this.peers.values()) {
      this.sendMessage(socket, message)
    }
  }

  /**
   * Broadcast new block to all peers
   */
  public broadcastBlock(block: Block): void {
    this.broadcast({
      type: MessageType.NEW_BLOCK,
      data: { block },
      from: this.nodeId,
      timestamp: Date.now(),
    })
  }

  /**
   * Broadcast new transaction to all peers
   */
  public broadcastTransaction(transaction: Transaction): void {
    this.broadcast({
      type: MessageType.NEW_TRANSACTION,
      data: { transaction },
      from: this.nodeId,
      timestamp: Date.now(),
    })
  }

  /**
   * Request blocks from peers
   */
  public async requestBlocks(fromIndex: number, count = 100): Promise<number> {
    if (this.peers.size === 0) {
      logger.warn("No peers available to request blocks")
      return 0
    }

    // Create promise to wait for blocks
    return new Promise((resolve) => {
      // Set up one-time event handler for blocks received
      const handleBlocksReceived = (blocks: Block[]) => {
        this.removeListener("blocks:received", handleBlocksReceived)
        resolve(blocks.length)
      }

      this.once("blocks:received", handleBlocksReceived)

      // Set timeout to resolve promise if no blocks received
      setTimeout(() => {
        this.removeListener("blocks:received", handleBlocksReceived)
        resolve(0)
      }, 10000)

      // Get random peer
      const peerIds = Array.from(this.peers.keys())
      const randomPeerId = peerIds[Math.floor(Math.random() * peerIds.length)]
      const { socket } = this.peers.get(randomPeerId)!

      // Send get blocks message
      this.sendMessage(socket, {
        type: MessageType.GET_BLOCKS,
        data: { fromIndex, count },
        from: this.nodeId,
        timestamp: Date.now(),
      })
    })
  }

  /**
   * Get all peers
   */
  public getPeers(): Peer[] {
    return Array.from(this.peers.values()).map(({ info }) => info)
  }
}
