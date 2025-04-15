/**
 * Wallet Types
 *
 * Type definitions for the Aurum.Gold wallet
 */

// Wallet information
export interface Wallet {
  address: string
  publicKey: string
  privateKey: string
  name?: string
  createdAt: number
}

// Encrypted wallet for storage
export interface EncryptedWallet {
  address: string
  encryptedPrivateKey: string
  publicKey: string
  name: string
  createdAt: number
}

// Wallet metadata for listing
export interface WalletMetadata {
  address: string
  name: string
  createdAt: number
}

// Transaction request
export interface TransactionRequest {
  from: string
  to: string
  amount: number
  fee?: number
  data?: string
}

// Keystore options
export interface KeystoreOptions {
  kdf: string
  kdfparams: {
    dklen: number
    salt: string
    n: number
    r: number
    p: number
  }
  cipher: string
  cipherparams: {
    iv: string
  }
}
