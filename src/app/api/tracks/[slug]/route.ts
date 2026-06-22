import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCourseProgress } from '@/lib/progress'

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params

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
              planAccess: true,
            },
          },
        },
      },
    },
  })

  if (!track) {
    return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })
  }

  const user = getAuthUser(request)

  let progressByCourseId: Record<string, { percentage: number; completed: boolean }> = {}

  if (user) {
    const courseIds = track.items.map(item => item.course.id)
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: user.userId, courseId: { in: courseIds } },
      select: { courseId: true, completedAt: true },
    })

    const progressEntries = await Promise.all(
      enrollments.map(async e => {
        const progress = await getCourseProgress(user.userId, e.courseId)
        return [e.courseId, { percentage: progress.percentage, completed: e.completedAt != null }] as const
      })
    )
    progressByCourseId = Object.fromEntries(progressEntries)
  }

  const courses = track.items.map(item => ({
    ...item.course,
    order: item.order,
    progress: progressByCourseId[item.course.id] ?? null,
  }))

  const completedCount = Object.values(progressByCourseId).filter(p => p.completed).length

  return NextResponse.json({
    track: {
      id: track.id,
      title: track.title,
      slug: track.slug,
      description: track.description,
      thumbnailUrl: track.thumbnailUrl,
      isBundle: track.isBundle,
      bundlePriceOneTime: track.bundlePriceOneTime,
      courses,
    },
    ...(user ? { completedCount, totalCourses: courses.length } : {}),
  })
}
