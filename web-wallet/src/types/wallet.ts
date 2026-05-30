import type { NetworkName } from '@/lib/wallet/networks'
import type { WalletKey } from '@/lib/wallet/bip86'
import type { VerificationResult } from '@/lib/wallet/verify'

export interface WalletState {
  mnemonic: string | null
  walletKey: WalletKey | null
  network: NetworkName
  password: string | null
  verification: VerificationResult | null
  createdAt: string | null
}

export interface WalletActions {
  createWallet: (network: NetworkName, password: string) => WalletKey
  importWallet: (mnemonic: string, network: NetworkName, password?: string) => WalletKey
  setNetwork: (network: NetworkName) => void
  clearWallet: () => void
}

export type WalletStore = WalletState & WalletActions

export interface WalletStepProps {
  onNext?: () => void
  onBack?: () => void
}
