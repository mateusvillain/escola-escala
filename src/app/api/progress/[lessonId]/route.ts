import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkLessonAccess } from '@/lib/access'
import { ensureEnrollment } from '@/lib/enrollment'
import { checkCourseCompletion } from '@/lib/progress'

const postSchema = z.object({
  watchPercentage: z.number().min(0).max(100).optional(),
  isCompleted: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ lessonId: string }> }
) {
  const auth = requireRole(request, ['student', 'instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth
  const { lessonId } = await ctx.params

  const access = await checkLessonAccess(user.userId, lessonId, user.role)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Acesso negado a esta aula' }, { status: 403 })
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.userId, lessonId } },
    select: { watchPercentage: true, isCompleted: true, completedAt: true },
  })

  return NextResponse.json({
    lessonId,
    watchPercentage: progress?.watchPercentage ?? 0,
    isCompleted: progress?.isCompleted ?? false,
    completedAt: progress?.completedAt ?? null,
  })
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ lessonId: string }> }
) {
  const auth = requireRole(request, ['student', 'instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth
  const { lessonId } = await ctx.params

  const access = await checkLessonAccess(user.userId, lessonId, user.role)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Acesso negado a esta aula' }, { status: 403 })
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

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  })
  if (!lesson) {
    return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
  }

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.userId, lessonId } },
    select: { watchPercentage: true, isCompleted: true, completedAt: true },
  })

  const { watchPercentage: requestedPercentage, isCompleted: requestedCompleted } = parsed.data
  const watchPercentage = requestedPercentage ?? existing?.watchPercentage ?? 0

  let isCompleted: boolean
  let completedAt: Date | null
  if (requestedCompleted === false) {
    // Desmarcação manual explícita — sempre permitida, mesmo após auto-complete
    isCompleted = false
    completedAt = null
  } else {
    isCompleted = existing?.isCompleted || requestedCompleted === true || watchPercentage >= 80
    completedAt = isCompleted ? existing?.completedAt ?? new Date() : null
  }

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.userId, lessonId } },
    create: { userId: user.userId, lessonId, watchPercentage, isCompleted, completedAt },
    update: { watchPercentage, isCompleted, completedAt, lastWatchedAt: new Date() },
    select: { watchPercentage: true, isCompleted: true, completedAt: true },
  })

  await ensureEnrollment(user.userId, lesson.module.courseId, user.role)

  setImmediate(() => {
    checkCourseCompletion(user.userId, lesson.module.courseId).catch(console.error)
  })

  return NextResponse.json({ lessonId, ...progress })
}
