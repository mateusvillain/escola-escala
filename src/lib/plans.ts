export interface PlanPriceIds {
  basicMonthly: string
  basicAnnual: string
  premiumMonthly: string
  premiumAnnual: string
}

export type PlanType = 'basic' | 'premium'
export type PlanBillingCycle = 'monthly' | 'annual'

export function resolvePriceId(priceIds: PlanPriceIds, plan: PlanType, billing: PlanBillingCycle): string {
  if (plan === 'basic') {
    return billing === 'monthly' ? priceIds.basicMonthly : priceIds.basicAnnual
  }
  return billing === 'monthly' ? priceIds.premiumMonthly : priceIds.premiumAnnual
}
