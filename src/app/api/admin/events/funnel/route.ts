import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const FUNNEL_EVENT_TYPES = ['plans_viewed', 'checkout_started', 'subscription_activated'] as const
const ALLOWED_DAYS = [7, 30, 90] as const
const DEFAULT_DAYS = 30
const TOP_LESSONS_LIMIT = 5

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const daysParam = Number(request.nextUrl.searchParams.get('days'))
  const days = ALLOWED_DAYS.includes(daysParam as (typeof ALLOWED_DAYS)[number]) ? daysParam : DEFAULT_DAYS
  const rangeStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [counts, lessonStartedEvents] = await Promise.all([
    prisma.productEvent.groupBy({
      by: ['eventType'],
      where: { eventType: { in: [...FUNNEL_EVENT_TYPES] }, createdAt: { gte: rangeStart } },
      _count: true,
    }),
    prisma.productEvent.findMany({
      where: { eventType: 'lesson_started', createdAt: { gte: rangeStart }, userId: { not: null } },
      select: { userId: true, metadata: true },
    }),
  ])

  const countMap = Object.fromEntries(counts.map(c => [c.eventType, c._count]))

  // Usuários únicos que iniciaram cada aula no período (não a contagem bruta de
  // eventos — um mesmo usuário pode recarregar a página da aula várias vezes).
  const startedByLesson = new Map<string, Set<string>>()
  for (const event of lessonStartedEvents) {
    const lessonId = (event.metadata as { lessonId?: string } | null)?.lessonId
    if (!lessonId || !event.userId) continue
    if (!startedByLesson.has(lessonId)) startedByLesson.set(lessonId, new Set())
    startedByLesson.get(lessonId)!.add(event.userId)
  }

  const allLessonIds = [...startedByLesson.keys()]
  const allUserIds = [...new Set(lessonStartedEvents.map(e => e.userId).filter((id): id is string => !!id))]

  const completedProgress = allLessonIds.length
    ? await prisma.lessonProgress.findMany({
        where: { lessonId: { in: allLessonIds }, userId: { in: allUserIds }, isCompleted: true },
        select: { lessonId: true, userId: true },
      })
    : []

  const completedByLesson = new Map<string, Set<string>>()
  for (const p of completedProgress) {
    if (!completedByLesson.has(p.lessonId)) completedByLesson.set(p.lessonId, new Set())
    completedByLesson.get(p.lessonId)!.add(p.userId)
  }

  const dropoffStats = allLessonIds
    .map(lessonId => {
      const started = startedByLesson.get(lessonId)!
      const completed = completedByLesson.get(lessonId) ?? new Set()
      const notCompletedCount = [...started].filter(uid => !completed.has(uid)).length
      return {
        lessonId,
        startedCount: started.size,
        dropoffRate: notCompletedCount / started.size,
      }
    })
    .sort((a, b) => b.dropoffRate - a.dropoffRate || b.startedCount - a.startedCount)
    .slice(0, TOP_LESSONS_LIMIT)

  const lessons = dropoffStats.length
    ? await prisma.lesson.findMany({
        where: { id: { in: dropoffStats.map(s => s.lessonId) } },
        select: {
          id: true,
          title: true,
          module: { select: { courseId: true, course: { select: { title: true } } } },
        },
      })
    : []
  const lessonMap = new Map(lessons.map(l => [l.id, l]))

  const topAbandonedLessons = dropoffStats.map(stat => {
    const lesson = lessonMap.get(stat.lessonId)
    return {
      lessonId: stat.lessonId,
      lessonTitle: lesson?.title ?? 'Aula removida',
      courseId: lesson?.module.courseId ?? null,
      courseTitle: lesson?.module.course.title ?? null,
      startedCount: stat.startedCount,
      dropoffRate: Math.round(stat.dropoffRate * 1000) / 10,
    }
  })

  return NextResponse.json({
    days,
    plansViewed: countMap['plans_viewed'] ?? 0,
    checkoutsStarted: countMap['checkout_started'] ?? 0,
    subscriptionsActivated: countMap['subscription_activated'] ?? 0,
    topAbandonedLessons,
  })
}
