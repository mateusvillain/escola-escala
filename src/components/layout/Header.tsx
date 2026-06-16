'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { JwtPayload } from '@/lib/jwt'
import { UserMenu } from './UserMenu'

const NAV_LINKS = [
  { href: '/cursos', label: 'Catálogo' },
  { href: '/dashboard', label: 'Dashboard' },
]

export function Header({ user }: { user: JwtPayload }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-xl text-blue-600 tracking-tight">
            Plataforma
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1" role="navigation" aria-label="Navegação principal">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <UserMenu user={user} />
            </div>

            {/* Hamburger */}
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 pt-2 pb-3 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="px-4 py-3 border-t border-gray-100">
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
                href="/assinatura"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Minha Assinatura
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
