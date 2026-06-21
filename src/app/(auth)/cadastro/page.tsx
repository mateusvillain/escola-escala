import { RegisterForm } from '@/components/auth/RegisterForm'
import { resolvePriceId, type PlanBillingCycle, type PlanType } from '@/lib/plans'

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string; ref?: string; checkoutError?: string }>
}) {
  const { plan, billing, ref, checkoutError } = await searchParams

  const validPlan: PlanType | undefined = plan === 'basic' || plan === 'premium' ? plan : undefined
  const validBilling: PlanBillingCycle | undefined =
    billing === 'monthly' || billing === 'annual' ? billing : undefined

  let priceId: string | undefined
  if (validPlan && validBilling) {
    priceId = resolvePriceId(
      {
        basicMonthly: process.env.STRIPE_PRICE_ID_BASIC_MONTHLY!,
        basicAnnual: process.env.STRIPE_PRICE_ID_BASIC_ANNUAL!,
        premiumMonthly: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY!,
        premiumAnnual: process.env.STRIPE_PRICE_ID_PREMIUM_ANNUAL!,
      },
      validPlan,
      validBilling,
    )
  }

  return (
    <RegisterForm
      priceId={priceId}
      billingCycle={validBilling}
      referralCode={ref}
      checkoutError={checkoutError === '1'}
    />
  )
}
