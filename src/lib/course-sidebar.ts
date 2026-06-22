import { prisma } from '@/lib/prisma'
import { getCourseProgress } from '@/lib/progress'
import { isModuleReleased, getReleaseCountdownLabel } from '@/lib/drip-content'

export interface SidebarModuleData {
  id: string
  title: string
  lessons: { id: string; title: string }[]
  quiz: { passed: boolean } | null
  isReleased: boolean
  releaseLabel: string | null
}

export interface CourseSidebarData {
  modules: SidebarModuleData[]
  progress: Record<string, boolean>
  completedCount: number
  totalCount: number
}

export async function getCourseSidebarData(
  courseId: string,
  userId: string | null,
  role?: string
): Promise<CourseSidebarData> {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      releaseType: true,
      releaseDate: true,
      releaseAfterDays: true,
      lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true } },
      quiz: { select: { id: true } },
    },
  })

  const totalCount = modules.reduce((sum, m) => sum + m.lessons.length, 0)

  let progress: Record<string, boolean> = {}
  let completedCount = 0
  let passedQuizIds = new Set<string>()
  let enrollment: { enrolledAt: Date } | null = null

  if (userId) {
    const quizIds = modules.map(m => m.quiz?.id).filter((id): id is string => id != null)

    const [progressRecords, courseProgress, quizAttempts, courseEnrollment] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId, lesson: { module: { courseId } } },
        select: { lessonId: true, isCompleted: true },
      }),
      getCourseProgress(userId, courseId),
      quizIds.length
        ? prisma.quizAttempt.findMany({
            where: { userId, quizId: { in: quizIds }, passed: true },
            select: { quizId: true },
          })
        : Promise.resolve([]),
      prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { enrolledAt: true },
      }),
    ])

    progress = Object.fromEntries(progressRecords.map(r => [r.lessonId, r.isCompleted]))
    completedCount = courseProgress.completedLessons
    passedQuizIds = new Set(quizAttempts.map(a => a.quizId))
    enrollment = courseEnrollment
  }

  const bypassDrip = role === 'admin'

  const sidebarModules = modules.map(m => {
    const isReleased = bypassDrip || isModuleReleased(m, enrollment)
    return {
      id: m.id,
      title: m.title,
      lessons: m.lessons,
      quiz: m.quiz ? { passed: passedQuizIds.has(m.quiz.id) } : null,
      isReleased,
      releaseLabel: isReleased ? null : getReleaseCountdownLabel(m, enrollment),
    }
  })

  return { modules: sidebarModules, progress, completedCount, totalCount }
}
