import Image from 'next/image'
import Link from 'next/link'

export interface TrackCardProps {
  title: string
  slug: string
  description: string
  thumbnailUrl: string | null
  totalCourses: number
  isBundle: boolean
  bundlePrice: number | null
}

export function TrackCard({
  title,
  slug,
  description,
  thumbnailUrl,
  totalCourses,
  isBundle,
  bundlePrice,
}: TrackCardProps) {
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
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
            <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
          Trilha
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-4 mt-auto">
          <span>{totalCourses} curso{totalCourses !== 1 ? 's' : ''}</span>
          {isBundle && bundlePrice != null && (
            <span className="font-medium text-indigo-700">
              A partir de R$ {bundlePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        <Link
          href={`/trilhas/${slug}`}
          className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
        >
          Ver trilha
        </Link>
      </div>
    </div>
  )
}
