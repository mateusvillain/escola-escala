'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { JwtPayload } from '@/lib/jwt'

export function UserMenu({ user, showReviewsLink = false }: { user: JwtPayload; showReviewsLink?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label="Menu do usuário"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold select-none">
          {initials}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Perfil
            </Link>
            {user.role === 'instructor' && (
              <Link
                href="/instrutor"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Painel do Instrutor
              </Link>
            )}
            <Link
              href="/dashboard/assinatura"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Minha Assinatura
            </Link>
            {showReviewsLink && (
              <Link
                href="/dashboard/avaliacoes"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Minhas Avaliações
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
