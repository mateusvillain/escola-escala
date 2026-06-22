import Image from 'next/image'
import Link from 'next/link'

interface ModuleLockedPromptProps {
  releaseLabel: string
  courseSlug: string
  thumbnailUrl?: string | null
}

export function ModuleLockedPrompt({ releaseLabel, courseSlug, thumbnailUrl }: ModuleLockedPromptProps) {
  return (
    <div
      className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900"
      style={{ aspectRatio: '16 / 9' }}
    >
      {thumbnailUrl && (
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          className="object-cover blur-sm opacity-30"
        />
      )}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 py-8 gap-4">
        <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
        </svg>

        <div>
          <p className="text-white font-semibold text-lg">Módulo ainda não liberado</p>
          <p className="text-white/90 text-sm max-w-sm mt-1.5 mx-auto">{releaseLabel}</p>
        </div>

        <Link
          href={`/cursos/${courseSlug}`}
          className="px-6 py-2.5 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Voltar ao curso
        </Link>
      </div>
    </div>
  )
}
