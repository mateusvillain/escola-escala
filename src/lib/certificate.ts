import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface CertificateData {
  studentName: string
  courseName: string
  instructorName: string
  completedAt: Date
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const { studentName, courseName, instructorName, completedAt } = data

  // A4 landscape: 842 × 595 points
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595])
  const { width, height } = page.getSize()

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const gold = rgb(0.78, 0.64, 0.2)
  const dark = rgb(0.1, 0.1, 0.1)
  const muted = rgb(0.35, 0.35, 0.35)
  const subtle = rgb(0.72, 0.72, 0.72)

  // Decorative double border
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: gold, borderWidth: 3 })
  page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: gold, borderWidth: 1 })

  function centered(text: string, font: typeof fontBold, size: number, y: number, color = dark) {
    const w = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: (width - w) / 2, y, size, font, color })
  }

  // Title
  centered('CERTIFICADO DE CONCLUSÃO', fontBold, 32, height - 108, dark)

  // Gold rule under title
  page.drawLine({ start: { x: 110, y: height - 128 }, end: { x: width - 110, y: height - 128 }, thickness: 1.5, color: gold })

  // "Certificamos que"
  centered('Certificamos que', fontRegular, 13, height - 180, muted)

  // Student name (largest)
  centered(studentName, fontBold, 28, height - 232, dark)

  // Completion phrase
  centered('concluiu com êxito o curso', fontRegular, 13, height - 276, muted)

  // Course name
  centered(courseName, fontBold, 22, height - 322, dark)

  // Subtle divider
  page.drawLine({ start: { x: 180, y: height - 360 }, end: { x: width - 180, y: height - 360 }, thickness: 0.5, color: subtle })

  // Instructor
  centered(`Instrutor: ${instructorName}`, fontRegular, 12, height - 393, muted)

  // Completion date
  centered(`Data de conclusão: ${formatDate(completedAt)}`, fontRegular, 12, height - 420, muted)

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export interface StoredCertificate {
  certificateId: string
  fileUrl: string | null
  issuedAt: Date
}

/**
 * Gera (se ainda não existir) e armazena o certificado de um curso para um
 * usuário. Idempotente — retorna o certificado existente sem regenerar.
 * Armazenamento: base64 em `fileUrl` (MVP — sem credenciais de blob storage
 * configuradas no projeto).
 */
export async function generateAndStoreCertificate(
  userId: string,
  courseId: string
): Promise<StoredCertificate> {
  try {
    const existing = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing) {
      return { certificateId: existing.id, fileUrl: existing.fileUrl, issuedAt: existing.issuedAt }
    }

    const [user, course, enrollment] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),
      prisma.course.findUniqueOrThrow({
        where: { id: courseId },
        select: { title: true, instructor: { select: { user: { select: { name: true } } } } },
      }),
      prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { completedAt: true },
      }),
    ])

    const pdfBuffer = await generateCertificatePDF({
      studentName: user.name,
      courseName: course.title,
      instructorName: course.instructor.user.name,
      completedAt: enrollment?.completedAt ?? new Date(),
    })

    const fileUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`

    const certificate = await prisma.certificate.create({
      data: { userId, courseId, fileUrl },
    })

    return { certificateId: certificate.id, fileUrl: certificate.fileUrl, issuedAt: certificate.issuedAt }
  } catch (err) {
    Sentry.captureException(err, { extra: { userId, courseId } })
    throw err
  }
}

/**
 * Converte o `fileUrl` armazenado (data URL base64 ou, futuramente, URL de
 * blob storage) na resposta HTTP de download do PDF. Compartilhado entre o
 * download do próprio aluno e o download pelo owner da organização.
 */
export function buildCertificateDownloadResponse(fileUrl: string, courseSlug: string): NextResponse {
  if (!fileUrl.startsWith('data:')) {
    return NextResponse.redirect(fileUrl)
  }

  const base64 = fileUrl.slice(fileUrl.indexOf(',') + 1)
  const buffer = Buffer.from(base64, 'base64')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-${courseSlug}.pdf"`,
    },
  })
}
