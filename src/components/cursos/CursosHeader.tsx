'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { JwtPayload } from '@/lib/jwt'
import { UserMenu } from '@/components/layout/UserMenu'

export function CursosHeader({ user }: { user: JwtPayload | null }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 font-bold text-xl text-blue-600 tracking-tight">
            Plataforma
          </Link>

          <div role="navigation" className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
            <Link
              href="/cursos"
              className="px-4 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
            >
              Catálogo
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              {user ? (
                <UserMenu user={user} />
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Entrar
                </Link>
              )}
            </div>

            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 pt-2 pb-3 space-y-1">
            <Link
              href="/cursos"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
            >
              Catálogo
            </Link>
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="px-4 py-3 border-t border-gray-100">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link
                    href="/perfil"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Perfil
                  </Link>
                  <Link
                    href="/dashboard/assinatura"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Minha Assinatura
                  </Link>
                </div>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
