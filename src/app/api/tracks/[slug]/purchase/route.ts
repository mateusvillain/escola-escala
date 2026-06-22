import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { slug } = await ctx.params

  const track = await prisma.courseTrack.findFirst({
    where: { slug, status: 'published' },
    select: { id: true, isBundle: true, stripePriceIdBundle: true },
  })

  if (!track) {
    return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })
  }

  if (!track.isBundle || !track.stripePriceIdBundle) {
    return NextResponse.json(
      { error: 'Esta trilha não está disponível para compra em bundle' },
      { status: 403 }
    )
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, name: true, stripeCustomerId: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
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
      mode: 'payment',
      line_items: [{ price: track.stripePriceIdBundle, quantity: 1 }],
      success_url: `${appUrl}/trilhas/${slug}?purchase=success`,
      cancel_url: `${appUrl}/trilhas/${slug}`,
      metadata: {
        userId: dbUser.id,
        trackId: track.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    Sentry.captureException(err, { extra: { userId: user.userId, trackId: track.id } })
    return NextResponse.json({ error: 'Erro ao criar sessão de compra' }, { status: 500 })
  }
}
