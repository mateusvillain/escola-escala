import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { checkLessonAccess } from '@/lib/access'
import { trackEvent } from '@/lib/events'
import { isModuleReleased, getReleaseCountdownLabel } from '@/lib/drip-content'
import { getAdjacentLessons, type LessonAttachment } from '@/lib/utils/lessons'
import { getCourseProgress } from '@/lib/progress'
import { BunnyPlayer } from '@/components/player/BunnyPlayer'
import { CourseSidebar } from '@/components/course/CourseSidebar'
import { UpgradePrompt, type UpgradeReason } from '@/components/course/UpgradePrompt'
import { ModuleLockedPrompt } from '@/components/course/ModuleLockedPrompt'
import { LessonCompletionToggle } from '@/components/course/LessonCompletionToggle'

export default async function AulaPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const { slug, lessonId } = await params

  const course = await prisma.course.findFirst({
    where: { slug, status: 'published' },
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnailUrl: true,
      modules: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          releaseType: true,
          releaseDate: true,
          releaseAfterDays: true,
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, content: true, videoId: true, isPreview: true, attachments: true },
          },
          quiz: { select: { id: true } },
        },
      },
    },
  })

  if (!course) notFound()

  const lesson = course.modules.flatMap(m => m.lessons).find(l => l.id === lessonId)
  if (!lesson) notFound()

  const attachments = (lesson.attachments as LessonAttachment[] | null) ?? []

  const { prev, next } = getAdjacentLessons(course.modules, lessonId)
  const totalLessons = course.modules.flatMap(m => m.lessons).length

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  const access = await checkLessonAccess(user?.userId ?? null, lessonId, user?.role)

  if (user && access.allowed) {
    void trackEvent('lesson_started', user.userId, { lessonId, courseId: course.id })
  }

  const upgradeReason: UpgradeReason | undefined =
    access.reason &&
    access.reason !== 'not_authenticated' &&
    access.reason !== 'preview' &&
    access.reason !== 'module_not_released'
      ? access.reason
      : undefined

  let progress: Record<string, boolean> = {}
  let completedCount = 0
  let passedQuizIds = new Set<string>()
  let initialPositionSeconds = 0
  let enrollment: { enrolledAt: Date } | null = null
  if (user) {
    const quizIds = course.modules.map(m => m.quiz?.id).filter((id): id is string => id != null)

    const [progressRecords, courseProgress, quizAttempts, courseEnrollment] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId: user.userId, lesson: { module: { courseId: course.id } } },
        select: { lessonId: true, isCompleted: true, lastPositionSeconds: true },
      }),
      getCourseProgress(user.userId, course.id),
      quizIds.length
        ? prisma.quizAttempt.findMany({
            where: { userId: user.userId, quizId: { in: quizIds }, passed: true },
            select: { quizId: true },
          })
        : Promise.resolve([]),
      prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId: user.userId, courseId: course.id } },
        select: { enrolledAt: true },
      }),
    ])
    progress = Object.fromEntries(progressRecords.map(r => [r.lessonId, r.isCompleted]))
    completedCount = courseProgress.completedLessons
    passedQuizIds = new Set(quizAttempts.map(a => a.quizId))
    initialPositionSeconds = progressRecords.find(r => r.lessonId === lessonId)?.lastPositionSeconds ?? 0
    enrollment = courseEnrollment
  }

  const bypassDrip = user?.role === 'admin'

  const sidebarModules = course.modules.map(m => {
    const isReleased = bypassDrip || isModuleReleased(m, enrollment)
    return {
      id: m.id,
      title: m.title,
      lessons: m.lessons.map(l => ({ id: l.id, title: l.title })),
      quiz: m.quiz ? { passed: passedQuizIds.has(m.quiz.id) } : null,
      isReleased,
      releaseLabel: isReleased ? null : getReleaseCountdownLabel(m, enrollment),
    }
  })

  const currentModule = course.modules.find(m => m.lessons.some(l => l.id === lessonId))
  const currentModuleReleaseLabel =
    access.reason === 'module_not_released' && currentModule
      ? getReleaseCountdownLabel(currentModule, enrollment)
      : null

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="lg:w-[70%] min-w-0">
        <Link
          href={`/cursos/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {course.title}
        </Link>

        <div className="flex items-center gap-2.5 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          {lesson.isPreview && (
            <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold flex-shrink-0">
              Preview Gratuito
            </span>
          )}
        </div>

        {access.allowed ? (
          lesson.videoId ? (
            <BunnyPlayer videoId={lesson.videoId} lessonId={lesson.id} initialPositionSeconds={initialPositionSeconds} />
          ) : (
            <div
              className="w-full rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center"
              style={{ aspectRatio: '16 / 9' }}
            >
              <p className="text-sm text-gray-400">Vídeo ainda não disponível para esta aula.</p>
            </div>
          )
        ) : access.reason === 'not_authenticated' ? (
          <LoginPrompt />
        ) : access.reason === 'module_not_released' ? (
          <ModuleLockedPrompt
            releaseLabel={currentModuleReleaseLabel ?? 'Em breve'}
            courseSlug={slug}
            thumbnailUrl={course.thumbnailUrl}
          />
        ) : (
          <UpgradePrompt
            reason={upgradeReason ?? 'no_subscription'}
            subscriptionStatus={access.subscriptionStatus}
            thumbnailUrl={course.thumbnailUrl}
          />
        )}

        {user && access.allowed && (
          <LessonCompletionToggle lessonId={lesson.id} initialCompleted={progress[lesson.id] ?? false} />
        )}

        {lesson.isPreview && (
          <div className="flex items-center justify-between gap-4 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Gostou? Assine para acessar todos os cursos.</p>
            <Link
              href="/planos"
              className="flex-shrink-0 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
            >
              Ver planos →
            </Link>
          </div>
        )}

        {lesson.content && (
          <div className="prose prose-sm sm:prose-base mt-8 max-w-none">
            <ReactMarkdown>{lesson.content}</ReactMarkdown>
          </div>
        )}

        {access.allowed && attachments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Materiais</h2>
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {attachment.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          {prev ? (
            <Link
              href={`/cursos/${slug}/aulas/${prev.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Aula Anterior
            </Link>
          ) : (
            <span />
          )}

          {next ? (
            <Link
              href={`/cursos/${slug}/aulas/${next.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Próxima Aula
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link
              href={`/cursos/${slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Voltar ao Curso
            </Link>
          )}
        </div>
      </div>

      <div className="lg:w-[30%] flex-shrink-0">
        <CourseSidebar
          modules={sidebarModules}
          courseSlug={slug}
          currentLessonId={lessonId}
          progress={progress}
          completedCount={completedCount}
          totalCount={totalLessons}
        />
      </div>
    </div>
  )
}

function LoginPrompt() {
  return (
    <div
      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex flex-col items-center justify-center text-center px-6 gap-3"
      style={{ aspectRatio: '16 / 9' }}
    >
      <p className="text-white font-semibold text-lg">Faça login para assistir</p>
      <p className="text-blue-100 text-sm max-w-sm">Entre na sua conta para acessar esta aula.</p>
      <Link
        href="/login"
        className="px-6 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm"
      >
        Entrar
      </Link>
    </div>
  )
}
