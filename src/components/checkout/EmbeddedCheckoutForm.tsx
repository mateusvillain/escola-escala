'use client'

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe-client'

interface Props {
  clientSecret: string
  onComplete?: () => void
}

export function EmbeddedCheckoutForm({ clientSecret, onComplete }: Props) {
  return (
    <EmbeddedCheckoutProvider
      key={clientSecret}
      stripe={stripePromise}
      options={{ clientSecret, onComplete }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
