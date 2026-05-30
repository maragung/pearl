export interface NetworkConfig {
  name: string
  bech32HRP: string
  coinType: number
}

export const NETWORKS = {
  mainnet: {
    name: 'MainNet',
    bech32HRP: 'prl',
    coinType: 808276,
  } as NetworkConfig,
  testnet: {
    name: 'TestNet',
    bech32HRP: 'tprl',
    coinType: 1,
  } as NetworkConfig,
  regtest: {
    name: 'RegTest',
    bech32HRP: 'rprl',
    coinType: 1,
  } as NetworkConfig,
  simnet: {
    name: 'SimNet',
    bech32HRP: 'rprl',
    coinType: 1,
  } as NetworkConfig,
} as const

export type NetworkName = keyof typeof NETWORKS

export const DEFAULT_NETWORK: NetworkName = 'mainnet'

export const BIP86_PATH = "m/86'/{coinType}'/0'/0/{index}"
export const PQ_PATH = "m/222'/{coinType}'/0'/0/{index}"

export function getDerivationPath(coinType: number, index: number): string {
  return `m/86'/${coinType}'/0'/0/${index}`
}

export function getPQDerivationPath(coinType: number, index: number): string {
  return `m/222'/${coinType}'/0'/0/${index}`
}
