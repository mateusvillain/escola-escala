'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Alert } from '@/components/ui'
import { registerSchema } from '@/lib/schemas/auth'

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

export function RegisterForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isFormValid, setIsFormValid] = useState(false)

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
        router.push('/dashboard')
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

  return (
    <lui-card aria-label="Criar conta">
      <div slot="header">
        <lui-heading level="2">Criar conta</lui-heading>
      </div>

      <div slot="body">
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
                label="Criar conta"
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
      </div>
    </lui-card>
  )
}
