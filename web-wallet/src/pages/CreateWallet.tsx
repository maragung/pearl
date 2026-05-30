import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useWalletStore } from '@/store/walletStore'
import SeedDisplay from '@/components/SeedDisplay'
import SeedVerify from '@/components/SeedVerify'
import VerifyBadge from '@/components/VerifyBadge'
import type { WalletKey } from '@/lib/wallet/bip86'
import type { VerificationResult } from '@/lib/wallet/verify'

type Step = 'password' | 'seed' | 'verify' | 'complete'

export default function CreateWallet() {
  const navigate = useNavigate()
  const { createWallet } = useWalletStore()
  const [step, setStep] = useState<Step>('password')
  const [localMnemonic, setLocalMnemonic] = useState('')
  const [localWalletKey, setLocalWalletKey] = useState<WalletKey | null>(null)
  const [localVerification, setLocalVerification] = useState<VerificationResult | null>(null)

  const handleCreate = (pw: string) => {
    const w = createWallet('mainnet', pw)
    setLocalMnemonic(w.mnemonic)
    setLocalWalletKey(w)
    setLocalVerification(useWalletStore.getState().verification)
    toast.success('Wallet created successfully')
    setStep('seed')
  }

  const handleVerifySuccess = () => {
    toast.success('Seed phrase confirmed')
    setStep('complete')
  }

  const handleDone = () => {
    navigate('/wallet')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <button
          onClick={() => {
            if (step === 'seed') { setStep('password'); return }
            if (step === 'verify') { setStep('seed'); return }
            if (step === 'complete') { setStep('verify'); return }
            navigate('/')
          }}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Create Wallet</h1>
          <p className="text-xs text-gray-500">Step {step === 'password' ? 1 : step === 'seed' ? 2 : step === 'verify' ? 3 : 4} of 4</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-md space-y-6">
          {step === 'password' && (
            <PasswordStep onNext={handleCreate} />
          )}
          {step === 'seed' && localMnemonic && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Seed Phrase</h2>
              <p className="text-sm text-gray-600">
                Write down these 12 words in order. You will need them to restore your wallet.
              </p>
              <SeedDisplay seed={localMnemonic} />
              {localVerification && <VerifyBadge verification={localVerification} />}
              <button
                onClick={() => setStep('verify')}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-pearl-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-pearl-700"
              >
                I have written down my seed phrase
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {step === 'verify' && localMnemonic && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Verify Your Seed</h2>
              <p className="text-sm text-gray-600">
                Select the words in the correct order to confirm you have saved them.
              </p>
              <SeedVerify seed={localMnemonic} onSuccess={handleVerifySuccess} />
            </div>
          )}
          {step === 'complete' && localWalletKey && localVerification && (
            <CompleteStep
              walletKey={localWalletKey}
              verification={localVerification}
              onDone={handleDone}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function PasswordStep({ onNext }: { onNext: (password: string) => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    onNext(password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Set a Password</h2>
        <p className="mt-1 text-sm text-gray-600">
          This password encrypts your wallet in this browser. It is separate from
          your seed phrase.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-pearl-500 focus:outline-none focus:ring-1 focus:ring-pearl-500"
          placeholder="Min. 8 characters"
          minLength={8}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-pearl-500 focus:outline-none focus:ring-1 focus:ring-pearl-500"
          placeholder="Re-enter password"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-pearl-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-pearl-700"
      >
        Create Wallet
      </button>
    </form>
  )
}

function CompleteStep({
  walletKey,
  verification,
  onDone,
}: {
  walletKey: WalletKey
  verification: VerificationResult
  onDone: () => void
}) {
  return (
    <div className="space-y-4 text-center">
      <div className="inline-flex rounded-full bg-green-50 p-3 text-green-600">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900">Wallet Created</h2>
      <p className="text-sm text-gray-600">Your wallet has been created and verified.</p>

      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs text-gray-500 mb-1">Address</p>
        <p className="break-all font-mono text-sm text-gray-900">{walletKey.address}</p>
      </div>

      <VerifyBadge verification={verification} className="justify-center" />

      <div className="space-y-2 text-left text-xs text-gray-500">
        {verification.checks.map((check) => (
          <div key={check.name} className="flex items-start gap-2">
            <span className={check.passed ? 'text-green-600' : 'text-red-600'}>
              {check.passed ? '✓' : '✗'}
            </span>
            <span>{check.detail}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onDone}
        className="w-full rounded-md bg-pearl-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-pearl-700"
      >
        Go to Wallet
      </button>
    </div>
  )
}
