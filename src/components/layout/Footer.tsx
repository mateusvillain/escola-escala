import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Plataforma de Cursos. Todos os direitos reservados.
          </p>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/sobre" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Sobre
            </Link>
            <Link href="/termos" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Privacidade
            </Link>
            <Link href="/contato" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Contato
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
