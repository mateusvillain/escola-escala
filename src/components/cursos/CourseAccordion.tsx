'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  videoDuration: number | null
  isPreview: boolean
  order: number
  videoId: string | null
}

interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface CourseAccordionProps {
  modules: Module[]
  courseSlug: string
  hasAccess: boolean
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CourseAccordion({ modules, courseSlug, hasAccess }: CourseAccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([modules[0]?.id]))

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
      {modules.map((module, idx) => {
        const isOpen = openIds.has(module.id)
        const lessonCount = module.lessons.length
        return (
          <div key={module.id} className="bg-white">
            <button
              onClick={() => toggle(module.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900">{module.title}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {lessonCount} aula{lessonCount !== 1 ? 's' : ''}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <ul className="divide-y divide-gray-50 bg-gray-50">
                {module.lessons.map(lesson => {
                  const isAccessible = hasAccess || lesson.isPreview
                  const duration = formatDuration(lesson.videoDuration)

                  const inner = (
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isAccessible ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        {isAccessible ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>

                      <span className={`flex-1 text-sm ${isAccessible ? 'text-gray-800' : 'text-gray-400'}`}>
                        {lesson.title}
                      </span>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lesson.isPreview && (
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                            Grátis
                          </span>
                        )}
                        {duration && (
                          <span className="text-xs text-gray-400 tabular-nums">{duration}</span>
                        )}
                      </div>
                    </div>
                  )

                  return (
                    <li key={lesson.id}>
                      {isAccessible ? (
                        <Link
                          href={`/cursos/${courseSlug}/aulas/${lesson.id}`}
                          className="block hover:bg-gray-100 transition-colors"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="cursor-default">{inner}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
