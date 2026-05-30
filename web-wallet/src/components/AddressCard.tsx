import { useState, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'
import type { WalletKey } from '@/lib/wallet/bip86'
import type { NetworkConfig } from '@/lib/wallet/networks'

interface AddressCardProps {
  walletKey: WalletKey
  network: NetworkConfig
}

export default function AddressCard({ walletKey, network }: AddressCardProps) {
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, walletKey.address, {
        width: 200,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      })
    }
  }, [walletKey.address])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletKey.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">Wallet Address</h2>
        <span className="rounded-full bg-pearl-50 px-2.5 py-0.5 text-xs font-medium text-pearl-700">
          {network.name}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-center">
        <div className="flex h-44 w-44 items-center justify-center rounded-lg border bg-white p-2">
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-3">
        <p className="break-all font-mono text-sm text-gray-900">{walletKey.address}</p>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? (
            <><Check className="h-4 w-4 text-green-600" /> Copied</>
          ) : (
            <><Copy className="h-4 w-4" /> Copy Address</>
          )}
        </button>
      </div>

      <div className="mt-4 space-y-2 border-t pt-4 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Derivation Path</span>
          <span className="font-mono text-gray-700">{walletKey.derivationPath}</span>
        </div>
        <div className="flex justify-between">
          <span>Address Index</span>
          <span className="font-mono text-gray-700">{walletKey.addressIndex}</span>
        </div>
        <div className="flex justify-between">
          <span>Network</span>
          <span className="text-gray-700">{network.name}</span>
        </div>
      </div>
    </div>
  )
}
