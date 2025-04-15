"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { blockchainApi, nodeApi, walletApi, explorerApi } from "@/lib/api-client"

// Types
interface BlockchainContextType {
  // Blockchain data
  blockchainInfo: any
  latestBlocks: any[]
  pendingTransactions: any[]
  validators: any[]

  // Node data
  nodeStatus: any
  peers: any[]

  // Wallet data
  wallets: any[]
  currentWallet: any | null

  // Actions
  refreshData: () => Promise<void>
  createTransaction: (from: string, to: string, amount: number, fee: number, password: string) => Promise<any>
  createStakeTransaction: (from: string, amount: number, fee: number, password: string) => Promise<any>
  registerAsValidator: (address: string, password: string) => Promise<any>
  createWallet: (name: string, password: string) => Promise<any>
  importWallet: (privateKey: string, name: string, password: string) => Promise<any>
  selectWallet: (address: string) => void
  searchBlockchain: (query: string) => Promise<any>
  isLoading: boolean
  error: string | null
}

// Create context
const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined)

// Provider component
export function BlockchainProvider({ children }: { children: ReactNode }) {
  // State
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null)
  const [latestBlocks, setLatestBlocks] = useState<any[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([])
  const [validators, setValidators] = useState<any[]>([])
  const [nodeStatus, setNodeStatus] = useState<any>(null)
  const [peers, setPeers] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [currentWallet, setCurrentWallet] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    refreshData()
  }, [])

  // Refresh all data
  const refreshData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch blockchain data
      const [blockchainInfoRes, latestBlocksRes, pendingTxRes, validatorsRes, nodeStatusRes, peersRes, walletsRes] =
        await Promise.all([
          blockchainApi.getInfo(),
          explorerApi.getLatestBlocks(10),
          blockchainApi.getPendingTransactions(),
          blockchainApi.getValidators(),
          nodeApi.getStatus(),
          nodeApi.getPeers(),
          walletApi.listWallets(),
        ])

      // Update state with fetched data
      if (blockchainInfoRes.data) setBlockchainInfo(blockchainInfoRes.data)
      if (latestBlocksRes.data) setLatestBlocks(latestBlocksRes.data)
      if (pendingTxRes.data) setPendingTransactions(pendingTxRes.data)
      if (validatorsRes.data) setValidators(validatorsRes.data)
      if (nodeStatusRes.data) setNodeStatus(nodeStatusRes.data)
      if (peersRes.data) setPeers(peersRes.data)
      if (walletsRes.data) setWallets(walletsRes.data)

      // Set current wallet if none selected and wallets exist
      if (!currentWallet && walletsRes.data && walletsRes.data.length > 0) {
        setCurrentWallet(walletsRes.data[0])
      }
    } catch (err) {
      setError("Failed to fetch blockchain data. Make sure the backend is running.")
      console.error("Error fetching blockchain data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Create transaction
  const createTransaction = async (from: string, to: string, amount: number, fee: number, password: string) => {
    setIsLoading(true)

    try {
      const result = await walletApi.createTransaction(from, to, amount, fee, password)

      if (result.error) {
        setError(result.error)
        return null
      }

      // Refresh data after transaction
      await refreshData()
      return result.data
    } catch (err) {
      setError("Failed to create transaction")
      console.error("Error creating transaction:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Create stake transaction
  const createStakeTransaction = async (from: string, amount: number, fee: number, password: string) => {
    setIsLoading(true)

    try {
      const result = await blockchainApi.createStakeTransaction(from, amount, fee, password)

      if (result.error) {
        setError(result.error)
        return null
      }

      // Refresh data after staking
      await refreshData()
      return result.data
    } catch (err) {
      setError("Failed to create stake transaction")
      console.error("Error creating stake transaction:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Register as validator
  const registerAsValidator = async (address: string, password: string) => {
    setIsLoading(true)

    try {
      const result = await blockchainApi.registerAsValidator(address, password)

      if (result.error) {
        setError(result.error)
        return null
      }

      // Refresh data after registration
      await refreshData()
      return result.data
    } catch (err) {
      setError("Failed to register as validator")
      console.error("Error registering as validator:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Create wallet
  const createWallet = async (name: string, password: string) => {
    setIsLoading(true)

    try {
      const result = await walletApi.createWallet(name, password)

      if (result.error) {
        setError(result.error)
        return null
      }

      // Refresh wallets after creation
      const walletsRes = await walletApi.listWallets()
      if (walletsRes.data) {
        setWallets(walletsRes.data)
        // Set as current wallet
        setCurrentWallet(result.data)
      }

      return result.data
    } catch (err) {
      setError("Failed to create wallet")
      console.error("Error creating wallet:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Import wallet
  const importWallet = async (privateKey: string, name: string, password: string) => {
    setIsLoading(true)

    try {
      const result = await walletApi.importWallet(privateKey, name, password)

      if (result.error) {
        setError(result.error)
        return null
      }

      // Refresh wallets after import
      const walletsRes = await walletApi.listWallets()
      if (walletsRes.data) {
        setWallets(walletsRes.data)
        // Set as current wallet
        setCurrentWallet(result.data)
      }

      return result.data
    } catch (err) {
      setError("Failed to import wallet")
      console.error("Error importing wallet:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Select wallet
  const selectWallet = (address: string) => {
    const wallet = wallets.find((w) => w.address === address)
    if (wallet) {
      setCurrentWallet(wallet)
    }
  }

  // Search blockchain
  const searchBlockchain = async (query: string) => {
    setIsLoading(true)

    try {
      const result = await explorerApi.search(query)

      if (result.error) {
        setError(result.error)
        return null
      }

      return result.data
    } catch (err) {
      setError("Failed to search blockchain")
      console.error("Error searching blockchain:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Context value
  const value = {
    blockchainInfo,
    latestBlocks,
    pendingTransactions,
    validators,
    nodeStatus,
    peers,
    wallets,
    currentWallet,
    refreshData,
    createTransaction,
    createStakeTransaction,
    registerAsValidator,
    createWallet,
    importWallet,
    selectWallet,
    searchBlockchain,
    isLoading,
    error,
  }

  return <BlockchainContext.Provider value={value}>{children}</BlockchainContext.Provider>
}

// Custom hook to use the blockchain context
export function useBlockchain() {
  const context = useContext(BlockchainContext)

  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider")
  }

  return context
}
