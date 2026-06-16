import Image from 'next/image'
import Link from 'next/link'

interface ContinueWatchingCardProps {
  courseTitle: string
  lessonTitle: string
  thumbnailUrl: string | null
  href: string
}

export function ContinueWatchingCard({
  courseTitle,
  lessonTitle,
  thumbnailUrl,
  href,
}: ContinueWatchingCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-64 aspect-video flex-shrink-0 bg-gray-100">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={courseTitle}
            fill
            className="object-cover"
            sizes="256px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1 justify-center">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
          Continuar de onde parei
        </p>
        <p className="text-sm text-gray-500 mb-1">{courseTitle}</p>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{lessonTitle}</h3>
        <Link
          href={href}
          className="inline-block self-start px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Continuar aula
        </Link>
      </div>
    </div>
  )
}
