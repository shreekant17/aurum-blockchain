"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface BlockchainInfo {
  validators: number
  totalSupply: number
  circulatingSupply: number
}

interface Block {
  index: number
  timestamp: number
  hash: string
  transactions: number
  size: number
  validator: string
}

interface NodeStatus {
  syncStatus: "synchronized" | "syncing"
  currentBlock: number
  peers: number
  uptime: number
}

interface Wallet {
  address: string
  balance: number
}

interface BlockchainContextType {
  blockchainInfo: BlockchainInfo
  latestBlocks: Block[]
  nodeStatus: NodeStatus
  currentWallet: Wallet | null
  refreshData: () => Promise<void>
  createTransaction: (from: string, to: string, amount: number, fee: number, password: string) => Promise<{ id: string } | null>
  isLoading: boolean
  error: string | null
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined)

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo>({
    validators: 1248,
    totalSupply: 21000000,
    circulatingSupply: 18900000,
  })
  const [latestBlocks, setLatestBlocks] = useState<Block[]>([])
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>({
    syncStatus: "synchronized",
    currentBlock: 1248901,
    peers: 42,
    uptime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  })
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // In a real app, this would fetch data from your blockchain node
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update mock data
      setBlockchainInfo({
        validators: 1248 + Math.floor(Math.random() * 10),
        totalSupply: 21000000,
        circulatingSupply: 18900000 + Math.floor(Math.random() * 1000),
      })

      setNodeStatus({
        syncStatus: "synchronized",
        currentBlock: 1248901 + Math.floor(Math.random() * 100),
        peers: 42 + Math.floor(Math.random() * 5),
        uptime: Date.now() - 7 * 24 * 60 * 60 * 1000,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh data")
    } finally {
      setIsLoading(false)
    }
  }

  const createTransaction = async (
    from: string,
    to: string,
    amount: number,
    fee: number,
    password: string
  ): Promise<{ id: string } | null> => {
    setIsLoading(true)
    setError(null)
    try {
      // In a real app, this would create and broadcast a transaction
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return {
        id: `0x${Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("")}`,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transaction")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  return (
    <BlockchainContext.Provider
      value={{
        blockchainInfo,
        latestBlocks,
        nodeStatus,
        currentWallet,
        refreshData,
        createTransaction,
        isLoading,
        error,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  )
}

export function useBlockchain() {
  const context = useContext(BlockchainContext)
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider")
  }
  return context
}
