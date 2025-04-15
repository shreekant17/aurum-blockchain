/**
 * Merkle Tree
 *
 * Merkle tree implementation for the Aurum.Gold blockchain
 */

import { createHash } from "crypto"
import type { Transaction } from "../types/blockchain-types"

/**
 * Calculate merkle root from transactions
 */
export function calculateMerkleRoot(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return "0".repeat(64)
  }

  // Calculate transaction hashes
  const leaves = transactions.map((tx) => calculateTransactionHash(tx))

  // Build merkle tree
  return buildMerkleTree(leaves)
}

/**
 * Calculate transaction hash
 */
function calculateTransactionHash(transaction: Transaction): string {
  const { signature, ...txWithoutSignature } = transaction
  const txStr = JSON.stringify(txWithoutSignature)
  return createHash("sha256").update(txStr).digest("hex")
}

/**
 * Build merkle tree and return root
 */
function buildMerkleTree(leaves: string[]): string {
  if (leaves.length === 0) {
    return "0".repeat(64)
  }

  if (leaves.length === 1) {
    return leaves[0]
  }

  const parents: string[] = []

  // Process pairs of leaves
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i]
    const right = i + 1 < leaves.length ? leaves[i + 1] : left

    // Hash the pair
    const parent = hashPair(left, right)
    parents.push(parent)
  }

  // Recursively build the tree
  return buildMerkleTree(parents)
}

/**
 * Hash a pair of nodes
 */
function hashPair(left: string, right: string): string {
  const data = left + right
  return createHash("sha256").update(data).digest("hex")
}
