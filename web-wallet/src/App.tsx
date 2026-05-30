import { HashRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from '@/components/Layout'
import Welcome from '@/pages/Welcome'
import CreateWallet from '@/pages/CreateWallet'
import ImportWallet from '@/pages/ImportWallet'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  return (
    <HashRouter>
      <Toaster position="top-center" richColors />
      <Layout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/create" element={<CreateWallet />} />
          <Route path="/import" element={<ImportWallet />} />
          <Route path="/wallet" element={<Dashboard />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
