import type Stripe from 'stripe'
import { stripe } from './stripe'
import { prisma } from './prisma'

type PlanType = 'basic' | 'premium'
type BillingCycle = 'monthly' | 'annual'

function buildPriceMap(): Record<string, { type: PlanType; billingCycle: BillingCycle }> {
  return {
    [process.env.STRIPE_PRICE_ID_BASIC_MONTHLY!]: { type: 'basic', billingCycle: 'monthly' },
    [process.env.STRIPE_PRICE_ID_BASIC_ANNUAL!]: { type: 'basic', billingCycle: 'annual' },
    [process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY!]: { type: 'premium', billingCycle: 'monthly' },
    [process.env.STRIPE_PRICE_ID_PREMIUM_ANNUAL!]: { type: 'premium', billingCycle: 'annual' },
  }
}

export async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent
): Promise<void> {
  const session = event.data.object

  const userId = session.metadata?.userId
  if (!userId) throw new Error('userId ausente no metadata da session')

  const stripeSubscriptionId = session.subscription as string
  const stripeCustomerId = session.customer as string

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const item = subscription.items.data[0]
  const priceId = item.price.id

  const planInfo = buildPriceMap()[priceId]
  if (!planInfo) throw new Error(`priceId não mapeado para nenhum plano: ${priceId}`)

  const plan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { type: planInfo.type },
  })

  // Em Stripe API v2026+, current_period_start/end estão no SubscriptionItem
  await prisma.userSubscription.upsert({
    where: { stripeSubscriptionId },
    update: {},
    create: {
      userId,
      planId: plan.id,
      stripeSubscriptionId,
      stripeCustomerId,
      status: 'active',
      billingCycle: planInfo.billingCycle,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
    },
  })

  // Garante que o User tem stripeCustomerId salvo (segurança contra race condition)
  await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId },
  })

  console.log(`[stripe] checkout.session.completed: assinatura ${stripeSubscriptionId} ativada para user ${userId}`)
}

export async function handleInvoicePaymentSucceeded(
  event: Stripe.InvoicePaymentSucceededEvent
): Promise<void> {
  const invoice = event.data.object

  // Em Stripe API v2026+, subscription fica em invoice.parent.subscription_details
  const subDetails = invoice.parent?.subscription_details
  if (!subDetails) return

  const stripeSubscriptionId =
    typeof subDetails.subscription === 'string'
      ? subDetails.subscription
      : subDetails.subscription.id

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const item = subscription.items.data[0]

  await prisma.userSubscription.updateMany({
    where: { stripeSubscriptionId },
    data: {
      status: 'active',
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
    },
  })

  console.log(`[stripe] invoice.payment_succeeded: período renovado para subscription ${stripeSubscriptionId}`)
}

export async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent
): Promise<void> {
  const invoice = event.data.object

  const subDetails = invoice.parent?.subscription_details
  if (!subDetails) return

  const stripeSubscriptionId =
    typeof subDetails.subscription === 'string'
      ? subDetails.subscription
      : subDetails.subscription.id

  await prisma.userSubscription.updateMany({
    where: { stripeSubscriptionId },
    data: { status: 'past_due' },
  })

  console.log(`[stripe] invoice.payment_failed: subscription ${stripeSubscriptionId} marcada como past_due`)
}

export async function handleCustomerSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent
): Promise<void> {
  const subscription = event.data.object

  await prisma.userSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'canceled' },
  })

  console.log(`[stripe] customer.subscription.deleted: subscription ${subscription.id} cancelada`)
}

export async function handleCustomerSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent
): Promise<void> {
  const subscription = event.data.object
  const item = subscription.items.data[0]
  const priceId = item.price.id

  const planInfo = buildPriceMap()[priceId]
  if (!planInfo) throw new Error(`priceId não mapeado para nenhum plano: ${priceId}`)

  const plan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { type: planInfo.type },
  })

  await prisma.userSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      planId: plan.id,
      billingCycle: planInfo.billingCycle,
      status: 'active',
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
    },
  })

  console.log(`[stripe] customer.subscription.updated: subscription ${subscription.id} atualizada para plano ${planInfo.type}/${planInfo.billingCycle}`)
}
