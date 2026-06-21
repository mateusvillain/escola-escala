export interface PlanPriceIds {
  basicMonthly: string
  basicAnnual: string
  premiumMonthly: string
  premiumAnnual: string
}

export type PlanType = 'basic' | 'premium'
export type PlanBillingCycle = 'monthly' | 'annual'

// Update these to match your Stripe product prices
export const PLAN_PRICES = {
  basic: { monthly: 80, annual: 800 },
  premium: { monthly: 100, annual: 1000 },
}

export function resolvePriceId(priceIds: PlanPriceIds, plan: PlanType, billing: PlanBillingCycle): string {
  if (plan === 'basic') {
    return billing === 'monthly' ? priceIds.basicMonthly : priceIds.basicAnnual
  }
  return billing === 'monthly' ? priceIds.premiumMonthly : priceIds.premiumAnnual
}
