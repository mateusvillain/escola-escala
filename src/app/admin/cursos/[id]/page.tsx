import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CourseForm } from '@/components/admin/CourseForm'
import { ModuleList } from '@/components/admin/ModuleList'

interface EditCursoPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCursoPage({ params }: EditCursoPageProps) {
  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        include: { lessons: { select: { id: true } } },
      },
    },
  })

  if (!course) notFound()

  const canPublish = course.modules.some(m => m.lessons.length > 0)

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

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ModuleList
          courseId={course.id}
          initialModules={course.modules.map(m => ({
            ...m,
            description: m.description ?? null,
          }))}
        />
      </div>
    </div>
  )
}
