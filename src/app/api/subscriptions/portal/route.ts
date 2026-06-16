import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { stripeCustomerId: true },
  })

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'Nenhuma assinatura encontrada para este usuário' },
      { status: 404 }
    )
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinatura`,
  })

  return NextResponse.json({ portalUrl: session.url })
}
