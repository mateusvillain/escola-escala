'use client'

import { useState } from 'react'
import { PLAN_PRICES } from '@/lib/plans'
import type { PlanBillingCycle, PlanType } from '@/lib/plans'

interface Props {
  onSelectFree: () => void
  onSelectPaid: (plan: PlanType, billing: PlanBillingCycle) => void
  loadingPlan: 'free' | PlanType | null
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PlanPicker({ onSelectFree, onSelectPaid, loadingPlan }: Props) {
  const [billing, setBilling] = useState<PlanBillingCycle>('annual')
  const disabled = loadingPlan !== null

  const basicPrice = billing === 'monthly' ? PLAN_PRICES.basic.monthly : PLAN_PRICES.basic.annual / 12
  const premiumPrice = billing === 'monthly' ? PLAN_PRICES.premium.monthly : PLAN_PRICES.premium.annual / 12

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Mensal
        </span>
        <button
          type="button"
          onClick={() => setBilling((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))}
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
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Básico */}
        <div className="border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900">Básico — R$ {formatPrice(basicPrice)}/mês</p>
            <p className="text-sm text-gray-500">Acesso a todos os cursos do catálogo.</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectPaid('basic', billing)}
            disabled={disabled}
            className="py-2.5 px-5 rounded-lg text-sm font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loadingPlan === 'basic' ? 'Aguarde...' : 'Assinar Básico'}
          </button>
        </div>

        {/* Premium */}
        <div className="border-2 border-blue-600 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900">Premium — R$ {formatPrice(premiumPrice)}/mês</p>
            <p className="text-sm text-gray-500">Tudo do Básico, cursos exclusivos e mentorias.</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectPaid('premium', billing)}
            disabled={disabled}
            className="py-2.5 px-5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loadingPlan === 'premium' ? 'Aguarde...' : 'Assinar Premium'}
          </button>
        </div>
      </div>

      <div className="text-center mt-5">
        <button
          type="button"
          onClick={onSelectFree}
          disabled={disabled}
          className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingPlan === 'free' ? 'Aguarde...' : 'Prefiro continuar no plano gratuito'}
        </button>
      </div>
    </div>
  )
}
