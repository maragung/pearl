// Encrypted localStorage persistence for wallet data.
// Uses Web Crypto API (AES-GCM) with PBKDF2 key derivation.

const STORAGE_KEY = 'pearl-wallet'
const SALT = 'pearl-wallet-v1'
const PBKDF2_ITERATIONS = 600000
const KEY_LENGTH = 256

interface EncryptedPayload {
  iv: string
  data: string
}

interface StoredWallet {
  mnemonic: string
  network: string
  createdAt: string
}

async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(buf.length)
  copy.set(buf)
  return copy.buffer
}

export async function saveWallet(
  mnemonic: string,
  network: string,
  password: string
): Promise<void> {
  const key = await deriveKey(password)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const payload: StoredWallet = { mnemonic, network, createdAt: new Date().toISOString() }
  const encoded = new TextEncoder().encode(JSON.stringify(payload))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoded)
  )

  const stored: EncryptedPayload = {
    iv: bytesToHex(toArrayBuffer(iv)),
    data: bytesToHex(encrypted),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export async function loadWallet(password: string): Promise<StoredWallet | null> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const stored: EncryptedPayload = JSON.parse(raw)
    const key = await deriveKey(password)
    const iv = toArrayBuffer(hexToBytes(stored.iv))
    const encrypted = toArrayBuffer(hexToBytes(stored.data))

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )

    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    return null
  }
}

export function hasStoredWallet(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function clearStoredWallet(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage may not be available
  }
}
