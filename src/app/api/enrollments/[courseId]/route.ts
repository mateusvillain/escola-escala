import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    select: { id: true, planAccess: true },
  })

  if (!course) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const subscription = await prisma.userSubscription.findFirst({
    where: { userId: user.userId, status: 'active' },
    include: { plan: true },
  })

  const planType = subscription?.plan.type ?? null
  const hasAccess =
    planType === 'premium' ||
    (planType === 'basic' && course.planAccess === 'basic')

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Acesso negado. Sua assinatura não cobre este curso.' },
      { status: 403 }
    )
  }

  const enrollment = await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId: user.userId, courseId: course.id } },
    create: { userId: user.userId, courseId: course.id },
    update: {},
    select: { id: true, enrolledAt: true },
  })

  return NextResponse.json({ enrolled: true, enrolledAt: enrollment.enrolledAt })
}
