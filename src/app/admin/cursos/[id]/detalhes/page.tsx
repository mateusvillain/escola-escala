import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { StarRating } from '@/components/cursos/StarRating'

const PLAN_LABELS = { basic: 'Básico', premium: 'Premium' } as const
const STATUS_LABELS = { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' } as const

interface CourseDetalhesPageProps {
  params: Promise<{ id: string }>
}

export default async function CourseDetalhesPage({ params }: CourseDetalhesPageProps) {
  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      planAccess: true,
      instructor: { select: { user: { select: { name: true } } } },
      modules: { select: { _count: { select: { lessons: true } } } },
      enrollments: { select: { completedAt: true } },
    },
  })
  if (!course) notFound()

  const enrollmentCount = course.enrollments.length
  const completedCount = course.enrollments.filter(e => e.completedAt !== null).length
  const completionRate = enrollmentCount === 0 ? 0 : Math.round((completedCount / enrollmentCount) * 100)
  const lessonCount = course.modules.reduce((sum, m) => sum + m._count.lessons, 0)

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
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <Link href="/admin/cursos" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← Cursos
        </Link>
        <Link href={`/admin/cursos/${course.id}`} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
          Editar curso →
        </Link>
      </div>

      <lui-heading level="1" size="xl" className="mt-2 mb-1">
        {course.title}
      </lui-heading>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
          {STATUS_LABELS[course.status]}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
          Plano {PLAN_LABELS[course.planAccess]}
        </span>
        <span className="text-sm text-gray-500">Instrutor: {course.instructor.user.name}</span>
      </div>

      {course.description && (
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{course.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Aulas</p>
          <p className="text-xl font-bold text-gray-900">{lessonCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Matriculados</p>
          <p className="text-xl font-bold text-gray-900">{enrollmentCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Conclusão</p>
          <p className="text-xl font-bold text-gray-900">{completionRate}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nota média</p>
          <p className="text-xl font-bold text-gray-900">{reviewCount > 0 ? averageRating.toFixed(1) : '—'}</p>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Avaliações</h2>
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
  )
}
