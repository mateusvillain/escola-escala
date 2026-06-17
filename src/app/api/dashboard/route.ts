import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCourseProgress } from '@/lib/progress'

const AVAILABLE_LIMIT = 6

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
  const completedCourseIds = enrollments.filter(e => e.completedAt).map(e => e.course.id)

  const [inProgressItems, completedItems, userReviews] = await Promise.all([
    Promise.all(
      enrollments
        .filter(e => !e.completedAt)
        .map(async e => {
          const [progress, lastProgress] = await Promise.all([
            getCourseProgress(user.userId, e.course.id),
            prisma.lessonProgress.findFirst({
              where: { userId: user.userId, lesson: { module: { courseId: e.course.id } } },
              orderBy: { lastWatchedAt: 'desc' },
              select: { lastWatchedAt: true, lesson: { select: { id: true, title: true } } },
            }),
          ])
          return {
            id: e.course.id,
            title: e.course.title,
            slug: e.course.slug,
            thumbnailUrl: e.course.thumbnailUrl,
            progress: progress.percentage,
            lastLesson: lastProgress?.lesson ?? null,
            lastWatchedAt: lastProgress?.lastWatchedAt ?? null,
          }
        })
    ),
    Promise.all(
      enrollments
        .filter(e => e.completedAt)
        .map(async e => {
          const [progress, certificate] = await Promise.all([
            getCourseProgress(user.userId, e.course.id),
            prisma.certificate.findUnique({
              where: { userId_courseId: { userId: user.userId, courseId: e.course.id } },
              select: { id: true },
            }),
          ])
          return {
            id: e.course.id,
            title: e.course.title,
            slug: e.course.slug,
            thumbnailUrl: e.course.thumbnailUrl,
            progress: progress.percentage,
            completedAt: e.completedAt,
            certificateUrl: certificate ? `/api/certificates/${e.course.id}/download` : null,
          }
        })
    ),
    completedCourseIds.length
      ? prisma.courseReview.findMany({
          where: { userId: user.userId, courseId: { in: completedCourseIds } },
          select: { courseId: true },
        })
      : Promise.resolve([]),
  ])

  const reviewedCourseIds = new Set(userReviews.map(r => r.courseId))

  const inProgress = inProgressItems
    .filter(item => item.progress > 0)
    .sort((a, b) => (b.lastWatchedAt?.getTime() ?? 0) - (a.lastWatchedAt?.getTime() ?? 0))
    .map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      thumbnailUrl: item.thumbnailUrl,
      progress: item.progress,
      lastLesson: item.lastLesson,
    }))

  let available: Array<{
    id: string
    title: string
    slug: string
    thumbnailUrl: string | null
    planAccess: 'basic' | 'premium'
  }> = []
  if (planType) {
    available = await prisma.course.findMany({
      where: {
        status: 'published',
        id: { notIn: enrolledCourseIds },
        ...(planType === 'basic' ? { planAccess: 'basic' } : {}),
      },
      select: { id: true, title: true, slug: true, thumbnailUrl: true, planAccess: true },
      orderBy: { createdAt: 'desc' },
      take: AVAILABLE_LIMIT,
    })
  }

  const completed = completedItems
    .slice()
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
    .map(item => ({ ...item, hasReview: reviewedCourseIds.has(item.id) }))

  return NextResponse.json({ inProgress, completed, available })
}
