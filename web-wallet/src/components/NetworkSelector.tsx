import { NETWORKS, type NetworkName } from '@/lib/wallet/networks'

interface NetworkSelectorProps {
  value: NetworkName
  onChange: (network: NetworkName) => void
}

export default function NetworkSelector({ value, onChange }: NetworkSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Network</label>
      <div className="flex rounded-lg border bg-white p-0.5">
        {(Object.keys(NETWORKS) as NetworkName[]).filter(n => n === 'mainnet' || n === 'testnet').map((net) => (
          <button
            key={net}
            type="button"
            onClick={() => onChange(net)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              value === net
                ? 'bg-pearl-50 text-pearl-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {NETWORKS[net].name}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        HRP: <code className="font-mono">{NETWORKS[value].bech32HRP}1</code> | Coin Type: {NETWORKS[value].coinType}
      </p>
    </div>
  )
}
