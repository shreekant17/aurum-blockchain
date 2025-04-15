/**
 * Blockchain Types
 *
 * Type definitions for the Aurum.Gold blockchain
 */

// Block structure
export interface Block {
  header: BlockHeader
  transactions: Transaction[]
  signature: string
}

// Block header structure
export interface BlockHeader {
  index: number
  previousHash: string
  timestamp: number
  merkleRoot: string
  validator: string
  nonce: number
}

// Transaction structure
export interface Transaction {
  id: string
  type: TransactionType
  from: string
  to: string
  amount: number
  fee: number
  timestamp: number
  signature: string
  data?: string
  nonce: number
}

// Transaction types
export enum TransactionType {
  REGULAR = "regular",
  REWARD = "reward",
  STAKE = "stake",
  UNSTAKE = "unstake",
  CONTRACT_DEPLOY = "contract_deploy",
  CONTRACT_CALL = "contract_call",
}

// Validator structure
export interface Validator {
  address: string
  stake: number
  isActive: boolean
  lastBlockValidated: number
  totalBlocksValidated: number
  rewardAddress: string
  registeredAt: number
}

// Account structure
export interface Account {
  address: string
  balance: number
  nonce: number
  stake: number
  code?: string
  storage?: Record<string, string>
}

// Blockchain state
export interface BlockchainState {
  blocks: Block[]
  latestBlock: Block
  validators: Map<string, Validator>
  accounts: Map<string, Account>
  pendingTransactions: Transaction[]
}

// Chain parameters
export interface ChainParams {
  networkId: string
  blockTime: number
  blockReward: number
  minStake: number
  maxSupply: number
  initialSupply: number
  difficultyAdjustmentInterval: number
  genesisTimestamp: number
}
