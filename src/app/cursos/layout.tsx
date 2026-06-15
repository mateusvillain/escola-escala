import { cookies } from 'next/headers'
import Link from 'next/link'
import { verifyToken } from '@/lib/jwt'
import { UserMenu } from '@/components/layout/UserMenu'
import { Footer } from '@/components/layout/Footer'

export default async function CursosLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0 font-bold text-xl text-blue-600 tracking-tight">
            Plataforma
          </Link>

          <div role="navigation" className="hidden md:flex items-center gap-1">
            <Link
              href="/cursos"
              className="px-4 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
            >
              Catálogo
            </Link>
          </div>

          <div className="flex items-center gap-3">
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
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <Footer />
    </div>
  )
}
