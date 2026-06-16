import Image from 'next/image'
import Link from 'next/link'

interface CourseProgressCardProps {
  title: string
  thumbnailUrl: string | null
  progress?: number
  ctaLabel: string
  ctaHref: string
  action?: React.ReactNode
}

export function CourseProgressCard({
  title,
  thumbnailUrl,
  progress,
  ctaLabel,
  ctaHref,
  action,
}: CourseProgressCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
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
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-3">{title}</h3>

        {progress !== undefined && (
          <div className="mb-4 mt-auto">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Progresso</span>
              <span className="font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className={progress === undefined ? 'mt-auto space-y-2' : 'space-y-2'}>
          <Link
            href={ctaHref}
            className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {ctaLabel}
          </Link>
          {action}
        </div>
      </div>
    </div>
  )
}
