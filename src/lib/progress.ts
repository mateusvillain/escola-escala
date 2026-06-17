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
 *
 * Módulos com Quiz associado também exigem uma QuizAttempt aprovada
 * (passed: true) do usuário antes da conclusão ser confirmada. Módulos
 * sem quiz não são afetados — comportamento retroativamente seguro.
 */
export async function checkCourseCompletion(userId: string, courseId: string): Promise<void> {
  const progress = await getCourseProgress(userId, courseId)
  if (progress.percentage !== 100) return

  const modulesWithQuiz = await prisma.module.findMany({
    where: { courseId, quiz: { isNot: null } },
    select: { quiz: { select: { id: true } } },
  })

  if (modulesWithQuiz.length > 0) {
    const quizIds = modulesWithQuiz.map(m => m.quiz!.id)
    const passedAttempts = await prisma.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds }, passed: true },
      select: { quizId: true },
      distinct: ['quizId'],
    })
    const passedQuizIds = new Set(passedAttempts.map(a => a.quizId))
    const allQuizzesPassed = quizIds.every(id => passedQuizIds.has(id))
    if (!allQuizzesPassed) return
  }

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
