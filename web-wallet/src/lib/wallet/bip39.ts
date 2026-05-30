import * as bip39 from 'bip39'
import { randomBytes, bytesToHex } from '@/lib/wallet/crypto'

const ENTROPY_BITS = 128

export function generateMnemonic(): string {
  const entropy = randomBytes(ENTROPY_BITS / 8)
  return bip39.entropyToMnemonic(bytesToHex(entropy))
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic.trim().toLowerCase())
}

export function mnemonicToSeed(mnemonic: string): Uint8Array {
  const m = mnemonic.trim().toLowerCase()
  const seedBuffer = bip39.mnemonicToSeedSync(m, '')
  return new Uint8Array(seedBuffer)
}

export function getWordCount(mnemonic: string): number {
  return mnemonic.trim().split(/\s+/).length
}
