'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PriceIds {
  basicMonthly: string
  basicAnnual: string
  premiumMonthly: string
  premiumAnnual: string
}

interface ActiveSubscription {
  planType: string
  billingCycle: string
}

interface Props {
  priceIds: PriceIds
  isAuthenticated: boolean
  activeSubscription: ActiveSubscription | null
  referralCode?: string
}

// Update these to match your Stripe product prices
const PRICES = {
  basic: { monthly: 80, annual: 800 },
  premium: { monthly: 100, annual: 1000 },
}

const BASIC_FEATURES = [
  'Acesso a todos os cursos do catálogo',
  'Player de vídeo em HD',
  'Certificados de conclusão',
  'Suporte por e-mail',
  'Acesso pelo app mobile',
]

const PREMIUM_FEATURES = [
  'Tudo do plano Básico',
  'Cursos premium exclusivos',
  'Downloads para assistir offline',
  'Suporte prioritário',
  'Acesso antecipado a novos cursos',
  'Mentorias em grupo mensais',
]

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function discountPercent(monthly: number, annual: number) {
  const annualMonthly = annual / 12
  return Math.round(((monthly - annualMonthly) / monthly) * 100)
}

export function PlansClient({ priceIds, isAuthenticated, activeSubscription, referralCode }: Props) {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const discount = discountPercent(PRICES.basic.monthly, PRICES.basic.annual)

  async function handleCheckout(plan: 'basic' | 'premium') {
    if (!isAuthenticated) {
      const next = referralCode ? `/planos?ref=${referralCode}` : '/planos'
      router.push(`/login?next=${encodeURIComponent(next)}`)
      return
    }

    const priceId =
      plan === 'basic'
        ? billing === 'monthly' ? priceIds.basicMonthly : priceIds.basicAnnual
        : billing === 'monthly' ? priceIds.premiumMonthly : priceIds.premiumAnnual

    setLoading(plan)
    setError(null)

    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, billingCycle: billing, referralCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao iniciar checkout.')
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  const planLabel = (type: string, cycle: string) => {
    const name = type === 'basic' ? 'Básico' : 'Premium'
    const period = cycle === 'monthly' ? 'Mensal' : 'Anual'
    return `${name} ${period}`
  }

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Escolha seu plano
        </h1>
        <p className="text-lg text-gray-600">
          Acesse centenas de cursos com instrutores especialistas. Cancele quando quiser.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Mensal
        </span>
        <button
          onClick={() => setBilling(prev => prev === 'monthly' ? 'annual' : 'monthly')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            billing === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={billing === 'annual'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
          Anual
        </span>
        {billing === 'annual' && (
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            Economize {discount}%
          </span>
        )}
      </div>

      {/* Active subscription banner */}
      {activeSubscription && (
        <div className="max-w-3xl mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Plano atual: {planLabel(activeSubscription.planType, activeSubscription.billingCycle)}
            </p>
            <p className="text-xs text-blue-700 mt-0.5">Sua assinatura está ativa.</p>
          </div>
          <Link
            href="/dashboard/assinatura"
            className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Gerenciar assinatura
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-3xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Básico */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Básico</h2>
            <p className="text-sm text-gray-500">Para quem está começando</p>
          </div>

          <div className="mb-6">
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-gray-900">
                R$ {billing === 'monthly'
                  ? formatPrice(PRICES.basic.monthly)
                  : formatPrice(PRICES.basic.annual / 12)}
              </span>
              <span className="text-gray-500 mb-1">/mês</span>
            </div>
            {billing === 'annual' && (
              <p className="text-sm text-gray-500 mt-1">
                R$ {formatPrice(PRICES.basic.annual)}/ano — cobrado anualmente
              </p>
            )}
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {BASIC_FEATURES.map(feature => (
              <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {activeSubscription ? (
            <span className={`w-full text-center py-3 rounded-xl text-sm font-semibold ${
              activeSubscription.planType === 'basic'
                ? 'bg-gray-100 text-gray-500 cursor-default'
                : 'border border-gray-300 text-gray-700 cursor-default'
            }`}>
              {activeSubscription.planType === 'basic' ? 'Plano atual' : 'Fazer downgrade'}
            </span>
          ) : (
            <button
              onClick={() => handleCheckout('basic')}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl text-sm font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'basic' ? 'Aguarde...' : 'Assinar Básico'}
            </button>
          )}
        </div>

        {/* Premium */}
        <div className="bg-white border-2 border-blue-600 rounded-2xl p-8 flex flex-col relative shadow-lg">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
              Mais popular
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Premium</h2>
            <p className="text-sm text-gray-500">Para quem quer o máximo</p>
          </div>

          <div className="mb-6">
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-gray-900">
                R$ {billing === 'monthly'
                  ? formatPrice(PRICES.premium.monthly)
                  : formatPrice(PRICES.premium.annual / 12)}
              </span>
              <span className="text-gray-500 mb-1">/mês</span>
            </div>
            {billing === 'annual' && (
              <p className="text-sm text-gray-500 mt-1">
                R$ {formatPrice(PRICES.premium.annual)}/ano — cobrado anualmente
              </p>
            )}
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {PREMIUM_FEATURES.map(feature => (
              <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {activeSubscription ? (
            <span className={`w-full text-center py-3 rounded-xl text-sm font-semibold ${
              activeSubscription.planType === 'premium'
                ? 'bg-blue-600 text-white cursor-default'
                : 'bg-blue-600 text-white cursor-default'
            }`}>
              {activeSubscription.planType === 'premium' ? 'Plano atual' : 'Fazer upgrade'}
            </span>
          ) : (
            <button
              onClick={() => handleCheckout('premium')}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'premium' ? 'Aguarde...' : 'Assinar Premium'}
            </button>
          )}
        </div>
      </div>

      {/* Guarantee note */}
      <p className="text-center text-sm text-gray-500 mt-10">
        Garantia de 7 dias. Cancele a qualquer momento. Sem fidelidade.
      </p>
    </div>
  )
}
