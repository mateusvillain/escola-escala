import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import Link from 'next/link'
import { EmpresasPlanClient } from './EmpresasPlanClient'

export const metadata = {
  title: 'Planos para Empresas',
}

export default async function PlanosEmpresasPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let isAuthenticated = false
  if (token) {
    try {
      verifyToken(token)
      isAuthenticated = true
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-bold text-xl text-blue-600 tracking-tight">
              Plataforma
            </Link>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/organizacao"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Minha organização
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Para empresas</h1>
          <p className="text-lg text-gray-600">
            Dê à sua equipe acesso a todo o catálogo de cursos, com gestão centralizada de membros e cobrança
            por seat.
          </p>
        </div>

        <EmpresasPlanClient isAuthenticated={isAuthenticated} />
      </main>
    </div>
  )
}
