'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { OrganizationFiscalDataForm } from './OrganizationFiscalDataForm'

interface Member {
  userId: string
  name: string
  email: string
  role: 'owner' | 'member'
  joinedAt: string
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
  seatsUsed: number
  subscription: { status: string; billingCycle: string; currentPeriodEnd: string } | null
  myRole: 'owner' | 'member'
}

interface PendingInvite {
  token: string
  organizationName: string
}

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
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null)
  const [hasOrg, setHasOrg] = useState<boolean | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  async function loadOrganization() {
    setLoading(true)
    try {
      const res = await fetch('/api/organizations/me')
      if (res.status === 404) {
        const body = await res.json()
        setHasOrg(false)
        setPendingInvite(body.pendingInvite ?? null)
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
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    setActionError(null)
    setActionLoading(true)
    try {
      const res = await fetch(`/api/organizations/me/members/${memberUserId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        setActionError(body.error ?? 'Erro ao remover membro.')
        return
      }
      await loadOrganization()
    } catch {
      setActionError('Erro de conexão. Tente novamente.')
    } finally {
      setActionLoading(false)
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

        {pendingInvite && (
          <div className="bg-blue-50 border border-blue-300 rounded-xl px-4 py-3 text-sm text-blue-800">
            Você tem um convite pendente para <strong>{pendingInvite.organizationName}</strong>.{' '}
            <Link href={`/convite/${pendingInvite.token}`} className="underline font-medium">
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

  const { organization, members, seatsUsed, myRole } = data
  const seatsAvailable = Math.max(organization.seatLimit - seatsUsed, 0)
  const isOwner = myRole === 'owner'

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

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

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Membros</h2>

        <ul className="divide-y divide-gray-100">
          {members.map((member) => (
            <li key={member.userId} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
                <p className="text-xs text-gray-400">Entrou em {formatDate(member.joinedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLES[member.role]}`}>
                  {ROLE_LABELS[member.role]}
                </span>
                {isOwner && member.userId !== userId && (
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
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

      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <OrganizationFiscalDataForm
            cnpj={organization.cnpj}
            legalName={organization.legalName}
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
    </div>
  )
}
