import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const postSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const auth = requireRole(request, ['student', 'instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth
  const { slug } = await ctx.params

  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } })
  if (!course) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: user.userId, courseId: course.id } },
    select: { completedAt: true },
  })
  if (!enrollment || !enrollment.completedAt) {
    return NextResponse.json({ error: 'Curso ainda não foi concluído' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', issues: parsed.error.issues }, { status: 400 })
  }

  const { rating, comment } = parsed.data

  const review = await prisma.courseReview.upsert({
    where: { userId_courseId: { userId: user.userId, courseId: course.id } },
    create: { userId: user.userId, courseId: course.id, rating, comment },
    update: { rating, comment },
    select: { rating: true, comment: true, createdAt: true },
  })

  return NextResponse.json(review)
}
