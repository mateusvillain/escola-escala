'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { OrganizationFiscalDataForm } from './OrganizationFiscalDataForm'
import { OrganizationAddressForm } from './OrganizationAddressForm'

interface Member {
  userId: string
  name: string
  email: string
  role: 'owner' | 'member'
  joinedAt: string
}

interface PendingInvite {
  id: string
  email: string
  createdAt: string
  expiresAt: string
  expired: boolean
}

interface OrganizationData {
  organization: {
    id: string
    name: string
    slug: string
    seatLimit: number
    cnpj: string | null
    legalName: string | null
    addressStreet: string | null
    addressNumber: string | null
    addressComplement: string | null
    addressNeighborhood: string | null
    addressCity: string | null
    addressState: string | null
    addressZipCode: string | null
  }
  members: Member[]
  pendingInvites: PendingInvite[]
  seatsUsed: number
  subscription: { status: string; billingCycle: string; currentPeriodEnd: string } | null
  myRole: 'owner' | 'member'
}

interface MyPendingInvite {
  token: string
  organizationName: string
}

type Tab = 'organizacao' | 'membros' | 'endereco'

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', member: 'Membro' }
const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-700',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function OrganizationPanel({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OrganizationData | null>(null)
  const [myPendingInvite, setMyPendingInvite] = useState<MyPendingInvite | null>(null)
  const [hasOrg, setHasOrg] = useState<boolean | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('organizacao')
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; name: string }[] | null>(null)
  const [promoteLoading, setPromoteLoading] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [cancelInviteLoading, setCancelInviteLoading] = useState<string | null>(null)

  function toggleMemberSelection(memberUserId: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      if (next.has(memberUserId)) next.delete(memberUserId)
      else next.add(memberUserId)
      return next
    })
  }

  async function loadOrganization() {
    setLoading(true)
    try {
      const res = await fetch('/api/organizations/me')
      if (res.status === 404) {
        const body = await res.json()
        setHasOrg(false)
        setMyPendingInvite(body.pendingInvite ?? null)
        setData(null)
      } else if (res.ok) {
        const body = await res.json()
        setHasOrg(true)
        setData(body)
      } else {
        setActionError('Erro ao carregar organização.')
      }
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganization()
  }, [])

  async function handleCreateOrganization(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setActionError(null)
    const form = e.currentTarget
    const name = (new FormData(form).get('name') as string)?.trim()
    if (!name) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const body = await res.json()
        setActionError(body.error ?? 'Erro ao criar organização.')
        return
      }
      await loadOrganization()
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setActionError(null)
    const form = e.currentTarget
    const email = (new FormData(form).get('email') as string)?.trim()
    if (!email) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/organizations/me/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = await res.json()
      if (!res.ok) {
        setActionError(body.error ?? 'Erro ao enviar convite.')
        return
      }
      form.reset()
      await loadOrganization()
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleConfirmRemove() {
    if (!confirmRemove) return
    const targets = confirmRemove
    setConfirmRemove(null)
    setActionError(null)
    setActionLoading(true)
    try {
      const results = await Promise.all(
        targets.map((target) => fetch(`/api/organizations/me/members/${target.userId}`, { method: 'DELETE' }))
      )
      const failed = results.filter((res) => !res.ok)
      if (failed.length > 0) {
        setActionError(
          failed.length === results.length
            ? 'Erro ao remover membro(s).'
            : `${results.length - failed.length} de ${results.length} membro(s) removido(s). Alguns falharam.`
        )
      }
      setSelectedMembers(new Set())
      await loadOrganization()
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    setActionError(null)
    setCancelInviteLoading(inviteId)
    try {
      const res = await fetch(`/api/organizations/me/invites/${inviteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        setActionError(body.error ?? 'Erro ao cancelar convite.')
        return
      }
      await loadOrganization()
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setCancelInviteLoading(null)
    }
  }

  async function handlePromote(memberUserId: string) {
    setActionError(null)
    setPromoteLoading(memberUserId)
    try {
      const res = await fetch(`/api/organizations/me/members/${memberUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'owner' }),
      })
      if (!res.ok) {
        const body = await res.json()
        setActionError(body.error ?? 'Erro ao promover membro.')
        return
      }
      await loadOrganization()
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setPromoteLoading(null)
    }
  }

  async function handleManagePortal() {
    setActionError(null)
    setActionLoading(true)
    try {
      const res = await fetch('/api/organizations/me/portal', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        setActionError(body.error ?? 'Erro ao acessar portal.')
        return
      }
      window.location.href = body.portalUrl
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando...</p>
  }

  if (hasOrg === false) {
    return (
      <div className="space-y-4">
        {actionError && (
          <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {myPendingInvite && (
          <div className="bg-blue-50 border border-blue-300 rounded-xl px-4 py-3 text-sm text-blue-800">
            Você tem um convite pendente para <strong>{myPendingInvite.organizationName}</strong>.{' '}
            <Link href={`/convite/${myPendingInvite.token}`} className="underline font-medium">
              Ver convite
            </Link>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-gray-600 mb-4">Você ainda não pertence a uma organização.</p>
          <form onSubmit={handleCreateOrganization} className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Nome da organização"
              required
              minLength={2}
              maxLength={255}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Criando...' : 'Criar organização'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700">
        {actionError ?? 'Erro ao carregar organização.'}
      </div>
    )
  }

  const { organization, members, pendingInvites, seatsUsed, myRole } = data
  const seatsAvailable = Math.max(organization.seatLimit - seatsUsed, 0)
  const isOwner = myRole === 'owner'

  const tabs: { key: Tab; label: string }[] = [
    { key: 'organizacao', label: 'Organização' },
    { key: 'membros', label: 'Membros' },
    ...(isOwner ? ([{ key: 'endereco', label: 'Endereço' }] as const) : []),
  ]

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="border-b border-gray-200 flex gap-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'pb-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'organizacao' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Organização</p>
                <p className="text-xl font-bold text-gray-900">{organization.name}</p>
              </div>
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                {seatsUsed} de {organization.seatLimit} seats usados ({seatsAvailable} disponíveis)
              </span>
            </div>

            {isOwner && (
              <button
                onClick={handleManagePortal}
                disabled={actionLoading}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Gerenciar assinatura →
              </button>
            )}
          </div>

          {isOwner && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <OrganizationFiscalDataForm cnpj={organization.cnpj} legalName={organization.legalName} />
            </div>
          )}
        </div>
      )}

      {tab === 'membros' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-900">Membros</h2>
              {isOwner && selectedMembers.size > 0 && (
                <button
                  onClick={() =>
                    setConfirmRemove(
                      members
                        .filter((m) => selectedMembers.has(m.userId))
                        .map((m) => ({ userId: m.userId, name: m.name }))
                    )
                  }
                  disabled={actionLoading}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remover selecionados ({selectedMembers.size})
                </button>
              )}
            </div>

            <ul className="divide-y divide-gray-100">
              {members.map((member) => (
                <li key={member.userId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isOwner && member.userId !== userId && (
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.userId)}
                        onChange={() => toggleMemberSelection(member.userId)}
                        aria-label={`Selecionar ${member.name}`}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400">Entrou em {formatDate(member.joinedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLES[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                    {isOwner && member.role === 'member' && (
                      <button
                        onClick={() => handlePromote(member.userId)}
                        disabled={promoteLoading === member.userId}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {promoteLoading === member.userId ? 'Promovendo...' : 'Tornar owner'}
                      </button>
                    )}
                    {isOwner && member.userId !== userId && (
                      <button
                        onClick={() => setConfirmRemove([{ userId: member.userId, name: member.name }])}
                        disabled={actionLoading}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {isOwner && (
              <form onSubmit={handleInvite} className="flex gap-2 pt-2 border-t border-gray-100">
                <input
                  type="email"
                  name="email"
                  placeholder="email@empresa.com"
                  required
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Convidar
                </button>
              </form>
            )}
          </div>

          {pendingInvites.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Convites pendentes</h2>
              <ul className="divide-y divide-gray-100">
                {pendingInvites.map((invite) => (
                  <li key={invite.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                      <p className="text-xs text-gray-400">Convidado em {formatDate(invite.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          invite.expired ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invite.expired ? 'Expirado' : 'Aguardando cadastro'}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={cancelInviteLoading === invite.id}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {cancelInviteLoading === invite.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'endereco' && isOwner && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <OrganizationAddressForm
            addressStreet={organization.addressStreet}
            addressNumber={organization.addressNumber}
            addressComplement={organization.addressComplement}
            addressNeighborhood={organization.addressNeighborhood}
            addressCity={organization.addressCity}
            addressState={organization.addressState}
            addressZipCode={organization.addressZipCode}
          />
        </div>
      )}

      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmRemove(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {confirmRemove.length === 1 ? 'Remover membro' : `Remover ${confirmRemove.length} membros`}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmRemove.length === 1 ? (
                <>
                  Tem certeza que deseja remover{' '}
                  <span className="font-medium">&quot;{confirmRemove[0].name}&quot;</span> da organização?
                </>
              ) : (
                <>
                  Tem certeza que deseja remover{' '}
                  <span className="font-medium">{confirmRemove.map((m) => m.name).join(', ')}</span> da
                  organização?
                </>
              )}{' '}
              O acesso aos cursos via assinatura da organização será revogado imediatamente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-red-600 hover:bg-red-700"
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
