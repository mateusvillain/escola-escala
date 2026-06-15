'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export interface Lesson {
  id: string
  title: string
  order: number
  videoId: string | null
  isPreview: boolean
}

interface LessonListProps {
  moduleId: string
  courseId: string
  initialLessons: Lesson[]
  onUpdate: () => void
}

export function LessonList({ moduleId, courseId, initialLessons, onUpdate }: LessonListProps) {
  const [lessons, setLessons] = useState<Lesson[]>(
    [...initialLessons].sort((a, b) => a.order - b.order)
  )
  const [mutating, setMutating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add lesson state
  const [addingLesson, setAddingLesson] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)

  // Sync when parent refetches and passes new initialLessons
  useEffect(() => {
    setLessons([...initialLessons].sort((a, b) => a.order - b.order))
  }, [initialLessons])

  const refetchLocal = async () => {
    const res = await fetch(`/api/admin/courses/${courseId}`)
    if (res.ok) {
      const data = await res.json()
      const thisModule = data.course.modules?.find((m: { id: string }) => m.id === moduleId)
      if (thisModule?.lessons) {
        setLessons([...thisModule.lessons].sort((a: Lesson, b: Lesson) => a.order - b.order))
      }
    }
    onUpdate()
  }

  // ── Add lesson ────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setAddingLesson(true)
    setNewTitle('')
    setTimeout(() => newInputRef.current?.focus(), 0)
  }

  const handleAdd = async () => {
    const title = newTitle.trim()
    if (!title) {
      setAddingLesson(false)
      return
    }
    setMutating('add')
    setError(null)
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error()
      await refetchLocal()
      setNewTitle('')
      setAddingLesson(false)
    } catch {
      setError('Erro ao criar aula.')
    } finally {
      setMutating(null)
    }
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { setAddingLesson(false); setNewTitle('') }
  }

  // ── Reorder ───────────────────────────────────────────────────────────────
  const handleMove = async (lesson: Lesson, direction: 'up' | 'down') => {
    const idx = lessons.findIndex(l => l.id === lesson.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= lessons.length) return

    const swapLesson = lessons[swapIdx]
    setMutating(lesson.id)
    setError(null)
    try {
      // Swap orders — no unique constraint on (moduleId, order) so sequential is safe
      await Promise.all([
        fetch(`/api/admin/lessons/${lesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: swapLesson.order }),
        }),
        fetch(`/api/admin/lessons/${swapLesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: lesson.order }),
        }),
      ])
      await refetchLocal()
    } catch {
      setError('Erro ao reordenar aula.')
    } finally {
      setMutating(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const lesson = deleteTarget
    setDeleteTarget(null)
    setMutating(lesson.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error()

      // Close order gaps in remaining lessons
      const remaining = lessons
        .filter(l => l.id !== lesson.id)
        .sort((a, b) => a.order - b.order)
      await Promise.all(
        remaining.map((l, idx) =>
          l.order !== idx + 1
            ? fetch(`/api/admin/lessons/${l.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: idx + 1 }),
              })
            : Promise.resolve()
        )
      )

      await refetchLocal()
    } catch {
      setError('Erro ao excluir aula.')
    } finally {
      setMutating(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="mt-2 ml-6 border-l-2 border-gray-100 pl-4 space-y-1">
      {/* Error */}
      {error && (
        <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Lesson rows */}
      {lessons.length === 0 && !addingLesson && (
        <p className="text-xs text-gray-400 py-2">
          Nenhuma aula. Adicione a primeira aula abaixo.
        </p>
      )}

      {lessons.map((lesson, idx) => {
        const isFirst = idx === 0
        const isLast = idx === lessons.length - 1
        const isMutating = mutating === lesson.id

        return (
          <div
            key={lesson.id}
            className={[
              'flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg transition-opacity group',
              isMutating ? 'opacity-50' : '',
            ].join(' ')}
          >
            {/* Title */}
            <Link
              href={`/admin/aulas/${lesson.id}`}
              className="flex-1 min-w-0 text-sm text-gray-700 hover:text-blue-600 truncate transition-colors"
              title="Editar aula"
            >
              {lesson.title}
            </Link>

            {/* Status badges */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {lesson.isPreview && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded">
                  Preview
                </span>
              )}
              {lesson.videoId ? (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded">
                  Com vídeo
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded">
                  Sem vídeo
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Edit */}
              <Link
                href={`/admin/aulas/${lesson.id}`}
                title="Editar aula"
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>

              {/* Move up */}
              <button
                type="button"
                onClick={() => handleMove(lesson, 'up')}
                disabled={isFirst || mutating !== null}
                title="Mover para cima"
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              {/* Move down */}
              <button
                type="button"
                onClick={() => handleMove(lesson, 'down')}
                disabled={isLast || mutating !== null}
                title="Mover para baixo"
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setDeleteTarget(lesson)}
                disabled={mutating !== null}
                title="Excluir aula"
                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}

      {/* Add lesson inline input */}
      {addingLesson ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            ref={newInputRef}
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="Título da aula"
            className="flex-1 px-2 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={mutating === 'add' || !newTitle.trim()}
            className="px-2.5 py-0.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {mutating === 'add' ? '...' : 'OK'}
          </button>
          <button
            type="button"
            onClick={() => { setAddingLesson(false); setNewTitle('') }}
            className="px-2.5 py-0.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={mutating !== null}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
        >
          + Adicionar aula
        </button>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Excluir aula</h3>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir a aula{' '}
              <span className="font-medium">"{deleteTarget.title}"</span>?
              Esta ação também removerá o progresso dos alunos nesta aula.
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
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
