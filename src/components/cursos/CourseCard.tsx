import Image from 'next/image'
import Link from 'next/link'

const PLAN_LABELS = { basic: 'Básico', premium: 'Premium' } as const
const PLAN_VARIANTS = { basic: 'bg-blue-50 text-blue-700', premium: 'bg-amber-50 text-amber-700' } as const

export interface CourseCardProps {
  title: string
  slug: string
  description: string
  thumbnailUrl: string | null
  planAccess: 'basic' | 'premium'
  instructorName: string
  totalLessons: number
  hasAccess: boolean
  hasEnrollment: boolean
  isAuthenticated: boolean
}

export function CourseCard({
  title,
  slug,
  description,
  thumbnailUrl,
  planAccess,
  instructorName,
  totalLessons,
  hasAccess,
  hasEnrollment,
  isAuthenticated,
}: CourseCardProps) {
  let ctaLabel: string
  if (!isAuthenticated || !hasAccess) {
    ctaLabel = 'Ver curso'
  } else if (hasEnrollment) {
    ctaLabel = 'Continuar'
  } else {
    ctaLabel = 'Começar'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-100 flex-shrink-0">
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
        {/* Plan badge */}
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_VARIANTS[planAccess]}`}>
          {PLAN_LABELS[planAccess]}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-4 mt-auto">
          <span>{instructorName}</span>
          <span>{totalLessons} aula{totalLessons !== 1 ? 's' : ''}</span>
        </div>

        <Link
          href={`/cursos/${slug}`}
          className={[
            'block w-full text-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            hasAccess && isAuthenticated
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50',
          ].join(' ')}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
