import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { checkLessonAccess, type AccessReason } from '@/lib/access'
import { getAdjacentLessons } from '@/lib/utils/lessons'
import { BunnyPlayer } from '@/components/player/BunnyPlayer'

const UPGRADE_MESSAGES: Record<Exclude<AccessReason, 'preview'>, { title: string; description: string; ctaLabel: string; ctaHref: string }> = {
  not_authenticated: {
    title: 'Faça login para assistir',
    description: 'Entre na sua conta para acessar esta aula.',
    ctaLabel: 'Entrar',
    ctaHref: '/login',
  },
  no_subscription: {
    title: 'Assine para assistir',
    description: 'Esta aula está disponível para alunos com assinatura ativa.',
    ctaLabel: 'Ver planos',
    ctaHref: '/planos',
  },
  subscription_inactive: {
    title: 'Sua assinatura está inativa',
    description: 'Reative sua assinatura para continuar assistindo este curso.',
    ctaLabel: 'Ver planos',
    ctaHref: '/planos',
  },
  plan_upgrade_required: {
    title: 'Conteúdo exclusivo do plano Premium',
    description: 'Faça upgrade do seu plano para acessar esta aula.',
    ctaLabel: 'Ver planos',
    ctaHref: '/planos',
  },
}

export default async function AulaPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const { slug, lessonId } = await params

  const course = await prisma.course.findFirst({
    where: { slug, status: 'published' },
    select: {
      slug: true,
      title: true,
      modules: {
        orderBy: { order: 'asc' },
        select: {
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, content: true, videoId: true, isPreview: true },
          },
        },
      },
    },
  })

  if (!course) notFound()

  const lesson = course.modules.flatMap(m => m.lessons).find(l => l.id === lessonId)
  if (!lesson) notFound()

  const { prev, next } = getAdjacentLessons(course.modules, lessonId)

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  const access = await checkLessonAccess(user?.userId ?? null, lessonId)

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/cursos/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {course.title}
      </Link>

      <div className="flex items-center gap-2.5 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
        {lesson.isPreview && (
          <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold flex-shrink-0">
            Preview Gratuito
          </span>
        )}
      </div>

      {access.allowed ? (
        lesson.videoId ? (
          <BunnyPlayer videoId={lesson.videoId} />
        ) : (
          <div
            className="w-full rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center"
            style={{ aspectRatio: '16 / 9' }}
          >
            <p className="text-sm text-gray-400">Vídeo ainda não disponível para esta aula.</p>
          </div>
        )
      ) : (
        <UpgradeBanner reason={access.reason && access.reason !== 'preview' ? access.reason : 'no_subscription'} />
      )}

      {lesson.isPreview && (
        <div className="flex items-center justify-between gap-4 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">Gostou? Assine para acessar todos os cursos.</p>
          <Link
            href="/planos"
            className="flex-shrink-0 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
          >
            Ver planos →
          </Link>
        </div>
      )}

      {lesson.content && (
        <div className="prose prose-sm sm:prose-base mt-8 max-w-none">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </div>
      )}

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        {prev ? (
          <Link
            href={`/cursos/${slug}/aulas/${prev.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Aula Anterior
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            href={`/cursos/${slug}/aulas/${next.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Próxima Aula
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <Link
            href={`/cursos/${slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Voltar ao Curso
          </Link>
        )}
      </div>
    </div>
  )
}

function UpgradeBanner({ reason }: { reason: Exclude<AccessReason, 'preview'> }) {
  const { title, description, ctaLabel, ctaHref } = UPGRADE_MESSAGES[reason]

  return (
    <div
      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex flex-col items-center justify-center text-center px-6 gap-3"
      style={{ aspectRatio: '16 / 9' }}
    >
      <p className="text-white font-semibold text-lg">{title}</p>
      <p className="text-blue-100 text-sm max-w-sm">{description}</p>
      <Link
        href={ctaHref}
        className="px-6 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
