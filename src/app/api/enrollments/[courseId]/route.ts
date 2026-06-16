import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureEnrollment } from '@/lib/enrollment'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ courseId: string }> }
) {
  const auth = requireRole(request, ['student', 'instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth
  const { courseId } = await ctx.params

  const course = await prisma.course.findFirst({
    where: { id: courseId, status: 'published' },
    select: { id: true },
  })

  if (!course) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const enrolled = await ensureEnrollment(user.userId, course.id)

  if (!enrolled) {
    return NextResponse.json(
      { error: 'Acesso negado. Sua assinatura não cobre este curso.' },
      { status: 403 }
    )
  }

  const enrollment = await prisma.courseEnrollment.findUniqueOrThrow({
    where: { userId_courseId: { userId: user.userId, courseId: course.id } },
    select: { enrolledAt: true },
  })

  return NextResponse.json({ enrolled: true, enrolledAt: enrollment.enrolledAt })
}
