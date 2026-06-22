'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'

type TrackStatus = 'draft' | 'published' | 'archived'

interface Track {
  id: string
  title: string
  slug: string
  status: TrackStatus
  isBundle: boolean
  createdAt: string
  _count: { items: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ConfirmModal {
  trackId: string
  trackTitle: string
  action: 'published' | 'archived'
}

const STATUS_LABELS: Record<TrackStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
}

const STATUS_VARIANTS: Record<TrackStatus, string> = {
  draft: 'caution',
  published: 'success',
  archived: 'secondary',
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Arquivado' },
]

export function TrackTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') ?? ''
  const currentSearch = searchParams.get('search') ?? ''
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10)

  const [tracks, setTracks] = useState<Track[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(currentSearch)
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openMenuId) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

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

  const fetchTracks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (currentStatus) params.set('status', currentStatus)
      if (currentSearch) params.set('search', currentSearch)
      params.set('page', String(currentPage))
      params.set('limit', '10')

      const res = await fetch(`/api/admin/tracks?${params.toString()}`)
      if (!res.ok) throw new Error('Erro ao carregar trilhas')
      const data = await res.json()
      setTracks(data.data)
      setPagination(data.pagination)
    } catch {
      setError('Não foi possível carregar as trilhas.')
    } finally {
      setLoading(false)
    }
  }, [currentStatus, currentSearch, currentPage])

  useEffect(() => {
    fetchTracks()
  }, [fetchTracks])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ search: value, page: '1' }))
    }, 300)
  }

  const handleStatusFilter = (status: string) => {
    router.push(buildUrl({ status, page: '1' }))
  }

  const handleStatusAction = async () => {
    if (!confirmModal) return
    setActionLoading(confirmModal.trackId)
    setConfirmModal(null)
    try {
      const res = await fetch(`/api/admin/tracks/${confirmModal.trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: confirmModal.action }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Falha ao atualizar status da trilha.')
        return
      }
      await fetchTracks()
    } catch {
      setError('Falha ao atualizar status da trilha.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <lui-heading level="1" size="xl">Trilhas</lui-heading>
        <Link
          href="/admin/trilhas/novo"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Trilha
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleStatusFilter(f.value)}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors',
                currentStatus === f.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar por título..."
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
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
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <lui-body>Nenhuma trilha encontrada</lui-body>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trilha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bundle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cursos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tracks.map(track => (
                <tr key={track.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 line-clamp-1">{track.title}</span>
                  </td>

                  <td className="px-4 py-3">
                    <lui-tag
                      label={track.isBundle ? 'Sim' : 'Não'}
                      variant={track.isBundle ? 'primary' : 'secondary'}
                      tag-style="subtle"
                      size="sm"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <lui-tag
                      label={STATUS_LABELS[track.status]}
                      variant={STATUS_VARIANTS[track.status] as 'caution' | 'success' | 'secondary'}
                      tag-style="subtle"
                      size="sm"
                    />
                  </td>

                  <td className="px-4 py-3 text-gray-600">{track._count.items}</td>

                  <td className="px-4 py-3 text-gray-500">
                    {new Date(track.createdAt).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {track.status !== 'published' && (
                        <button
                          onClick={() => setConfirmModal({ trackId: track.id, trackTitle: track.title, action: 'published' })}
                          disabled={actionLoading === track.id}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === track.id ? '...' : 'Publicar'}
                        </button>
                      )}

                      <div className="relative" ref={openMenuId === track.id ? menuRef : null}>
                        <button
                          onClick={() => setOpenMenuId(prev => (prev === track.id ? null : track.id))}
                          aria-label="Mais ações"
                          aria-expanded={openMenuId === track.id}
                          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {openMenuId === track.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                            <Link
                              href={`/admin/trilhas/${track.id}`}
                              onClick={() => setOpenMenuId(null)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Editar
                            </Link>
                            {track.status !== 'archived' && (
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  setConfirmModal({ trackId: track.id, trackTitle: track.title, action: 'archived' })
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Arquivar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
            {pagination.total} trilha{pagination.total !== 1 ? 's' : ''} no total
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

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <lui-heading level="3" className="mb-2">
              {confirmModal.action === 'published' ? 'Publicar trilha' : 'Arquivar trilha'}
            </lui-heading>
            <lui-body className="text-gray-600 mb-6">
              {confirmModal.action === 'published'
                ? `Tem certeza que deseja publicar "${confirmModal.trackTitle}"? Ela ficará visível para os alunos.`
                : `Tem certeza que deseja arquivar "${confirmModal.trackTitle}"? Ela deixará de ser acessível.`}
            </lui-body>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusAction}
                className={[
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  confirmModal.action === 'published'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700',
                ].join(' ')}
              >
                {confirmModal.action === 'published' ? 'Publicar' : 'Arquivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
