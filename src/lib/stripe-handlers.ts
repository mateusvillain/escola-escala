import type Stripe from 'stripe'

// Handlers são implementados nas TASK-71 a TASK-75.
// Cada função recebe o evento tipado e lança erro se falhar —
// o webhook receiver captura e loga sem retornar 500.

export async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent
): Promise<void> {
  // TASK-71: criar UserSubscription no banco
  console.log('[stripe] checkout.session.completed — not yet implemented', event.id)
}

export async function handleInvoicePaymentSucceeded(
  event: Stripe.InvoicePaymentSucceededEvent
): Promise<void> {
  // TASK-72: renovar currentPeriodStart/End no banco
  console.log('[stripe] invoice.payment_succeeded — not yet implemented', event.id)
}

export async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent
): Promise<void> {
  // TASK-73: marcar assinatura como past_due
  console.log('[stripe] invoice.payment_failed — not yet implemented', event.id)
}

export async function handleCustomerSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent
): Promise<void> {
  // TASK-74: cancelar assinatura no banco
  console.log('[stripe] customer.subscription.deleted — not yet implemented', event.id)
}

export async function handleCustomerSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent
): Promise<void> {
  // TASK-75: atualizar plano no banco (upgrade/downgrade)
  console.log('[stripe] customer.subscription.updated — not yet implemented', event.id)
}
