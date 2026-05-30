import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Upload, ShieldCheck, Key, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { hasStoredWallet, loadWallet, clearStoredWallet } from '@/lib/wallet/storage'
import { useWalletStore } from '@/store/walletStore'
import type { NetworkName } from '@/lib/wallet/networks'

export default function Welcome() {
  const navigate = useNavigate()
  const { importWallet } = useWalletStore()
  const [existingWallet, setExistingWallet] = useState(false)
  const [showUnlock, setShowUnlock] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    setExistingWallet(hasStoredWallet())
  }, [])

  const handleUnlock = async () => {
    if (unlockPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setUnlocking(true)
    try {
      const stored = await loadWallet(unlockPassword)
      if (!stored) {
        toast.error('Wrong password or no wallet found')
        setUnlocking(false)
        return
      }
      importWallet(stored.mnemonic, stored.network as NetworkName)
      navigate('/wallet')
      toast.success('Wallet unlocked')
    } catch {
      toast.error('Failed to unlock wallet')
    } finally {
      setUnlocking(false)
    }
  }

  const handleClearStorage = () => {
    clearStoredWallet()
    setExistingWallet(false)
    setShowUnlock(false)
    toast.success('Stored wallet cleared')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-3">
          <div className="text-5xl">💎</div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Pearl Wallet
          </h1>
          <p className="text-sm text-gray-500">
            A secure web wallet for the Pearl blockchain. Create a new wallet or
            import an existing one using your seed phrase.
          </p>
        </div>

        {existingWallet && !showUnlock && (
          <div className="rounded-xl border-2 border-pearl-200 bg-pearl-50 p-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-pearl-800 mb-2">
              <Lock className="h-4 w-4" />
              Encrypted wallet found in browser
            </div>
            <button
              onClick={() => setShowUnlock(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-pearl-600 px-4 py-2 text-sm font-medium text-white hover:bg-pearl-700"
            >
              <Key className="h-4 w-4" />
              Unlock Wallet
            </button>
          </div>
        )}

        {showUnlock && (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Unlock Wallet</h3>
            <div className="flex gap-2">
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Wallet password"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pearl-500 focus:outline-none focus:ring-1 focus:ring-pearl-500"
                minLength={8}
              />
              <button
                onClick={handleUnlock}
                disabled={unlocking || unlockPassword.length < 8}
                className="rounded-md bg-pearl-600 px-4 py-2 text-sm font-medium text-white hover:bg-pearl-700 disabled:opacity-40"
              >
                {unlocking ? 'Unlocking...' : 'Unlock'}
              </button>
            </div>
            <button
              onClick={handleClearStorage}
              className="mt-2 text-xs text-gray-400 hover:text-red-500"
            >
              Clear stored wallet
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/create')}
            className="group relative rounded-xl border-2 border-pearl-200 bg-white p-6 text-left shadow-sm transition-all hover:border-pearl-400 hover:shadow-md"
          >
            <div className="mb-3 inline-flex rounded-lg bg-pearl-50 p-2.5 text-pearl-600 group-hover:bg-pearl-100">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-semibold text-gray-900">Create Wallet</h3>
            <p className="text-sm text-gray-500">
              Generate a new wallet with a secure 12-word seed phrase
            </p>
          </button>

          <button
            onClick={() => navigate('/import')}
            className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-gray-400 hover:shadow-md"
          >
            <div className="mb-3 inline-flex rounded-lg bg-gray-50 p-2.5 text-gray-600 group-hover:bg-gray-100">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-semibold text-gray-900">Import Wallet</h3>
            <p className="text-sm text-gray-500">
              Restore your wallet using a seed phrase or export file
            </p>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="h-3 w-3" />
          Client-side only. Keys never leave your device.
        </div>
      </div>
    </div>
  )
}
