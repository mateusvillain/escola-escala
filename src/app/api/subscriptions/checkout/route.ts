import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

const schema = z.object({
  priceId: z.string().min(1),
  billingCycle: z.enum(['monthly', 'annual']),
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

  const { priceId } = parsed.data

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

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/planos`,
    metadata: { userId: dbUser.id },
  })

  return NextResponse.json({ checkoutUrl: session.url })
}
