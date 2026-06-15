import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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
