/**
 * Node Types
 *
 * Type definitions for the Aurum.Gold node
 */

// Node configuration
export interface NodeConfig {
  p2pPort: number
  rpcPort: number
  apiPort: number
  dataDir: string
  networkId: string
  logLevel: string
  enableApi: boolean
  enableDiscovery: boolean
  maxPeers: number
  bootstrapNodes?: string[]
  walletPath?: string
  blockchainPath?: string
}

// Peer information
export interface Peer {
  id: string
  ip: string
  port: number
  lastSeen: number
  version: string
  capabilities: string[]
}

// Node status
export interface NodeStatus {
  nodeId: string
  version: string
  networkId: string
  p2pPort: number
  rpcPort: number
  apiPort: number
  peerCount: number
  syncStatus: SyncStatus
  currentBlock: number
  highestBlock: number
  startTime: number
  isMining: boolean
  isValidator: boolean
}

// Sync status
export enum SyncStatus {
  SYNCING = "syncing",
  SYNCHRONIZED = "synchronized",
  NOT_SYNCED = "not_synced",
}

// Node events
export enum NodeEvent {
  PEER_CONNECTED = "peer_connected",
  PEER_DISCONNECTED = "peer_disconnected",
  BLOCK_ADDED = "block_added",
  TRANSACTION_ADDED = "transaction_added",
  SYNC_STARTED = "sync_started",
  SYNC_COMPLETED = "sync_completed",
  VALIDATOR_REGISTERED = "validator_registered",
  ERROR = "error",
}

// Message types for P2P communication
export enum MessageType {
  HANDSHAKE = "handshake",
  DISCONNECT = "disconnect",
  GET_PEERS = "get_peers",
  PEERS = "peers",
  GET_BLOCKS = "get_blocks",
  BLOCKS = "blocks",
  GET_TRANSACTIONS = "get_transactions",
  TRANSACTIONS = "transactions",
  NEW_BLOCK = "new_block",
  NEW_TRANSACTION = "new_transaction",
}

// P2P message structure
export interface P2PMessage {
  type: MessageType
  data: any
  from: string
  timestamp: number
}
