import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { Footer } from '@/components/layout/Footer'
import { PlansClient } from './PlansClient'
import Link from 'next/link'

export const metadata = {
  title: 'Planos e Preços',
}

export default async function PlanosPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let userId: string | null = null
  if (token) {
    try {
      userId = verifyToken(token).userId
    } catch {}
  }

  let activeSubscription: { planType: string; billingCycle: string } | null = null
  if (userId) {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true },
    })
    if (sub) {
      activeSubscription = {
        planType: sub.plan.type,
        billingCycle: sub.billingCycle,
      }
    }
  }

  const priceIds = {
    basicMonthly: process.env.STRIPE_PRICE_ID_BASIC_MONTHLY!,
    basicAnnual: process.env.STRIPE_PRICE_ID_BASIC_ANNUAL!,
    premiumMonthly: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY!,
    premiumAnnual: process.env.STRIPE_PRICE_ID_PREMIUM_ANNUAL!,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-bold text-xl text-blue-600 tracking-tight">
              Plataforma
            </Link>
            <div className="flex items-center gap-3">
              {userId ? (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Ir para o Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <PlansClient
          priceIds={priceIds}
          isAuthenticated={!!userId}
          activeSubscription={activeSubscription}
        />
      </main>

      <Footer />
    </div>
  )
}
