'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown> | null
  createdAt: string
  actor: { name: string; email: string }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTION_LABELS: Record<string, string> = {
  'course.status_changed': 'Status do curso alterado',
  'user.role_changed': 'Role de usuário alterado',
  'user.status_changed': 'Status de usuário alterado',
}

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todas as ações' },
  { value: 'course.status_changed', label: 'Status do curso' },
  { value: 'user.role_changed', label: 'Role de usuário' },
  { value: 'user.status_changed', label: 'Status de usuário' },
]

function formatDetails(entry: AuditLogEntry): string {
  const meta = entry.metadata
  if (!meta) return '—'

  switch (entry.action) {
    case 'course.status_changed':
      return `"${meta.title}": ${meta.from} → ${meta.to}`
    case 'user.role_changed':
      return `${meta.email}: ${meta.from} → ${meta.to}`
    case 'user.status_changed':
      return `${meta.email}: ${meta.from ? 'ativo' : 'inativo'} → ${meta.to ? 'ativo' : 'inativo'}`
    default:
      return JSON.stringify(meta)
  }
}

export function AuditLogTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentAction = searchParams.get('action') ?? ''
  const currentStartDate = searchParams.get('startDate') ?? ''
  const currentEndDate = searchParams.get('endDate') ?? ''
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10)

  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(overrides).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams]
  )

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (currentAction) params.set('action', currentAction)
      if (currentStartDate) params.set('startDate', currentStartDate)
      if (currentEndDate) params.set('endDate', currentEndDate)
      params.set('page', String(currentPage))
      params.set('limit', '20')

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`)
      if (!res.ok) throw new Error('Erro ao carregar log de auditoria')
      const data = await res.json()
      setLogs(data.data)
      setPagination(data.pagination)
    } catch {
      setError('Não foi possível carregar o log de auditoria.')
    } finally {
      setLoading(false)
    }
  }, [currentAction, currentStartDate, currentEndDate, currentPage])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <lui-heading level="1" size="xl">Auditoria</lui-heading>
        <p className="text-sm text-gray-500 mt-1">Histórico de ações administrativas sensíveis.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={currentAction}
          onChange={e => router.push(buildUrl({ action: e.target.value, page: '1' }))}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {ACTION_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={currentStartDate}
          onChange={e => router.push(buildUrl({ startDate: e.target.value, page: '1' }))}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          aria-label="Data inicial"
        />
        <span className="text-sm text-gray-400">até</span>
        <input
          type="date"
          value={currentEndDate}
          onChange={e => router.push(buildUrl({ endDate: e.target.value, page: '1' }))}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          aria-label="Data final"
        />

        {(currentAction || currentStartDate || currentEndDate) && (
          <button
            onClick={() => router.push(pathname)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <lui-alert variant="danger" title="Erro" content={error} className="mb-4" />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <lui-body>Carregando...</lui-body>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <lui-body>Nenhuma ação registrada</lui-body>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Autor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ação</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalhes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{log.actor.name}</p>
                    <p className="text-xs text-gray-500">{log.actor.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDetails(log)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {pagination.total} registro{pagination.total !== 1 ? 's' : ''} no total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(buildUrl({ page: String(currentPage - 1) }))}
              disabled={currentPage <= 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              {currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => router.push(buildUrl({ page: String(currentPage + 1) }))}
              disabled={currentPage >= pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
