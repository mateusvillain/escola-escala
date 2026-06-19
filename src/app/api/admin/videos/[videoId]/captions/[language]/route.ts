import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { deleteCaption } from '@/lib/bunny'

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ videoId: string; language: string }> }
) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const { videoId, language } = await ctx.params

  try {
    await deleteCaption(videoId, language)
  } catch (err) {
    console.error('[bunny] erro ao excluir legenda:', err)
    return NextResponse.json({ error: 'Falha ao excluir legenda no Bunny Stream' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
