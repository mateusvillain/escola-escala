import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { MyReviewsContent } from '@/components/dashboard/MyReviewsContent'

export const metadata = { title: 'Minhas Avaliações' }

export default async function MinhasAvaliacoesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) redirect('/login')

  let userId: string
  try {
    userId = verifyToken(token).userId
  } catch {
    redirect('/login')
  }

  const [completedEnrollments, reviews] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { course: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.courseReview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        rating: true,
        comment: true,
        createdAt: true,
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
  ])

  const reviewedCourseIds = new Set(reviews.map(r => r.course.id))
  const pending = completedEnrollments
    .filter(e => !reviewedCourseIds.has(e.course.id))
    .map(e => ({ id: e.course.id, title: e.course.title, slug: e.course.slug }))

  if (pending.length === 0 && reviews.length === 0) {
    redirect('/dashboard')
  }

  const submitted = reviews.map(r => ({
    courseId: r.course.id,
    title: r.course.title,
    slug: r.course.slug,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Minhas Avaliações</h1>
      <MyReviewsContent pending={pending} submitted={submitted} />
    </div>
  )
}
