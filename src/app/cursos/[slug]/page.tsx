import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { CourseAccordion } from '@/components/cursos/CourseAccordion'
import { StarRating } from '@/components/cursos/StarRating'
import { ReviewReminderBanner } from '@/components/cursos/ReviewReminderBanner'
import { BuyCourseButton } from '@/components/cursos/BuyCourseButton'

const PLAN_LABELS = { basic: 'Básico', premium: 'Premium' } as const
const PLAN_STYLES = {
  basic: 'bg-blue-50 text-blue-700 border-blue-200',
  premium: 'bg-amber-50 text-amber-700 border-amber-200',
} as const

function formatTotalDuration(seconds: number): string {
  if (seconds === 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export default async function CursoDetalhe({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const course = await prisma.course.findFirst({
    where: { slug, status: 'published' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      planAccess: true,
      allowOneTimePurchase: true,
      priceOneTime: true,
      instructor: {
        select: {
          slug: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
      modules: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              videoDuration: true,
              isPreview: true,
              order: true,
              videoId: true,
            },
          },
          quiz: { select: { id: true, _count: { select: { questions: true } } } },
        },
      },
    },
  })

  if (!course) notFound()

  const reviewAggregate = await prisma.courseReview.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const averageRating = reviewAggregate._avg.rating ?? 0
  const reviewCount = reviewAggregate._count.rating

  const allLessons = course.modules.flatMap(m => m.lessons)
  const totalSeconds = allLessons.reduce((s, l) => s + (l.videoDuration ?? 0), 0)
  const totalDuration = formatTotalDuration(totalSeconds)

  // Auth + access
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  let user = null
  if (token) {
    try { user = verifyToken(token) } catch {}
  }

  let hasAccess = false
  let hasEnrollment = false
  let isCompleted = false
  let myReview: { rating: number; comment: string | null; createdAt: Date } | null = null
  let lastWatchedLessonTitle: string | null = null

  if (user) {
    const [subscription, enrollment, lastProgress, review] = await Promise.all([
      prisma.userSubscription.findFirst({
        where: { userId: user.userId, status: 'active' },
        include: { plan: true },
      }),
      prisma.courseEnrollment.findFirst({
        where: { userId: user.userId, courseId: course.id },
        select: { id: true, completedAt: true },
      }),
      prisma.lessonProgress.findFirst({
        where: {
          userId: user.userId,
          lesson: { module: { courseId: course.id } },
        },
        orderBy: { lastWatchedAt: 'desc' },
        select: { lesson: { select: { title: true } } },
      }),
      prisma.courseReview.findUnique({
        where: { userId_courseId: { userId: user.userId, courseId: course.id } },
        select: { rating: true, comment: true, createdAt: true },
      }),
    ])

    const planType = subscription?.plan.type ?? null
    hasEnrollment = enrollment !== null
    // CourseEnrollment (ex: compra avulsa) dá acesso direto, independente de assinatura.
    hasAccess =
      user.role === 'admin' ||
      planType === 'premium' ||
      (planType === 'basic' && course.planAccess === 'basic') ||
      hasEnrollment
    isCompleted = enrollment?.completedAt != null
    myReview = review
    lastWatchedLessonTitle = lastProgress?.lesson.title ?? null
  }

  // Modules for accordion — omit videoId if no access
  const modules = course.modules.map(m => ({
    ...m,
    lessons: m.lessons.map(l => ({
      ...l,
      videoId: hasAccess ? l.videoId : null,
    })),
    quiz: m.quiz ? { id: m.quiz.id, questionCount: m.quiz._count.questions } : null,
  }))

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        {/* Thumbnail */}
        <div className="relative w-full lg:w-80 aspect-video lg:aspect-auto lg:h-52 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 320px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${PLAN_STYLES[course.planAccess]}`}>
                Plano {PLAN_LABELS[course.planAccess]}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">{course.title}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{course.description}</p>

            <Link
              href={`/instrutores/${course.instructor.slug}`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 transition-colors w-fit"
            >
              {course.instructor.user.avatarUrl ? (
                <Image
                  src={course.instructor.user.avatarUrl}
                  alt={course.instructor.user.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                  {course.instructor.user.name[0]}
                </div>
              )}
              <span>{course.instructor.user.name}</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {course.modules.length} módulo{course.modules.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.862v6.276a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {allLessons.length} aula{allLessons.length !== 1 ? 's' : ''}
            </span>
            {totalDuration && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {totalDuration}
              </span>
            )}
            {reviewCount > 0 && (
              <span className="flex items-center gap-1.5">
                <StarRating rating={averageRating} size="sm" />
                {averageRating.toFixed(1)} ({reviewCount} avaliaç{reviewCount !== 1 ? 'ões' : 'ão'})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CTA banner */}
      {!user || !hasAccess ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-lg">Assine para acessar este curso</p>
            <p className="text-blue-100 text-sm mt-1">
              {course.planAccess === 'premium'
                ? 'Disponível no Plano Premium'
                : 'Disponível no Plano Básico ou Premium'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
            {course.allowOneTimePurchase && course.priceOneTime != null && (
              <BuyCourseButton
                courseSlug={course.slug}
                price={Number(course.priceOneTime)}
                isAuthenticated={!!user}
              />
            )}
            <Link
              href="/planos"
              className="px-6 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm whitespace-nowrap"
            >
              Ver planos
            </Link>
          </div>
        </div>
      ) : !hasEnrollment ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-green-800 font-medium">Você tem acesso a este curso.</p>
          <Link
            href={`/cursos/${course.slug}/aulas/${allLessons[0]?.id ?? ''}`}
            className="flex-shrink-0 px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Começar curso
          </Link>
        </div>
      ) : isCompleted && !myReview ? (
        <ReviewReminderBanner courseSlug={course.slug} courseTitle={course.title} />
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-blue-800 font-medium">Continue de onde parou.</p>
            {lastWatchedLessonTitle && (
              <p className="text-blue-600 text-sm mt-0.5">Última aula: {lastWatchedLessonTitle}</p>
            )}
          </div>
          <Link
            href={`/cursos/${course.slug}/aulas/${allLessons[0]?.id ?? ''}`}
            className="flex-shrink-0 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Continuar
          </Link>
        </div>
      )}

      {/* Modules accordion */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Conteúdo do curso</h2>
        <CourseAccordion
          modules={modules}
          courseSlug={course.slug}
          hasAccess={hasAccess}
        />
      </div>

      {/* My review */}
      {myReview && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Minha avaliação</h2>
          <div className="border border-gray-200 rounded-xl p-4 max-w-md">
            <div className="flex items-center justify-between mb-1.5">
              <StarRating rating={myReview.rating} size="sm" />
              <p className="text-xs text-gray-400">
                {myReview.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {myReview.comment && <p className="text-sm text-gray-600 mt-2">{myReview.comment}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
