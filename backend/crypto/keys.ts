/**
 * Key Management
 *
 * Cryptographic key functions for the Aurum.Gold blockchain
 */

import { randomBytes, createCipheriv, createDecipheriv, scrypt } from "crypto"
import * as secp256k1 from "secp256k1"
import { promisify } from "util"
import { logger } from "../utils/logger"
import type { KeystoreOptions } from "../types/wallet-types"

const scryptAsync = promisify(scrypt)

/**
 * Generate a new key pair
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  try {
    // Generate private key
    let privateKey: Buffer
    do {
      privateKey = randomBytes(32)
    } while (!secp256k1.privateKeyVerify(privateKey))

    // Derive public key
    const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey))

    return {
      privateKey: privateKey.toString("hex"),
      publicKey: publicKey.toString("hex"),
    }
  } catch (error) {
    logger.error("Error generating key pair:", error)
    throw new Error("Failed to generate key pair")
  }
}

/**
 * Derive public key from private key
 */
export function derivePublicKey(privateKey: string): string {
  try {
    const privateKeyBuffer = Buffer.from(privateKey, "hex")

    if (!secp256k1.privateKeyVerify(privateKeyBuffer)) {
      throw new Error("Invalid private key")
    }

    const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKeyBuffer))
    return publicKey.toString("hex")
  } catch (error) {
    logger.error("Error deriving public key:", error)
    throw new Error("Failed to derive public key")
  }
}

/**
 * Derive address from public key
 */
export function deriveAddress(publicKey: string): string {
  try {
    const publicKeyBuffer = Buffer.from(publicKey, "hex")

    // Hash the public key with SHA-256
    const sha256 = require("crypto").createHash("sha256").update(publicKeyBuffer).digest()

    // Hash the result with RIPEMD-160
    const ripemd160 = require("crypto").createHash("ripemd160").update(sha256).digest()

    // Add prefix 'aur1' and encode
    return `aur1${ripemd160.toString("hex")}`
  } catch (error) {
    logger.error("Error deriving address:", error)
    throw new Error("Failed to derive address")
  }
}

/**
 * Encrypt a private key with a password
 */
export async function encryptPrivateKey(
  privateKey: string,
  password: string,
): Promise<{ encryptedPrivateKey: string; options: KeystoreOptions }> {
  try {
    // Generate random salt
    const salt = randomBytes(32)

    // Derive key from password
    const key = (await scryptAsync(password, salt, 32, { N: 16384, r: 8, p: 1 })) as Buffer

    // Generate random IV
    const iv = randomBytes(16)

    // Create cipher
    const cipher = createCipheriv("aes-256-ctr", key, iv)

    // Encrypt private key
    const encryptedPrivateKey = Buffer.concat([cipher.update(Buffer.from(privateKey, "hex")), cipher.final()])

    // Create keystore options
    const options: KeystoreOptions = {
      kdf: "scrypt",
      kdfparams: {
        dklen: 32,
        salt: salt.toString("hex"),
        n: 16384,
        r: 8,
        p: 1,
      },
      cipher: "aes-256-ctr",
      cipherparams: {
        iv: iv.toString("hex"),
      },
    }

    return {
      encryptedPrivateKey: encryptedPrivateKey.toString("hex"),
      options,
    }
  } catch (error) {
    logger.error("Error encrypting private key:", error)
    throw new Error("Failed to encrypt private key")
  }
}

/**
 * Decrypt a private key with a password
 */
export async function decryptPrivateKey(
  encryptedPrivateKey: string,
  password: string,
  options: KeystoreOptions,
): Promise<string> {
  try {
    // Convert salt and IV from hex to buffer
    const salt = Buffer.from(options.kdfparams.salt, "hex")
    const iv = Buffer.from(options.cipherparams.iv, "hex")

    // Derive key from password
    const key = (await scryptAsync(password, salt, 32, {
      N: options.kdfparams.n,
      r: options.kdfparams.r,
      p: options.kdfparams.p,
    })) as Buffer

    // Create decipher
    const decipher = createDecipheriv("aes-256-ctr", key, iv)

    // Decrypt private key
    const decryptedPrivateKey = Buffer.concat([
      decipher.update(Buffer.from(encryptedPrivateKey, "hex")),
      decipher.final(),
    ])

    return decryptedPrivateKey.toString("hex")
  } catch (error) {
    logger.error("Error decrypting private key:", error)
    throw new Error("Failed to decrypt private key")
  }
}
