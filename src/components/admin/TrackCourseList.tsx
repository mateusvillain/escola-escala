'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'

type CourseStatus = 'draft' | 'published' | 'archived'

interface TrackCourseItem {
  id: string
  courseId: string
  order: number
  course: {
    id: string
    title: string
    slug: string
    thumbnailUrl: string | null
    status: CourseStatus
  }
}

interface CourseOption {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
}

interface TrackCourseListProps {
  trackId: string
  initialItems: TrackCourseItem[]
}

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
}

export function TrackCourseList({ trackId, initialItems }: TrackCourseListProps) {
  const [items, setItems] = useState<TrackCourseItem[]>(
    [...initialItems].sort((a, b) => a.order - b.order)
  )
  const [mutating, setMutating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add course state
  const [addingCourse, setAddingCourse] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<CourseOption[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<TrackCourseItem | null>(null)

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/admin/tracks/${trackId}`)
    if (res.ok) {
      const data = await res.json()
      const sorted: TrackCourseItem[] = (data.track.items ?? []).sort(
        (a: TrackCourseItem, b: TrackCourseItem) => a.order - b.order
      )
      setItems(sorted)
    }
  }, [trackId])

  useEffect(() => {
    if (!addingCourse) return
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setAddingCourse(false)
        setSearchInput('')
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [addingCourse])

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams({ status: 'published', limit: '10' })
        if (value) params.set('search', value)
        const res = await fetch(`/api/admin/courses?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const existingIds = new Set(items.map(i => i.courseId))
          setSearchResults((data.data ?? []).filter((c: CourseOption) => !existingIds.has(c.id)))
        }
      } catch {
        // ignore — busca silenciosa, não impede usuário de tentar de novo
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const handleOpenAdd = () => {
    setAddingCourse(true)
    handleSearchChange('')
  }

  // ── Add course ───────────────────────────────────────────────────────────
  const handleAddCourse = async (courseId: string) => {
    setAddingCourse(false)
    setSearchInput('')
    setSearchResults([])
    setMutating('add')
    setError(null)
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      if (!res.ok) throw new Error()
      await refetch()
    } catch {
      setError('Erro ao adicionar curso à trilha.')
    } finally {
      setMutating(null)
    }
  }

  // ── Reorder ───────────────────────────────────────────────────────────────
  const handleMove = async (item: TrackCourseItem, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? item.order - 1 : item.order + 1
    if (newOrder < 1 || newOrder > items.length) return

    setMutating(item.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/courses/${item.courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      })
      if (!res.ok) throw new Error()
      await refetch()
    } catch {
      setError('Erro ao reordenar curso.')
    } finally {
      setMutating(null)
    }
  }

  // ── Remove ────────────────────────────────────────────────────────────────
  const handleRemoveConfirm = async () => {
    if (!deleteTarget) return
    const item = deleteTarget
    setDeleteTarget(null)
    setMutating(item.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/courses/${item.courseId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) throw new Error()
      await refetch()
    } catch {
      setError('Erro ao remover curso da trilha.')
    } finally {
      setMutating(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Cursos da trilha</h2>
        {!addingCourse && (
          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={mutating !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            + Adicionar curso
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {addingCourse && (
        <div ref={searchBoxRef} className="relative mb-3">
          <input
            type="text"
            autoFocus
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar curso publicado por título..."
            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
            {searching ? (
              <p className="px-3 py-2 text-sm text-gray-400">Buscando...</p>
            ) : searchResults.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">Nenhum curso publicado encontrado.</p>
            ) : (
              searchResults.map(course => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleAddCourse(course.id)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                >
                  {course.title}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="space-y-1">
        {items.length === 0 && !addingCourse && (
          <p className="text-sm text-gray-400 py-4 text-center">
            Nenhum curso ainda. Adicione ao menos 2 cursos para poder publicar a trilha.
          </p>
        )}

        {items.map((item, idx) => {
          const isFirst = idx === 0
          const isLast = idx === items.length - 1
          const isMutating = mutating === item.id

          return (
            <div
              key={item.id}
              className={[
                'flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg',
                isMutating ? 'opacity-50' : '',
              ].join(' ')}
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">
                {item.order}
              </span>

              <div className="w-12 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                {item.course.thumbnailUrl ? (
                  <Image
                    src={item.course.thumbnailUrl}
                    alt={item.course.title}
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

              <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">
                {item.course.title}
              </span>

              <span className="flex-shrink-0 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                {STATUS_LABELS[item.course.status]}
              </span>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(item, 'up')}
                  disabled={isFirst || mutating !== null}
                  title="Mover para cima"
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleMove(item, 'down')}
                  disabled={isLast || mutating !== null}
                  title="Mover para baixo"
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  disabled={mutating !== null}
                  title="Remover curso da trilha"
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Remove confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Remover curso da trilha
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja remover{' '}
              <span className="font-medium">&quot;{deleteTarget.course.title}&quot;</span> desta trilha?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
