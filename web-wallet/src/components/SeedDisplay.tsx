import { useState } from 'react'
import { Copy, Eye, EyeOff, Check } from 'lucide-react'

interface SeedDisplayProps {
  seed: string
}

export default function SeedDisplay({ seed }: SeedDisplayProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const words = seed.split(' ')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(seed)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border bg-yellow-50 p-3 text-sm text-yellow-800">
        <strong>Important:</strong> Never share your seed phrase. Anyone with these words can
        access your wallet. Store it securely offline.
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setRevealed(!revealed)}
          className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {words.map((word, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-2 text-sm"
          >
            <span className="min-w-[1.2rem] text-right text-xs text-gray-400">{i + 1}.</span>
            <span className={`font-mono font-medium ${revealed ? 'text-gray-900' : 'blur-sm select-none'}`}>
              {word}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
