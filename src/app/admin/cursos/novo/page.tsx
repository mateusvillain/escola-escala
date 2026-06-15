import Link from 'next/link'
import { CourseForm } from '@/components/admin/CourseForm'

export default function NovoCursoPage() {
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
        Novo curso
      </lui-heading>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <CourseForm />
      </div>
    </div>
  )
}
