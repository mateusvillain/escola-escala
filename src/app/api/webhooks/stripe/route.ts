import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import {
  handleCheckoutSessionCompleted,
  handleCustomerSubscriptionDeleted,
  handleCustomerSubscriptionUpdated,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded,
  handleTrialWillEnd,
} from '@/lib/stripe-handlers'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Stripe-Signature ausente' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assinatura inválida'
    console.error('[stripe webhook] verificação falhou:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event as Stripe.CheckoutSessionCompletedEvent)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event as Stripe.InvoicePaymentSucceededEvent)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event as Stripe.InvoicePaymentFailedEvent)
        break
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event as Stripe.CustomerSubscriptionDeletedEvent)
        break
      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(event as Stripe.CustomerSubscriptionUpdatedEvent)
        break
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event as Stripe.CustomerSubscriptionTrialWillEndEvent)
        break
      default:
        // Eventos não mapeados são ignorados silenciosamente
        break
    }
  } catch (err) {
    // Loga sem retornar 500 — Stripe re-envia eventos em caso de falha não-2xx
    console.error(`[stripe webhook] erro ao processar ${event.type}:`, err)
  }

  return NextResponse.json({ received: true })
}
