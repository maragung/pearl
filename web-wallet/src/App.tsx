import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/ErrorBoundary'
import Welcome from '@/pages/Welcome'
import CreateWallet from '@/pages/CreateWallet'
import ImportWallet from '@/pages/ImportWallet'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/create" element={<CreateWallet />} />
          <Route path="/import" element={<ImportWallet />} />
          <Route path="/wallet" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
