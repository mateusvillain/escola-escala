import type Stripe from 'stripe'
import { stripe } from './stripe'
import { prisma } from './prisma'
import { sendWelcomeEmail, sendTrialEndingEmail, sendPaymentFailedEmail } from './email'

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

// Crédito de um ciclo mensal do plano do indicador, concedido apenas na primeira assinatura do indicado.
async function grantReferralCredit(referredByCode: string, referredUserId: string): Promise<void> {
  const referral = await prisma.referralCode.findUnique({
    where: { code: referredByCode },
    include: { owner: { select: { stripeCustomerId: true } } },
  })
  if (!referral) {
    console.warn(`[stripe] referral: código ${referredByCode} não encontrado — nenhum crédito concedido`)
    return
  }

  const ownerSubscription = await prisma.userSubscription.findFirst({
    where: { userId: referral.ownerUserId, status: 'active' },
    include: { plan: true },
  })

  if (!ownerSubscription || !referral.owner.stripeCustomerId) {
    console.warn(`[stripe] referral: indicador ${referral.ownerUserId} sem assinatura ativa ou stripeCustomerId — nenhum crédito concedido`)
    return
  }

  const creditAmountCents = Math.round(Number(ownerSubscription.plan.priceMonthly) * 100)

  await stripe.customers.createBalanceTransaction(referral.owner.stripeCustomerId, {
    amount: -creditAmountCents,
    currency: 'brl',
    description: `Crédito por indicação — código ${referredByCode}, indicado ${referredUserId}`,
  })

  console.log(`[stripe] referral: crédito de ${creditAmountCents} centavos concedido a customer ${referral.owner.stripeCustomerId} (código ${referredByCode})`)
}

// Compra avulsa de curso (mode: 'payment') matricula direto, sem criar UserSubscription.
async function handleOneTimeCoursePurchase(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId
  const courseId = session.metadata?.courseId
  if (!userId || !courseId) {
    throw new Error('userId ou courseId ausente no metadata da session de compra avulsa')
  }

  // Idempotente — Stripe pode reentregar o webhook.
  await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {},
  })

  console.log(`[stripe] checkout.session.completed (payment): enrollment criado para user ${userId} no curso ${courseId}`)
}

// Compra de bundle de trilha (mode: 'payment') matricula em todos os cursos da trilha de uma vez.
async function handleTrackBundlePurchase(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId
  const trackId = session.metadata?.trackId
  if (!userId || !trackId) {
    throw new Error('userId ou trackId ausente no metadata da session de compra de bundle')
  }

  const items = await prisma.courseTrackItem.findMany({
    where: { trackId },
    select: { courseId: true },
  })

  // Idempotente — Stripe pode reentregar o webhook; upsert por curso não duplica nem falha.
  await Promise.all(
    items.map(item =>
      prisma.courseEnrollment.upsert({
        where: { userId_courseId: { userId, courseId: item.courseId } },
        create: { userId, courseId: item.courseId },
        update: {},
      })
    )
  )

  console.log(`[stripe] checkout.session.completed (payment): bundle da trilha ${trackId} matriculou user ${userId} em ${items.length} cursos`)
}

export async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent
): Promise<void> {
  const session = event.data.object

  if (session.mode === 'payment') {
    if (session.metadata?.trackId) {
      await handleTrackBundlePurchase(session)
    } else {
      await handleOneTimeCoursePurchase(session)
    }
    return
  }

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

  const referredByCode = session.metadata?.referralCode

  // checkout.session.completed só pode resultar em 'trialing' (trial concedido) ou 'active'.
  const subscriptionStatus = subscription.status === 'trialing' ? 'trialing' : 'active'

  // Em Stripe API v2026+, current_period_start/end estão no SubscriptionItem
  await prisma.userSubscription.upsert({
    where: { stripeSubscriptionId },
    update: {},
    create: {
      userId,
      planId: plan.id,
      stripeSubscriptionId,
      stripeCustomerId,
      status: subscriptionStatus,
      billingCycle: planInfo.billingCycle,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      ...(referredByCode && { referredByCode }),
    },
  })

  // Garante que o User tem stripeCustomerId salvo (segurança contra race condition)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true, freeTrialEligible: true },
  })

  if (dbUser && !dbUser.stripeCustomerId) {
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } })
  }

  // A concessão de trial é de uso único — consome assim que a assinatura é criada.
  if (dbUser?.freeTrialEligible) {
    await prisma.user.update({ where: { id: userId }, data: { freeTrialEligible: false } })
  }

  // E-mail de boas-vindas apenas na primeira assinatura (não em renovações)
  const subscriptionCount = await prisma.userSubscription.count({ where: { userId } })
  if (subscriptionCount === 1 && dbUser) {
    try {
      await sendWelcomeEmail(dbUser.email, dbUser.name)
    } catch (err) {
      console.error('[stripe] falha ao enviar e-mail de boas-vindas:', err)
    }
  }

  // Crédito ao indicador apenas na primeira assinatura do indicado (não em renovações)
  if (referredByCode && subscriptionCount === 1) {
    try {
      await grantReferralCredit(referredByCode, userId)
    } catch (err) {
      console.error('[stripe] falha ao conceder crédito de indicação:', err)
    }
  }

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

  const stripeCustomerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

  if (stripeCustomerId) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId },
      select: { email: true, name: true },
    })

    if (user) {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinatura`,
        })
        await sendPaymentFailedEmail(user.email, user.name, portalSession.url)
      } catch (err) {
        console.error('[stripe] falha ao enviar e-mail de cobrança falhada:', err)
      }
    }
  }
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

export async function handleTrialWillEnd(
  event: Stripe.CustomerSubscriptionTrialWillEndEvent
): Promise<void> {
  const subscription = event.data.object

  const userSub = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { plan: true, user: { select: { email: true, name: true } } },
  })

  if (!userSub) {
    console.warn(`[stripe] trial_will_end: subscription ${subscription.id} não encontrada em UserSubscription`)
    return
  }

  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : userSub.currentPeriodEnd
  const amount = userSub.billingCycle === 'annual' ? Number(userSub.plan.priceAnnual) : Number(userSub.plan.priceMonthly)

  try {
    await sendTrialEndingEmail(userSub.user.email, userSub.user.name, trialEnd, amount, userSub.billingCycle)
  } catch (err) {
    console.error('[stripe] falha ao enviar e-mail de fim de trial:', err)
  }

  console.log(`[stripe] customer.subscription.trial_will_end: aviso enviado para subscription ${subscription.id}`)
}
