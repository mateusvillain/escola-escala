import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CourseForm } from '@/components/admin/CourseForm'
import { ModuleList } from '@/components/admin/ModuleList'
import { StarRating } from '@/components/cursos/StarRating'

interface EditCursoPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCursoPage({ params }: EditCursoPageProps) {
  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        include: {
          lessons: {
            select: { id: true, title: true, order: true, videoId: true, isPreview: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      enrollments: {
        select: { completedAt: true },
      },
    },
  })

  if (!course) notFound()

  const canPublish = course.modules.some(m => m.lessons.length > 0)

  const enrollmentCount = course.enrollments.length
  const completedCount = course.enrollments.filter(e => e.completedAt !== null).length
  const completionRate = enrollmentCount === 0 ? 0 : Math.round((completedCount / enrollmentCount) * 100)
  const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)

  // Avaliações sem identificar o autor — mesma decisão de privacidade da área do aluno/instrutor.
  const [reviews, reviewAggregate] = await Promise.all([
    prisma.courseReview.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: 'desc' },
      select: { rating: true, comment: true, createdAt: true },
    }),
    prisma.courseReview.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])
  const averageRating = reviewAggregate._avg.rating ?? 0
  const reviewCount = reviewAggregate._count.rating

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/admin/cursos"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Cursos
        </Link>
      </div>
      <lui-heading level="1" size="xl" className="mb-6">
        Editar curso
      </lui-heading>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <CourseForm
          courseId={course.id}
          slug={course.slug}
          canPublish={canPublish}
          defaultValues={{
            title: course.title,
            description: course.description ?? '',
            thumbnailUrl: course.thumbnailUrl ?? '',
            instructorId: course.instructorId,
            planAccess: course.planAccess as 'basic' | 'premium',
          }}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <ModuleList
          courseId={course.id}
          initialModules={course.modules.map(m => ({
            ...m,
            description: m.description ?? null,
          }))}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <lui-heading level="2" size="lg" className="mb-4">
          Métricas e avaliações
        </lui-heading>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Aulas</p>
            <p className="text-xl font-bold text-gray-900">{lessonCount}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Matriculados</p>
            <p className="text-xl font-bold text-gray-900">{enrollmentCount}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Conclusão</p>
            <p className="text-xl font-bold text-gray-900">{completionRate}%</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nota média</p>
            <p className="text-xl font-bold text-gray-900">{reviewCount > 0 ? averageRating.toFixed(1) : '—'}</p>
          </div>
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Avaliações</h3>
            {reviewCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <StarRating rating={averageRating} size="sm" />
                {averageRating.toFixed(1)} ({reviewCount} avaliaç{reviewCount !== 1 ? 'ões' : 'ão'})
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">Este curso ainda não recebeu avaliações.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <StarRating rating={review.rating} size="sm" />
                    <p className="text-xs text-gray-400">
                      {review.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 mt-2">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
