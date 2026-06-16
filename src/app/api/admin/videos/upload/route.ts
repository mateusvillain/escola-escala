import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createVideo, uploadVideo, getEmbedUrl, getThumbnailUrl } from '@/lib/bunny'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024 // 2GB

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

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

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede o limite de 2GB' }, { status: 413 })
  }

  const title = (formData.get('title') as string | null) ?? file.name

  const arrayBuffer = await file.arrayBuffer()

  let videoGuid: string
  try {
    const video = await createVideo(title)
    videoGuid = video.guid
  } catch (err) {
    console.error('[bunny] erro ao criar vídeo:', err)
    return NextResponse.json({ error: 'Falha ao criar vídeo no Bunny Stream' }, { status: 502 })
  }

  try {
    await uploadVideo(videoGuid, arrayBuffer)
  } catch (err) {
    console.error('[bunny] erro ao fazer upload:', err)
    return NextResponse.json({ error: 'Falha ao enviar vídeo para o Bunny Stream' }, { status: 502 })
  }

  return NextResponse.json({
    videoId: videoGuid,
    embedUrl: getEmbedUrl(videoGuid),
    thumbnailUrl: getThumbnailUrl(videoGuid),
    status: 'processing',
  })
}
