'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'

type Role = 'admin' | 'instructor' | 'student'
type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'

interface User {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  freeTrialEligible: boolean
  createdAt: string
  instructorId: string | null
  subscription: { status: SubscriptionStatus; planName: string } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ConfirmModal {
  userId: string
  userName: string
  action: 'deactivate' | 'reactivate' | 'change-role' | 'grant-trial' | 'revoke-trial'
  newRole?: Role
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  instructor: 'Instrutor',
  student: 'Aluno',
}

const ROLE_VARIANTS: Record<Role, string> = {
  admin: 'danger',
  instructor: 'primary',
  student: 'secondary',
}

const SUB_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Ativo',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelado',
  trialing: 'Trial',
}

const SUB_VARIANTS: Record<SubscriptionStatus, string> = {
  active: 'success',
  past_due: 'caution',
  canceled: 'secondary',
  trialing: 'info',
}

const ROLE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'instructor', label: 'Instrutor' },
  { value: 'student', label: 'Aluno' },
]

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

export function UserTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentRole = searchParams.get('role') ?? ''
  const currentSearch = searchParams.get('search') ?? ''
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10)

  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(currentSearch)
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null)
  const [pendingRole, setPendingRole] = useState<Record<string, Role>>({})

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const exportUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (currentRole) params.set('role', currentRole)
    if (currentSearch) params.set('search', currentSearch)
    return `/api/admin/users/export?${params}`
  }, [currentRole, currentSearch])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (currentRole) params.set('role', currentRole)
      if (currentSearch) params.set('search', currentSearch)
      params.set('page', String(currentPage))
      params.set('limit', '20')

      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.data)
      setPagination(data.pagination)
    } catch {
      setError('Não foi possível carregar os usuários.')
    } finally {
      setLoading(false)
    }
  }, [currentRole, currentSearch, currentPage])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ search: value, page: '1' }))
    }, 300)
  }

  const handleConfirm = async () => {
    if (!confirmModal) return
    const { userId, action, newRole } = confirmModal
    setActionLoading(userId)
    setConfirmModal(null)

    try {
      const body =
        action === 'deactivate' ? { isActive: false }
        : action === 'reactivate' ? { isActive: true }
        : action === 'grant-trial' ? { freeTrialEligible: true }
        : action === 'revoke-trial' ? { freeTrialEligible: false }
        : { role: newRole }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erro ao atualizar usuário.')
        return
      }
      setPendingRole(prev => { const n = { ...prev }; delete n[userId]; return n })
      await fetchUsers()
    } catch {
      setError('Falha ao atualizar usuário.')
    } finally {
      setActionLoading(null)
    }
  }

  const openRoleChange = (user: User) => {
    const newRole = pendingRole[user.id] ?? user.role
    setConfirmModal({
      userId: user.id,
      userName: user.name,
      action: 'change-role',
      newRole,
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <lui-heading level="1" size="xl">Usuários</lui-heading>
        <a
          href={exportUrl()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Exportar CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {ROLE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => router.push(buildUrl({ role: f.value, page: '1' }))}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors',
                currentRole === f.value
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
          placeholder="Buscar por nome ou e-mail..."
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1 min-w-[220px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Error */}
      {error && (
        <lui-alert variant="danger" title="Erro" content={error} className="mb-4" />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <lui-body>Carregando...</lui-body>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <lui-body>Nenhum usuário encontrado</lui-body>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assinatura</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cadastro</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  {/* Avatar + Name + Email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <lui-tag
                      label={ROLE_LABELS[user.role]}
                      variant={ROLE_VARIANTS[user.role] as 'danger' | 'primary' | 'secondary'}
                      tag-style="subtle"
                      size="sm"
                    />
                  </td>

                  {/* Subscription */}
                  <td className="px-4 py-3">
                    {user.subscription ? (
                      <div className="flex flex-col gap-0.5">
                        <lui-tag
                          label={SUB_LABELS[user.subscription.status]}
                          variant={SUB_VARIANTS[user.subscription.status] as 'success' | 'caution' | 'secondary' | 'info'}
                          tag-style="subtle"
                          size="sm"
                        />
                        <span className="text-xs text-gray-400">{user.subscription.planName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sem plano</span>
                    )}
                  </td>

                  {/* Active status */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <lui-tag
                        label={user.isActive ? 'Ativo' : 'Inativo'}
                        variant={user.isActive ? 'success' : 'secondary'}
                        tag-style="subtle"
                        size="sm"
                      />
                      {user.freeTrialEligible && (
                        <lui-tag
                          label="Trial concedido — aguardando uso"
                          variant="info"
                          tag-style="subtle"
                          size="sm"
                        />
                      )}
                    </div>
                  </td>

                  {/* Created at */}
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Role change */}
                      <div className="flex items-center gap-1">
                        <select
                          value={pendingRole[user.id] ?? user.role}
                          onChange={e =>
                            setPendingRole(prev => ({ ...prev, [user.id]: e.target.value as Role }))
                          }
                          disabled={actionLoading === user.id}
                          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="instructor">Instrutor</option>
                          <option value="student">Aluno</option>
                        </select>
                        {(pendingRole[user.id] && pendingRole[user.id] !== user.role) && (
                          <button
                            onClick={() => openRoleChange(user)}
                            disabled={actionLoading === user.id}
                            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            Aplicar
                          </button>
                        )}
                      </div>

                      {/* Detail page */}
                      <Link
                        href={`/admin/usuarios/${user.id}`}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        Ver detalhes
                      </Link>

                      {/* Grant / Revoke trial */}
                      {user.freeTrialEligible ? (
                        <button
                          onClick={() => setConfirmModal({ userId: user.id, userName: user.name, action: 'revoke-trial' })}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : 'Revogar trial'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ userId: user.id, userName: user.name, action: 'grant-trial' })}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : 'Conceder trial'}
                        </button>
                      )}

                      {/* Deactivate / Reactivate */}
                      {user.isActive ? (
                        <button
                          onClick={() => setConfirmModal({ userId: user.id, userName: user.name, action: 'deactivate' })}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : 'Desativar'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ userId: user.id, userName: user.name, action: 'reactivate' })}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : 'Reativar'}
                        </button>
                      )}
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
            {pagination.total} usuário{pagination.total !== 1 ? 's' : ''} no total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(buildUrl({ page: String(currentPage - 1) }))}
              disabled={currentPage <= 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">{currentPage} / {pagination.totalPages}</span>
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
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {confirmModal.action === 'deactivate' && 'Desativar usuário'}
              {confirmModal.action === 'reactivate' && 'Reativar usuário'}
              {confirmModal.action === 'change-role' && 'Alterar role'}
              {confirmModal.action === 'grant-trial' && 'Conceder trial gratuito'}
              {confirmModal.action === 'revoke-trial' && 'Revogar trial gratuito'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmModal.action === 'deactivate' && (
                <>Tem certeza que deseja desativar <span className="font-medium">"{confirmModal.userName}"</span>? O usuário não conseguirá fazer login.</>
              )}
              {confirmModal.action === 'reactivate' && (
                <>Reativar <span className="font-medium">"{confirmModal.userName}"</span>? O usuário voltará a ter acesso à plataforma.</>
              )}
              {confirmModal.action === 'change-role' && (
                <>Alterar o role de <span className="font-medium">"{confirmModal.userName}"</span> para <span className="font-medium">{ROLE_LABELS[confirmModal.newRole!]}</span>?</>
              )}
              {confirmModal.action === 'grant-trial' && (
                <>Conceder 7 dias de teste grátis a <span className="font-medium">"{confirmModal.userName}"</span>? O trial será aplicado automaticamente na próxima assinatura desse usuário.</>
              )}
              {confirmModal.action === 'revoke-trial' && (
                <>Revogar a concessão de trial de <span className="font-medium">"{confirmModal.userName}"</span>? O usuário deixará de receber o trial gratuito na próxima assinatura.</>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className={[
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  confirmModal.action === 'deactivate'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700',
                ].join(' ')}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
