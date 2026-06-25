import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { checkCourseAccess, hasActiveAccessToOrganization } from '@/lib/access'
import { getCourseSidebarData } from '@/lib/course-sidebar'
import { CourseSidebar } from '@/components/course/CourseSidebar'
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
      course: { select: { id: true, slug: true, status: true, thumbnailUrl: true, organizationId: true } },
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

  // Curso de organização nunca aparece no catálogo público (TASK-226) — evita também o acesso
  // direto via URL por quem não é membro dessa organização (nem admin).
  if (moduleRecord.course.organizationId && user.role !== 'admin') {
    const isOrgMember = await hasActiveAccessToOrganization(user.userId, moduleRecord.course.organizationId)
    if (!isOrgMember) notFound()
  }

  const access = await checkCourseAccess(user.userId, moduleRecord.course.id, user.role)
  // module_not_released nunca é retornado por checkCourseAccess (drip content é por aula, ver
  // checkLessonAccess) — excluído aqui só para o narrowing de tipo bater com AccessReason.
  const upgradeReason: UpgradeReason | undefined =
    access.reason &&
    access.reason !== 'not_authenticated' &&
    access.reason !== 'preview' &&
    access.reason !== 'module_not_released'
      ? access.reason
      : undefined

  const sidebarData = await getCourseSidebarData(moduleRecord.course.id, user.userId, user.role)

  if (!access.allowed) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="lg:w-[70%] min-w-0">
          <UpgradePrompt
            reason={upgradeReason ?? 'no_subscription'}
            subscriptionStatus={access.subscriptionStatus}
            thumbnailUrl={moduleRecord.course.thumbnailUrl}
          />
        </div>
        <div className="lg:w-[30%] flex-shrink-0">
          <CourseSidebar
            modules={sidebarData.modules}
            courseSlug={slug}
            currentQuizModuleId={moduleId}
            progress={sidebarData.progress}
            completedCount={sidebarData.completedCount}
            totalCount={sidebarData.totalCount}
          />
        </div>
      </div>
    )
  }

  const questions = moduleRecord.quiz.questions.map(q => ({
    id: q.id,
    text: q.text,
    options: q.options as string[],
  }))

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="lg:w-[70%] min-w-0">
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

      <div className="lg:w-[30%] flex-shrink-0">
        <CourseSidebar
          modules={sidebarData.modules}
          courseSlug={slug}
          currentQuizModuleId={moduleId}
          progress={sidebarData.progress}
          completedCount={sidebarData.completedCount}
          totalCount={sidebarData.totalCount}
        />
      </div>
    </div>
  )
}
