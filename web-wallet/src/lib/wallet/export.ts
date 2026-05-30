import type { NetworkName } from '@/lib/wallet/networks'
import type { WalletKey } from '@/lib/wallet/bip86'

export interface WalletExportData {
  walletVersion: number
  network: NetworkName
  PrivatePassphrase: string
  PublicPassphrase: string
  Seed: string
  derivationPath: string
  address: string
  Bday: string
  createdAt: string
}

export function createExportData(
  walletKey: WalletKey,
  networkName: NetworkName,
  password: string,
  publicPassphrase = 'public'
): WalletExportData {
  return {
    walletVersion: 1,
    network: networkName,
    PrivatePassphrase: password,
    PublicPassphrase: publicPassphrase,
    Seed: walletKey.mnemonic,
    derivationPath: walletKey.derivationPath,
    address: walletKey.address,
    Bday: Math.floor(Date.now() / 1000).toString(),
    createdAt: new Date().toISOString(),
  }
}

export function serializeExport(data: WalletExportData): string {
  return JSON.stringify(data, null, 2)
}

export function downloadExportFile(data: WalletExportData): void {
  const json = serializeExport(data)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pearl-wallet-${data.network}-${data.address.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function parseImportFile(json: string): WalletExportData {
  const data = JSON.parse(json) as WalletExportData
  if (data.walletVersion !== 1) {
    throw new Error(`Unsupported wallet version: ${data.walletVersion}`)
  }
  if (!data.Seed) {
    throw new Error('Invalid wallet file: missing Seed')
  }
  return data
}
