import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  const { fileUrl } = certificate

  if (!fileUrl.startsWith('data:')) {
    return NextResponse.redirect(fileUrl)
  }

  const base64 = fileUrl.slice(fileUrl.indexOf(',') + 1)
  const buffer = Buffer.from(base64, 'base64')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-${certificate.course.slug}.pdf"`,
    },
  })
}
