import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

const PREFIX = "enc:v1:"

function deriveKey(): Buffer | null {
  const raw = process.env.SECRETS_ENCRYPTION_KEY?.trim()
  if (!raw) return null
  // Accept any passphrase length — derive 32-byte key via SHA-256
  return createHash("sha256").update(raw, "utf8").digest()
}

export function isSecretsEncryptionConfigured(): boolean {
  return Boolean(process.env.SECRETS_ENCRYPTION_KEY?.trim())
}

/**
 * Encrypt plaintext for storage (AES-256-GCM).
 * Format: enc:v1:{iv_b64}:{tag_b64}:{ciphertext_b64}
 */
export function encryptSecret(plaintext: string): string {
  const key = deriveKey()
  if (!key) {
    throw new Error("SECRETS_ENCRYPTION_KEY is not configured")
  }
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload?.trim()) return null
  const value = payload.trim()
  if (!value.startsWith(PREFIX)) return null

  const key = deriveKey()
  if (!key) return null

  const parts = value.slice(PREFIX.length).split(":")
  if (parts.length !== 3) return null
  const [ivB64, tagB64, dataB64] = parts
  if (!ivB64 || !tagB64 || !dataB64) return null

  try {
    const iv = Buffer.from(ivB64, "base64")
    const tag = Buffer.from(tagB64, "base64")
    const data = Buffer.from(dataB64, "base64")
    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
    return decrypted.toString("utf8")
  } catch {
    return null
  }
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return Boolean(value?.trim().startsWith(PREFIX))
}
