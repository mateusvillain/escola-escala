'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PLAN_PRICES, resolvePriceId } from '@/lib/plans'

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

const PRICES = PLAN_PRICES

// Deve ficar em sincronia com o percent_off do Coupon configurado em STRIPE_COUPON_ID_REFERRAL
const REFERRAL_DISCOUNT_PERCENT = 10

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

function withReferralDiscount(value: number) {
  return value * (1 - REFERRAL_DISCOUNT_PERCENT / 100)
}

export function PlansClient({ priceIds, isAuthenticated, activeSubscription, referralCode }: Props) {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // O desconto de indicação é válido somente no plano anual.
  const hasReferralCode = !!referralCode && !activeSubscription
  const hasReferralDiscount = hasReferralCode && billing === 'annual'
  const effectiveAnnualBasic = hasReferralCode ? withReferralDiscount(PRICES.basic.annual) : PRICES.basic.annual
  const discount = discountPercent(PRICES.basic.monthly, effectiveAnnualBasic)
  const basicBasePrice = billing === 'monthly' ? PRICES.basic.monthly : PRICES.basic.annual / 12
  const premiumBasePrice = billing === 'monthly' ? PRICES.premium.monthly : PRICES.premium.annual / 12

  async function handleCheckout(plan: 'basic' | 'premium') {
    if (!isAuthenticated) {
      const next = referralCode ? `/planos?ref=${referralCode}` : '/planos'
      router.push(`/login?next=${encodeURIComponent(next)}`)
      return
    }

    const priceId = resolvePriceId(priceIds, plan, billing)

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

  function cadastroHref(plan: 'basic' | 'premium') {
    const params = new URLSearchParams({ plan, billing })
    if (referralCode) params.set('ref', referralCode)
    return `/cadastro?${params.toString()}`
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

      {/* Referral discount banner */}
      {hasReferralDiscount && (
        <div className="max-w-3xl mx-auto mb-8 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-green-900">
            🎉 Você foi indicado! Ganhe {REFERRAL_DISCOUNT_PERCENT}% de desconto na primeira cobrança do plano anual.
          </p>
          <p className="text-xs text-green-700 mt-0.5">O desconto é aplicado automaticamente no checkout.</p>
        </div>
      )}

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
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          Economize {discount}%
        </span>
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
            <div className="flex items-end gap-2 flex-wrap">
              {hasReferralDiscount && (
                <span className="text-xl text-gray-400 line-through">
                  R$ {formatPrice(basicBasePrice)}
                </span>
              )}
              <span className="text-4xl font-bold text-gray-900">
                R$ {formatPrice(hasReferralDiscount ? withReferralDiscount(basicBasePrice) : basicBasePrice)}
              </span>
              <span className="text-gray-500 mb-1">/mês</span>
            </div>
            {billing === 'annual' && (
              <p className="text-sm text-gray-500 mt-1">
                R$ {formatPrice(hasReferralDiscount ? withReferralDiscount(PRICES.basic.annual) : PRICES.basic.annual)}/ano — cobrado anualmente
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
          ) : !isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link
                href={cadastroHref('basic')}
                className="w-full text-center py-3 rounded-xl text-sm font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Criar conta e assinar
              </Link>
              <button
                onClick={() => handleCheckout('basic')}
                className="text-sm text-gray-500 hover:text-gray-700 underline text-center"
              >
                Já tenho conta
              </button>
            </div>
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
            <div className="flex items-end gap-2 flex-wrap">
              {hasReferralDiscount && (
                <span className="text-xl text-gray-400 line-through">
                  R$ {formatPrice(premiumBasePrice)}
                </span>
              )}
              <span className="text-4xl font-bold text-gray-900">
                R$ {formatPrice(hasReferralDiscount ? withReferralDiscount(premiumBasePrice) : premiumBasePrice)}
              </span>
              <span className="text-gray-500 mb-1">/mês</span>
            </div>
            {billing === 'annual' && (
              <p className="text-sm text-gray-500 mt-1">
                R$ {formatPrice(hasReferralDiscount ? withReferralDiscount(PRICES.premium.annual) : PRICES.premium.annual)}/ano — cobrado anualmente
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
          ) : !isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link
                href={cadastroHref('premium')}
                className="w-full text-center py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Criar conta e assinar
              </Link>
              <button
                onClick={() => handleCheckout('premium')}
                className="text-sm text-gray-500 hover:text-gray-700 underline text-center"
              >
                Já tenho conta
              </button>
            </div>
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
