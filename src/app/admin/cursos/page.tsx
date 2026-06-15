import { Suspense } from 'react'
import { CourseTable } from '@/components/admin/CourseTable'

export default function AdminCursosPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <CourseTable />
    </Suspense>
  )
}
