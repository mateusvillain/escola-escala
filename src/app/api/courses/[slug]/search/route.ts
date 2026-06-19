import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { checkLessonAccess } from '@/lib/access'
import { prisma } from '@/lib/prisma'

const SNIPPET_MAX_LENGTH = 150

function buildSnippet(text: string, term: string): string {
  const idx = text.toLowerCase().indexOf(term.toLowerCase())
  if (idx === -1) return text.slice(0, SNIPPET_MAX_LENGTH)

  const radius = Math.floor((SNIPPET_MAX_LENGTH - term.length) / 2)
  const start = Math.max(0, idx - radius)
  const end = Math.min(text.length, idx + term.length + radius)

  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end)}${suffix}`
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  const course = await prisma.course.findFirst({
    where: { slug, status: 'published' },
    select: { id: true },
  })

  if (!course) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      module: { courseId: course.id },
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      moduleId: true,
      title: true,
      description: true,
      content: true,
    },
  })

  const user = getAuthUser(request)

  const accessChecks = await Promise.all(
    lessons.map(lesson => checkLessonAccess(user?.userId ?? null, lesson.id, user?.role))
  )

  const term = q.toLowerCase()
  const results = lessons
    .filter((_, index) => accessChecks[index].allowed)
    .map(lesson => {
      const matchedText =
        [lesson.title, lesson.description, lesson.content].find(
          field => field?.toLowerCase().includes(term)
        ) ?? lesson.title

      return {
        moduleId: lesson.moduleId,
        lessonId: lesson.id,
        title: lesson.title,
        snippet: buildSnippet(matchedText, q),
      }
    })

  return NextResponse.json({ results })
}
