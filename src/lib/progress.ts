import { prisma } from '@/lib/prisma'
import { generateAndStoreCertificate } from '@/lib/certificate'

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

/**
 * Verifica se o usuário concluiu 100% das aulas do curso. Se sim, marca
 * CourseEnrollment.completedAt (se ainda não estiver) e dispara a geração
 * do certificado (idempotente — generateAndStoreCertificate não duplica).
 */
export async function checkCourseCompletion(userId: string, courseId: string): Promise<void> {
  const progress = await getCourseProgress(userId, courseId)
  if (progress.percentage !== 100) return

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { completedAt: true },
  })
  if (!enrollment) return

  if (!enrollment.completedAt) {
    await prisma.courseEnrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { completedAt: new Date() },
    })
  }

  await generateAndStoreCertificate(userId, courseId)
}
