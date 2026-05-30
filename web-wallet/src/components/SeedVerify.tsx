import { useState, useMemo } from 'react'
import { Shuffle } from 'lucide-react'

interface SeedVerifyProps {
  seed: string
  onSuccess: () => void
}

export default function SeedVerify({ seed, onSuccess }: SeedVerifyProps) {
  const originalWords = useMemo(() => seed.split(' '), [seed])
  const [shuffledWords] = useState(() =>
    [...originalWords].sort(() => Math.random() - 0.5)
  )
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState(false)

  const handleWordClick = (word: string) => {
    if (selected.length >= originalWords.length) return
    setSelected([...selected, word])
    setError(false)
  }

  const handleUndo = () => {
    setSelected(selected.slice(0, -1))
    setError(false)
  }

  const handleVerify = () => {
    if (selected.join(' ') === originalWords.join(' ')) {
      onSuccess()
    } else {
      setError(true)
    }
  }

  const handleReset = () => {
    setSelected([])
    setError(false)
  }

  const isComplete = selected.length === originalWords.length

  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-gray-600">
        Confirm your seed phrase by selecting the words in the correct order.
      </p>

      <div className="min-h-[5rem] rounded-lg border-2 border-dashed bg-white p-3">
        <div className="flex flex-wrap gap-1.5">
          {selected.map((word, i) => (
            <span
              key={`${i}-${word}`}
              className="inline-flex items-center gap-1 rounded-md bg-pearl-100 px-2 py-1 text-sm font-mono text-pearl-800"
            >
              <span className="text-[10px] text-pearl-500">{i + 1}.</span>
              {word}
            </span>
          ))}
          {selected.length === 0 && (
            <span className="text-sm text-gray-400 italic">
              Click the words below in order...
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600">
          Incorrect order. Try again.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {shuffledWords.map((word, i) => {
          const usedCount = selected.filter((w) => w === word).length
          const totalCount = originalWords.filter((w) => w === word).length
          const isUsed = usedCount >= totalCount
          return (
            <button
              key={`${i}-${word}`}
              onClick={() => handleWordClick(word)}
              disabled={isUsed}
              className={`rounded-md border px-3 py-1.5 text-sm font-mono transition-colors
                ${isUsed
                  ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                  : 'border-gray-200 bg-white text-gray-900 hover:bg-pearl-50 hover:border-pearl-200'
                }`}
            >
              {word}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleUndo}
          disabled={selected.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          Undo
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Reset
        </button>
        <div className="flex-1" />
        <button
          onClick={handleVerify}
          disabled={!isComplete}
          className="rounded-md bg-pearl-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pearl-700 disabled:opacity-40"
        >
          Verify
        </button>
      </div>
    </div>
  )
}
