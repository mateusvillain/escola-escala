'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface QuizQuestionView {
  id: string
  text: string
  options: string[]
}

interface QuestionResult {
  questionId: string
  selectedOptionIndex: number | null
  correctOptionIndex: number
  isCorrect: boolean
}

interface QuizResult {
  score: number
  passed: boolean
  results: QuestionResult[]
}

interface QuizFormProps {
  moduleId: string
  courseSlug: string
  questions: QuizQuestionView[]
}

export function QuizForm({ moduleId, courseSlug, questions }: QuizFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAnswered = questions.every(q => answers[q.id] !== undefined)

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError('Responda todas as perguntas antes de enviar.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/modules/${moduleId}/quiz/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({
            questionId,
            selectedOptionIndex,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erro ao enviar o quiz.')
        return
      }
      setResult(json)
      router.refresh()
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setAnswers({})
    setError(null)
  }

  if (result) {
    const resultByQuestion = new Map(result.results.map(r => [r.questionId, r]))

    return (
      <div>
        <div
          className={`rounded-xl p-6 mb-6 text-center border ${
            result.passed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <p className={`text-3xl font-bold ${result.passed ? 'text-green-700' : 'text-amber-700'}`}>
            {result.score}%
          </p>
          <p className={`text-sm font-medium mt-1 ${result.passed ? 'text-green-800' : 'text-amber-800'}`}>
            {result.passed ? 'Aprovado!' : 'Você precisa de 70% para ser aprovado.'}
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const r = resultByQuestion.get(q.id)
            if (!r) return null
            return (
              <div
                key={q.id}
                className={`border rounded-xl p-4 ${r.isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}
              >
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {idx + 1}. {q.text}
                </p>
                <div className="space-y-1">
                  {q.options.map((option, oIndex) => {
                    const isSelected = r.selectedOptionIndex === oIndex
                    const isCorrectOption = r.correctOptionIndex === oIndex
                    return (
                      <p
                        key={oIndex}
                        className={`text-sm px-3 py-1.5 rounded ${
                          isCorrectOption
                            ? 'bg-green-100 text-green-800 font-medium'
                            : isSelected
                              ? 'bg-red-100 text-red-800'
                              : 'text-gray-600'
                        }`}
                      >
                        {option}
                        {isCorrectOption && ' ✓'}
                        {isSelected && !isCorrectOption && ' (sua resposta)'}
                      </p>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mt-6">
          {!result.passed && (
            <button
              type="button"
              onClick={handleRetry}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refazer quiz
            </button>
          )}
          <Link
            href={`/cursos/${courseSlug}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar ao curso
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div key={q.id} className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">
              {idx + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((option, oIndex) => (
                <label
                  key={oIndex}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    checked={answers[q.id] === oIndex}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: oIndex }))}
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Enviando...' : 'Enviar respostas'}
      </button>
    </div>
  )
}
