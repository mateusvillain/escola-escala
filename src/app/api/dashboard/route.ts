import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCourseProgress } from '@/lib/progress'

const AVAILABLE_LIMIT = 10

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['student', 'instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth

  const subscription = await prisma.userSubscription.findFirst({
    where: { userId: user.userId, status: 'active' },
    include: { plan: true },
  })
  const planType = subscription?.plan.type ?? null

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: user.userId },
    select: {
      completedAt: true,
      course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
    },
  })

  const enrolledCourseIds = enrollments.map(e => e.course.id)

  const [inProgressItems, completedItems] = await Promise.all([
    Promise.all(
      enrollments
        .filter(e => !e.completedAt)
        .map(async e => {
          const [progress, lastProgress] = await Promise.all([
            getCourseProgress(user.userId, e.course.id),
            prisma.lessonProgress.findFirst({
              where: { userId: user.userId, lesson: { module: { courseId: e.course.id } } },
              orderBy: { lastWatchedAt: 'desc' },
              select: { lesson: { select: { id: true, title: true } } },
            }),
          ])
          return {
            id: e.course.id,
            title: e.course.title,
            slug: e.course.slug,
            thumbnailUrl: e.course.thumbnailUrl,
            progress: progress.percentage,
            lastLesson: lastProgress?.lesson ?? null,
          }
        })
    ),
    Promise.all(
      enrollments
        .filter(e => e.completedAt)
        .map(async e => {
          const progress = await getCourseProgress(user.userId, e.course.id)
          return {
            id: e.course.id,
            title: e.course.title,
            slug: e.course.slug,
            thumbnailUrl: e.course.thumbnailUrl,
            progress: progress.percentage,
          }
        })
    ),
  ])

  const inProgress = inProgressItems.filter(item => item.progress > 0)

  let available: Array<{ id: string; title: string; slug: string; thumbnailUrl: string | null }> = []
  if (planType) {
    available = await prisma.course.findMany({
      where: {
        status: 'published',
        id: { notIn: enrolledCourseIds },
        ...(planType === 'basic' ? { planAccess: 'basic' } : {}),
      },
      select: { id: true, title: true, slug: true, thumbnailUrl: true },
      orderBy: { createdAt: 'desc' },
      take: AVAILABLE_LIMIT,
    })
  }

  return NextResponse.json({ inProgress, completed: completedItems, available })
}
