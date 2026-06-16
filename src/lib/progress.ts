import { prisma } from '@/lib/prisma'

export interface CourseProgress {
  completedLessons: number
  totalLessons: number
  percentage: number
}

export async function getCourseProgress(userId: string, courseId: string): Promise<CourseProgress> {
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({
      where: { userId, isCompleted: true, lesson: { module: { courseId } } },
    }),
  ])

  const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100)

  return { completedLessons, totalLessons, percentage }
}
