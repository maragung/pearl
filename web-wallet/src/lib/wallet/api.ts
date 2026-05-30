// API client for the Go Wallet API Server
// Provides XMSS address derivation and cross-check verification
// via the official Go implementation.

const DEFAULT_API_URL = 'http://localhost:8447'

export interface DeriveResult {
  address: string
  derivationPath: string
  addressIndex: number
  coinType: number
  network: string
  xonlyPubKey: string
  taprootKey: string
}

export interface VerifyResult {
  passed: boolean
  computed: string
  expected: string
  match: boolean
  description: string
}

export interface XMSSResult {
  bip86Address: string
  xmssAddress: string
  xmssPubKey: string
  derivationPath: string
  pqPath: string
}

export interface HealthResult {
  status: string
  network: string
  xmss: boolean
  version: string
}

export class WalletAPI {
  private baseURL: string
  private _available = false

  constructor(baseURL = DEFAULT_API_URL) {
    this.baseURL = baseURL
  }

  get available(): boolean {
    return this._available
  }

  async checkHealth(): Promise<HealthResult | null> {
    try {
      const res = await fetch(`${this.baseURL}/api/health`, {
        signal: AbortSignal.timeout(2000),
      })
      if (!res.ok) return null
      const data = await res.json()
      this._available = true
      return data
    } catch {
      this._available = false
      return null
    }
  }

  async deriveAddress(
    mnemonic: string,
    addressIndex = 0
  ): Promise<DeriveResult> {
    const res = await fetch(`${this.baseURL}/api/derive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mnemonic, addressIndex }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || 'API derive failed')
    }
    return res.json()
  }

  async verifyAddress(
    mnemonic: string,
    expectedAddress: string,
    addressIndex = 0
  ): Promise<VerifyResult> {
    const res = await fetch(`${this.baseURL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mnemonic, expectedAddress, addressIndex }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || 'API verify failed')
    }
    return res.json()
  }

  async deriveXMSS(
    mnemonic: string,
    addressIndex = 0
  ): Promise<XMSSResult> {
    const res = await fetch(`${this.baseURL}/api/derive-xmss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mnemonic, addressIndex }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || 'API XMSS derive failed')
    }
    return res.json()
  }
}

export const walletAPI = new WalletAPI()
