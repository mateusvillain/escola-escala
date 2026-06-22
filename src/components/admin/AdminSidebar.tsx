'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/cursos', label: 'Cursos' },
  { href: '/admin/trilhas', label: 'Trilhas' },
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/assinaturas', label: 'Assinaturas' },
  { href: '/admin/auditoria', label: 'Auditoria' },
]

interface AdminSidebarProps {
  userName: string
  userEmail: string
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen flex-shrink-0">
      <div className="p-6 border-b border-gray-700">
        <Link href="/" className="font-bold text-lg text-white hover:text-gray-200 transition-colors">
          Plataforma Admin
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {LINKS.map(link => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ].join(' ')}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-sm font-medium text-gray-200 truncate">{userName}</p>
        <p className="text-xs text-gray-400 truncate">{userEmail}</p>
        <Link
          href="/dashboard"
          className="mt-2 block text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← Voltar ao app
        </Link>
      </div>
    </aside>
  )
}
