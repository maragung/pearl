import { generateMnemonic as _generateMnemonic, validateMnemonic as _validateMnemonic, mnemonicToSeedSync as _mnemonicToSeedSync } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'

const ENTROPY_BITS = 128

export function generateMnemonic(): string {
  return _generateMnemonic(wordlist, ENTROPY_BITS)
}

export function validateMnemonic(mnemonic: string): boolean {
  return _validateMnemonic(mnemonic.trim().toLowerCase(), wordlist)
}

export function mnemonicToSeed(mnemonic: string): Uint8Array {
  const m = mnemonic.trim().toLowerCase()
  return _mnemonicToSeedSync(m)
}

export function getWordCount(mnemonic: string): number {
  return mnemonic.trim().split(/\s+/).length
}
