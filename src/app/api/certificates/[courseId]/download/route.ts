import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildCertificateDownloadResponse } from '@/lib/certificate'

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ courseId: string }> }
) {
  const auth = requireRole(request, ['student', 'instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth
  const { courseId } = await ctx.params

  const certificate = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: user.userId, courseId } },
    select: { fileUrl: true, course: { select: { slug: true } } },
  })

  if (!certificate || !certificate.fileUrl) {
    return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })
  }

  return buildCertificateDownloadResponse(certificate.fileUrl, certificate.course.slug)
}
