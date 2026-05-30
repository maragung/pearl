import { bech32m } from 'bech32'
import type { NetworkConfig } from '@/lib/wallet/networks'

const WITNESS_VERSION = 1
const WITNESS_PROGRAM_LENGTH = 32

export function encodeTaprootAddress(
  xonlyPubKey: Uint8Array,
  network: NetworkConfig
): string {
  if (xonlyPubKey.length !== WITNESS_PROGRAM_LENGTH) {
    throw new Error(`Invalid x-only pubkey length: ${xonlyPubKey.length}, expected 32`)
  }

  const words = bech32m.toWords(xonlyPubKey)
  const addr = bech32m.encode(network.bech32HRP, [WITNESS_VERSION, ...words], 1023)
  return addr
}

export function decodeTaprootAddress(
  address: string
): { prefix: string; witnessProgram: number[] } {
  const decoded = bech32m.decode(address, 1023)
  const data = decoded.words

  if (data.length === 0) throw new Error('Empty data')
  const witnessVersion = data[0]
  if (witnessVersion !== WITNESS_VERSION) {
    throw new Error(`Unsupported witness version: ${witnessVersion}`)
  }

  const witnessProgram = bech32m.fromWords(data.slice(1))
  if (witnessProgram.length !== WITNESS_PROGRAM_LENGTH) {
    throw new Error(`Invalid witness program length: ${witnessProgram.length}`)
  }

  return { prefix: decoded.prefix, witnessProgram }
}

export function validateAddress(address: string, expectedHRP: string): boolean {
  try {
    const { prefix, witnessProgram } = decodeTaprootAddress(address)
    return prefix === expectedHRP && witnessProgram.length === WITNESS_PROGRAM_LENGTH
  } catch {
    return false
  }
}
