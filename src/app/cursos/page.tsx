import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { CatalogFilters } from '@/components/cursos/CatalogFilters'
import { CourseCard } from '@/components/cursos/CourseCard'
import { TrackCard } from '@/components/trilhas/TrackCard'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
      <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-base font-medium text-gray-500">Nenhum curso encontrado</p>
      <p className="text-sm">Tente ajustar os filtros ou a busca.</p>
    </div>
  )
}

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<{ planAccess?: string; search?: string }>
}) {
  const { planAccess, search } = await searchParams

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  let userPlanType: 'basic' | 'premium' | null = null
  let enrolledCourseIds = new Set<string>()

  if (user) {
    const [subscription, enrollments] = await Promise.all([
      prisma.userSubscription.findFirst({
        where: { userId: user.userId, status: 'active' },
        include: { plan: true },
      }),
      prisma.courseEnrollment.findMany({
        where: { userId: user.userId },
        select: { courseId: true },
      }),
    ])
    if (subscription) userPlanType = subscription.plan.type
    enrolledCourseIds = new Set(enrollments.map(e => e.courseId))
  }

  const isAdmin = user?.role === 'admin'
  const hasFullCatalogAccess = userPlanType === 'premium' || isAdmin

  const [courses, tracks] = await Promise.all([
    prisma.course.findMany({
      where: {
        status: 'published',
        trackItems: { none: {} },
        ...(!hasFullCatalogAccess && (planAccess === 'basic' || planAccess === 'premium')
          ? { planAccess }
          : {}),
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        planAccess: true,
        instructor: {
          select: {
            user: { select: { name: true } },
          },
        },
        modules: {
          select: {
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.courseTrack.findMany({
      where: {
        status: 'published',
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        isBundle: true,
        bundlePriceOneTime: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <lui-heading level="1" size="xl">Catálogo de Cursos</lui-heading>
        <p className="text-sm text-gray-500 mt-1">Explore todos os cursos disponíveis na plataforma.</p>
      </div>

      <Suspense>
        <CatalogFilters hidePlanFilter={hasFullCatalogAccess} />
      </Suspense>

      {tracks.length > 0 && (
        <div className="mb-10">
          <lui-heading level="2" size="lg">Trilhas</lui-heading>
          <p className="text-sm text-gray-500 mt-1 mb-4">Sequências de cursos organizadas por tema.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map(track => (
              <TrackCard
                key={track.id}
                title={track.title}
                slug={track.slug}
                description={track.description}
                thumbnailUrl={track.thumbnailUrl}
                totalCourses={track._count.items}
                isBundle={track.isBundle}
                bundlePrice={
                  !isAdmin && userPlanType === null && track.bundlePriceOneTime != null
                    ? Number(track.bundlePriceOneTime)
                    : null
                }
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <lui-heading level="2" size="lg">Cursos sem trilha</lui-heading>
        <p className="text-sm text-gray-500 mt-1 mb-4">Cursos avulsos, não vinculados a nenhuma trilha.</p>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const totalLessons = course.modules.reduce((sum, m) => sum + m._count.lessons, 0)
              const hasAccess =
                hasFullCatalogAccess ||
                (userPlanType === 'basic' && course.planAccess === 'basic')
              const hasEnrollment = enrolledCourseIds.has(course.id)

              return (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  slug={course.slug}
                  description={course.description}
                  thumbnailUrl={course.thumbnailUrl}
                  planAccess={course.planAccess}
                  instructorName={course.instructor.user.name}
                  totalLessons={totalLessons}
                  hasAccess={hasAccess}
                  hasEnrollment={hasEnrollment}
                  isAuthenticated={user !== null}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
