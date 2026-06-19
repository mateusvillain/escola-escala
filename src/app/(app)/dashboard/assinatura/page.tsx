import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { ManageSubscriptionButton } from './ManageSubscriptionButton'

export const metadata = { title: 'Minha Assinatura' }

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  trialing: 'Em teste',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-700',
  trialing: 'bg-blue-100 text-blue-700',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatPrice(value: number | { toNumber(): number }) {
  const num = typeof value === 'number' ? value : value.toNumber()
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function AssinaturaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) redirect('/login')

  let userId: string
  try {
    userId = verifyToken(token).userId
  } catch {
    redirect('/login')
  }

  const subscription = await prisma.userSubscription.findFirst({
    where: { userId, status: { in: ['active', 'past_due', 'trialing'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  const price =
    subscription?.billingCycle === 'annual'
      ? formatPrice(subscription.plan.priceAnnual)
      : subscription
        ? formatPrice(subscription.plan.priceMonthly)
        : null

  const billingLabel = subscription?.billingCycle === 'annual' ? 'Anual' : 'Mensal'

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Minha Assinatura</h1>

      {!subscription ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-5">Você ainda não possui uma assinatura ativa.</p>
          <Link
            href="/planos"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Assinar agora
          </Link>
        </div>
      ) : (
        <div className="space-y-4">

          {subscription.status === 'past_due' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm text-yellow-800 font-medium">
                Pagamento pendente — sua assinatura está temporariamente suspensa. Atualize seu método de pagamento para restaurar o acesso.
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plano</p>
                <p className="text-xl font-bold text-gray-900">{subscription.plan.name}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[subscription.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {subscription.status === 'trialing'
                  ? `Em teste — cobrança em ${formatDate(subscription.currentPeriodEnd)}`
                  : STATUS_LABELS[subscription.status] ?? subscription.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ciclo</p>
                <p className="text-sm font-semibold text-gray-800">{billingLabel}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Valor</p>
                <p className="text-sm font-semibold text-gray-800">
                  {price}{subscription.billingCycle === 'annual' ? '/ano' : '/mês'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Próxima renovação</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Início do período</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(subscription.currentPeriodStart)}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <ManageSubscriptionButton />
              <p className="mt-2 text-xs text-gray-400">
                Cancele, troque de plano ou atualize seu cartão pelo portal seguro do Stripe.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
