import { useState, useCallback } from 'react'
import { useWalletStore } from '@/store/walletStore'
import { walletAPI } from '@/lib/wallet/api'
import { saveWallet, loadWallet, hasStoredWallet, clearStoredWallet } from '@/lib/wallet/storage'
import type { NetworkName } from '@/lib/wallet/networks'

export interface ServerStatus {
  available: boolean
  network: string
  xmss: boolean
  version: string
}

export function useWallet() {
  const store = useWalletStore()
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [checkingServer, setCheckingServer] = useState(false)
  const [xmssAddress, setXmssAddress] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkServer = useCallback(async () => {
    setCheckingServer(true)
    try {
      const health = await walletAPI.checkHealth()
      if (health) {
        setServerStatus({
          available: true,
          network: health.network,
          xmss: health.xmss,
          version: health.version,
        })
      } else {
        setServerStatus(null)
      }
    } catch {
      setServerStatus(null)
    } finally {
      setCheckingServer(false)
    }
  }, [])

  const crossCheckWithServer = useCallback(async (mnemonic: string, address: string) => {
    if (!serverStatus?.available) return null
    try {
      return await walletAPI.verifyAddress(mnemonic, address)
    } catch {
      return null
    }
  }, [serverStatus])

  const deriveXMSSAddress = useCallback(async (mnemonic: string) => {
    if (!serverStatus?.available || !serverStatus?.xmss) return null
    try {
      const result = await walletAPI.deriveXMSS(mnemonic)
      setXmssAddress(result.xmssAddress)
      return result
    } catch {
      return null
    }
  }, [serverStatus])

  const saveToStorage = useCallback(async (password: string) => {
    const { mnemonic, network } = useWalletStore.getState()
    if (!mnemonic) return
    setSaving(true)
    try {
      await saveWallet(mnemonic, network, password)
    } finally {
      setSaving(false)
    }
  }, [])

  const loadFromStorage = useCallback(async (password: string) => {
    setLoading(true)
    try {
      const stored = await loadWallet(password)
      if (!stored) return false
      const net = stored.network as NetworkName
      const wk = store.importWallet(stored.mnemonic, net)
      return !!wk
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }, [store])

  const hasExistingWallet = hasStoredWallet()

  return {
    ...store,
    serverStatus,
    checkingServer,
    xmssAddress,
    saving,
    loading,
    hasExistingWallet,
    checkServer,
    crossCheckWithServer,
    deriveXMSSAddress,
    saveToStorage,
    loadFromStorage,
    clearStoredWallet: () => {
      clearStoredWallet()
      store.clearWallet()
    },
  }
}
