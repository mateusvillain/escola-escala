'use client'

import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'

interface LessonCompletionToggleProps {
  lessonId: string
  initialCompleted: boolean
}

export function LessonCompletionToggle({ lessonId, initialCompleted }: LessonCompletionToggleProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  async function toggle() {
    const next = !isCompleted
    setIsCompleted(next)
    setError(false)
    setSaving(true)

    try {
      const res = await fetch(`/api/progress/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next ? { isCompleted: true, watchPercentage: 100 } : { isCompleted: false }),
      })
      if (!res.ok) throw new Error('request failed')
    } catch {
      setIsCompleted(!next)
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4">
      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={toggle}
          disabled={saving}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
        />
        <span className="text-sm font-medium text-gray-700">
          {isCompleted ? 'Aula concluída' : 'Marcar como concluída'}
        </span>
      </label>

      {error && (
        <Alert
          variant="danger"
          title="Não foi possível atualizar o progresso. Tente novamente."
          className="mt-2"
        />
      )}
    </div>
  )
}
