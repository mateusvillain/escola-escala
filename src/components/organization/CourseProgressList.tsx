'use client'

import { useEffect, useState } from 'react'

interface CourseStats {
  courseId: string
  title: string
  organizationId: string | null
  dueDate: string | null
  enrolledCount: number
  completedCount: number
  inProgressCount: number
  overdueCount: number
}

interface CourseMember {
  userId: string
  name: string
  email: string
  status: 'completed' | 'in_progress' | 'overdue' | 'not_started'
  completedAt: string | null
  daysOverdue?: number
  lastActivity: string | null
}

const STATUS_LABELS: Record<CourseMember['status'], string> = {
  completed: 'Concluído',
  in_progress: 'Em andamento',
  overdue: 'Atrasado',
  not_started: 'Não iniciado',
}

type TagVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'caution' | 'info'

const STATUS_VARIANTS: Record<CourseMember['status'], TagVariant> = {
  completed: 'success',
  in_progress: 'info',
  overdue: 'danger',
  not_started: 'secondary',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isPastDue(dueDate: string | null): boolean {
  return dueDate != null && new Date(dueDate).getTime() < Date.now()
}

export function CourseProgressList() {
  const [courses, setCourses] = useState<CourseStats[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [members, setMembers] = useState<CourseMember[] | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/organizations/me/courses')
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(body => setCourses(body.courses))
      .catch(() => setError('Não foi possível carregar os cursos.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedCourseId) {
      setMembers(null)
      return
    }
    setMembersLoading(true)
    setMembersError(null)
    fetch(`/api/organizations/me/courses/${selectedCourseId}/members`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(body => setMembers(body.members))
      .catch(() => setMembersError('Não foi possível carregar os membros.'))
      .finally(() => setMembersLoading(false))
  }, [selectedCourseId])

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  // — Visão de drill-down de um curso —
  if (selectedCourseId) {
    const course = courses?.find(c => c.courseId === selectedCourseId)
    const pastDue = course ? isPastDue(course.dueDate) : false

    return (
      <lui-card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedCourseId(null)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Cursos
            </button>
            <span className="text-gray-300 select-none">/</span>
            <h2 className="text-base font-semibold text-gray-900">{course?.title}</h2>
            {course?.organizationId && (
              <lui-tag label="Próprio" variant="primary" tag-style="subtle" size="sm" />
            )}
          </div>

          {course?.dueDate && (
            <p className="text-sm text-gray-500 mb-4">
              Prazo:{' '}
              <span className={pastDue ? 'text-red-600 font-medium' : 'text-gray-700 font-medium'}>
                {formatShortDate(course.dueDate)}
              </span>
            </p>
          )}

          {membersError && (
            <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
              {membersError}
            </div>
          )}

          {membersLoading ? (
            <p className="text-sm text-gray-400">Carregando membros...</p>
          ) : !members || members.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhum membro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Membro
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Data / Última atividade
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map(member => (
                    <tr key={member.userId}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <lui-tag
                            label={STATUS_LABELS[member.status]}
                            variant={STATUS_VARIANTS[member.status]}
                            tag-style="subtle"
                            size="sm"
                          />
                          {member.status === 'overdue' && member.daysOverdue !== undefined && (
                            <span className="text-xs text-red-600 whitespace-nowrap">
                              {member.daysOverdue} dia{member.daysOverdue !== 1 ? 's' : ''} de atraso
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {member.status === 'completed' && member.completedAt ? (
                          formatDate(member.completedAt)
                        ) : member.lastActivity ? (
                          formatDate(member.lastActivity)
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </lui-card>
    )
  }

  // — Lista de cursos —
  if (!courses || courses.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">Nenhum curso acessível ainda.</p>
    )
  }

  return (
    <lui-card aria-label="Cursos da organização">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Cursos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Progresso dos membros por curso acessível pela organização.
        </p>
        <div className="divide-y divide-gray-100">
          {courses.map(course => {
            const pastDue = isPastDue(course.dueDate)
            return (
              <button
                key={course.courseId}
                onClick={() => setSelectedCourseId(course.courseId)}
                className="w-full text-left px-3 py-4 hover:bg-gray-50 transition-colors rounded-lg flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{course.title}</span>
                    {course.organizationId && (
                      <lui-tag label="Próprio" variant="primary" tag-style="subtle" size="sm" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {course.dueDate ? (
                      <>
                        Prazo:{' '}
                        <span className={pastDue ? 'text-red-500 font-medium' : 'text-gray-500'}>
                          {formatShortDate(course.dueDate)}
                        </span>
                      </>
                    ) : (
                      'Sem prazo'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs whitespace-nowrap">
                  {course.completedCount > 0 && (
                    <span className="text-green-600 font-medium">
                      {course.completedCount} concluído{course.completedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {course.inProgressCount > 0 && (
                    <span className="text-blue-600 font-medium">
                      {course.inProgressCount} em andamento
                    </span>
                  )}
                  {pastDue && course.overdueCount > 0 && (
                    <span className="text-red-600 font-medium">
                      {course.overdueCount} atrasado{course.overdueCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {course.enrolledCount === 0 && (
                    <span className="text-gray-400">Nenhum inscrito</span>
                  )}
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </lui-card>
  )
}
