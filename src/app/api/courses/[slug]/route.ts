import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCourseAccess } from '@/lib/access'

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params

  const course = await prisma.course.findFirst({
    where: { slug, status: 'published' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      planAccess: true,
      createdAt: true,
      instructor: {
        select: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      modules: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              videoId: true,
              videoDuration: true,
              isPreview: true,
              order: true,
            },
          },
        },
      },
    },
  })

  if (!course) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const user = getAuthUser(request)

  let hasAccess = false

  if (user) {
    const access = await checkCourseAccess(user.userId, course.id, user.role)
    hasAccess = access.allowed
  }

  // Fetch progress in one query if user has access
  let progressMap = new Map<string, { watchPercentage: number; isCompleted: boolean }>()
  if (user && hasAccess) {
    const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
    const progressRecords = await prisma.lessonProgress.findMany({
      where: { userId: user.userId, lessonId: { in: allLessonIds } },
      select: { lessonId: true, watchPercentage: true, isCompleted: true },
    })
    progressMap = new Map(progressRecords.map(p => [p.lessonId, p]))
  }

  const modules = course.modules.map(module => ({
    id: module.id,
    title: module.title,
    description: module.description,
    order: module.order,
    lessons: module.lessons.map(lesson => {
      const progress = progressMap.get(lesson.id)
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        videoDuration: lesson.videoDuration,
        isPreview: lesson.isPreview,
        order: lesson.order,
        ...(hasAccess || lesson.isPreview ? { videoId: lesson.videoId } : {}),
        ...(user && hasAccess
          ? {
              progress: progress
                ? { watchPercentage: progress.watchPercentage, isCompleted: progress.isCompleted }
                : { watchPercentage: 0, isCompleted: false },
            }
          : {}),
      }
    }),
  }))

  return NextResponse.json({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    planAccess: course.planAccess,
    createdAt: course.createdAt,
    instructor: {
      name: course.instructor.user.name,
      avatarUrl: course.instructor.user.avatarUrl,
    },
    modules,
    ...(user !== null ? { hasAccess } : {}),
  })
}
