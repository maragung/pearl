import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isWalletPage = location.pathname === '/wallet'

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {isWalletPage && (
        <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="text-lg">💎</span>
              <span>Pearl Wallet</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <Link to="/" className="hover:text-gray-900">
                Home
              </Link>
            </nav>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  )
}
