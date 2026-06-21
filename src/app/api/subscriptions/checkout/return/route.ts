import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(`${appUrl}/cadastro?checkoutError=1`)
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.status === 'complete') {
      return NextResponse.redirect(`${appUrl}/dashboard?checkout=success`)
    }
  } catch {
    // Sessão inválida/expirada — trata como erro abaixo.
  }

  return NextResponse.redirect(`${appUrl}/cadastro?checkoutError=1`)
}
