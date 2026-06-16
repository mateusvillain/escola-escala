import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAndStoreCertificate } from '@/lib/certificate'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ courseId: string }> }
) {
  const auth = requireRole(request, ['student', 'instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth
  const { courseId } = await ctx.params

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: user.userId, courseId } },
    select: { completedAt: true },
  })

  if (!enrollment || !enrollment.completedAt) {
    return NextResponse.json({ error: 'Curso ainda não foi concluído' }, { status: 403 })
  }

  const certificate = await generateAndStoreCertificate(user.userId, courseId)

  return NextResponse.json(certificate)
}
