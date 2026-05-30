import { fromSeed, derivePath, xonlyPubKey, type HDKey } from '@/lib/wallet/hdkeychain'
import { encodeTaprootAddress } from '@/lib/wallet/address'
import { mnemonicToSeed } from '@/lib/wallet/bip39'
import { getDerivationPath, type NetworkConfig } from '@/lib/wallet/networks'
import { computeTaprootKeyNoScript } from '@/lib/wallet/taproot'

export interface WalletKey {
  seed: Uint8Array
  mnemonic: string
  masterKey: HDKey
  addressKey: HDKey
  xonlyPubKey: Uint8Array
  taprootKey: Uint8Array
  address: string
  network: NetworkConfig
  addressIndex: number
  derivationPath: string
}

export function deriveWallet(
  mnemonic: string,
  network: NetworkConfig,
  addressIndex = 0
): WalletKey {
  const seed = mnemonicToSeed(mnemonic)
  const masterKey = fromSeed(seed)

  const derivationPath = getDerivationPath(network.coinType, addressIndex)
  const addressKey = derivePath(masterKey, derivationPath)

  const pubKey = xonlyPubKey(addressKey.key)
  const taprootKey = computeTaprootKeyNoScript(pubKey)
  const address = encodeTaprootAddress(taprootKey, network)

  return {
    seed,
    mnemonic,
    masterKey,
    addressKey,
    xonlyPubKey: pubKey,
    taprootKey,
    address,
    network,
    addressIndex,
    derivationPath,
  }
}

export function deriveAddressOnly(
  mnemonic: string,
  network: NetworkConfig,
  addressIndex = 0
): { address: string; derivationPath: string; xonlyPubKey: Uint8Array; taprootKey: Uint8Array } {
  const w = deriveWallet(mnemonic, network, addressIndex)
  return {
    address: w.address,
    derivationPath: w.derivationPath,
    xonlyPubKey: w.xonlyPubKey,
    taprootKey: w.taprootKey,
  }
}
