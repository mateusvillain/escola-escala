'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SidebarLesson {
  id: string
  title: string
}

interface SidebarModule {
  id: string
  title: string
  lessons: SidebarLesson[]
  quiz: { passed: boolean } | null
}

interface CourseSidebarProps {
  modules: SidebarModule[]
  courseSlug: string
  currentLessonId: string
  progress: Record<string, boolean>
  completedCount: number
  totalCount: number
}

function LessonIcon({ isCompleted, isCurrent }: { isCompleted: boolean; isCurrent: boolean }) {
  if (isCompleted) {
    return (
      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  return (
    <svg
      className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.5 7.5a.5.5 0 01.766-.424l4 2.5a.5.5 0 010 .848l-4 2.5A.5.5 0 018.5 12.5v-5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function CourseSidebar({
  modules,
  courseSlug,
  currentLessonId,
  progress,
  completedCount,
  totalCount,
}: CourseSidebarProps) {
  const [collapsed, setCollapsed] = useState(true)
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="md:hidden w-full flex items-center justify-between px-4 py-3 mb-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
        aria-expanded={!collapsed}
      >
        Conteúdo do curso
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`${collapsed ? 'hidden' : 'block'} md:block border border-gray-200 rounded-xl overflow-hidden bg-white`}>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {completedCount} de {totalCount} aula{totalCount !== 1 ? 's' : ''} concluída{completedCount !== 1 ? 's' : ''}
          </p>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
          {modules.map(module => (
            <div key={module.id} className="py-2">
              <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {module.title}
              </p>
              <ul>
                {module.lessons.map(lesson => {
                  const isCurrent = lesson.id === currentLessonId
                  const isCompleted = progress[lesson.id] ?? false
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/cursos/${courseSlug}/aulas/${lesson.id}`}
                        className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                          isCurrent
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <LessonIcon isCompleted={isCompleted} isCurrent={isCurrent} />
                        <span className="truncate">{lesson.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {module.quiz && module.lessons.every(l => progress[l.id]) && (
                <Link
                  href={`/cursos/${courseSlug}/modulos/${module.id}/quiz`}
                  className={`flex items-center gap-2.5 mx-4 mt-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    module.quiz.passed
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {module.quiz.passed ? 'Quiz aprovado ✓' : 'Fazer quiz do módulo'}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
