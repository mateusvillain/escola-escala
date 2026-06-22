import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { getCourseProgress } from '@/lib/progress'
import { BuyTrackButton } from '@/components/trilhas/BuyTrackButton'

export default async function TrilhaDetalhe({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const track = await prisma.courseTrack.findFirst({
    where: { slug, status: 'published' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      isBundle: true,
      bundlePriceOneTime: true,
      items: {
        orderBy: { order: 'asc' },
        select: {
          order: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
        },
      },
    },
  })

  if (!track) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  const courseIds = track.items.map(item => item.course.id)

  const enrollmentByCourseId = new Map<string, { completedAt: Date | null }>()
  const progressByCourseId = new Map<string, number>()

  if (user) {
    const currentUser = user
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: currentUser.userId, courseId: { in: courseIds } },
      select: { courseId: true, completedAt: true },
    })

    enrollments.forEach(e => enrollmentByCourseId.set(e.courseId, e))

    await Promise.all(
      enrollments.map(async e => {
        const progress = await getCourseProgress(currentUser.userId, e.courseId)
        progressByCourseId.set(e.courseId, progress.percentage)
      })
    )
  }

  const hasAnyEnrollment = enrollmentByCourseId.size > 0
  const completedCount = Array.from(enrollmentByCourseId.values()).filter(
    e => e.completedAt != null
  ).length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        <div className="relative w-full lg:w-80 aspect-video lg:aspect-auto lg:h-52 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {track.thumbnailUrl ? (
            <Image
              src={track.thumbnailUrl}
              alt={track.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 320px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{track.title}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{track.description}</p>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {track.items.length} curso{track.items.length !== 1 ? 's' : ''}
            </span>
            {hasAnyEnrollment && (
              <span className="flex items-center gap-1.5 font-medium text-blue-700">
                {completedCount} de {track.items.length} cursos concluídos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bundle CTA */}
      {track.isBundle && track.bundlePriceOneTime != null && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-lg">Compre a trilha completa</p>
            <p className="text-blue-100 text-sm mt-1">
              Acesso permanente a todos os {track.items.length} cursos em pagamento único.
            </p>
          </div>
          <BuyTrackButton
            trackSlug={track.slug}
            price={Number(track.bundlePriceOneTime)}
            isAuthenticated={!!user}
          />
        </div>
      )}

      {/* Course list */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Cursos da trilha</h2>
        <div className="space-y-3">
          {track.items.map(item => {
            const progress = progressByCourseId.get(item.course.id)
            const enrollment = enrollmentByCourseId.get(item.course.id)

            return (
              <Link
                key={item.course.id}
                href={`/cursos/${item.course.slug}`}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-semibold text-blue-700 bg-blue-50 rounded-full">
                  {item.order}
                </span>

                <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.course.thumbnailUrl ? (
                    <Image
                      src={item.course.thumbnailUrl}
                      alt={item.course.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.course.title}</p>
                  {progress !== undefined ? (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{enrollment?.completedAt ? 'Concluído' : 'Em andamento'}</span>
                        <span className="font-medium text-gray-700">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-1.5 bg-blue-600 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Ver curso</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
