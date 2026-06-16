import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { CursosHeader } from '@/components/cursos/CursosHeader'
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
      <CursosHeader user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <Footer />
    </div>
  )
}
