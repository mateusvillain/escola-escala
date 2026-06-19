import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { validateReferralCode } from '@/lib/referral'

const schema = z.object({
  priceId: z.string().min(1),
  billingCycle: z.enum(['monthly', 'annual']),
  referralCode: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', issues: parsed.error.issues }, { status: 400 })
  }

  const { priceId, billingCycle, referralCode } = parsed.data

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      subscriptions: {
        where: { status: 'active' },
        take: 1,
      },
    },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  if (dbUser.subscriptions.length > 0) {
    return NextResponse.json({ error: 'Você já possui uma assinatura ativa' }, { status: 409 })
  }

  // Desconto de indicação é válido somente para o plano anual.
  const validReferralCode = referralCode && billingCycle === 'annual'
    ? (await validateReferralCode(referralCode, dbUser.id)) ?? undefined
    : undefined

  let stripeCustomerId = dbUser.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.name,
    })
    stripeCustomerId = customer.id

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { stripeCustomerId },
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/planos`,
    metadata: {
      userId: dbUser.id,
      ...(validReferralCode && { referralCode: validReferralCode }),
    },
  }

  // Stripe não permite `allow_promotion_codes` e `discounts` na mesma Checkout Session.
  if (validReferralCode) {
    sessionParams.discounts = [{ coupon: process.env.STRIPE_COUPON_ID_REFERRAL! }]
  } else {
    sessionParams.allow_promotion_codes = true
  }

  // Trial gratuito concedido manualmente pelo admin (não é benefício padrão de checkout).
  if (dbUser.freeTrialEligible) {
    sessionParams.subscription_data = { trial_period_days: 7 }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return NextResponse.json({ checkoutUrl: session.url })
}
