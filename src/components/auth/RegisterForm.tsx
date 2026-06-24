'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Alert } from '@/components/ui'
import { registerSchema } from '@/lib/schemas/auth'
import { EmbeddedCheckoutForm } from '@/components/checkout/EmbeddedCheckoutForm'
import { PlanPicker } from '@/components/checkout/PlanPicker'
import { RegisterFiscalStep } from '@/components/auth/RegisterFiscalStep'
import { resolvePriceId, type PlanBillingCycle, type PlanPriceIds, type PlanType } from '@/lib/plans'

interface Props {
  priceIds: PlanPriceIds
  plan?: PlanType
  billingCycle?: PlanBillingCycle
  referralCode?: string
  checkoutError?: boolean
  next?: string
  prefillEmail?: string
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

  return errors
}

export function RegisterForm({ priceIds, plan, billingCycle, referralCode, checkoutError, next, prefillEmail }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  const preselectedPriceId = plan && billingCycle ? resolvePriceId(priceIds, plan, billingCycle) : undefined
  const wantsSubscription = !!preselectedPriceId
  const [step, setStep] = useState<'account' | 'plans' | 'fiscal' | 'checkout' | 'checkout-error'>(
    checkoutError ? 'checkout-error' : 'account',
  )
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutErrorMsg, setCheckoutErrorMsg] = useState<string | null>(null)
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(plan ?? null)
  const [pendingBilling, setPendingBilling] = useState<PlanBillingCycle | null>(billingCycle ?? null)
  const [checkoutStarting, setCheckoutStarting] = useState(false)

  function getValues() {
    const form = formRef.current
    if (!form) return null
    return {
      name: readShadowValue(form, 'name'),
      email: readShadowValue(form, 'email'),
      password: readShadowValue(form, 'password'),
    }
  }

  function handleFormInput() {
    const values = getValues()
    if (!values) return
    const errors = validate(values)
    const allFilled = !!(values.name && values.email && values.password)
    setIsFormValid(allFilled && Object.keys(errors).length === 0)
  }

  async function startCheckout(checkoutPriceId: string, checkoutBilling: PlanBillingCycle) {
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: checkoutPriceId,
          billingCycle: checkoutBilling,
          referralCode,
          uiMode: 'embedded',
        }),
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

  function handleSelectFree() {
    router.push('/dashboard')
  }

  function handleSelectPaid(selectedPlan: PlanType, selectedBilling: PlanBillingCycle) {
    setCheckoutErrorMsg(null)
    setPendingPlan(selectedPlan)
    setPendingBilling(selectedBilling)
    setStep('fiscal')
  }

  function handleBackToPlans() {
    setCheckoutErrorMsg(null)
    setStep('plans')
  }

  async function handleFiscalContinue() {
    if (!pendingPlan || !pendingBilling) return
    setCheckoutStarting(true)
    await startCheckout(resolvePriceId(priceIds, pendingPlan, pendingBilling), pendingBilling)
    setCheckoutStarting(false)
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
        if (next) {
          router.push(next)
          return
        }
        if (wantsSubscription) {
          setStep('fiscal')
        } else {
          setStep('plans')
        }
        setLoading(false)
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

  if (step === 'plans') {
    return (
      <lui-card aria-label="Escolha seu plano">
        <lui-body size="sm" weight="medium" style={{ color: '#6b7280' }}>
          {wantsSubscription ? 'Etapa 2 de 3' : 'Etapa 2 de 2'}
        </lui-body>
        <lui-heading level="2">Sua conta foi criada. Escolha um plano</lui-heading>
        <lui-stack space="md">
          <PlanPicker onSelectFree={handleSelectFree} onSelectPaid={handleSelectPaid} loadingPlan={null} />
        </lui-stack>
      </lui-card>
    )
  }

  if (step === 'fiscal') {
    return (
      <lui-card aria-label="Dados fiscais">
        <button
          type="button"
          onClick={handleBackToPlans}
          className="block text-left text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          ← Voltar para os planos
        </button>
        <lui-body size="sm" weight="medium" style={{ color: '#6b7280' }}>
          {wantsSubscription ? 'Etapa 2 de 3' : 'Etapa 3 de 4'}
        </lui-body>
        <lui-heading level="2">Dados para a nota fiscal</lui-heading>
        <lui-stack space="md">
          <Alert
            variant="info"
            title="Por que pedimos isso"
            content="Assinaturas pagas exigem emissão de nota fiscal — precisamos do seu CPF/CNPJ e endereço completo antes de seguir para o pagamento."
          />
          {checkoutErrorMsg && (
            <Alert
              variant="danger"
              title="Não foi possível iniciar a assinatura"
              content={checkoutErrorMsg}
            />
          )}
          <RegisterFiscalStep onContinue={handleFiscalContinue} continueLoading={checkoutStarting} />
        </lui-stack>
      </lui-card>
    )
  }

  if (step === 'checkout' && clientSecret) {
    return (
      <lui-card aria-label="Concluir assinatura">
        <lui-body size="sm" weight="medium" style={{ color: '#6b7280' }}>
          {wantsSubscription ? 'Etapa 3 de 3' : 'Etapa 4 de 4'}
        </lui-body>
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
      {!next && (
        <lui-body size="sm" weight="medium" style={{ color: '#6b7280' }}>
          {wantsSubscription ? 'Etapa 1 de 3' : 'Etapa 1 de 2'}
        </lui-body>
      )}
      <lui-heading level="2">Criar conta</lui-heading>

      <lui-stack space="md">
        {submitError && (
          <Alert variant="danger" title="Erro ao criar conta" content={submitError} />
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
              value={prefillEmail}
              disabled={!!prefillEmail}
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
            <Button
              label="Continuar"
              type="submit"
              loading={loading}
              loadingText="Criando conta..."
              disabled={!isFormValid || loading}
              block
            />
          </lui-stack>
        </form>

        <lui-flex justify="center">
          <Link
            href={next ? `/login?redirect=${encodeURIComponent(next)}` : '/login'}
            style={{ fontSize: '0.875rem', textDecoration: 'underline' }}
          >
            Já tem conta? Faça login
          </Link>
        </lui-flex>
      </lui-stack>
    </lui-card>
  )
}
