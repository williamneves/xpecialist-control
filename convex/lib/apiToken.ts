import { nanoid } from 'nanoid'

/**
 * Hash a token using SHA-256 via Web Crypto API
 * Returns hex-encoded hash string
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a new API token
 * Token format: xpc_{nanoid(8)}_{nanoid(32)}
 * Returns: { token (full, shown once), prefix (for identification), hash (for storage) }
 */
export async function generateApiToken(): Promise<{
  token: string
  prefix: string
  hash: string
}> {
  const prefixPart = nanoid(8)
  const secretPart = nanoid(32)
  const prefix = `xpc_${prefixPart}`
  const token = `${prefix}_${secretPart}`
  const hash = await hashToken(token)

  return { token, prefix, hash }
}
