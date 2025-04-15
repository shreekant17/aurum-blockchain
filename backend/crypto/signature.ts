/**
 * Signature Utilities
 *
 * Cryptographic signature functions for the Aurum.Gold blockchain
 */

import { createHash } from "crypto"
import * as secp256k1 from "secp256k1"
import { logger } from "../utils/logger"

/**
 * Sign data with a private key
 */
export function sign(data: string, privateKey: Buffer): Buffer {
  try {
    // Create hash of the data
    const dataHash = createHash("sha256").update(data).digest()

    // Sign the hash with the private key
    const { signature, recid } = secp256k1.ecdsaSign(dataHash, privateKey)

    // Combine signature and recovery id
    const signatureWithRecovery = Buffer.alloc(65)
    signature.copy(signatureWithRecovery, 0)
    signatureWithRecovery[64] = recid

    return signatureWithRecovery
  } catch (error) {
    logger.error("Error signing data:", error)
    throw new Error("Failed to sign data")
  }
}

/**
 * Verify a signature
 */
export function verifySignature(data: string, signature: Buffer, publicKey: Buffer): boolean {
  try {
    // Create hash of the data
    const dataHash = createHash("sha256").update(data).digest()

    // Extract signature and recovery id
    const sig = signature.slice(0, 64)

    // Verify the signature
    return secp256k1.ecdsaVerify(sig, dataHash, publicKey)
  } catch (error) {
    logger.error("Error verifying signature:", error)
    return false
  }
}

/**
 * Recover public key from signature
 */
export function recoverPublicKey(data: string, signature: Buffer): Buffer {
  try {
    // Create hash of the data
    const dataHash = createHash("sha256").update(data).digest()

    // Extract signature and recovery id
    const sig = signature.slice(0, 64)
    const recid = signature[64]

    // Recover public key
    return Buffer.from(secp256k1.ecdsaRecover(sig, recid, dataHash))
  } catch (error) {
    logger.error("Error recovering public key:", error)
    throw new Error("Failed to recover public key")
  }
}

/**
 * Sign a transaction or block
 */
export function signMessage(message: object, privateKey: string): string {
  try {
    // Convert message to string
    const messageStr = JSON.stringify(message)

    // Convert private key from hex to buffer
    const privateKeyBuffer = Buffer.from(privateKey, "hex")

    // Sign the message
    const signature = sign(messageStr, privateKeyBuffer)

    // Return signature as hex string
    return signature.toString("hex")
  } catch (error) {
    logger.error("Error signing message:", error)
    throw new Error("Failed to sign message")
  }
}

/**
 * Verify a transaction or block signature
 */
export function verifyMessage(message: object, signature: string, publicKey: string): boolean {
  try {
    // Convert message to string
    const messageStr = JSON.stringify(message)

    // Convert signature and public key from hex to buffer
    const signatureBuffer = Buffer.from(signature, "hex")
    const publicKeyBuffer = Buffer.from(publicKey, "hex")

    // Verify the signature
    return verifySignature(messageStr, signatureBuffer, publicKeyBuffer)
  } catch (error) {
    logger.error("Error verifying message:", error)
    return false
  }
}
