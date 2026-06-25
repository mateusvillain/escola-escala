'use client'

import { useEffect, useState } from 'react'

interface MemberEngagement {
  userId: string
  name: string
  email: string
  completedCount: number
  inProgressCount: number
  studySeconds: number
}

function formatStudyTime(seconds: number): string {
  if (seconds <= 0) return '0min'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours === 0) return `${minutes}min`
  return `${hours}h ${minutes}min`
}

export function EngagementDashboard() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<MemberEngagement[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/organizations/me/engagement')
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(body => setMembers(body.members))
      .catch(() => setError('Não foi possível carregar o engajamento da equipe.'))
      .finally(() => setLoading(false))
  }, [])

  const hasAnyProgress =
    members?.some(m => m.completedCount > 0 || m.inProgressCount > 0) ?? false

  return (
    <lui-card aria-label="Engajamento da equipe">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Engajamento da equipe</h2>
        <p className="text-sm text-gray-500 mb-4">
          Progresso dos membros nos cursos acessíveis pela organização.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : !members || members.length === 0 || !hasAnyProgress ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Nenhum membro com progresso registrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Membro
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Concluídos
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Em andamento
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tempo de estudo
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
                    <td className="px-3 py-3 text-gray-700">{member.completedCount}</td>
                    <td className="px-3 py-3 text-gray-700">{member.inProgressCount}</td>
                    <td className="px-3 py-3 text-gray-700">{formatStudyTime(member.studySeconds)}</td>
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
