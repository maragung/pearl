import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, RefreshCw, LogOut, CheckCircle, XCircle, Server, Wifi, WifiOff, Shuffle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useWallet } from '@/hooks/useWallet'
import { NETWORKS } from '@/lib/wallet/networks'
import { downloadExportFile, createExportData } from '@/lib/wallet/export'
import { verifyWalletDerivation } from '@/lib/wallet/verify'
import AddressCard from '@/components/AddressCard'
import VerifyBadge from '@/components/VerifyBadge'

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    walletKey, network, verification, mnemonic, password, createdAt,
    serverStatus, checkingServer,
    xmssAddress,
    checkServer, crossCheckWithServer, deriveXMSSAddress,
    saveToStorage, clearStoredWallet,
  } = useWallet()
  const [reVerifyResult, setReVerifyResult] = useState<typeof verification>(null)
  const [serverVerifyResult, setServerVerifyResult] = useState<any>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [savePassword, setSavePassword] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!walletKey) {
      navigate('/')
      return
    }
    checkServer()
  }, [walletKey, navigate, checkServer])

  if (!walletKey || !mnemonic) return null

  const net = NETWORKS[network]

  const handleExport = () => {
    try {
      const data = createExportData(walletKey, network, password || '')
      downloadExportFile(data)
      toast.success('Wallet exported successfully')
    } catch (err) {
      toast.error('Failed to export wallet')
    }
  }

  const handleReVerify = () => {
    try {
      const { verification: v } = verifyWalletDerivation(mnemonic, net)
      setReVerifyResult(v)
      if (v.passed) {
        toast.success('JS verification passed')
      } else {
        toast.error('JS verification failed')
      }
    } catch (err) {
      toast.error('Re-verification failed')
    }
  }

  const handleServerVerify = async () => {
    try {
      const result = await crossCheckWithServer(mnemonic, walletKey.address)
      if (result) {
        setServerVerifyResult(result)
        if (result.passed) {
          toast.success('Server cross-check: MATCH')
        } else {
          toast.error('Server cross-check: MISMATCH')
        }
      } else {
        toast.error('Server not available')
      }
    } catch {
      toast.error('Server verification failed')
    }
  }

  const handleDeriveXMSS = async () => {
    try {
      const result = await deriveXMSSAddress(mnemonic)
      if (result) {
        toast.success('XMSS address derived')
      } else {
        toast.error('Server XMSS not available')
      }
    } catch {
      toast.error('XMSS derivation failed')
    }
  }

  const handleSaveToStorage = async () => {
    if (savePassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    await saveToStorage(savePassword)
    setSaved(true)
    setShowSaveDialog(false)
    toast.success('Wallet saved to browser')
  }

  const handleClear = () => {
    clearStoredWallet()
    navigate('/')
    toast.success('Wallet cleared')
  }

  const activeVerification = reVerifyResult || verification

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Wallet Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your Pearl wallet</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Lock className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Save dialog */}
        {showSaveDialog && (
          <div className="rounded-xl border bg-yellow-50 p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Encrypt & Save Wallet</h3>
            <p className="mb-3 text-xs text-gray-600">
              Your seed phrase will be encrypted with this password and stored in browser localStorage.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={savePassword}
                onChange={(e) => setSavePassword(e.target.value)}
                placeholder="Encryption password"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pearl-500 focus:outline-none focus:ring-1 focus:ring-pearl-500"
                minLength={8}
              />
              <button
                onClick={handleSaveToStorage}
                disabled={savePassword.length < 8}
                className="rounded-md bg-pearl-600 px-4 py-2 text-sm font-medium text-white hover:bg-pearl-700 disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="rounded-md border bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <AddressCard walletKey={walletKey} network={net} />
        </div>

        {/* Server Status */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Go API Server</span>
            </div>
            <div className="flex items-center gap-2">
              {checkingServer ? (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Checking...
                </span>
              ) : serverStatus?.available ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Wifi className="h-3 w-3" /> Connected ({serverStatus.network})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <WifiOff className="h-3 w-3" /> Not available
                </span>
              )}
              <button onClick={checkServer} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Cross-Check */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Cross-Check Verification</h2>
            <VerifyBadge verification={activeVerification} />
          </div>

          <div className="space-y-2">
            {activeVerification?.checks.map((check) => (
              <div key={check.name} className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 text-xs">
                {check.passed ? (
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                )}
                <div>
                  <span className="font-medium text-gray-900">{check.name}</span>
                  <span className="ml-1 text-gray-600">{check.detail}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleReVerify}
              className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-verify (JS)
            </button>
            <button
              onClick={handleServerVerify}
              disabled={!serverStatus?.available}
              className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <Server className="h-3.5 w-3.5" />
              Cross-check (Go)
            </button>
          </div>

          {serverVerifyResult && (
            <div className={`mt-3 rounded-lg p-3 text-xs ${serverVerifyResult.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {serverVerifyResult.description}
            </div>
          )}
        </div>

        {/* XMSS Section */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Post-Quantum (XMSS) Address</h2>
          <p className="mb-4 text-sm text-gray-600">
            Derive an address with XMSS post-quantum tapscript commitment.
            Requires the Go API server running with --xmss flag.
          </p>
          <button
            onClick={handleDeriveXMSS}
            disabled={!serverStatus?.available || !serverStatus?.xmss}
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <Shuffle className="h-4 w-4" />
            Derive XMSS Address
          </button>
          {xmssAddress && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">XMSS Address (with PQ tapscript)</p>
              <p className="break-all font-mono text-sm text-gray-900">{xmssAddress}</p>
            </div>
          )}
          {(!serverStatus?.xmss && serverStatus?.available) && (
            <p className="mt-2 text-xs text-amber-600">
              Start server with --xmss to enable XMSS support.
            </p>
          )}
        </div>

        {/* Export */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Export Wallet</h2>
            {saved && <span className="text-xs text-green-600">Saved locally</span>}
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Download a JSON file compatible with{' '}
            <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">oyster --createfromfile</code>
          </p>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-md bg-pearl-600 px-4 py-2 text-sm font-medium text-white hover:bg-pearl-700"
          >
            <Download className="h-4 w-4" />
            Export Wallet File
          </button>
        </div>

        {/* Derivation Details */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Derivation Details</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <p className="text-gray-500">Standard</p>
              <p className="font-mono text-gray-800">BIP-86 (Taproot)</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Post-Quantum</p>
              <p className="font-mono text-gray-800">BIP-222 (XMSS)</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Derivation Path</p>
              <p className="font-mono text-gray-800 break-all">{walletKey.derivationPath}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Network</p>
              <p className="font-mono text-gray-800">{net.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Bech32 HRP</p>
              <p className="font-mono text-gray-800">{net.bech32HRP}1</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Coin Type</p>
              <p className="font-mono text-gray-800">{net.coinType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Created</p>
              <p className="text-gray-800">{createdAt ? new Date(createdAt).toLocaleDateString() : 'Now'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Words</p>
              <p className="font-mono text-gray-800">{mnemonic.split(' ').length}-word BIP39</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
