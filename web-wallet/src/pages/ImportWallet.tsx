import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useWalletStore } from '@/store/walletStore'
import VerifyBadge from '@/components/VerifyBadge'
import { validateMnemonic } from '@/lib/wallet/bip39'
import { parseImportFile } from '@/lib/wallet/export'
import type { WalletKey } from '@/lib/wallet/bip86'
import type { VerificationResult } from '@/lib/wallet/verify'

type Tab = 'seed' | 'file'

export default function ImportWallet() {
  const navigate = useNavigate()
  const { importWallet } = useWalletStore()
  const [tab, setTab] = useState<Tab>('seed')
  const [seedInput, setSeedInput] = useState('')
  const [importedKey, setImportedKey] = useState<WalletKey | null>(null)
  const [importedVerification, setImportedVerification] = useState<VerificationResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportBySeed = () => {
    const phrase = seedInput.trim().toLowerCase()
    if (!phrase) {
      toast.error('Please enter your seed phrase')
      return
    }
    if (!validateMnemonic(phrase)) {
      toast.error('Invalid BIP39 seed phrase')
      return
    }
    try {
      const wk = importWallet(phrase, 'mainnet')
      setImportedKey(wk)
      setImportedVerification(useWalletStore.getState().verification)
      toast.success('Wallet imported successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = parseImportFile(text)
      setSeedInput(data.Seed)
      setTab('seed')
      toast.success('Wallet file parsed. Verify and import.')
    } catch (err) {
      toast.error('Invalid wallet file')
    }
  }

  const handleDone = () => {
    navigate('/wallet')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <button onClick={() => navigate('/')} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold text-gray-900">Import Wallet</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex rounded-lg border bg-white p-0.5">
            <button
              onClick={() => setTab('seed')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${tab === 'seed' ? 'bg-pearl-50 text-pearl-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FileText className="mr-1.5 inline h-4 w-4" />
              Seed Phrase
            </button>
            <button
              onClick={() => setTab('file')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${tab === 'file' ? 'bg-pearl-50 text-pearl-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Upload className="mr-1.5 inline h-4 w-4" />
              File
            </button>
          </div>

          {tab === 'seed' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Seed Phrase</label>
                <textarea
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-pearl-500 focus:outline-none focus:ring-1 focus:ring-pearl-500"
                  placeholder="Enter your 12 or 24-word BIP39 seed phrase..."
                />
              </div>
              <button
                onClick={handleImportBySeed}
                className="w-full rounded-md bg-pearl-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-pearl-700"
              >
                Import Wallet
              </button>
            </div>
          )}

          {tab === 'file' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center hover:border-pearl-400"
              >
                <Upload className="mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Click to upload</p>
                <p className="text-xs text-gray-500">
                  Pearl Wallet export file (.json)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-500 text-center">
                Compatible with oyster --createfromfile
              </p>
            </div>
          )}

          {importedKey && importedVerification && (
            <div className="space-y-4 rounded-xl border bg-white p-6">
              <h3 className="font-semibold text-gray-900">Wallet Imported</h3>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="break-all font-mono text-sm text-gray-900">
                  {importedKey.address}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500">Derivation Path</p>
                <p className="font-mono text-xs text-gray-700">{importedKey.derivationPath}</p>
              </div>

              <VerifyBadge verification={importedVerification} className="justify-center" />

              <div className="space-y-1 text-xs text-gray-500">
                {importedVerification.checks.map((check) => (
                  <div key={check.name} className="flex items-start gap-2">
                    <span className={check.passed ? 'text-green-600' : 'text-red-600'}>
                      {check.passed ? '✓' : '✗'}
                    </span>
                    <span>{check.detail}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleDone}
                className="w-full rounded-md bg-pearl-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-pearl-700"
              >
                Go to Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
