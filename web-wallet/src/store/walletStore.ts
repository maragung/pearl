import { create } from 'zustand'
import type { WalletStore } from '@/types/wallet'
import { generateMnemonic, validateMnemonic } from '@/lib/wallet/bip39'
import { verifyWalletDerivation } from '@/lib/wallet/verify'
import { NETWORKS, type NetworkName } from '@/lib/wallet/networks'
import { createExportData } from '@/lib/wallet/export'

function createNewWalletFromState(network: NetworkName, password: string) {
  const mnemonic = generateMnemonic()
  const net = NETWORKS[network]
  const { wallet, verification } = verifyWalletDerivation(mnemonic, net)
  return { mnemonic, walletKey: wallet, verification, password, createdAt: new Date().toISOString() }
}

function importWalletFromSeed(network: NetworkName, mnemonic: string, password?: string) {
  const m = mnemonic.trim().toLowerCase()
  if (!validateMnemonic(m)) throw new Error('Invalid BIP39 mnemonic')
  const net = NETWORKS[network]
  const { wallet, verification } = verifyWalletDerivation(m, net)
  return { mnemonic: m, walletKey: wallet, verification, password: password || null, createdAt: new Date().toISOString() }
}

export const useWalletStore = create<WalletStore>((set) => ({
  mnemonic: null,
  walletKey: null,
  network: 'mainnet',
  password: null,
  verification: null,
  createdAt: null,

  createWallet: (network: NetworkName, password: string) => {
    const result = createNewWalletFromState(network, password)
    set({
      ...result,
      network,
    })
    return result.walletKey
  },

  importWallet: (mnemonic: string, network: NetworkName, password?: string) => {
    const result = importWalletFromSeed(network, mnemonic, password)
    set({
      ...result,
      network,
    })
    return result.walletKey
  },

  setNetwork: (network: NetworkName) => {
    set({ network })
  },

  clearWallet: () => {
    set({
      mnemonic: null,
      walletKey: null,
      password: null,
      verification: null,
      createdAt: null,
    })
  },
}))

export function getExportData() {
  const state = useWalletStore.getState()
  if (!state.walletKey || !state.mnemonic) throw new Error('No wallet loaded')
  return createExportData(
    state.walletKey,
    state.network,
    state.password || ''
  )
}
