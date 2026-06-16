import Image from 'next/image'
import Link from 'next/link'

interface CompletedCourseCardProps {
  title: string
  slug: string
  thumbnailUrl: string | null
  completedAt: string
  certificateUrl: string | null
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function CompletedCourseCard({
  title,
  slug,
  thumbnailUrl,
  completedAt,
  certificateUrl,
}: CompletedCourseCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <Link href={`/cursos/${slug}`} className="relative w-full aspect-video bg-gray-100 flex-shrink-0 block">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
          Concluído
        </span>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link href={`/cursos/${slug}`}>
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1 hover:text-blue-700 transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mb-4 mt-auto">Concluído em {formatDate(completedAt)}</p>

        {certificateUrl ? (
          <a
            href={certificateUrl}
            className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Baixar Certificado
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Gerando...
          </button>
        )}
      </div>
    </div>
  )
}
