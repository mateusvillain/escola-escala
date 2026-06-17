'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type CourseStatus = 'draft' | 'published' | 'archived'

interface Course {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  status: CourseStatus
  planAccess: 'basic' | 'premium'
  instructor: { name: string }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ConfirmModal {
  courseId: string
  courseTitle: string
  action: 'published' | 'archived'
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

const PLAN_LABELS = { basic: 'Básico', premium: 'Premium' }

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Arquivado' },
]

export function CourseTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') ?? ''
  const currentSearch = searchParams.get('search') ?? ''
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10)

  const [courses, setCourses] = useState<Course[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(currentSearch)
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(overrides).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams]
  )

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (currentStatus) params.set('status', currentStatus)
      if (currentSearch) params.set('search', currentSearch)
      params.set('page', String(currentPage))
      params.set('limit', '10')

      const res = await fetch(`/api/admin/courses?${params.toString()}`)
      if (!res.ok) throw new Error('Erro ao carregar cursos')
      const data = await res.json()
      setCourses(data.data)
      setPagination(data.pagination)
    } catch {
      setError('Não foi possível carregar os cursos.')
    } finally {
      setLoading(false)
    }
  }, [currentStatus, currentSearch, currentPage])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ search: value, page: '1' }))
    }, 300)
  }

  const handleStatusFilter = (status: string) => {
    router.push(buildUrl({ status, page: '1' }))
  }

  const handleStatusAction = async () => {
    if (!confirmModal) return
    setActionLoading(confirmModal.courseId)
    setConfirmModal(null)
    try {
      const res = await fetch(`/api/admin/courses/${confirmModal.courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: confirmModal.action }),
      })
      if (!res.ok) throw new Error()
      await fetchCourses()
    } catch {
      setError('Falha ao atualizar status do curso.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <lui-heading level="1" size="xl">Cursos</lui-heading>
        <Link
          href="/admin/cursos/novo"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Curso
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Status filter tabs */}
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleStatusFilter(f.value)}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors',
                currentStatus === f.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Buscar por título..."
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Error */}
      {error && (
        <lui-alert variant="danger" title="Erro" content={error} className="mb-4" />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plano</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Instrutor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  {/* Thumbnail + Title */}
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

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <lui-tag
                      label={PLAN_LABELS[course.planAccess]}
                      variant={course.planAccess === 'premium' ? 'primary' : 'info'}
                      tag-style="subtle"
                      size="sm"
                    />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <lui-tag
                      label={STATUS_LABELS[course.status]}
                      variant={STATUS_VARIANTS[course.status] as 'caution' | 'success' | 'secondary'}
                      tag-style="subtle"
                      size="sm"
                    />
                  </td>

                  {/* Instructor */}
                  <td className="px-4 py-3 text-gray-600">{course.instructor.name}</td>

                  {/* Created at */}
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(course.createdAt).toLocaleDateString('pt-BR')}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cursos/${course.id}`}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Editar
                      </Link>

                      {course.status !== 'published' && (
                        <button
                          onClick={() => setConfirmModal({ courseId: course.id, courseTitle: course.title, action: 'published' })}
                          disabled={actionLoading === course.id}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === course.id ? '...' : 'Publicar'}
                        </button>
                      )}

                      {course.status !== 'archived' && (
                        <button
                          onClick={() => setConfirmModal({ courseId: course.id, courseTitle: course.title, action: 'archived' })}
                          disabled={actionLoading === course.id}
                          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === course.id ? '...' : 'Arquivar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {pagination.total} curso{pagination.total !== 1 ? 's' : ''} no total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(buildUrl({ page: String(currentPage - 1) }))}
              disabled={currentPage <= 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              {currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => router.push(buildUrl({ page: String(currentPage + 1) }))}
              disabled={currentPage >= pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <lui-heading level="3" className="mb-2">
              {confirmModal.action === 'published' ? 'Publicar curso' : 'Arquivar curso'}
            </lui-heading>
            <lui-body className="text-gray-600 mb-6">
              {confirmModal.action === 'published'
                ? `Tem certeza que deseja publicar "${confirmModal.courseTitle}"? Ele ficará visível para os alunos.`
                : `Tem certeza que deseja arquivar "${confirmModal.courseTitle}"? Ele deixará de ser acessível.`}
            </lui-body>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusAction}
                className={[
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  confirmModal.action === 'published'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700',
                ].join(' ')}
              >
                {confirmModal.action === 'published' ? 'Publicar' : 'Arquivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
