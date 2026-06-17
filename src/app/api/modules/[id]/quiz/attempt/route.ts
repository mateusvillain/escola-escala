import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCourseAccess } from '@/lib/access'
import { checkCourseCompletion } from '@/lib/progress'

const postSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionIndex: z.number().int().min(0),
    })
  ),
})

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['student', 'instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth
  const { id: moduleId } = await ctx.params

  const moduleRecord = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      courseId: true,
      quiz: {
        select: {
          id: true,
          questions: {
            select: { id: true, correctOptionIndex: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!moduleRecord || !moduleRecord.quiz) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }

  const access = await checkCourseAccess(user.userId, moduleRecord.courseId, user.role)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Acesso negado a este curso' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const totalQuestions = moduleRecord.quiz.questions.length
  if (totalQuestions === 0) {
    return NextResponse.json({ error: 'Este quiz ainda não tem perguntas' }, { status: 400 })
  }

  const selectedByQuestion = new Map(
    parsed.data.answers.map(a => [a.questionId, a.selectedOptionIndex])
  )

  let correctCount = 0
  const results = moduleRecord.quiz.questions.map(q => {
    const selectedOptionIndex = selectedByQuestion.get(q.id) ?? null
    const isCorrect = selectedOptionIndex === q.correctOptionIndex
    if (isCorrect) correctCount++
    return {
      questionId: q.id,
      selectedOptionIndex,
      correctOptionIndex: q.correctOptionIndex,
      isCorrect,
    }
  })

  const score = Math.round((correctCount / totalQuestions) * 100)
  const passed = score >= 70

  const attempt = await prisma.quizAttempt.create({
    data: { userId: user.userId, quizId: moduleRecord.quiz.id, score, passed },
  })

  if (passed) {
    setImmediate(() => {
      checkCourseCompletion(user.userId, moduleRecord.courseId).catch(console.error)
    })
  }

  return NextResponse.json({
    score,
    passed,
    completedAt: attempt.completedAt,
    results,
  })
}
