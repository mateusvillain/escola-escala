import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Image from 'next/image'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { CourseCard } from '@/components/cursos/CourseCard'

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const instructor = await prisma.instructor.findUnique({
    where: { slug },
    select: {
      bio: true,
      user: { select: { name: true, avatarUrl: true } },
      courses: {
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnailUrl: true,
          planAccess: true,
          modules: {
            select: { _count: { select: { lessons: true } } },
          },
        },
      },
    },
  })

  if (!instructor) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  let userPlanType: 'basic' | 'premium' | null = null
  let enrolledCourseIds = new Set<string>()

  if (user) {
    const [subscription, enrollments] = await Promise.all([
      prisma.userSubscription.findFirst({
        where: { userId: user.userId, status: 'active' },
        include: { plan: true },
      }),
      prisma.courseEnrollment.findMany({
        where: { userId: user.userId },
        select: { courseId: true },
      }),
    ])
    if (subscription) userPlanType = subscription.plan.type
    enrolledCourseIds = new Set(enrollments.map(e => e.courseId))
  }

  const isAdmin = user?.role === 'admin'
  const hasFullCatalogAccess = userPlanType === 'premium' || isAdmin

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        {instructor.user.avatarUrl ? (
          <Image
            src={instructor.user.avatarUrl}
            alt={instructor.user.name}
            width={72}
            height={72}
            className="rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-2xl font-bold flex-shrink-0">
            {instructor.user.name[0]}
          </div>
        )}
        <div>
          <lui-heading level="1" size="xl">{instructor.user.name}</lui-heading>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">{instructor.bio}</p>
        </div>
      </div>

      {/* Courses */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Cursos de {instructor.user.name}
      </h2>

      {instructor.courses.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum curso publicado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructor.courses.map(course => {
            const totalLessons = course.modules.reduce((sum, m) => sum + m._count.lessons, 0)
            const hasAccess =
              hasFullCatalogAccess ||
              (userPlanType === 'basic' && course.planAccess === 'basic')
            const hasEnrollment = enrolledCourseIds.has(course.id)

            return (
              <CourseCard
                key={course.id}
                title={course.title}
                slug={course.slug}
                description={course.description}
                thumbnailUrl={course.thumbnailUrl}
                planAccess={course.planAccess}
                instructorName={instructor.user.name}
                totalLessons={totalLessons}
                hasAccess={hasAccess}
                hasEnrollment={hasEnrollment}
                isAuthenticated={user !== null}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
