import { describe, it, expect } from 'vitest'
import { generateCertificatePDF } from '../certificate'

const SAMPLE: Parameters<typeof generateCertificatePDF>[0] = {
  studentName: 'Maria Silva',
  courseName: 'Curso de Teste',
  instructorName: 'João Paulo',
  completedAt: new Date('2026-06-15T12:00:00Z'),
}

describe('generateCertificatePDF', () => {
  it('retorna um Buffer não vazio', async () => {
    const buffer = await generateCertificatePDF(SAMPLE)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('buffer inicia com a assinatura PDF (%PDF)', async () => {
    const buffer = await generateCertificatePDF(SAMPLE)
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
  })

  it('gera em menos de 2 segundos', async () => {
    const start = Date.now()
    await generateCertificatePDF(SAMPLE)
    expect(Date.now() - start).toBeLessThan(2000)
  })

  it('aceita nomes longos sem lançar erro', async () => {
    const buffer = await generateCertificatePDF({
      ...SAMPLE,
      studentName: 'Antônio Márcio dos Santos Cavalcante Ferreira',
      courseName: 'Desenvolvimento Web Completo com React, Next.js e Node.js',
    })
    expect(buffer.length).toBeGreaterThan(0)
  })
})
