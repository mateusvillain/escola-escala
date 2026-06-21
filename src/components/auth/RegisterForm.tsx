'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Alert } from '@/components/ui'
import { registerSchema } from '@/lib/schemas/auth'
import { EmbeddedCheckoutForm } from '@/components/checkout/EmbeddedCheckoutForm'
import type { PlanBillingCycle } from '@/lib/plans'

interface Props {
  priceId?: string
  billingCycle?: PlanBillingCycle
  referralCode?: string
  checkoutError?: boolean
}

function readShadowValue(form: HTMLFormElement, name: string): string {
  const el = form.querySelector(`lui-input[name="${name}"]`)
  return el?.shadowRoot?.querySelector('input')?.value ?? ''
}

function validate(values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {}

  const parsed = registerSchema.safeParse({
    name: values.name,
    email: values.email,
    password: values.password,
  })

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      if (!errors[field]) errors[field] = issue.message
    }
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Campo obrigatório'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'As senhas não coincidem'
  }

  return errors
}

export function RegisterForm({ priceId, billingCycle, referralCode, checkoutError }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  const wantsSubscription = !!priceId && !!billingCycle
  const [step, setStep] = useState<'account' | 'checkout' | 'checkout-error'>(
    checkoutError ? 'checkout-error' : 'account',
  )
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutErrorMsg, setCheckoutErrorMsg] = useState<string | null>(null)

  function getValues() {
    const form = formRef.current
    if (!form) return null
    return {
      name: readShadowValue(form, 'name'),
      email: readShadowValue(form, 'email'),
      password: readShadowValue(form, 'password'),
      confirmPassword: readShadowValue(form, 'confirmPassword'),
    }
  }

  function handleFormInput() {
    const values = getValues()
    if (!values) return
    const errors = validate(values)
    const allFilled = !!(values.name && values.email && values.password && values.confirmPassword)
    setIsFormValid(allFilled && Object.keys(errors).length === 0)
  }

  async function startCheckout() {
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, billingCycle, referralCode, uiMode: 'embedded' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCheckoutErrorMsg(data.error ?? 'Não foi possível iniciar a assinatura.')
        return
      }

      setClientSecret(data.clientSecret)
      setStep('checkout')
    } catch {
      setCheckoutErrorMsg('Erro de conexão ao iniciar a assinatura.')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const values = getValues()
    if (!values) return

    const errors = validate(values)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    setFieldErrors({})

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      })

      if (res.status === 201) {
        if (wantsSubscription) {
          await startCheckout()
          setLoading(false)
        } else {
          router.push('/dashboard')
        }
        return
      }

      const data = await res.json()
      if (res.status === 409) {
        setFieldErrors({ email: 'Este e-mail já está cadastrado' })
      } else {
        setSubmitError(data.error ?? 'Erro ao criar conta. Tente novamente.')
      }
    } catch {
      setSubmitError('Erro de conexão. Tente novamente.')
    }

    setLoading(false)
  }

  if (step === 'checkout-error') {
    return (
      <lui-card aria-label="Pagamento não concluído">
        <lui-heading level="2">Pagamento não concluído</lui-heading>
        <lui-stack space="md">
          <Alert
            variant="caution"
            title="Sua conta já foi criada"
            content="O pagamento da assinatura não foi confirmado. Você pode tentar novamente quando quiser — sua conta já existe e está pronta para uso."
          />
          <lui-flex justify="center" gap="md">
            <Link href="/planos" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
              Ver planos novamente
            </Link>
            <Link href="/login" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
              Ir para o login
            </Link>
          </lui-flex>
        </lui-stack>
      </lui-card>
    )
  }

  if (step === 'checkout' && clientSecret) {
    return (
      <lui-card aria-label="Concluir assinatura">
        <lui-heading level="2">Quase lá — conclua sua assinatura</lui-heading>
        <lui-stack space="md">
          <EmbeddedCheckoutForm
            clientSecret={clientSecret}
            onComplete={() => router.push('/dashboard?checkout=success')}
          />
        </lui-stack>
      </lui-card>
    )
  }

  return (
    <lui-card aria-label="Criar conta">
      <lui-heading level="2">Criar conta</lui-heading>

      <lui-stack space="md">
        {submitError && (
          <Alert variant="danger" title="Erro ao criar conta" content={submitError} />
        )}

        {checkoutErrorMsg && (
          <Alert
            variant="caution"
            title="Conta criada, mas a assinatura não foi iniciada"
            content={`${checkoutErrorMsg} Você já pode acessar sua conta e assinar mais tarde em /planos.`}
          />
        )}

        {checkoutErrorMsg && (
          <Link href="/dashboard" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
            Ir para o Dashboard
          </Link>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          <lui-stack space="lg">
            <lui-input
              label="Nome"
              name="name"
              placeholder="Seu nome completo"
              required
              error={!!fieldErrors.name}
              error-text={fieldErrors.name}
              onInput={handleFormInput}
            />
            <lui-input
              label="E-mail"
              type="email"
              name="email"
              placeholder="email@exemplo.com"
              required
              error={!!fieldErrors.email}
              error-text={fieldErrors.email}
              onInput={handleFormInput}
            />
            <lui-input
              label="Senha"
              type="password"
              name="password"
              placeholder="Mínimo 8 caracteres"
              required
              error={!!fieldErrors.password}
              error-text={fieldErrors.password}
              onInput={handleFormInput}
            />
            <lui-input
              label="Confirmar Senha"
              type="password"
              name="confirmPassword"
              placeholder="Repita a senha"
              required
              error={!!fieldErrors.confirmPassword}
              error-text={fieldErrors.confirmPassword}
              onInput={handleFormInput}
            />
            <Button
              label={wantsSubscription ? 'Criar conta e continuar para o pagamento' : 'Criar conta'}
              type="submit"
              loading={loading}
              loadingText="Criando conta..."
              disabled={!isFormValid || loading}
              block
              onClick={() => formRef.current?.requestSubmit()}
            />
          </lui-stack>
        </form>

        <lui-flex justify="center">
          <Link href="/login" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
            Já tem conta? Faça login
          </Link>
        </lui-flex>
      </lui-stack>
    </lui-card>
  )
}
