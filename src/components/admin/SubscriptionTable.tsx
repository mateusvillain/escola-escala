'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'

type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'
type BillingCycle = 'monthly' | 'annual'
type PlanType = 'basic' | 'premium'

interface Subscription {
  id: string
  stripeSubscriptionId: string
  status: SubscriptionStatus
  billingCycle: BillingCycle
  currentPeriodEnd: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  plan: {
    name: string
    type: PlanType
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Ativo',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelado',
  trialing: 'Trial',
}

const STATUS_VARIANTS: Record<SubscriptionStatus, string> = {
  active: 'success',
  past_due: 'caution',
  canceled: 'danger',
  trialing: 'info',
}

const BILLING_LABELS: Record<BillingCycle, string> = {
  monthly: 'Mensal',
  annual: 'Anual',
}

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  basic: 'Básico',
  premium: 'Premium',
}

const STATUS_FILTERS = [
  { value: '', label: 'Todos os status' },
  { value: 'active', label: 'Ativo' },
  { value: 'past_due', label: 'Pagamento pendente' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'trialing', label: 'Trial' },
]

const PLAN_TYPE_FILTERS = [
  { value: '', label: 'Todos os planos' },
  { value: 'basic', label: 'Básico' },
  { value: 'premium', label: 'Premium' },
]

export function SubscriptionTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') ?? ''
  const currentPlanType = searchParams.get('planType') ?? ''
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10)

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
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

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (currentStatus) params.set('status', currentStatus)
      if (currentPlanType) params.set('planType', currentPlanType)
      params.set('page', String(currentPage))
      params.set('limit', '20')

      const res = await fetch(`/api/admin/subscriptions?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSubscriptions(data.data)
      setPagination(data.pagination)
    } catch {
      setError('Não foi possível carregar as assinaturas.')
    } finally {
      setLoading(false)
    }
  }, [currentStatus, currentPlanType, currentPage])

  useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <lui-heading level="1" size="xl">Assinaturas</lui-heading>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={currentStatus}
          onChange={e => router.push(buildUrl({ status: e.target.value, page: '1' }))}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          value={currentPlanType}
          onChange={e => router.push(buildUrl({ planType: e.target.value, page: '1' }))}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PLAN_TYPE_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
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
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <lui-body>Nenhuma assinatura encontrada</lui-body>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aluno</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plano</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ciclo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Próxima renovação</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  {/* Student name + email */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{sub.user.name}</p>
                    <p className="text-xs text-gray-500">{sub.user.email}</p>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{sub.plan.name}</p>
                    <p className="text-xs text-gray-400">{PLAN_TYPE_LABELS[sub.plan.type]}</p>
                  </td>

                  {/* Billing cycle */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{BILLING_LABELS[sub.billingCycle]}</span>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <lui-tag
                      label={STATUS_LABELS[sub.status]}
                      variant={STATUS_VARIANTS[sub.status] as 'success' | 'caution' | 'danger' | 'info'}
                      tag-style="subtle"
                      size="sm"
                    />
                  </td>

                  {/* Next renewal */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </td>

                  {/* Profile link */}
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/usuarios?search=${encodeURIComponent(sub.user.email)}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      Ver perfil
                    </Link>
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
            {pagination.total} assinatura{pagination.total !== 1 ? 's' : ''} no total
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
    </div>
  )
}
