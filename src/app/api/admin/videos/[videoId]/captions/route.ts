import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { uploadCaption } from '@/lib/bunny'

const MAX_SIZE_BYTES = 1 * 1024 * 1024 // 1MB — arquivos .vtt são texto puro, bem menores que isso

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ videoId: string }> }
) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const { videoId } = await ctx.params

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" obrigatório' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.vtt')) {
    return NextResponse.json({ error: 'O arquivo deve ter extensão .vtt' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede o limite de 1MB' }, { status: 413 })
  }

  const language = ((formData.get('language') as string | null) || 'pt').trim().toLowerCase()
  if (!/^[a-z]{2,3}(-[a-z]{2,4})?$/.test(language)) {
    return NextResponse.json({ error: 'Código de idioma inválido (ex: pt, en, pt-br)' }, { status: 400 })
  }

  const label = ((formData.get('label') as string | null) || language).trim().slice(0, 50)
  const vttContent = await file.text()

  try {
    await uploadCaption(videoId, language, vttContent, label)
  } catch (err) {
    console.error('[bunny] erro ao enviar legenda:', err)
    return NextResponse.json({ error: 'Falha ao enviar legenda para o Bunny Stream' }, { status: 502 })
  }

  return NextResponse.json({ success: true, language, label })
}
