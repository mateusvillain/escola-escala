import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { trackEvent } from '@/lib/events'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { slug } = await ctx.params

  const course = await prisma.course.findFirst({
    where: { slug, status: 'published' },
    select: { id: true, allowOneTimePurchase: true, stripePriceIdOneTime: true },
  })

  if (!course) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  if (!course.allowOneTimePurchase || !course.stripePriceIdOneTime) {
    return NextResponse.json(
      { error: 'Este curso não está disponível para compra avulsa' },
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
      line_items: [{ price: course.stripePriceIdOneTime, quantity: 1 }],
      success_url: `${appUrl}/cursos/${slug}?purchase=success`,
      cancel_url: `${appUrl}/cursos/${slug}`,
      metadata: {
        userId: dbUser.id,
        courseId: course.id,
      },
    })

    void trackEvent('checkout_started', dbUser.id, { courseId: course.id, type: 'one_time_course' })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    Sentry.captureException(err, { extra: { userId: user.userId, courseId: course.id } })
    return NextResponse.json({ error: 'Erro ao criar sessão de compra' }, { status: 500 })
  }
}
