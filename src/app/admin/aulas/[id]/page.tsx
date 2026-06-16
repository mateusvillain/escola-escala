import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { LessonEditor } from '@/components/admin/LessonEditor'

interface EditAulaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAulaPage({ params }: EditAulaPageProps) {
  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { module: { include: { course: true } } },
  })

  if (!lesson) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link
          href={`/admin/cursos/${lesson.module.course.id}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← {lesson.module.course.title}
        </Link>
        <span className="text-sm text-gray-300">/</span>
        <span className="text-sm text-gray-400">{lesson.module.title}</span>
      </div>
      <lui-heading level="1" size="xl" className="mb-6">
        Editar aula
      </lui-heading>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <LessonEditor
          lessonId={lesson.id}
          defaultValues={{
            title: lesson.title,
            description: lesson.description ?? '',
            content: lesson.content ?? '',
            isPreview: lesson.isPreview,
          }}
          initialVideoId={lesson.videoId}
          initialVideoDuration={lesson.videoDuration}
        />
      </div>
    </div>
  )
}
