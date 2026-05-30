import { deriveWallet, type WalletKey } from '@/lib/wallet/bip86'
import { validateMnemonic } from '@/lib/wallet/bip39'
import { validateAddress } from '@/lib/wallet/address'
import type { NetworkConfig } from '@/lib/wallet/networks'

export interface VerificationResult {
  passed: boolean
  checks: VerificationCheck[]
}

export interface VerificationCheck {
  name: string
  passed: boolean
  detail: string
}

export function verifyWalletDerivation(
  mnemonic: string,
  network: NetworkConfig,
  addressIndex = 0
): { wallet: WalletKey; verification: VerificationResult } {
  const wallet = deriveWallet(mnemonic, network, addressIndex)
  const checks: VerificationCheck[] = []

  const seedValid = validateMnemonic(mnemonic)
  checks.push({
    name: 'Mnemonic Validation',
    passed: seedValid,
    detail: seedValid
      ? 'BIP39 mnemonic is valid'
      : 'Mnemonic failed BIP39 checksum validation',
  })

  const addressValid = validateAddress(wallet.address, network.bech32HRP)
  checks.push({
    name: 'Address Format',
    passed: addressValid,
    detail: addressValid
      ? `Address ${wallet.address} has valid Bech32m format for ${network.name}`
      : `Address failed Bech32m validation for HRP ${network.bech32HRP}`,
  })

  const hrpMatch = wallet.address.startsWith(network.bech32HRP + '1')
  checks.push({
    name: 'HRP Match',
    passed: hrpMatch,
    detail: hrpMatch
      ? `Address prefix "${network.bech32HRP}1" matches network`
      : `Expected prefix "${network.bech32HRP}1" but got "${wallet.address.slice(0, 4)}"`,
  })

  const reDerived = deriveWallet(mnemonic, network, addressIndex)
  const reDeriveMatch = reDerived.address === wallet.address
  checks.push({
    name: 'Derivation Idempotency',
    passed: reDeriveMatch,
    detail: reDeriveMatch
      ? 'Re-derivation produces identical address'
      : 'Re-derivation produced different address',
  })

  const allPassed = checks.every((c) => c.passed)

  return {
    wallet,
    verification: { passed: allPassed, checks },
  }
}
