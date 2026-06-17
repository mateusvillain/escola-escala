'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type CourseStatus = 'draft' | 'published' | 'archived'

interface InstructorCourse {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  status: CourseStatus
  enrollmentCount: number
  completionRate: number
}

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
}

const STATUS_VARIANTS: Record<CourseStatus, string> = {
  draft: 'caution',
  published: 'success',
  archived: 'secondary',
}

export function InstructorDashboard() {
  const [courses, setCourses] = useState<InstructorCourse[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/instructor/courses')
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(json => setCourses(json.data))
      .catch(() => setError('Não foi possível carregar seus cursos.'))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <lui-heading level="1" size="xl">Meus Cursos</lui-heading>
        <p className="text-sm text-gray-500 mt-1">Acompanhe matrículas e taxa de conclusão dos seus cursos.</p>
      </div>

      {error && <lui-alert variant="danger" title="Erro" content={error} className="mb-6" />}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {courses === null ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <lui-body>Carregando...</lui-body>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <lui-body>Nenhum curso encontrado</lui-body>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Curso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Alunos matriculados</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxa de conclusão</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.title}
                            width={48}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 line-clamp-1">{course.title}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <lui-tag
                      label={STATUS_LABELS[course.status]}
                      variant={STATUS_VARIANTS[course.status] as 'caution' | 'success' | 'secondary'}
                      tag-style="subtle"
                      size="sm"
                    />
                  </td>

                  <td className="px-4 py-3 text-gray-600">{course.enrollmentCount}</td>

                  <td className="px-4 py-3 text-gray-600">{course.completionRate}%</td>

                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/instrutor/${course.id}`}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
