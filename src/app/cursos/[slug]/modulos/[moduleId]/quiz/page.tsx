import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { checkCourseAccess } from '@/lib/access'
import { UpgradePrompt, type UpgradeReason } from '@/components/course/UpgradePrompt'
import { QuizForm } from '@/components/course/QuizForm'

export default async function ModuleQuizPage({
  params,
}: {
  params: Promise<{ slug: string; moduleId: string }>
}) {
  const { slug, moduleId } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) redirect('/login')

  let user
  try {
    user = verifyToken(token)
  } catch {
    redirect('/login')
  }

  const moduleRecord = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      title: true,
      course: { select: { id: true, slug: true, status: true, thumbnailUrl: true } },
      quiz: {
        select: {
          questions: {
            orderBy: { order: 'asc' },
            select: { id: true, text: true, options: true },
          },
        },
      },
    },
  })

  if (!moduleRecord || moduleRecord.course.slug !== slug || moduleRecord.course.status !== 'published') {
    notFound()
  }
  if (!moduleRecord.quiz || moduleRecord.quiz.questions.length === 0) {
    notFound()
  }

  const access = await checkCourseAccess(user.userId, moduleRecord.course.id, user.role)
  const upgradeReason: UpgradeReason | undefined =
    access.reason && access.reason !== 'not_authenticated' && access.reason !== 'preview'
      ? access.reason
      : undefined

  if (!access.allowed) {
    return (
      <div className="max-w-2xl mx-auto">
        <UpgradePrompt
          reason={upgradeReason ?? 'no_subscription'}
          subscriptionStatus={access.subscriptionStatus}
          thumbnailUrl={moduleRecord.course.thumbnailUrl}
        />
      </div>
    )
  }

  const questions = moduleRecord.quiz.questions.map(q => ({
    id: q.id,
    text: q.text,
    options: q.options as string[],
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/cursos/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar ao curso
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Quiz: {moduleRecord.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Responda todas as perguntas e envie para ver seu resultado. É necessário 70% para ser aprovado.
      </p>

      <QuizForm moduleId={moduleId} courseSlug={slug} questions={questions} />
    </div>
  )
}
