/**
 * API Client
 *
 * Client for interacting with the Aurum.Gold blockchain API
 */

// Default API URL - change this to your backend URL in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// Types
interface ApiResponse<T> {
  data?: T
  error?: string
}

// Generic fetch function with error handling
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.error || `Error: ${response.status} ${response.statusText}`,
      }
    }

    return { data }
  } catch (error) {
    console.error("API request failed:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Blockchain API
export const blockchainApi = {
  // Get blockchain info
  getInfo: () => fetchApi("/blockchain/info"),

  // Get block by index
  getBlock: (index: number) => fetchApi(`/blockchain/block/${index}`),

  // Get latest blocks
  getLatestBlocks: (limit = 10) => fetchApi(`/blockchain/blocks/latest?limit=${limit}`),

  // Get pending transactions
  getPendingTransactions: () => fetchApi("/blockchain/transactions/pending"),

  // Create transaction
  createTransaction: (from: string, to: string, amount: number, fee: number, password: string) =>
    fetchApi("/blockchain/transaction", {
      method: "POST",
      body: JSON.stringify({ from, to, amount, fee, password }),
    }),

  // Create stake transaction
  createStakeTransaction: (from: string, amount: number, fee: number, password: string) =>
    fetchApi("/blockchain/stake", {
      method: "POST",
      body: JSON.stringify({ from, amount, fee, password }),
    }),

  // Get validators
  getValidators: () => fetchApi("/blockchain/validators"),

  // Register as validator
  registerAsValidator: (address: string, password: string) =>
    fetchApi("/blockchain/validator/register", {
      method: "POST",
      body: JSON.stringify({ address, password }),
    }),
}

// Node API
export const nodeApi = {
  // Get node status
  getStatus: () => fetchApi("/node/status"),

  // Get peers
  getPeers: () => fetchApi("/node/peers"),

  // Connect to peer
  connectToPeer: (ip: string, port: number) =>
    fetchApi("/node/peer", {
      method: "POST",
      body: JSON.stringify({ ip, port }),
    }),

  // Sync with network
  syncWithNetwork: () =>
    fetchApi("/node/sync", {
      method: "POST",
    }),

  // Get node configuration
  getConfig: () => fetchApi("/node/config"),
}

// Wallet API
export const walletApi = {
  // Create wallet
  createWallet: (name: string, password: string) =>
    fetchApi("/wallet/create", {
      method: "POST",
      body: JSON.stringify({ name, password }),
    }),

  // Import wallet
  importWallet: (privateKey: string, name: string, password: string) =>
    fetchApi("/wallet/import", {
      method: "POST",
      body: JSON.stringify({ privateKey, name, password }),
    }),

  // List wallets
  listWallets: () => fetchApi("/wallet/list"),

  // Get wallet balance
  getWalletBalance: (address: string) => fetchApi(`/wallet/${address}/balance`),

  // Create transaction
  createTransaction: (from: string, to: string, amount: number, fee: number, password: string) =>
    fetchApi("/wallet/transaction", {
      method: "POST",
      body: JSON.stringify({ from, to, amount, fee, password }),
    }),
}

// Explorer API
export const explorerApi = {
  // Search blockchain
  search: (query: string) => fetchApi(`/explorer/search?query=${encodeURIComponent(query)}`),

  // Get latest blocks
  getLatestBlocks: (limit = 10) => fetchApi(`/explorer/blocks/latest?limit=${limit}`),

  // Get block by index
  getBlock: (index: number) => fetchApi(`/explorer/block/${index}`),

  // Get latest transactions
  getLatestTransactions: (limit = 10) => fetchApi(`/explorer/transactions/latest?limit=${limit}`),

  // Get address details
  getAddressDetails: (address: string) => fetchApi(`/explorer/address/${address}`),
}
