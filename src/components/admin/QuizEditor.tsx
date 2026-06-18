'use client'

import { useState } from 'react'

interface QuestionDraft {
  text: string
  options: string[]
  correctOptionIndex: number
}

export interface QuizQuestion {
  id: string
  text: string
  options: string[]
  correctOptionIndex: number
  order: number
}

export interface Quiz {
  id: string
  questions: QuizQuestion[]
}

interface QuizEditorProps {
  moduleId: string
  initialQuiz: Quiz | null
  onUpdate: () => void
}

const EMPTY_QUESTION: QuestionDraft = { text: '', options: ['', ''], correctOptionIndex: 0 }

function toDrafts(quiz: Quiz | null): QuestionDraft[] {
  if (!quiz) return []
  return quiz.questions.map(q => ({ text: q.text, options: q.options, correctOptionIndex: q.correctOptionIndex }))
}

export function QuizEditor({ moduleId, initialQuiz, onUpdate }: QuizEditorProps) {
  const [hasQuiz, setHasQuiz] = useState(initialQuiz !== null)
  const [questions, setQuestions] = useState<QuestionDraft[]>(toDrafts(initialQuiz))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const startQuiz = () => {
    setHasQuiz(true)
    setQuestions([{ ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options] }])
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options] }])
  }

  const removeQuestion = (qIndex: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== qIndex))
  }

  const updateQuestionText = (qIndex: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => (i === qIndex ? { ...q, text } : q)))
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q
      )
    )
  }

  const addOption = (qIndex: number) => {
    setQuestions(prev =>
      prev.map((q, i) => (i === qIndex && q.options.length < 5 ? { ...q, options: [...q.options, ''] } : q))
    )
  }

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q
        const options = q.options.filter((_, j) => j !== oIndex)
        const correctOptionIndex =
          q.correctOptionIndex === oIndex
            ? 0
            : q.correctOptionIndex > oIndex
              ? q.correctOptionIndex - 1
              : q.correctOptionIndex
        return { ...q, options, correctOptionIndex }
      })
    )
  }

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    setQuestions(prev => prev.map((q, i) => (i === qIndex ? { ...q, correctOptionIndex: oIndex } : q)))
  }

  const validate = (): string | null => {
    if (questions.length === 0) return 'Adicione ao menos uma pergunta.'
    for (const q of questions) {
      if (!q.text.trim()) return 'Toda pergunta precisa de um texto.'
      if (q.options.some(o => !o.trim())) return 'Toda alternativa precisa de um texto.'
      if (q.options.length < 2) return 'Cada pergunta precisa de ao menos 2 alternativas.'
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      setSuccess(null)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}/quiz`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.map(q => ({
            text: q.text.trim(),
            options: q.options.map(o => o.trim()),
            correctOptionIndex: q.correctOptionIndex,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erro ao salvar o quiz.')
        return
      }
      setSuccess('Quiz salvo com sucesso.')
      onUpdate()
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setConfirmDelete(false)
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}/quiz`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error()
      setHasQuiz(false)
      setQuestions([])
      setSuccess(null)
      onUpdate()
    } catch {
      setError('Erro ao remover o quiz.')
    } finally {
      setDeleting(false)
    }
  }

  if (!hasQuiz) {
    return (
      <div className="mt-2 ml-6 pl-4">
        <button
          type="button"
          onClick={startQuiz}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          + Adicionar quiz a este módulo
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 ml-6 border-l-2 border-blue-100 pl-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Quiz do módulo</h3>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
          className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          Remover quiz
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
      )}
      {success && (
        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">{success}</div>
      )}

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full">
              {qIndex + 1}
            </span>
            <input
              type="text"
              value={q.text}
              onChange={e => updateQuestionText(qIndex, e.target.value)}
              placeholder="Texto da pergunta"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={() => removeQuestion(qIndex)}
              title="Remover pergunta"
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="ml-7 space-y-1.5">
            {q.options.map((option, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={q.correctOptionIndex === oIndex}
                  onChange={() => setCorrectOption(qIndex, oIndex)}
                  title="Marcar como correta"
                  className="flex-shrink-0"
                />
                <input
                  type="text"
                  value={option}
                  onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                  placeholder={`Alternativa ${oIndex + 1}`}
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeOption(qIndex, oIndex)}
                  disabled={q.options.length <= 2}
                  title="Remover alternativa"
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(qIndex)}
              disabled={q.options.length >= 5}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              + Adicionar alternativa
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addQuestion}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          + Adicionar pergunta
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar quiz'}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Remover quiz</h3>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja remover o quiz deste módulo? Todas as perguntas e tentativas dos alunos
              serão removidas permanentemente, e o módulo deixará de exigir aprovação para o certificado.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
