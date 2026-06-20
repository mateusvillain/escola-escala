import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { createVideo, generateTusCredentials } from '@/lib/bunny'

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
})

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', issues: parsed.error.issues }, { status: 400 })
  }

  let videoGuid: string
  try {
    const video = await createVideo(parsed.data.title)
    videoGuid = video.guid
  } catch (err) {
    console.error('[bunny] erro ao criar vídeo:', err)
    return NextResponse.json({ error: 'Falha ao criar vídeo no Bunny Stream' }, { status: 502 })
  }

  const credentials = generateTusCredentials(videoGuid)

  return NextResponse.json(credentials)
}
