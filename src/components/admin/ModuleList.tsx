'use client'

import { useState, useCallback, useRef } from 'react'
import { LessonList, type Lesson } from './LessonList'
import { QuizEditor, type Quiz } from './QuizEditor'
import { getReleaseSummary, type DripModule } from '@/lib/drip-content'
import type { ModuleReleaseType } from '@/generated/prisma/client'

interface Module {
  id: string
  courseId: string
  title: string
  description: string | null
  order: number
  releaseType: ModuleReleaseType
  // Date no SSR inicial (props do Server Component); string ISO após refetch via fetch().json()
  releaseDate: Date | string | null
  releaseAfterDays: number | null
  lessons: Lesson[]
  quiz: Quiz | null
}

function toDate(value: Date | string | null): Date | null {
  return value ? new Date(value) : null
}

function toDateInputValue(value: Date | string | null): string {
  const date = toDate(value)
  return date ? date.toISOString().slice(0, 10) : ''
}

interface ModuleListProps {
  courseId: string
  initialModules: Module[]
}

export function ModuleList({ courseId, initialModules }: ModuleListProps) {
  const [modules, setModules] = useState<Module[]>(
    [...initialModules].sort((a, b) => a.order - b.order)
  )
  const [mutating, setMutating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Expand/collapse state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Add module state
  const [addingModule, setAddingModule] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null)

  // Release (drip content) inline edit state
  const [editingReleaseId, setEditingReleaseId] = useState<string | null>(null)
  const [releaseTypeForm, setReleaseTypeForm] = useState<ModuleReleaseType>('immediate')
  const [releaseDateForm, setReleaseDateForm] = useState('')
  const [releaseAfterDaysForm, setReleaseAfterDaysForm] = useState('')

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/admin/courses/${courseId}`)
    if (res.ok) {
      const data = await res.json()
      const sorted: Module[] = (data.course.modules ?? []).sort(
        (a: Module, b: Module) => a.order - b.order
      )
      setModules(sorted)
    }
  }, [courseId])

  const toggleExpand = (moduleId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  // ── Add module ────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setAddingModule(true)
    setNewTitle('')
    setTimeout(() => newInputRef.current?.focus(), 0)
  }

  const handleAdd = async () => {
    const title = newTitle.trim()
    if (!title) {
      setAddingModule(false)
      return
    }
    setMutating('add')
    setError(null)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      await refetch()
      // Auto-expand the new module
      setExpandedIds(prev => new Set([...prev, data.module.id]))
      setNewTitle('')
      setAddingModule(false)
    } catch {
      setError('Erro ao criar módulo.')
    } finally {
      setMutating(null)
    }
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') {
      setAddingModule(false)
      setNewTitle('')
    }
  }

  // ── Inline edit ───────────────────────────────────────────────────────────
  const handleEditStart = (mod: Module, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(mod.id)
    setEditTitle(mod.title)
  }

  const handleEditSave = async (moduleId: string) => {
    const title = editTitle.trim()
    setEditingId(null)
    if (!title) return

    const prev = modules.find(m => m.id === moduleId)
    if (prev?.title === title) return

    setMutating(moduleId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error()
      setModules(ms =>
        ms.map(m => (m.id === moduleId ? { ...m, title } : m))
      )
    } catch {
      setError('Erro ao atualizar módulo.')
    } finally {
      setMutating(null)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, moduleId: string) => {
    if (e.key === 'Enter') handleEditSave(moduleId)
    if (e.key === 'Escape') setEditingId(null)
  }

  // ── Liberação programada (drip content) ─────────────────────────────────────
  const handleReleaseEditStart = (mod: Module, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingReleaseId(mod.id)
    setReleaseTypeForm(mod.releaseType)
    setReleaseDateForm(toDateInputValue(mod.releaseDate))
    setReleaseAfterDaysForm(mod.releaseAfterDays != null ? String(mod.releaseAfterDays) : '')
  }

  const handleReleaseCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingReleaseId(null)
  }

  const handleReleaseSave = async (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (releaseTypeForm === 'fixed_date' && !releaseDateForm) {
      setError('Informe a data de liberação.')
      return
    }
    if (releaseTypeForm === 'days_after_enrollment' && !releaseAfterDaysForm) {
      setError('Informe o número de dias após a matrícula.')
      return
    }

    setMutating(moduleId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseType: releaseTypeForm,
          releaseDate: releaseTypeForm === 'fixed_date' ? releaseDateForm : null,
          releaseAfterDays:
            releaseTypeForm === 'days_after_enrollment' ? Number(releaseAfterDaysForm) : null,
        }),
      })
      if (!res.ok) throw new Error()
      setEditingReleaseId(null)
      await refetch()
    } catch {
      setError('Erro ao atualizar a liberação do módulo.')
    } finally {
      setMutating(null)
    }
  }

  // ── Reorder ───────────────────────────────────────────────────────────────
  const handleMove = async (mod: Module, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation()
    const newOrder = direction === 'up' ? mod.order - 1 : mod.order + 1
    if (newOrder < 1 || newOrder > modules.length) return

    setMutating(mod.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/modules/${mod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      })
      if (!res.ok) throw new Error()
      await refetch()
    } catch {
      setError('Erro ao reordenar módulo.')
    } finally {
      setMutating(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const mod = deleteTarget
    setDeleteTarget(null)
    setMutating(mod.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/modules/${mod.id}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) throw new Error()
      setExpandedIds(prev => {
        const next = new Set(prev)
        next.delete(mod.id)
        return next
      })
      await refetch()
    } catch {
      setError('Erro ao excluir módulo.')
    } finally {
      setMutating(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Módulos</h2>
        {!addingModule && (
          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={mutating !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            + Adicionar módulo
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Module list */}
      <div className="space-y-1">
        {modules.length === 0 && !addingModule && (
          <p className="text-sm text-gray-400 py-4 text-center">
            Nenhum módulo ainda. Adicione o primeiro módulo acima.
          </p>
        )}

        {modules.map((mod, idx) => {
          const isFirst = idx === 0
          const isLast = idx === modules.length - 1
          const isMutating = mutating === mod.id
          const isEditing = editingId === mod.id
          const isExpanded = expandedIds.has(mod.id)

          return (
            <div key={mod.id} className={isMutating ? 'opacity-50' : ''}>
              {/* Module row */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => !isEditing && toggleExpand(mod.id)}
              >
                {/* Expand chevron */}
                <svg
                  className={[
                    'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150',
                    isExpanded ? 'rotate-90' : '',
                  ].join(' ')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>

                {/* Order badge */}
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">
                  {mod.order}
                </span>

                {/* Title — inline editable */}
                <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      autoFocus
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => handleEditSave(mod.id)}
                      onKeyDown={e => handleEditKeyDown(e, mod.id)}
                      className="w-full px-2 py-0.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={e => handleEditStart(mod, e)}
                      disabled={isMutating || mutating !== null}
                      className="text-sm font-medium text-gray-800 hover:text-blue-600 text-left truncate max-w-full disabled:cursor-default"
                      title="Clique para editar o título"
                    >
                      {mod.title}
                    </button>
                  )}
                </div>

                {/* Lesson count */}
                <span className="flex-shrink-0 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                  {mod.lessons.length} {mod.lessons.length === 1 ? 'aula' : 'aulas'}
                </span>

                {/* Release (drip content) summary */}
                <button
                  type="button"
                  onClick={e => handleReleaseEditStart(mod, e)}
                  disabled={mutating !== null}
                  title="Clique para configurar a liberação do módulo"
                  className="flex-shrink-0 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  Liberação: {getReleaseSummary({ ...mod, releaseDate: toDate(mod.releaseDate) })}
                </button>

                {/* Actions */}
                <div
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={e => handleMove(mod, 'up', e)}
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
                    onClick={e => handleMove(mod, 'down', e)}
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
                    onClick={e => { e.stopPropagation(); setDeleteTarget(mod) }}
                    disabled={mutating !== null}
                    title="Excluir módulo"
                    className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Release (drip content) inline editor */}
              {editingReleaseId === mod.id && (
                <div
                  className="flex flex-wrap items-center gap-2 px-4 py-3 mt-1 bg-indigo-50 border border-indigo-200 rounded-lg"
                  onClick={e => e.stopPropagation()}
                >
                  <select
                    value={releaseTypeForm}
                    onChange={e => setReleaseTypeForm(e.target.value as ModuleReleaseType)}
                    className="px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="immediate">Imediato</option>
                    <option value="fixed_date">Data fixa</option>
                    <option value="days_after_enrollment">Dias após matrícula</option>
                  </select>

                  {releaseTypeForm === 'fixed_date' && (
                    <input
                      type="date"
                      value={releaseDateForm}
                      onChange={e => setReleaseDateForm(e.target.value)}
                      className="px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  )}

                  {releaseTypeForm === 'days_after_enrollment' && (
                    <input
                      type="number"
                      min={1}
                      value={releaseAfterDaysForm}
                      onChange={e => setReleaseAfterDaysForm(e.target.value)}
                      placeholder="Dias"
                      className="w-20 px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  )}

                  <button
                    type="button"
                    onClick={e => handleReleaseSave(mod.id, e)}
                    disabled={isMutating}
                    className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isMutating ? '...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReleaseCancel}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Expanded lesson list */}
              {isExpanded && (
                <>
                  <LessonList
                    moduleId={mod.id}
                    courseId={courseId}
                    initialLessons={mod.lessons}
                    onUpdate={refetch}
                  />
                  <QuizEditor moduleId={mod.id} initialQuiz={mod.quiz} onUpdate={refetch} />
                </>
              )}
            </div>
          )
        })}

        {/* Add module inline input */}
        {addingModule && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              ref={newInputRef}
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Título do módulo"
              className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={mutating === 'add' || !newTitle.trim()}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {mutating === 'add' ? '...' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={() => { setAddingModule(false); setNewTitle('') }}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Excluir módulo
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Tem certeza que deseja excluir o módulo{' '}
              <span className="font-medium">"{deleteTarget.title}"</span>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              Esta ação removerá todas as {deleteTarget.lessons.length} aula
              {deleteTarget.lessons.length !== 1 ? 's' : ''} deste módulo permanentemente.
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
